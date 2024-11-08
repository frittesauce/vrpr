import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT, createAuthJWT } from '$lib/server/jwt';

import { Snowflake } from 'nodejs-snowflake';

import { db } from '$lib/server/db';
import { likes, vorps, notifications, users, history, followers } from '$lib/server/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { uploadAvatar } from '../utils';
import { readFileSync } from 'fs';
import { message } from 'sveltekit-superforms';
import { updated } from '$app/stores';

const avatar = readFileSync('static/default.png');

export const POST: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
	const discordToken = cookies.get('temp-discord-token');
	const meRes = await fetch('https://discord.com/api/v10/users/@me', {
		headers: {
			Authorization: 'Bearer ' + discordToken
		}
	});

	if (!meRes.ok) {
		throw new Error('Invalid Discord token');
	}

	const meBody = await meRes.json();

	const body = await request.json();

	if (!body.handle || !body.username || !meBody.email) {
		return json({ error: 'Invalid request - missing fields.' }, { status: 400 });
	}

	if (body.handle.length > 32 || body.username.length > 60) {
		return json(
			{ error: 'Handle (32) or username (60) are over the character limit.' },
			{ status: 400 }
		);
	}

	const existingUser = await db.select().from(users).where(eq(users.email, meBody.email)).limit(1);

	if (existingUser.length > 0) {
		return json({ error: 'Email already in use' }, { status: 409 });
	}

	try {
		const userId = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});
		const uniqueUserId = String(userId.getUniqueID());

		const cleanedHandle = body.handle.replace(/[^0-9a-z_-]/gi, '').toLowerCase();

		const jwt = await createAuthJWT({
			userId: uniqueUserId
		});

		const [newVorp] = await db
			.insert(users)
			.values({
				id: uniqueUserId,
				handle: cleanedHandle,
				token: jwt,
				email: meBody.email,
				username: body.username.replace('\n', ' '),
				bio: body.bio
			})
			.returning();

		uploadAvatar(avatar, uniqueUserId);
		//! CHANGE TRUE LATER
		cookies.set('_DONT_SHARE_AUTH', jwt, {
			path: '/',
			httpOnly: false,
			secure: false,
			sameSite: 'strict',
			maxAge: 31536000
		});

		return json({ ...newVorp }, { status: 201 });
	} catch (error) {
		console.log('Error creating user:', error);
		return json({ error: 'Failed to create user.' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	{
		const authCookie = cookies.get('_DONT_SHARE_AUTH');
		if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

		let usrId: string;

		try {
			const jwtPayload = await verifyAuthJWT(authCookie);
			usrId = jwtPayload.userId;

			if (!usrId) {
				throw new Error('invalid jwt');
			}
		} catch (error) {
			console.log('auth error...', error);
			return json({ error: 'couldnt authenticate' }, { status: 401 });
		}

		const userHandle = url.searchParams.get('handle');
		const userId = url.searchParams.get('id');

		if (!userHandle && !userId) {
			return json({ error: 'Missing user handle or id.' }, { status: 400 });
		}

		try {
			const result = await db
				.select({
					id: users.id,
					handle: users.handle,
					created_at: users.created_at,
					username: users.username,
					verified: users.verified,
					bio: users.bio,
					updated: users.updated,
					isFollowing: sql<boolean>`exists(
						SELECT 1 FROM ${followers}
						WHERE ${followers.follower_id} = ${usrId}
						AND ${followers.user_id} = ${users.id}
					)`.as('followedByUser'),
					followers:
						sql<number>`(SELECT COUNT(*) FROM ${followers} WHERE ${followers.user_id} = ${users.id})
					`.as('followers'),
					following:
						sql<number>`(SELECT COUNT(*) FROM ${followers} WHERE ${followers.follower_id} = ${users.id})
					`.as('followers')
				})
				.from(users)
				.leftJoin(followers, eq(followers.user_id, users.id))
				.where(eq(users.handle, userHandle))
				.limit(1);

			const user = result[0];

			if (!user) {
				return json({ error: 'user doesnt exist' }, { status: 404 });
			}

			return json({
				id: user.id,
				handle: user.handle,
				created_at: user.created_at,
				username: user.username,
				verified: user.verified,
				bio: user.bio,
				following: user.following,
				updated: user.updated,
				followers: user.followers,
				isFollowing: user.isFollowing
			});
		} catch (error) {
			console.error('Error fetching user:', error);
			return json({ error: 'Failed to fetch user' }, { status: 500 });
		}
	}
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
	let userId: string | null;

	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

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
	let { bio, username } = body;

	const updateData: Partial<typeof users.$inferInsert> = {};

	if (bio) {
		if (typeof bio !== 'string' || bio.length > 256) {
			return json({ error: 'Bio must be 256 characters or less' }, { status: 400 });
		}
		updateData.bio = bio;
	}

	if (username) {
		if (typeof username !== 'string' || username.length > 60) {
			return json({ error: 'Username must be 60 characters or less' }, { status: 400 });
		}
		updateData.username = username;
	}

	try {
		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, userId))
			.returning();

		return json(
			{
				message: 'User updated successfully',
				user: {
					id: updatedUser.id,
					handle: updatedUser.handle,
					username: updatedUser.username,
					bio: updatedUser.bio
				}
			},
			{ status: 200 }
		);
	} catch {
		return json({ error: 'something went wrong whilest updating' }, { status: 500 });
	}
};
