import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { notifications, users, vorps } from '@/server/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies }) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		const userId = jwtPayload.userId;

		const userNotifications = await db
			.select({
				id: notifications.id,
				type: notifications.type,
				sourceUserID: notifications.sourceUserId,
				sourceUser: users.username,
				sourceUserHandle: users.handle,
				sourceUserVerified: users.verified,
				sourceUserCreatedAt: users.created_at,
				sourceUserBio: users.bio,
				vorpContent: vorps.content,
				vorpId: vorps.id,
				read: notifications.read,
				createdAt: notifications.createdAt
			})
			.from(notifications)
			.leftJoin(users, eq(notifications.sourceUserId, users.id))
			.leftJoin(vorps, eq(notifications.vorpId, vorps.id))
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(50);
		return json(userNotifications, { status: 200 });
	} catch (error) {
		console.log('auth error...', error);
		return json({ error: 'failed to get notifications' }, { status: 500 });
	}
};
