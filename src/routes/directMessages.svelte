<script lang="ts">
	import { text } from '@sveltejs/kit';
	import Loading from './loading.svelte';
	import ScrollArea from '@/components/ui/scroll-area/scroll-area.svelte';
	import Conversation from './conversation.svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface DirectMessages {
		id: string;
		name: string;
		participants: string[];
		recentMessage: string;
	}

	let dms: DirectMessages[] = [];
	let page = 'list';
	let conversationMembers: string[];
	let conversationName: string;

	let loading: boolean = true;
	async function getConversations() {
		const response = await fetch('/api/directMessages/list');

		if (response.ok) {
			dms = await response.json();
			loading = false;
		} else {
			toast('something went wrong you loser :((');
		}
	}

	onMount(async () => {
		getConversations();
	});
</script>

<div>
	{#if loading}
		<Loading occupy_screen={true} />
	{:else if page == 'list'}
		<ScrollArea>
			{#each dms as dm}
				<button
					class=" m-4 h-[75px] w-full"
					on:click={() => {
						page = `conversation${dm.id}`;
						conversationName = dm.name;
						conversationMembers = dm.participants;
					}}
				>
					<div class="flex">
						<span>
							<img src="default.jpg" alt="temp" class=" h-16 w-16 rounded-full" />
						</span>
						<div class="ml-2 flex flex-col text-left">
							<span class=" text-lg font-bold">
								{dm.name}
							</span>
							<span class=" text-md"> dm preview </span>
						</div>
					</div>
				</button>
			{/each}
		</ScrollArea>
	{:else if page.startsWith('conversation')}
		<Conversation
			{conversationMembers}
			{conversationName}
			conversationId={page.replace('conversation', '')}
		/>
	{/if}
</div>
