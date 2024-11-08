<script lang="ts">
	import { goto } from '$app/navigation';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';

	export let handle;
	export let userId;
	export let name;
	export let following;
	export let followers;
	export let verified;
	export let bio;
	export let userUpdatedAt;
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		<slot />
	</HoverCard.Trigger>

	<HoverCard.Content class="w-80">
		<div class="flex flex-col">
			<img
				src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{userId}_big.webp?updated={userUpdatedAt}"
				alt="avatar of user {name}"
				class=" mb-2 h-16 w-16 rounded-full"
			/>
			<span class=" mb-0 flex h-min items-center align-middle text-lg font-bold"
				>{name}
				<img
					src="./badges/verf-{verified}.svg"
					class="mx-1 h-4 w-auto align-middle"
					alt="verrified badge"
				/></span
			>
			<h1 class=" mb-3 text-lg text-slate-500">@{handle}</h1>
			<p class=" text-md mb-4 break-words text-white">{bio}</p>

			<span class="flex">
				<span class="mx-2">{followers} <span class="text-slate-500">followers</span></span>
				<span class="mx-2">{following} <span class="text-slate-500">following</span></span>
			</span>
		</div>
	</HoverCard.Content>
</HoverCard.Root>
