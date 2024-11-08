import { db } from '$lib/server/db';
import { and, ConsoleLogWriter, desc, eq, exists, sql } from 'drizzle-orm';
import { verifyAuthJWT } from '$lib/server/jwt';
import { vorps, users, likes } from '$lib/server/schema';
import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { Snowflake } from 'nodejs-snowflake';
import { fetchReferencedvorps, vorpObj } from '../utils';
import { createNotification } from '@/server/notification';
import { not } from 'drizzle-orm';

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

	const formData = await request.formData();

	let content = formData.get('content') as string;
	let vrpId = formData.get('vorpId') as string;

	if (!content) content = 'i tried to vorp nothing ';

	if (content.length >= 280) {
		return json({ error: 'content to long try to make it smaller :(' }, { status: 400 });
	}

	if (!vrpId) {
		return json({ error: 'no vorp id :(' }, { status: 400 });
	}

	try {
		const [vorpExist] = await db.select().from(vorps).where(eq(vorps.id, vrpId)).limit(1);
		if (!vorpExist) {
			throw new Error('post doesnt exist');
		}

		const vorpId = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});
		const uniqueVorpid = String(vorpId.getUniqueID());

		let valuesVorp: any = {
			id: uniqueVorpid,
			user_id: userId,
			content: content,
			parent: vrpId
		};

		const [newVorp] = await db.insert(vorps).values(valuesVorp).returning();

		if (vorpExist.user_id !== userId && vorpExist.user_id) {
			await createNotification(vorpExist.user_id, 'comment', userId, vrpId);
		}
		return json(newVorp, { status: 201 });
	} catch (error) {
		console.error('couldnt vorp the vorp', error);
		return json({ error: 'failed to vorp' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	const vorpId = url.searchParams.get('id');
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!vorpId) {
		return json({ error: 'Missing vorp ID' }, { status: 400 });
	}

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}

		const userId = jwtPayload.userId;

		const userReplies = await db
			.select(vorpObj(userId))
			.from(vorps)
			.leftJoin(likes, eq(likes.vorp_id, vorps.id))
			.leftJoin(users, eq(vorps.user_id, users.id))
			.where(
				and(
					eq(vorps.parent, vorpId),
					exists(
						db
							.select()
							.from(vorps)
							.where(and(eq(vorps.parent, vorps.id), eq(vorps.user_id, userId)))
					)
				)
			)
			.groupBy(vorps.id, users.id)
			.orderBy(desc(vorps.created_at))
			.execute();

		let mostLikedComments: {
			id: string;
			content: string;
			userId: string | null;
			createdAt: Date | null;
			views: number | null;
			parentId: string | null;
			likeCount: number;
			commentCount: number;
			likedByUser: boolean;
			repostedByUser: boolean;
			handle: string | null;
			userCreatedAt: Date | null;
			username: string | null;
			verified: number | null;
		}[] = [];
		if (userReplies.length < 50) {
			const notInClause =
				userReplies.length > 0
					? not(
							eq(
								vorps.id,
								sql`ANY(${sql`ARRAY[${sql.join(userReplies.map((reply) => reply.id))}]`})`
							)
						)
					: sql`TRUE`;
			mostLikedComments = await db
				.select(vorpObj(userId))
				.from(vorps)
				.leftJoin(likes, eq(likes.vorp_id, vorps.id))
				.leftJoin(users, eq(vorps.user_id, users.id))
				.where(and(eq(vorps.parent, vorpId), notInClause))
				.groupBy(vorps.id, users.id)
				.orderBy(desc(sql`count(distinct ${likes.user_id})`), desc(vorps.created_at))
				// .limit(50 - userReplies.length)
				.execute();
		}
		const comments = [...userReplies, ...mostLikedComments];

		incrementViewCounts(comments.map((comments) => comments.id));

		return json(comments, { status: 200 });
	} catch (error) {
		console.error('Error fetching comments:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return json({ error: 'Failed to fetch comments' }, { status: 500 });
	}
};

async function incrementViewCounts(vorpIds: string[]) {
	try {
		await db.transaction(async (tx) => {
			await Promise.all(
				vorpIds.map((id) => tx.execute(sql`UPDATE ${vorps} SET views = views + 1 WHERE id = ${id}`))
			);
		});
	} catch (error) {
		console.error('Error incrementing view counts:', error);
	}
}
