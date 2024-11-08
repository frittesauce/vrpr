import { uploadAvatar } from '../utils';
import { readFileSync } from 'fs';
import { json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { message } from 'sveltekit-superforms';

const avatar = readFileSync('static/default.png');

export const POST: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	if (!authCookie) return json({ error: 'missing auth' }, { status: 401 });

	const jwtPayload = await verifyAuthJWT(authCookie);

	if (!jwtPayload.userId) {
		throw new Error('invalid jwt');
	}

	const userId = jwtPayload.userId;
	uploadAvatar(avatar, userId);
	return json({ message: 'meow' }, { status: 201 });
};
