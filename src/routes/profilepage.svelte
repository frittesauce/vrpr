<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Loading from './loading.svelte';
	import { toast } from 'svelte-sonner';
	import { AwardIcon, CalendarDays } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import Vorp from './vorp.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Avatar from './avatar.svelte';
	import { number } from 'zod';
	import BadgeButoon from './badgeButoon.svelte';
	export let profileHandle: string;
	export let myId: string;
	export let handleDelete;
	export let page;
	export let selected;

	let profile: {
		username: string;
		handle: string;
		created_at: string;
		id: string;
		bio: string;
		verified: number;
		following: number;
		updated: string;
		followers: number;
		isFollowing: boolean;
	};
	let userVorps: any[] = [];
	let loading = true;
	let isSelf = false;
	let vorpLoading = true;
	let tempSrc: any;
	let newSrc: any;
	let newDisplay: string;
	let newBio: string;
	let opened: boolean;
	export let badgeList;

	let currentTab = 'Vorps';
	const tabs = ['Vorps', 'Likes'];

	function formatDayJoined(dateString: Date | string) {
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

	function tabChange(tab: string) {
		currentTab = tab;
		console.log(tab);
		fetchUserVorps(currentTab === tabs[1]);
	}

	async function fetchProfile() {
		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
				isSelf = profile.id === myId;
			} else {
				toast('user dont exist :( </3');
			}
		} catch (error) {
			toast('skibidi </3');
		}
	}

	async function fetchUserVorps(likes: boolean) {
		vorpLoading = true;
		try {
			const response = await fetch(
				`/api/feed?handle=${profileHandle}${likes ? '&type=Liked' : ''}`
			);
			if (response.status === 200) {
				userVorps = await response.json();
			} else {
				toast(`Failed to load user vorps. Error: ${response.status}`);
			}
		} catch (error) {
			console.error('poopoo error :((');
		}
		vorpLoading = false;
	}

	async function handleFollow() {
		const res = await fetch('/api/follow', {
			method: 'POST',
			body: JSON.stringify({ target: profile.id })
		});

		if (res.status === 200) {
			profile.isFollowing = !profile.isFollowing;
			profile.followers = profile.following
				? Number(profile.followers) + 1
				: Number(profile.followers) - 1;
		}
	}

	onMount(async () => {
		await fetchProfile();
		await Promise.all([fetchUserVorps(false)]);

		tempSrc = `https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/${profile.id}_big.webp?updated=${profile.updated}`;
		newBio = profile.bio;
		newDisplay = profile.username;

		loading = false;
	});

	function handleChange(temp) {
		newSrc = temp.detail.file;
	}

	async function handleSave() {
		const response = await fetch('api/profile', {
			method: 'PATCH',
			body: JSON.stringify({
				bio: newBio,
				username: newDisplay
			})
		});
		if (response.status === 200) {
			opened = false;
			profile.bio = newBio;
			profile.username = newDisplay;
			toast('updated profile sucesfully!');
		} else {
			toast('something went wrong whilest updating sorry');
		}

		if (!newSrc) return;

		const formData = new FormData();

		formData.append('file', newSrc);

		const avatarResult = await fetch('api/upload', {
			method: 'POST',
			body: formData
		});

		if (avatarResult.status === 200) {
			opened = false;
		} else {
			toast('couldnt upload new avatar');
		}
	}
</script>

