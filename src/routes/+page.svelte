<script lang="ts">
	import '../app.css';
	import Auth from './auth.svelte';
	import Cookies from 'js-cookie';
	import { onMount } from 'svelte';
	import Loading from './loading.svelte';
	import AccountMaker from './accountMaker.svelte';
	import Main from './main.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import Store from './store.svelte';
	import type { PageData } from './$types';
	import Vorp from './vorp.svelte';
	import { browser } from '$app/environment';
	import { updated } from '$app/stores';
	let authenticated: boolean = false;
	let loading: boolean = true;
	let noAccount: boolean = true;
	let userData = {
		username: '',
		handle: '',
		created_at: '',
		id: '',
		verified: '',
		updated: ''
	};

	let badgeList: any = [];
	let selected: string;

	async function getBadges() {
		const response = await fetch('/api/badges', {
			method: 'GET'
		});
		const res = await response.json();
		const newBadges = res.badges.map((badge: any) => ({ ...badge }));
		badgeList = newBadges;
		selected = newBadges[0].selected;
	}

	async function checkAuth() {
		if (Cookies.get('temp-discord-token')) {
			authenticated = true;
		}

		if (localStorage.getItem('user-data')) {
			try {
				const data = JSON.parse(localStorage.getItem('user-data')!);
				loading = false;
				noAccount = false;
				userData = data;
				authenticated = true;
				getBadges();
			} catch (error) {
				console.error('Failed to load user data from storage', error);
			}
		}

		try {
			const loginResponse = await fetch(`api/me`, {
				method: 'GET',
				credentials: 'include'
			});
			if (loginResponse.status === 200) {
				const res = await loginResponse.json();
				userData = {
					username: res.username,
					handle: res.handle,
					created_at: res.created_at,
					id: res.id,
					verified: res.verified,
					updated: res.updated
				};

				localStorage.setItem('user-data', JSON.stringify(userData));
				noAccount = false;
				getBadges();
			} else {
				noAccount = true;
			}
		} catch (error) {
			console.error('Error checking user status:', error);
			noAccount = true;
		}

		loading = false;
	}

	export let data: PageData;
	let testTitle = 'chirp';

	function blur() {
		testTitle = 'COME BACK PLS PLS PLS';
		document.title = testTitle;
	}
	function focus() {
		testTitle = 'vorper';
		document.title = testTitle;
	}

	onMount(() => {
		checkAuth();
		if (browser) {
			window.addEventListener('blur', blur);

			window.addEventListener('focus', focus);
		}
	});
</script>

<Toaster />

{#if loading}
	<Loading />
{:else if !authenticated}
	<Auth />
{:else if noAccount}
	<AccountMaker />
{:else}
	<Main {...userData} vorpOpened={data.vorpOpened} {badgeList} {selected} />
{/if}

<svelte:head>
	<meta
		name="description"
		content="vorper a microblogging social media platform thats alien/space themed!"
	/>
	<title>vorper</title>
</svelte:head>
