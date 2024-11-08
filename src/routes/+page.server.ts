import type { PageLoad } from './$types';
import { getVorp } from '$lib/server/vorp';

export const load: PageLoad = async ({ url }) => {
	const id = url.searchParams.get('id');
	const vorp = await getVorp(id || '');

	return {
		vorpData: vorp,
		vorpOpened: id
	};
};
