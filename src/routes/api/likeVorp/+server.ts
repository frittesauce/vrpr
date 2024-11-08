import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { createNotification } from '@/server/notification';
import { likes, vorps } from '@/server/schema';
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
	const { vorpId } = body;

	if (!vorpId || typeof vorpId !== 'string') {
		return json({ error: 'Invalid vorpId ID' }, { status: 400 });
	}

	try {
		const [vorp] = await db.select().from(vorps).where(eq(vorps.id, vorpId)).limit(1);

		if (!vorp) {
			return json({ error: 'vorp was not found' }, { status: 404 });
		}

		const [alrLiked] = await db
			.select()
			.from(likes)
			.where(and(eq(likes.vorp_id, vorpId), eq(likes.user_id, userId)))
			.limit(1);

		if (alrLiked) {
			await db.delete(likes).where(and(eq(likes.vorp_id, vorpId), eq(likes.user_id, userId)));
			return json({ message: 'vorp liked successfully' });
		} else {
			await db.insert(likes).values({
				vorp_id: vorpId,
				user_id: userId
			});

			if (userId !== vorp.user_id && vorp.user_id) {
				await createNotification(vorp.user_id, 'like', userId, vorpId);
			}

			return json({ message: 'vorp liked successfully' });
		}
	} catch (error) {
		console.log(error);
		return json({ message: 'vorp unliked successfully' });
	}
};
