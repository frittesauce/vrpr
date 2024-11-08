import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { createNotification } from '@/server/notification';
import { followers, users, vorps } from '@/server/schema';
import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');
	if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

	let userId: string;

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);
		userId = jwtPayload.userId;

		if (!userId) {
			throw new Error('invalid jwt');
		}
	} catch (error) {
		console.log('auth error...', error);
		return json({ error: 'couldnt authenticate' }, { status: 401 });
	}

	const body = await request.json();
	const { target } = body;

	if (!target || typeof target !== 'string') {
		return json({ error: 'Invalid target ID' }, { status: 400 });
	}

	try {
		const [trgt] = await db.select().from(users).where(eq(users.id, target)).limit(1);

		if (!trgt) {
			return json({ error: 'target was not found' }, { status: 404 });
		}

		const [alrFollowing] = await db
			.select()
			.from(followers)
			.where(and(eq(followers.follower_id, userId), eq(followers.user_id, target)))
			.limit(1);

		if (alrFollowing) {
			await db
				.delete(followers)
				.where(and(eq(followers.follower_id, userId), eq(followers.user_id, target)));
			return json({ message: 'user unfollowed successfully' });
		} else {
			await db.insert(followers).values({
				follower_id: userId,
				user_id: target
			});

			await createNotification(target, 'follow', userId);

			return json({ message: 'user followed successfully' });
		}
	} catch (error) {
		console.log(error);
		return json({ message: 'vorp unliked successfully' });
	}
};
