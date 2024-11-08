<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Store from './store.svelte';
	export let badgeList: any = [];
	export let selected: string;

	let opened = false;
</script>

<Dialog.Root bind:open={opened}>
	<Dialog.Trigger
		><img
			src="./badges/verf-{selected}.svg"
			class="mx-1 h-16 w-auto align-middle"
			alt="verrified badge"
		/></Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-[1200px]">
		<Store {selected} {badgeList} />
	</Dialog.Content>
</Dialog.Root>
