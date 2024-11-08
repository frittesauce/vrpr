import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { vorpObj } from '../utils';
import { followers, likes, users, vorps } from '@/server/schema';
import { desc, and, eq, not, exists, or, isNull, sql, count, inArray } from 'drizzle-orm';

async function updateViews(vorpIds: string[]) {
	for (const vorpId of vorpIds) {
		await db
			.update(vorps)
			.set({ views: sql`${vorps.views} + 1` })
			.where(eq(vorps.id, vorpId));
	}
}

export const GET: RequestHandler = async ({
	url,
	request,
	cookies
}: {
	url: URL;
	request: Request;
	cookies: Cookies;
}) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');
	const handle = url.searchParams.get('handle');
	const type = url.searchParams.get('type') || 'Main';

	let userId: string;

	if (!authCookie) return json({ error: 'no authentication' }, { status: 401 });

	const tabs = ['Main', 'Following', 'Liked'];

	if (!tabs.includes(type)) {
		return json({ error: 'Invalid type property.' }, { status: 400 });
	}

	const excludePosts = url.searchParams.get('excludePosts')?.split(',') || [];

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);
		userId = jwtPayload.userId;
		if (!userId) {
			throw new Error('invalid jwt');
		}

		let result;

		if (handle) {
			const userExist = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.handle, handle))
				.limit(1);

			const user = userExist[0];

			if (!user) {
				return json({ error: 'user doesnt exist :(' }, { status: 404 });
			}
			if (type === 'Liked') {
				result = await likedFeed(userId, user.id);
			} else {
				result = await handleFeed(user.id, userId);
			}
		} else if (type === 'Following') {
			result = await followFeed(userId, 20, excludePosts);
		} else {
			result = await mainFeed(userId, 20, excludePosts);
		}

		const Vorpids = result.map((vorp) => vorp.id);
		updateViews(Vorpids).catch((error) => {
			console.error('couldnt update views sorry poo poo :(');
		});

		return json({ vorps: result });
	} catch (error) {
		console.log('auth error...', error);
		return json({ error: 'couldnt authenticate' }, { status: 401 });
	}
};

async function mainFeed(userId: string, limit = 20, excludePosts: string[] = []) {
	const feed = await db
		.select(vorpObj(userId))
		.from(vorps)
		.leftJoin(likes, eq(likes.vorp_id, vorps.id))
		.leftJoin(users, eq(vorps.user_id, users.id))
		.leftJoin(followers, eq(vorps.user_id, followers.user_id))
		.where(and(isNull(vorps.parent), not(inArray(vorps.id, excludePosts))))
		.groupBy(vorps.id, users.id)
		.orderBy(desc(vorps.created_at))
		.limit(limit);
	return feed;
}

async function followFeed(userId: string, limit = 100, excludePosts: string[] = []) {
	const feed = await db
		.select(vorpObj(userId))
		.from(vorps)
		.leftJoin(likes, eq(likes.vorp_id, vorps.id))
		.leftJoin(users, eq(vorps.user_id, users.id))
		.leftJoin(followers, eq(vorps.user_id, followers.user_id))
		.where(
			and(
				isNull(vorps.parent),
				and(
					exists(
						db
							.select()
							.from(followers)
							.where(and(eq(followers.user_id, vorps.user_id), eq(followers.follower_id, userId)))
					),
					not(inArray(vorps.id, excludePosts))
				)
			)
		)
		.groupBy(vorps.id, users.id)
		.orderBy(desc(vorps.created_at))
		.limit(limit);
	return feed;
}

async function handleFeed(handleUserId: string, userId: string) {
	const totalVorps = await db
		.select({ count: count() })
		.from(vorps)
		.where(eq(vorps.user_id, handleUserId));

	const feed = await db
		.select(vorpObj(userId))
		.from(vorps)
		.leftJoin(likes, eq(likes.vorp_id, vorps.id))
		.leftJoin(users, eq(vorps.user_id, users.id))
		.where(and(eq(vorps.user_id, handleUserId), isNull(vorps.parent)))
		.groupBy(vorps.id, users.id)
		.orderBy(desc(vorps.created_at))
		.limit(50);
	return feed;
}

async function likedFeed(userId: string, profileId: string) {
	const feed = await db
		.select({
			...vorpObj(userId),
			likedAt: likes.liked_at
		})
		.from(likes)
		.innerJoin(vorps, eq(likes.vorp_id, vorps.id))
		.innerJoin(users, eq(vorps.user_id, users.id))
		.where(eq(likes.user_id, profileId))
		.orderBy(desc(likes.liked_at))
		.limit(100);

	return feed;
}
