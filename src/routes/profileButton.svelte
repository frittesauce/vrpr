<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '@/components/ui/button/button.svelte';
	import { page } from '$app/stores';

	import { DoorClosed, DoorOpen, Rabbit, Axe } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	export let handle;
	export let id;
	export let username;
	export let updated;

	let hover = false;

	function deleteAllCookies() {
		console.log('pee  pee');
		localStorage.clear();
	}

	async function logout() {
		console.log('meow');
		const response = await fetch('/api/logout', { method: 'POST' });

		if (response.status !== 200) {
			console.log('poo poo');
			return toast('you skibidi you cant log out');
		}
		deleteAllCookies();
		location.reload();
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="m-2 flex w-[250px] rounded-full p-[12px] text-left align-middle text-xl hover:bg-slate-600"
	>
		<div class="flex">
			<img
				src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{id}_big.webp?updated={updated}"
				alt="your avatar!"
				class=" mr-2 h-14 w-14 rounded-full"
			/>
			<div class=" self-center text-left">
				<h1 class="text-xl font-bold text-slate-100">{username}</h1>
				<h2 class="text-xl text-slate-500">@{handle}</h2>
			</div>
			<!-- <img src="/funnycat.png" class=" ml-2 h-14 w-14" alt="funny cat making selfie" /> -->
		</div>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-[250px]">
		<DropdownMenu.Group>
			<DropdownMenu.Label class="flex w-full justify-between text-2xl">Profile!</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				><button
					class="flex w-full justify-between text-xl"
					on:click={() => {
						goto(`/${handle}`);
					}}>My Profile! <Rabbit /></button
				></DropdownMenu.Item
			>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-xl">
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button
					class="flex w-full justify-between"
					on:mouseenter={() => {
						hover = true;
					}}
					on:mouseleave={() => {
						hover = false;
					}}
					on:click={logout}
				>
					Log Out
					{#if hover == true}
						<DoorOpen class="ml-auto" />
					{:else}
						<DoorClosed class="ml-auto" />
					{/if}
				</button>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