{#if loading}
	<Loading />
{:else if profile}
	<div class=" h-dvh overflow-y-auto overflow-x-hidden">
		<div class=" m-4">
			<div>
				<img
					class=" h-36 w-36 rounded-full text-center"
					src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{profile.id}_big.webp?updated={profile.updated}"
					alt="{profile.handle}'s profile picture"
				/>
			</div>
			<div>
				<div class="mr-6 flex justify-between">
					<div class="mb-3 items-center justify-center">
						<h1 class=" flex items-center align-middle text-2xl font-bold">
							{profile.username}<img
								src="./badges/verf-{profile.verified}.svg"
								class="mx-1 h-8 w-auto align-middle"
								alt="verrified badge"
							/>
						</h1>
						<h2 class=" text-lg text-slate-400">@{profile.handle}</h2>
					</div>
					<div>
						{#if !isSelf}
							{#if !profile.isFollowing}
								<button
									class=" rounded-full bg-white p-2 px-3 text-lg font-bold text-black"
									on:click={handleFollow}>Follow</button
								>
							{:else}
								<AlertDialog.Root>
									<AlertDialog.Trigger>
										<button class=" rounded-full bg-red-600 p-2 px-3 text-lg font-bold text-white"
											>Unfollow</button
										>
									</AlertDialog.Trigger>
									<AlertDialog.Content class="sm:max-w-[320px]">
										<AlertDialog.Header>
											<AlertDialog.Title>Unfollow @{profile.handle}</AlertDialog.Title>
											<AlertDialog.Description class="">
												Unfollowing @{profile.handle} will show their posts less on your timeline. their
												profile will stil be visible unless their vorps are protected.
											</AlertDialog.Description>
										</AlertDialog.Header>
										<AlertDialog.Footer>
											<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
											<AlertDialog.Action on:click={handleFollow}>Unfollow</AlertDialog.Action>
										</AlertDialog.Footer>
									</AlertDialog.Content>
								</AlertDialog.Root>
							{/if}
						{:else}
							<Dialog.Root bind:open={opened}>
								<Dialog.Trigger>
									<button class=" rounded-full bg-white p-2 px-3 text-lg font-bold text-black"
										>Edit Profile</button
									></Dialog.Trigger
								>
								<Dialog.Content class="sm:w-[600px]">
									<div>
										<!-- svelte-ignore a11y-click-events-have-key-events -->
										<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
										<div class="flex w-full items-center justify-between align-middle">
											<Avatar src={tempSrc} alt="avatar" editable={true} on:change={handleChange} />
											<div class="ml-auto"><BadgeButoon {selected} {badgeList} /></div>
										</div>

										<div class="flex flex-grow flex-col gap-2">
											<div class="flex w-full max-w-sm flex-col gap-1.5">
												<p>Username</p>
												<input
													type="email"
													id="email"
													placeholder="Username"
													bind:value={newDisplay}
												/>
											</div>

											<div class="flex w-full max-w-sm flex-col gap-1.5">
												<p>About me</p>
												<input
													type="email"
													id="email"
													placeholder="About me..."
													bind:value={newBio}
												/>
											</div>
										</div>

										<div class="flex justify-end">
											<button on:click={handleSave}>Save</button>
										</div>
									</div>
								</Dialog.Content>
							</Dialog.Root>
						{/if}
					</div>
				</div>
				<div class="mb-3">
					<p class=" m-0 inline-block max-w-lg break-all p-0 text-lg">{profile.bio}</p>
				</div>
				<div class=" mb-3 flex items-center text-slate-400">
					<CalendarDays class="mr-1 h-4 w-4" />
					<p class="flex gap-x-1 align-middle text-base">
						Joined {formatDayJoined(profile.created_at)}
					</p>
				</div>
				<div class="mb-3 flex items-center gap-x-3">
					<p>
						{profile.followers} Followers
					</p>
					<p>
						{profile.following} Following
					</p>
				</div>
			</div>
		</div>
		<div class="my-2 flex w-[600px] justify-center">
			<button
				class:underline={currentTab == 'Vorps'}
				on:click={() => tabChange('Vorps')}
				class="m-2 text-2xl">vorps</button
			>
			<button
				class:underline={currentTab == 'Likes'}
				on:click={() => tabChange('Likes')}
				class="m-2 text-2xl">liked</button
			>
		</div>
		<div class="my-2 w-[600px]">
			{#if vorpLoading}
				<Loading occupy_screen={false} />
			{:else if userVorps.length === 0}
				<p>no vorps yet.</p>
			{:else}
				{#each userVorps.vorps as vorp}
					<Vorp
						bind:page
						{...vorp}
						bind:followedByUser={profile.following}
						myUid={myId}
						{handleDelete}
					/>
				{/each}
			{/if}
		</div>
	</div>
{/if}
