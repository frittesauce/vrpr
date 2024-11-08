import { db } from '$lib/server/db';
import { ConsoleLogWriter, eq, sql } from 'drizzle-orm';
import { verifyAuthJWT } from '$lib/server/jwt';
import { vorps, users, likes } from '$lib/server/schema';
import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { Snowflake } from 'nodejs-snowflake';
import { deletevorp, fetchReferencedvorps, vorpObj } from '../utils';
import { message } from 'sveltekit-superforms';
import sharp from 'sharp';
import { supabase } from '@/supabaseClient';

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
	let images = formData.getAll('images') as File | null;
	if (!images[0] && !content) content = 'i tried to vorp nothing ';

	if (content.length >= 280) {
		return json({ error: 'content to long try to make it smaller :(' }, { status: 400 });
	}

	try {
		const vorpId = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});
		const uniqueVorpid = String(vorpId.getUniqueID());

		let valuesVorp: any = {
			id: uniqueVorpid,
			user_id: userId,
			content: content,
			hasImage: false
		};

		let count = 0;

		if (images[0]) {
			valuesVorp = {
				id: uniqueVorpid,
				user_id: userId,
				content: content,
				hasImage: true
			};
			for (const image of images) {
				const arrayBuffer = await image.arrayBuffer();
				const inputBuffer = Buffer.from(arrayBuffer);
				let newImage = await sharp(inputBuffer, {
					animated: true
				})
					.webp()
					.toBuffer();

				const { data, error } = await supabase.storage

					.from('vorper')
					.upload(`vorps/${uniqueVorpid}/${count}.webp`, newImage, {
						cacheControl: '3600',
						upsert: false
					});
				count += 1;
			}
		}

		const [newVorp] = await db.insert(vorps).values(valuesVorp).returning();

		const [newVrp] = await db
			.select(vorpObj(userId))
			.from(vorps)
			.leftJoin(likes, eq(likes.vorp_id, vorps.id))
			.leftJoin(users, eq(vorps.user_id, users.id))
			.where(eq(vorps.id, newVorp.id))
			.limit(1);

		return json(newVrp, { status: 201 });
	} catch (error) {
		console.error('couldnt vorp the vorp', error);
		return json({ error: 'failed to vorp' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({
	url,
	request,
	cookies
}: {
	url: URL;
	request: Request;
	cookies: Cookies;
}) => {
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
		userId = null;
	}
	const Vorpid = url.searchParams.get('id');
	if (!Vorpid) {
		return json({ error: 'missing id' }, { status: 400 });
	}

	try {
		const vorpObject = vorpObj(userId);

		const [vorp] = await db
			.select({ ...vorpObject, parent: vorps.parent })
			.from(vorps)
			.leftJoin(users, eq(vorps.user_id, users.id))
			.where(eq(vorps.id, Vorpid))
			.limit(1);
		if (!vorp) {
			return json({ error: 'vorp not found' }, { status: 404 });
		}

		await db.execute(sql`UPDATE ${vorps} SET views = views + 1 WHERE id = ${Vorpid}`);

		const referencedVorps = await fetchReferencedvorps(userId, vorp.parent);
		return json({ ...vorp, referencedVorps });
	} catch (error) {
		console.error('Error getting vorp:', error);
		return json({ error: 'Failed to get vorp' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
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

	const formData = await request.formData();

	let content = formData.get('change') as string;
	let images = formData.get('images') as [] | null;

	if (!content) content = 'i tried to vorp nothing...';

	if (content.length >= 280) {
		return json({ error: 'content to long try to make it smaller :(' }, { status: 400 });
	}

	let Vorpid = formData.get('vorpId') as string;
	if (!Vorpid) {
		return json({ error: 'missing id' }, { status: 401 });
	}

	try {
		const [vorp] = await db
			.select({ UserId: vorps.user_id })
			.from(vorps)
			.where(eq(vorps.id, Vorpid))
			.limit(1);
		if (!vorp) {
			throw new Error('post doesnt exist');
		}

		if (vorp.UserId != userId) {
			throw new Error('youre not the author');
		}
	} catch (error) {
		console.log(error);
		return json({ error: 'vorp doesnt eist or youre not the author !' }, { status: 404 });
	}

	try {
		const [newVorp] = await db
			.update(vorps)
			.set({ content: content, edited: true })
			.where(eq(vorps.id, Vorpid));

		return json(newVorp, { status: 201 });
	} catch (error) {
		return json('error', { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
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
	const { vorpId } = body;

	if (!vorpId || typeof vorpId !== 'string') {
		return json({ error: 'Invalid vorpId ID' }, { status: 400 });
	}

	try {
		const [vorp] = await db
			.select({ UserId: vorps.user_id })
			.from(vorps)
			.where(eq(vorps.id, vorpId))
			.limit(1);
		if (!vorp) {
			throw new Error('post doesnt exist');
		}

		if (vorp.UserId != userId) {
			throw new Error('youre not the author');
		}
	} catch (error) {
		console.log(error);
		return json({ error: 'vorp doesnt eist or youre not the author !' }, { status: 404 });
	}

	try {
		await deletevorp(vorpId);

		return json({ message: 'vorp deleted' }, { status: 200 });
	} catch (error) {
		return json('error', { status: 400 });
	}
};
