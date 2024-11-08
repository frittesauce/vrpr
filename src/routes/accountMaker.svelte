<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let loading = false;
	let nickname = '';
	let username = '';
	let pronounce = '';
	let about = "Hi, I'm new here!";

	const handleSubmit = async () => {
		try {
			loading = true;
			const response = await fetch('/api/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: nickname,
					handle: username,
					bio: about
				})
			});

			if (response.status !== 201) {
				throw new Error('Non-201 status code');
			}
			loading = false;
			window.location.href = '/';
		} catch (error) {
			console.log(error);
			toast('couldnt make account sorry :( your username is probally taken!');
		}
	};
</script>

<!-- <div class="flex min-h-dvh items-center justify-center">
	<img
		alt="allien dancing"
		src="https://media1.tenor.com/m/PnLITI4Y3_0AAAAd/cat-tongue-filter.gif"
		class="h-72 w-72 rounded-2xl"
	/>

	<div>
		<h1>Make Your Account!</h1>

		<div class="bg rounded-2xl bg-blue-950 p-5">
			<div class="grid grid-flow-col grid-rows-3 gap-4">
				
			</div>
		</div>
	</div>
</div> -->

<main class=" flex flex-shrink flex-grow flex-row-reverse">
	<div class=" h-screen min-w-[45vw] justify-center py-16">
		<div class="my-16 flex flex-col">
			<h1 class=" text-7xl font-bold">Vorper</h1>
		</div>
		<div class=" mb-12 ml-2 flex flex-col">
			<h1 class=" text-3xl font-bold">Make your account</h1>
		</div>
		<div>
			<div class=" h-48">
				<input
					class=" my-2 rounded-lg border-2 border-white bg-transparent p-2 text-xl text-white focus:outline-none"
					placeholder="display name"
					bind:value={nickname}
				/>
				<div>
					<input
						class=" my-2 rounded-lg border-2 border-white bg-transparent p-2 text-xl text-white focus:outline-none"
						placeholder="@username"
						bind:value={username}
						on:input={() => {
							username = '@' + username.replace(/[^0-9a-z_-]/gi, '').toLowerCase();
						}}
					/>
				</div>
			</div>
			<button
				on:click={handleSubmit}
				disabled={!nickname || !username}
				class="justfiy-b flex w-64 items-center justify-center gap-x-2 rounded-xl border-[3px] border-white bg-transparent p-4 py-2 align-middle text-4xl font-bold text-white"
				>Create!</button
			>
		</div>
	</div>
	<div class=" flex h-screen w-full items-center justify-center">
		<img
			alt="allien dancing"
			src="https://media1.tenor.com/m/PnLITI4Y3_0AAAAd/cat-tongue-filter.gif"
			class=" max-h-[420px] max-w-full rounded-3xl"
		/>
	</div>
</main>
