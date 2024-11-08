<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';
	export let badgeList: any = [];
	export let selected: string;

	async function setBadge(badgeId: string) {
		try {
			const response = await fetch('/api/badges', {
				method: 'POST',
				body: JSON.stringify({ badgeId: badgeId })
			});
			if (response.status !== 200) {
				throw new Error('something went wrong');
			}
			toast('changed badge to: ' + badgeId);
		} catch (error) {}
		selected = badgeId;
	}
</script>

<div class=" h-[500px] w-full gap-4 overflow-y-scroll">
	<div class=" ">
		<h1 class="text-4xl">Verified Selector</h1>
	</div>
	<div class=" flex flex-wrap items-center justify-center">
		<div class=" grid grid-cols-2 gap-8">
			{#each badgeList as badge}
				<div class="m-4 flex flex-col justify-between rounded-xl border-2 p-6">
					<div>
						<img src="./badges/verf-{badge.id}.svg" class=" my-2 h-24 w-24" alt="verrified badge" />
						<h2 class="mb-3 text-xl">
							{badge.name}!
						</h2>
						<p class=" text-md mb-1 h-24 max-h-24 overflow-y-scroll text-white">
							{badge.description}
						</p>
					</div>
					{#if badge.id == selected}
						<button class=" w-32 rounded-md bg-orange-500 p-2 text-xl font-bold text-white" disabled
							>Selected!</button
						>
					{:else}
						<button
							class=" w-32 rounded-md bg-green-500 p-2 text-xl font-bold text-white hover:bg-green-600"
							on:click={setBadge(badge.id)}>Use!</button
						>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
