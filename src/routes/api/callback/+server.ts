import { db } from '$lib/server/db';
import { supabase } from '$lib/supabaseClient';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { users } from '$lib/server/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { createAuthJWT } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const code = url.searchParams.get('code');
		if (!code) return json({ error: 'No code in search params' }, { status: 400 });

		const formData = new URLSearchParams();
		formData.set('grant_type', 'authorization_code');
		formData.set('code', code);
		url.search = '';
		if (url.port == '') url.protocol = 'https://';
		formData.set('redirect_uri', url.toString());

		const codeRes = await fetch('https://discord.com/api/v10/oauth2/token', {
			method: 'POST',
			body: formData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization:
					'Basic ' +
					btoa(`${process.env.PUBLIC_DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`)
			}
		});

		if (codeRes.status != 200) return json({ error: 'invalid state' }, { status: 400 });
		const data = await codeRes.json();

		const accessToken = data['access_token'];
		const meRes = await fetch('https://discord.com/api/v10/users/@me', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (meRes.status != 200) return json({ error: 'invalid user' }, { status: 400 });
		const meBody = await meRes.json();
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, meBody.email))
			.limit(1);
		if (existingUser.length > 0) {
			const jwt = await createAuthJWT({
				userId: existingUser[0].id,
				timestamp: Date.now()
			});
			//! set these to true later again
			cookies.set('_DONT_SHARE_AUTH', jwt, {
				path: '/',
				httpOnly: false,
				secure: false,
				sameSite: 'strict',
				maxAge: 31536000
			});
		}

		cookies.set('temp-discord-token', accessToken, {
			path: '/',
			httpOnly: false,
			secure: false
		});

		return new Response(null, {
			status: 301,
			headers: {
				Location: '/'
			}
		});
	} catch (error) {
		console.error('Error while handling discord callback', error);
		return json({ error: 'Unexpected internal error' }, { status: 500 });
	}
};
