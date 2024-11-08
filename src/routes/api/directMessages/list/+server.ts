import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { conversations } from '@/server/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { arrayContains, arrayOverlaps, eq, inArray } from 'drizzle-orm';
export const GET: RequestHandler = async ({ cookies, url }) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	let userId: string;

	if (!authCookie) return json({ error: 'no authentication' }, { status: 401 });

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		const userId = jwtPayload.userId;

		const convos = await db
			.select()
			.from(conversations)
			.where(arrayContains(conversations.participants, [userId]));

		return json(convos, { status: 200 });
	} catch (error) {
		console.log(error);
		return json('meow');
	}
};
