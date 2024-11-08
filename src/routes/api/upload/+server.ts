import { verifyAuthJWT } from '@/server/jwt';
import { json, type RequestHandler } from '@sveltejs/kit';
import { uploadAvatar } from '../utils';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('upaditing profile picture');
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

	let userId: string;

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		userId = jwtPayload.userId;
		const formData = await request.formData();

		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file uploaded' }, { status: 400 });
		}

		const fileName = userId;

		const arrayBuffer = await file.arrayBuffer();
		const inputBuffer = Buffer.from(arrayBuffer);

		uploadAvatar(inputBuffer, fileName);

		await db
			.update(users)
			.set({ updated: sql`NOW()` })
			.where(eq(users.id, userId));

		return json(
			{
				message: 'File uploaded successfully'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.log('file error...', error);
		return json({ error: 'Uplading failed' }, { status: 500 });
	}
};
