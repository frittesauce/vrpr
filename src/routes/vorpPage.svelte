<script lang="ts">
	import { onMount } from 'svelte';
	import Vorp from './vorp.svelte';
	import Loading from './loading.svelte';
	import { toast } from 'svelte-sonner';

	export let myUid;
	export let page;
	let vorpOpened = page.replace('vorp', '');

	let vorp: any;
	let feed: any = [];
	let loading = true;
	let loadingFeed = true;

	async function fetchVorp(id) {
		loading = true;
		feed = [];
		const response = await fetch(`/api/vorp?id=${id}`, { method: 'GET' });

		if (response.status === 200) {
			feed = await fetchFeed();
			vorp = await response.json();
			loading = false;
		}
	}

	async function fetchFeed() {
		const response = await fetch('api/comment?id=' + page.replace('vorp', ''), {
			method: 'GET'
		});

		if (response.status !== 200) toast('coulnt load vorp');

		const res = await response.json();
		return res.map((post: any) => ({ ...post }));
	}

	async function handleDelete(id: string) {
		toast('deleting...');
		const result = await fetch('api/vorp', {
			method: 'DELETE',
			body: JSON.stringify({
				vorpId: id
			})
		});
		if (result.status == 200) {
			toast('deleted!');
			feed = feed.filter((vorp: any) => vorp.id !== id);
		}
	}

	onMount(async () => {
		fetchVorp(page.replace('vorp', ''));
	});

	$: fetchVorp(page.replace('vorp', ''));
</script>

{#if loading}
	<Loading />
{:else}
	<Vorp {...vorp} {myUid} {handleDelete} />
	<hr class=" mt-3 w-full border-slate-500 pt-4" />
	{#each feed as comment}
		<Vorp bind:page {...comment} {myUid} {handleDelete} />
	{/each}
{/if}
