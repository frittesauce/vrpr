<script lang="ts">
	import { onMount } from 'svelte';
	import Loading from './loading.svelte';
	import ScrollArea from '@/components/ui/scroll-area/scroll-area.svelte';

	export let conversationId: string;
	export let conversationName: string;
	export let conversationMembers: string[];

	interface Message {
		id: string;
		user_id: string;
		content: string;
		created_at: string;
		edited: boolean;
		username: string;
		handle: string;
		user_updated: string;
		verified: number;
	}

	let dms: Message[] = [];
	let loading: boolean = true;
	async function getConversations() {
		const response = await fetch(`/api/directMessages?id=${conversationId}`);

		if (response.ok) {
			dms = await response.json();
			loading = false;
		}
	}

	onMount(async () => {
		getConversations();
	});
</script>

<div>
	{#if loading}
		<Loading occupy_screen={true} />
	{:else}
		<div>
			<div class="flex border p-4">
				<img src="default.jpg" alt="temp" class=" h-14 w-14 rounded-full" />
				<p>{conversationName}</p>
			</div>
			<div class="p-4">
				<ScrollArea class=" flex h-full flex-row-reverse">
					{#each dms as dm}
						<div class="flex gap-x-2">
							<img
								src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{dm.user_id}_big.webp?updated={dm.user_updated}"
								alt="avatar of user {dm.username}"
								class="mr-2 h-12 w-12 rounded-full"
							/>
							<div class="">
								<div class="flex items-center gap-x-2 text-center align-middle">
									<span class=" h-min text-xl font-bold">
										{dm.username}
									</span>
									<img
										src="badges/verf-{dm.verified}.svg"
										class="mx-1 h-5 w-auto align-middle"
										alt="verrified badge"
									/>
								</div>
								<div>
									<span class="text-lg">{dm.content}</span>
								</div>
							</div>
						</div>
					{/each}
				</ScrollArea>
			</div>
		</div>
	{/if}
</div>
