import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { users } from '@/server/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	console.log('test');
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) {
		return json({ error: 'no auth cookie was provided :(' }, { status: 401 });
	}

	let userId: string;

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		userId = jwtPayload.userId;

		if (!userId) {
			throw new Error('invalid jwt token');
		}
	} catch (error) {
		console.log(`error logging out`, error);
		return json({ error: 'no valid authentication cookie was provided' }, { status: 401 });
	}

	try {
		const result = await db
			.update(users)
			.set({ token: '' })
			.where(eq(users.id, userId))
			.returning();

		if (result.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		console.log('meow');

		cookies.delete('_DONT_SHARE_AUTH', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 31536000
		});

		cookies.delete('temp-discord-token', {
			path: '/'
		});

		return json({}, { status: 200 });
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
