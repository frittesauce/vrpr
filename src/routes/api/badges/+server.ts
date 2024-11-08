import { json, type Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { badges, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';

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

	let userId: string;

	if (!authCookie) return json({ error: 'no authentication' }, { status: 401 });

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

	const bdgs = await db
		.select({
			id: badges.id,
			name: badges.name,
			likes: badges.followers,
			description: badges.description,
			selected: sql<number>`(SELECT verified FROM users WHERE id = ${userId})`.as('selected')
		})
		.from(badges)
		.orderBy(badges.id);
	return json({ badges: bdgs });
};

export const POST: RequestHandler = async ({
	url,
	request,
	cookies
}: {
	url: URL;
	request: Request;
	cookies: Cookies;
}) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	let userId: string;

	if (!authCookie) return json({ error: 'no authentication' }, { status: 401 });

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
	const { badgeId } = body;

	if (!badgeId || typeof badgeId !== 'number') {
		return json({ error: 'Invalid badge ID' }, { status: 400 });
	}

	try {
		const respone = await db.update(users).set({ verified: badgeId }).where(eq(users.id, userId));
		return json({ message: 'done!' });
	} catch (error) {
		return json({ message: 'error!' });
	}

	// const response =
};
