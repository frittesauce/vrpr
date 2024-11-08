<script lang="ts">
	import { toast } from 'svelte-sonner';
	import Vorp from './vorp.svelte';
	import Store from './store.svelte';
	import BadgeButoon from './badgeButoon.svelte';
	import Cookies from 'js-cookie';
	import Profilepage from './profilepage.svelte';
	import ProfileButton from './profileButton.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '@/components/ui/form/index';
	import Avatar from './avatar.svelte';
	import Inputvorp from './inputvorp.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import Loading from './loading.svelte';
	import { goto } from '$app/navigation';
	import Notifications from './notifications.svelte';
	let feed: any = [];
	let currentTab: string = 'Main';
	import { Apple, MoonStar, Earth, Moon, MessageSquare, Image } from 'lucide-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import VorpPage from './vorpPage.svelte';
	import DirectMessages from './directMessages.svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	const tabs = ['Main', 'Following'];

	function tabChange(tab: string) {
		loadingFeed = true;
		feed = [];
		currentTab = tab;
		fetchFeed(false, tab);
		if (feedContainer) {
			feedContainer.addEventListener('scroll', handleScroll);
		}
	}

	async function fetchFeed(append = false) {
		const response = await fetch(
			`api/feed?type=${currentTab}&excludePosts=${feed.map((vorp: any) => vorp.id).join(',')}`,
			{ method: 'GET' }
		);

		if (response.status !== 200) toast('coulnt load vorp');

		const res = await response.json();
		const newVorps = res.vorps.map((vorp: any) => ({ ...vorp }));

		if (append) {
			const uniqueNewPosts = newVorps.filter(
				(newPost: any) => !feed.some((existingPost: any) => existingPost.id === newPost.id)
			);

			if (feed.length == feed.concat(uniqueNewPosts).length) {
				toast('No more posts to load!\nRefresh for more!');
				feedContainer.removeEventListener('scroll', handleScroll);
			}

			feed = feed.concat(uniqueNewPosts);

			if (feed.length > 250) {
				feed = feed.slice(50);
			}
		} else {
			feed = newVorps;
		}
		loadingFeed = false;
	}

	export let id: String;
	export let updated: String;
	export let verified: String;
	export let username: String;
	export let handle: String;

	export let created_at: number;
	export let badgeList: any = [];
	export let selected: string;
	export let profileOpend = null;

	export let vorpOpened = null;

	let page: string = 'home';

	let vorp: string = '';
	let opened: boolean = false;

	let feedContainer: HTMLDivElement | null;

	let loadingBottomFeed = false;
	let loadingFeed = true;

	// <!-- <input multiple type="file" bind:this={imageInput} /> -->

	const dispatch = createEventDispatcher();

	let files: any[] = [];
	let filesfiles: any[] = [];

	function handleImage() {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.accept = 'image/*';
		input.onchange = (e) => {
			const tempfiles = e.target.files;
			filesfiles = tempfiles;
			if (tempfiles) {
				for (let file of tempfiles) {
					dispatch('change', { file });

					const reader = new FileReader();
					reader.onload = (e) => {
						files.push(e.target.result);
						files = files;
					};
					reader.readAsDataURL(file);
				}
				console.log(files);
			}
		};
		input.click();
	}

	function handleScroll() {
		if (feedContainer) {
			const { scrollTop, scrollHeight, clientHeight } = feedContainer;

			if (scrollTop + clientHeight >= scrollHeight && !loadingBottomFeed) {
				loadingBottomFeed = true;

				fetchFeed(true).then(() => {
					loadingBottomFeed = false;
				});
			}
		}
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
			feedContainer.removeEventListener('scroll', handleScroll);
			feed = [];
			fetchFeed();
			feedContainer.addEventListener('scroll', handleScroll);
		}
	}

	async function PostHandler() {
		const formData = new FormData();

		if (filesfiles) {
			if (filesfiles.length >= 0) {
				for (const image of filesfiles) {
					console.log(image);
					formData.append('images', image);
				}
			}
		}

		formData.append('content', vorp);
		opened = false;
		const response = await fetch('api/vorp', {
			method: 'POST',
			body: formData
		});

		if (response.status == 201) {
			vorp = '';
			toast('vorped sucesfully!');
			feedContainer.removeEventListener('scroll', handleScroll);
			feed = [];
			files = [];
			fetchFeed();
			feedContainer.addEventListener('scroll', handleScroll);
		}
	}

	if (profileOpend !== null) {
		page = `profile${profileOpend}`;
	}

	if (vorpOpened) {
		page = `vorp${vorpOpened}`;
	}

	let imageInput: HTMLInputElement;
	let unreadMessages: any;

	onMount(async () => {
		fetchFeed();

		const response = await fetch('/api/notifications/unread');
		if (response.ok) {
			unreadMessages = (await response.json()).count;
		} else {
			console.error('Failed to fetch unread messages');
		}
		if (feedContainer) {
			feedContainer.addEventListener('scroll', handleScroll);
		}
	});

	onDestroy(() => {
		if (feedContainer) {
			feedContainer.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<ModeWatcher defaultMode="dark" />
<div class="m-6 my-0 flex h-[100vh] justify-center gap-4">
	<header class="absolute top-0 h-dvh w-[275px] justify-center md:relative md:flex">
		<div class=" fixed z-20 flex h-full items-end justify-between text-left md:flex-col">
			<div class="flex w-full bg-black md:inline-block md:w-[275px] md:bg-transparent">
				<button
					aria-label="home"
					on:click={() => {
						page = 'home';
						goto('/');
					}}
				>
					<Moon class="my-2 hidden h-14 w-14 self-center md:flex " />
				</button>
				<button
					class="m-2 flex w-auto rounded-full p-[12px] text-left align-middle text-xl hover:bg-slate-600 md:w-[250px]"
					on:click={() => {
						page = 'home';
						goto('/');
					}}
				>
					<Earth class="mr-4 flex h-8 w-auto justify-center align-middle" />Home</button
				>
				<button
					class="m-2 flex w-auto rounded-full p-[12px] text-left align-middle text-xl hover:bg-slate-600 md:w-[250px]"
					on:click={() => {
						page = 'notifications';
					}}
					><MoonStar class="mr-4 flex h-8 w-auto justify-center align-middle" />
					Notifications
					{#if unreadMessages}
						<div
							class=" ml-2 flex min-h-8 min-w-8 justify-center rounded-full bg-red-600 text-center font-bold"
						>
							<p>{unreadMessages}</p>
						</div>
					{/if}
				</button>
				<!-- 
				<button
					class="m-2 flex w-auto rounded-full p-[12px] text-left align-middle text-xl hover:bg-slate-600 md:w-[250px]"
					on:click={() => {
						page = 'directMessages';
					}}
					><MessageSquare class="mr-4 flex h-8 w-auto justify-center align-middle" />
					directMessages
				</button> -->

				<Dialog.Root bind:open={opened}>
					<Dialog.Trigger
						class="m-2 h-[50px]  w-auto justify-start rounded-full bg-red-700 text-left text-2xl hover:bg-red-800 md:w-[250px]"
						><div class="flex justify-center px-[32px] text-center">Vorp</div></Dialog.Trigger
					>
					<Dialog.Content class="sm:max-w-[600px]">
						<div class="flex items-start space-x-3">
							<Avatar
								src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{id}_big.webp?updated={updated}"
								alt="your profile avatar"
							/>
							<div class="flex h-full flex-grow flex-col gap-2">
								<div class="max-h-[600px] max-w-[400px] overflow-y-auto break-words">
									<Inputvorp bind:vorp />

									{#if files.length > 0}
										<div class="mr-4 flex h-[250px] w-full items-center justify-center">
											<Carousel.Root
												opts={{
													align: 'start',
													loop: true
												}}
												class="sm:w-[250px]"
											>
												<Carousel.Content>
													{#each files as url}
														<Carousel.Item
															><img
																class="h-[200px] w-[200px] rounded-xl"
																alt="content is unkown"
																src={url}
															/></Carousel.Item
														>
													{/each}
												</Carousel.Content>
												<div>
													{#if files.length != 1}
														<Carousel.Previous />
														<Carousel.Next />
													{/if}
												</div>
											</Carousel.Root>
										</div>
									{/if}
									<div class="flex">
										<button on:click={handleImage}><Image class="hover:text-blue-600" /></button>

										{#if files.length > 0}
											<p>{files.length}</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
						<div class="flex justify-end">
							<Form.Button on:click={PostHandler}>Vorp</Form.Button>
						</div>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			<div class="hidden md:flex">
				<ProfileButton {handle} {id} {username} {updated} />
			</div>
		</div>
	</header>
	<div
		class=" w-[600px] overflow-y-auto overflow-x-hidden border-l border-r border-slate-600"
		bind:this={feedContainer}
	>
		{#if page === 'notifications'}
			<Notifications bind:unreadMessages />
		{:else if page === 'home'}
			<div class="my-2 flex w-[600px] justify-center">
				<button
					class:underline={currentTab == 'Main'}
					on:click={() => tabChange('Main')}
					class="m-2 text-2xl">Main</button
				>
				<button
					class:underline={currentTab == 'Following'}
					on:click={() => tabChange('Following')}
					class="m-2 text-2xl">Following</button
				>
			</div>
			<div class="flex h-full flex-col gap-2">
				{#if loadingFeed}
					<Loading />
				{:else}
					<hr class=" w-full border-slate-500 pt-3" />
					<div class="w-full">
						<div class="flex items-start space-x-3">
							<img
								src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{id}_big.webp?updated={updated}"
								alt="your profile avatar"
								class=" h-14 w-14 rounded-full"
							/>
							<div class="flex h-full w-[600px] flex-grow flex-col gap-2">
								<div class="max-h-[600px] max-w-[500px] overflow-y-auto break-words">
									<Inputvorp bind:vorp />
								</div>
							</div>
						</div>
					</div>
					<div class="flex justify-end">
						<Form.Button on:click={PostHandler}>Vorp</Form.Button>
					</div>
					{#each feed as vorp}
						<Vorp bind:page {...vorp} myUid={id} {handleDelete} />
					{/each}
					{#if loadingBottomFeed}
						<Loading occupy_screen={false} />
					{/if}
				{/if}
			</div>
		{:else if page === 'directMessages'}
			<DirectMessages />
		{:else if page.startsWith('profile')}
			{#key page}
				<Profilepage
					bind:page
					myId={id}
					profileHandle={page.replace('profile', '')}
					{handleDelete}
					{badgeList}
					{selected}
				/>
			{/key}
		{:else if page.startsWith('vorp')}
			<VorpPage bind:page myUid={id} />
		{/if}
	</div>
</div>
