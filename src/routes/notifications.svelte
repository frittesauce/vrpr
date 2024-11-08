<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, CalendarDays, Star, MessageSquare, UserPlus } from 'lucide-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Loading from './loading.svelte';
	import Avatar from './avatar.svelte';
	import Vorp from './vorp.svelte';

	export let unreadMessages;

	interface Notification {
		sourceUserBio: string;
		id: string;
		type: 'like' | 'comment' | 'follow';
		sourceUserID: string;
		sourceUser: string;
		sourceUserHandle: string;
		sourceUserVerified: boolean;
		sourceUserCreatedAt: string;
		vorpContent?: string;
		vorpId?: string;
		read: boolean;
		createdAt: string;
	}

	let notifications: Notification[] = [];
	let loading: boolean = true;

	onMount(async () => {
		const response = await fetch('/api/notifications');
		if (response.ok) {
			notifications = await response.json();
			loading = false;
			const res2 = await fetch('/api/notifications/unread', {
				method: 'PATCH'
			});
			unreadMessages = 0;
		}
	});

	function getNotificationIcon(type: 'like' | 'comment' | 'follow') {
		switch (type) {
			case 'like':
				return { icon: Star, color: 'text-yellow-400' };
			case 'comment':
				return { icon: MessageSquare, color: 'text-white' };
			case 'follow':
				return { icon: UserPlus, color: 'text-blue-400' };
			default:
				return { icon: Bell, color: 'text-yellow-400' };
		}
	}

	function getNotificationMessage(notification: Notification): string {
		switch (notification.type) {
			case 'like':
				return 'liked your vorp';
			case 'comment':
				return 'commented on your vorp';
			case 'follow':
				return 'started following you';
			default:
				return 'interacted with your vorp';
		}
	}
</script>

<div>
	{#if loading}
		<Loading occupy_screen={true}></Loading>
	{:else if notifications.length === 0}
		<p>no notifications lonely fella :(</p>
	{:else}
		<ScrollArea class="h-dvh">
			<div class="h-[70vh] w-full rounded-md">
				<ul class="flex w-full flex-col items-center">
					{#each notifications as notification}
						<li
							class="w-full border-b border-slate-600"
							class:bg-slate-900={notification.read == false}
						>
							<button
								class="m-2 flex w-full items-start space-x-4 rounded-lg p-4 text-left transition-colors"
							>
								<div class="mr-1 flex-grow-0">
									<svelte:component
										this={getNotificationIcon(notification.type).icon}
										class="h-8 w-8 {getNotificationIcon(notification.type).color}"
									/>
								</div>
								<div>
									<div>
										<img
											src="https://gjxtygjooxisxpsvcxwo.supabase.co/storage/v1/object/public/vorper/avatars/{notification.sourceUserID}_big.webp?updated={notification.sourceUserCreatedAt}"
											alt="your profile avatar"
											class="h-8 w-8 rounded-full"
										/>
									</div>
									<div class="flex-grown">
										<p class=" mb-2 text-lg font-medium">
											@{notification.sourceUser}
											{getNotificationMessage(notification)}
										</p>
										{#if notification.vorpContent}
											<p
												class=" text-muted-forground mt-1 w-[470px] break-all text-sm text-slate-200"
											>
												{notification.vorpContent}
											</p>
										{/if}
									</div>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</ScrollArea>
	{/if}
</div>
