import { fetchReferencedvorps, vorpObj } from '../../routes/api/utils';
import { db } from './db';
import { vorps, users } from './schema';
import { eq } from 'drizzle-orm';

export async function getVorp(vorpId: string) {
	if (!vorpId) return;

	const vorpobj = vorpObj(null);

	const [vorp] = await db
		.select({ ...vorpobj, parent: vorps.parent })
		.from(vorps)
		.leftJoin(users, eq(vorps.user_id, users.id))
		.where(eq(vorps.id, vorpId))
		.limit(1);

	if (!vorp) {
		return;
	}

	const referencedVorps = await fetchReferencedvorps(null, vorp.parent);

	return { ...vorp, referencedVorps };
}
