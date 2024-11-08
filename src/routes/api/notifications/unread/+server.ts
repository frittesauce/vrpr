import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { notifications, users, vorps } from '@/server/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { and, count, eq } from 'drizzle-orm';
import { message } from 'sveltekit-superforms';

export const GET: RequestHandler = async ({ cookies }) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) {
		return json({ error: 'missing authentication cookie!' }, { status: 404 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		const userid = jwtPayload.userId;

		const unreadResult = await db
			.select({ count: count() })
			.from(notifications)
			.leftJoin(users, eq(users.id, notifications.sourceUserId))
			.leftJoin(vorps, eq(vorps.id, notifications.vorpId))
			.where(and(eq(notifications.userId, userid), eq(notifications.read, false)));

		return json(unreadResult[0] || { count: 0 }, { status: 200 });
	} catch (error) {
		console.log('Error fetching unred notifications :(', error);
		return json({ error: 'failed to get notifications' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ cookies }) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) {
		return json({ error: 'missing authentication cookie!' }, { status: 404 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		const userid = jwtPayload.userId;

		const readNot = await db
			.update(notifications)
			.set({ read: true })
			.where(eq(notifications.userId, userid));

		return json({ message: 'notifiations updated' }, { status: 200 });
	} catch (error) {
		console.log('Error fetching unred notifications :(', error);
		return json({ error: 'failed to get notifications' }, { status: 500 });
	}
};
