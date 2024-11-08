import { supabase } from '@/supabaseClient';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const Vorpid = url.searchParams.get('id');

	let urls = [];

	const { data, error } = await supabase.storage.from('vorper').list(`vorps/${Vorpid}`);

	if (!data) return json({ error: 'no images' }, { status: 404 });

	const images: string[] = data?.map((images) => images.name) || [];
	for (const dt in images) {
		const { data } = supabase.storage.from('vorper').getPublicUrl(`vorps/${Vorpid}/${images[dt]}`);
		urls.push(data.publicUrl);
	}
	return json({ urls });
};
