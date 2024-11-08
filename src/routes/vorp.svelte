<script lang="ts">
	import { toast } from 'svelte-sonner';
	import Avatar from './avatar.svelte';
	import {
		AlignEndHorizontal,
		Star,
		Hammer,
		Dog,
		Cat,
		Croissant,
		MessageCircle,
		Bookmark,
		Rocket,
		Telescope,
		UserRoundPlus,
		UserRoundMinus
	} from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '@/components/ui/form/index';
	import Inputvorp from './inputvorp.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Loading from './loading.svelte';
	import { time } from 'drizzle-orm/mysql-core';
	import MiniProfile from './miniProfile.svelte';

	let carApi: CarouselAPI;
	let count;
	let current;

	$: if (carApi) {
		count = carApi.scrollSnapList().length;
		current = carApi.selectedScrollSnap() + 1;
		carApi.on('select', () => {
			current = carApi.selectedScrollSnap() + 1;
		});
	}

	let opened: boolean = false;

	export let myUid: string;

	export let id: string;
	export let content: string;
	export let createdAt: number;
	export let views: number;
	export let likeCount: number;
	export let commentCount: number;
	export let verified: number;
	export let userCreatedAt: number;
	export let userUpdatedAt: number;

	export let handle: string;
	export let name: string;
	export let bio: string;
	export let userId: string;

	export let edited: boolean;
	export let hasImage: boolean;
	export let followedByUser: boolean;
	export let likedByUser: boolean;

	export let followers: boolean;
	export let following: boolean;

	export let page;

	let vorp = '';
	let opened2 = false;
	let openedDropwdown = false;
	let editedVorp = content;

	function formatNumber(num: number): string {
		if (!num) return '0';

		const absNum = Math.abs(num);

		if (absNum >= 1000000000) {
			return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
		}
		if (absNum >= 1000000) {
			return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		}
		if (absNum >= 1000) {
			return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
		}
		return num.toString();
	}

	async function handleLike() {
		likeCount = likedByUser ? likeCount - 1 : Number(likeCount) + 1;
		likedByUser = !likedByUser;

		const res = await fetch('/api/likeVorp', {
			method: 'POST',
			body: JSON.stringify({ vorpId: id })
		});
	}

	async function handleFollow() {
		const res = await fetch('/api/follow', {
			method: 'POST',
			body: JSON.stringify({ target: userId })
		});

		if (res.status === 200) {
			followedByUser = !followedByUser;
		}
	}

	async function PostHandler() {
		const formData = new FormData();

		formData.append('content', vorp);
		formData.append('vorpId', id);
		toast.promise(
			fetch('api/comment', {
				method: 'POST',
				body: formData
			}),
			{
				loading: 'vorping...',
				success: 'vorped!!',
				error: 'Could not vorp.'
			}
		);
		opened = false;
		vorp = '';
	}

	export let handleDelete: any;
	async function EditHandler() {
		const formData = new FormData();

		formData.append('change', editedVorp);
		formData.append('vorpId', id);
		toast.promise(
			fetch('api/vorp', {
				method: 'PATCH',
				body: formData
			}),
			{
				loading: 'editing...',
				success: 'edited!!!',
				error: 'Could not edit.'
			}
		);
		edited = true;
		content = editedVorp;
		opened2 = false;
	}

	function formatTimeAgo(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const secondsPast = (now.getTime() - date.getTime()) / 1000;

		if (secondsPast < 60) {
			return `${Math.floor(secondsPast)}s ago`;
		}
		if (secondsPast < 3600) {
			return `${Math.floor(secondsPast / 60)}m ago`;
		}
		if (secondsPast <= 86400) {
			return `${Math.floor(secondsPast / 3600)}h ago`;
		}
		if (secondsPast > 86400) {
			const day = date.getDate();
			const month = date.toLocaleString('default', { month: 'short' });
			const year = date.getFullYear();
			return `${day} ${month} ${year}`;
		}
	}
	function formatDateTooltip(date) {
		date = new Date(date);

		const options = {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};

		return date.toLocaleString(undefined, options);
	}

	async function fetchImages() {
		const response = await fetch(`/api/images?id=${id}`, {
			method: 'GET'
		});
		if (response.status === 200) {
			const res = await response.json();
			return res.urls;
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<button
	class="w-full text-left hover:bg-slate-900"
	on:click={() => {
		goto(`./?id=${id}`);
		page = `vorp${id}`;
	}}
>
	<hr class=" w-full border-slate-500 pt-3" />
	<div class=" px-4">
		<div class=" flex">
			<img
				src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{userId}_big.webp?updated={userUpdatedAt}"
				alt="avatar of user {name}"
				class="mr-2 h-10 w-10 rounded-full"
			/>
			<div class=" w-full">
				<div class="flex w-full justify-between">
					<div class=" flex items-center justify-center gap-0">
						<MiniProfile
							{userId}
							{handle}
							{name}
							{followers}
							{following}
							{verified}
							{bio}
							{userUpdatedAt}
						>
							<button
								class=" z-50 flex items-center justify-center gap-0"
								on:click|stopPropagation={() => {
									goto(`./${handle}`);
								}}
							>
								<span class=" h-min text-lg font-bold">{name}</span>
								<img
									src="./badges/verf-{verified}.svg"
									class="mx-1 h-4 w-auto align-middle"
									alt="verrified badge"
								/>
								<h1 class=" text-lg text-slate-500">@{handle}</h1>
							</button></MiniProfile
						>
						<h1 class=" mx-1 text-lg text-slate-500">·</h1>
						<p class="text-lg text-slate-500">{formatTimeAgo(createdAt)}</p>
					</div>
					<Dialog.Root bind:open={opened2}>
						<Popover.Root bind:open={openedDropwdown}>
							<Popover.Trigger asChild let:builder>
								<button
									{...builder}
									aria-label="open vorp popover"
									on:click|stopPropagation={() => {
										openedDropwdown = !openedDropwdown;
									}}
								>
									{#if userId == myUid}
										<Cat />
									{:else}
										<Dog />
									{/if}
								</button>
							</Popover.Trigger>
							<Popover.Content class="m-0 flex w-48 flex-col p-2 ">
								{#if userId == myUid}
									<button
										class="mb-1 flex items-center justify-between rounded-lg p-3 text-base hover:bg-slate-700"
									>
										<Dialog.Trigger class="flex w-full justify-between"
											><Hammer />Edit</Dialog.Trigger
										>
									</button>
									<button
										class="mb-1 flex items-center justify-between rounded-lg p-3 text-base hover:bg-slate-700"
										on:click|stopPropagation={() => {
											handleDelete(id);
											openedDropwdown = false;
										}}><Croissant /> Delete</button
									>
								{:else if !followedByUser}
									<button
										class="mb-1 flex items-center justify-between rounded-lg p-3 text-base hover:bg-slate-700"
										on:click={() => {
											handleFollow();
											openedDropwdown = false;
										}}><UserRoundPlus />Follow</button
									>
								{:else}
									<button
										class="mb-1 flex items-center justify-between rounded-lg p-3 text-base hover:bg-slate-700"
										on:click={() => {
											openedDropwdown = false;
											handleFollow();
										}}><UserRoundMinus />Unfollow</button
									>
								{/if}
							</Popover.Content>
						</Popover.Root>

						<Dialog.Content class="sm:max-w-[600px]">
							<div class="flex items-start space-x-3">
								<Avatar alt="your profile avatar" />
								<div class="flex h-full flex-grow flex-col gap-2">
									<div class="max-h-[600px] overflow-y-auto">
										<Inputvorp bind:vorp={editedVorp} />
									</div>
								</div>
							</div>
							<div class="flex justify-end">
								<Form.Button on:click={() => EditHandler()}>vorp</Form.Button>
							</div>
						</Dialog.Content>
					</Dialog.Root>
				</div>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="block h-auto whitespace-pre-wrap">
					<p class=" m-0 inline-block max-w-lg break-words p-0 text-lg">{content}</p>

					{#if edited}
						<p class=" text-base text-slate-500">(edited)</p>
					{/if}

					{#if hasImage}
						<div class="mr-4 flex h-[400px] w-full items-center justify-center">
							{#await fetchImages()}
								<Loading />
							{:then imagesUrls}
								<Carousel.Root
									opts={{
										align: 'start',
										loop: true
									}}
									bind:api={carApi}
									class="sm:w-[400px]"
								>
									<div class=" inline-block" on:click|stopPropagation>
										<Carousel.Content>
											{#each imagesUrls as url}
												<Carousel.Item
													><img
														class="h-[350px] w-[350px] rounded-xl"
														alt="content is unkown"
														src={url}
													/></Carousel.Item
												>
											{/each}
										</Carousel.Content>
										<div>
											{#if imagesUrls.length != 1}
												<Carousel.Previous />
												<Carousel.Next />
											{/if}
										</div>
									</div>
								</Carousel.Root>
							{/await}
						</div>
					{/if}
				</div>
				<div class="mt-3 flex justify-between">
					<Dialog.Root bind:open={opened}>
						<Dialog.Trigger asChild>
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<button
								class="flex items-center justify-center text-lg"
								on:click|stopPropagation={() => {
									opened = true;
								}}
							>
								<MessageCircle class=" mr-1 h-5 w-5" />
								{formatNumber(commentCount)}
							</button>
						</Dialog.Trigger>
						<Dialog.Content class="sm:max-w-[600px]">
							<div class=" flex align-middle">
								<img
									src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{userId}_big.webp?updated={userUpdatedAt}"
									class="mr-2 h-10 w-10 rounded-full"
									alt="profile pic"
								/>
								<div class=" mx-4 self-center">
									<h1 class="text-2xl">{name}</h1>
								</div>

								<img src="./badges/verf-{verified}.svg" class="h-12 w-12" alt="verrified badge" />
							</div>
							<div class="flex">
								<div
									class=" self-stret mx-6 inline-block h-auto min-h-[1em] w-[0.06rem] bg-slate-500 dark:bg-white/10"
								></div>
								<p class=" m-1 mx-6 whitespace-pre-wrap break-all text-xl">
									{content.replace(/\n$/, '')}
								</p>
							</div>
							<div class="flex items-start space-x-3">
								<img
									src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{myUid}_big.webp"
									class="mr-2 h-10 w-10 rounded-full"
									alt="your profile pic"
								/>
								<div class="flex h-full flex-grow flex-col gap-2">
									<div class="max-h-[600px] overflow-y-auto">
										<Inputvorp bind:vorp />
									</div>
								</div>
							</div>
							<div class="flex justify-end">
								<Form.Button on:click={() => PostHandler()}>vorp</Form.Button>
							</div>
						</Dialog.Content>
					</Dialog.Root>
					<button class="likeBtn" on:click|stopPropagation={handleLike}>
						<p
							class:text-yellow-500={likedByUser}
							class="  flex items-center justify-center text-lg"
						>
							<Star class=" mr-1 flex h-6 w-6 align-middle" />
							{formatNumber(likeCount)}
						</p></button
					>
					<p class="flex items-center justify-center text-lg">
						<Telescope class="mr-1" />
						{formatNumber(views)}
					</p>
					<div class="flex">
						<p class="flex items-center justify-center text-lg">
							<Bookmark />
						</p>

						<p class="flex items-center justify-center text-lg">
							<Rocket />
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</button>
