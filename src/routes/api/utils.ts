import { db } from '@/server/db';
import { vorps, likes, followers, users, notifications, history } from '@/server/schema';
import { supabase } from '@/supabaseClient';
import { and, eq, inArray, sql } from 'drizzle-orm';
import sharp from 'sharp';

export const vorpObj = (userId: string | null) => {
	let payload = {
		id: vorps.id,
		content: vorps.content,
		userId: vorps.user_id,
		createdAt: vorps.created_at,
		views: vorps.views,
		handle: users.handle,
		name: users.username,
		bio: users.bio,
		verified: users.verified,
		userCreatedAt: users.created_at,
		userUpdatedAt: users.updated,
		edited: vorps.edited,
		hasImage: vorps.hasImage,
		likeCount: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.vorp_id} = ${vorps.id})`.as(
			'likeCount'
		),
		likedByUser: sql<boolean>`exists(
        select 1 from ${likes}
        where ${likes.vorp_id} = ${vorps.id}
        and ${likes.user_id} = ${userId}
    	)`.as('likedByUser'),
		followedByUser: sql<boolean>`exists(
            SELECT 1 FROM ${followers}
            WHERE ${followers.follower_id} = ${userId}
            AND ${followers.user_id} = ${vorps.user_id}
        )`.as('followedByUser'),
		commentCount:
			sql<number>`(SELECT COUNT(*) FROM ${vorps} as comments WHERE comments.parent = ${vorps.id})`.as(
				'commentCount'
			),
		followers:
			sql<number>`(SELECT COUNT(*) FROM ${followers} WHERE ${followers.user_id} = ${userId})`.as(
				'followers'
			),
		following:
			sql<number>`(SELECT COUNT(*) FROM ${followers} WHERE ${followers.follower_id} = ${userId})`.as(
				'following'
			)
	};

	return payload;
};

export async function fetchReferencedvorps(
	userId: string | null,
	parentId: string | null
): Promise<any[]> {
	const referencedvorps: any[] = [];

	async function fetchParent(currentParentId: string) {
		const obj = vorpObj(userId);

		const [parent] = await db
			.select(obj)
			.from(vorps)
			.leftJoin(users, eq(vorps.user_id, users.id))
			.where(and(eq(vorps.id, currentParentId)))
			.limit(1);

		if (parent) {
			referencedvorps.unshift(parent);
			if (parent.parentId) {
				await fetchParent(parent.parentId);
			}
		}
	}

	if (parentId) {
		await fetchParent(parentId);
	}

	return referencedvorps;
}

export async function deletevorp(vorpId: string) {
	await db.transaction(async (trx) => {
		const comments = await trx.select({ id: vorps.id }).from(vorps).where(eq(vorps.parent, vorpId));

		const commentIds = comments.map((comment) => comment.id);
		const allIds = [vorpId, ...commentIds];
		await trx.delete(likes).where(inArray(likes.vorp_id, allIds));

		await trx.delete(notifications).where(inArray(notifications.vorpId, allIds));

		await trx.delete(vorps).where(and(eq(vorps.parent, vorpId)));

		await trx.delete(vorps).where(eq(vorps.id, vorpId));
	});

	const { data } = await supabase.storage.from('vorper').list(`vorps/${vorpId}`);
	for (let dt of data) {
		await supabase.storage.from('vorper').remove([`vorps/${vorpId}/${dt.name}`]);
	}
	await supabase.storage.from('vorper').remove([`vorps/${vorpId}`]);
}

export async function uploadAvatar(inputBuffer: Buffer, fileName: string, userId: string) {
	const buffer_small = await sharp(inputBuffer, {
		animated: true
	})
		.resize(40, 40)
		.webp()
		.toBuffer();

	const buffer_medium = await sharp(inputBuffer, {
		animated: true
	})
		.resize(50, 50)
		.webp()
		.toBuffer();

	const buffer_big = await sharp(inputBuffer, {
		animated: true
	})
		.resize(160, 160)
		.webp()
		.toBuffer();

	const images = [
		{ filename: fileName + '_small.webp', buffer: buffer_small },
		{ filename: fileName + '_medium.webp', buffer: buffer_medium },
		{ filename: fileName + '_big.webp', buffer: buffer_big }
	];

	for (const img of images) {
		const { data: dt, error: err } = await supabase.storage
			.from('vorper')
			.remove([`avatars/${img.filename}`]);
		const { data, error } = await supabase.storage

			.from('vorper')
			.upload(`avatars/${img.filename}`, img.buffer, {
				cacheControl: '3600',
				upsert: false
			});
		console.log(error, err);
	}
}
