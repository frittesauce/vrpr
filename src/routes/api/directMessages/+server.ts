import { db } from '@/server/db';
import { verifyAuthJWT } from '@/server/jwt';
import { conversations, directMessages, users } from '@/server/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const authCookie = cookies.get('_DONT_SHARE_AUTH');

	let userId: string;
	let conversationId: string | null = url.searchParams.get('id');

	if (!authCookie) return json({ error: 'no authentication provided ' }, { status: 401 });

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('invalid jwt');
		}

		const userId = jwtPayload.userId;

		const conversationMembers: any = await db
			.select({ participants: conversations.participants })
			.from(conversations)
			.where(eq(conversations.id, conversationId))
			.limit(1);

		if (!conversationMembers) {
			throw new Error('conversation doesnt exist!');
		}

		const convoIds = conversationMembers[0].participants;

		if (!convoIds.includes(userId)) {
			throw new Error('youre not in this conversation!');
		}

		const messages = await db
			.select({
				id: directMessages.id,
				user_id: directMessages.user_id,
				content: directMessages.content,
				created_at: directMessages.created_at,
				edited: directMessages.edited,
				username: users.username,
				handle: users.handle,
				user_updated: users.updated,
				verified: users.verified
			})
			.from(directMessages)
			.where(eq(directMessages.conversationId, conversationId))
			.leftJoin(users, eq(users.id, directMessages.user_id));

		return json(messages, { status: 200 });
	} catch (error) {
		console.log('error whilest fetching direct messages', error);
		return json({ error: 'something went wrong try again!' }, { status: 500 });
	}
};
