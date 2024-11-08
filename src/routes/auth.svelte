<script lang="ts">
	const handleLogin = async () => {
		try {
			const callBackUrl = new URL(window.location.href);
			callBackUrl.search = '';
			callBackUrl.pathname = '/api/callback';

			window.location.href = `https://discord.com/oauth2/authorize?client_id=1288514562181697707&response_type=code&redirect_uri=${encodeURIComponent(callBackUrl.toString())}&scope=email+identify`;
		} catch (error) {}
	};
</script>

<main class=" flex flex-shrink flex-grow flex-row-reverse">
	<div class=" h-screen min-w-[45vw] justify-center p-16">
		<div class="my-24 flex flex-col">
			<h1 class=" text-7xl font-bold">Happening now</h1>
		</div>
		<div class=" mb-12 ml-6 flex flex-col">
			<h1 class=" text-5xl font-bold">Join today!</h1>
		</div>
		<div>
			<button
				on:click={handleLogin}
				class="justfiy-b flex w-64 items-center justify-center gap-x-2 rounded-xl border-[3px] border-white bg-transparent p-4 py-2 align-middle text-4xl font-bold text-white"
				formaction="?/login&provider=discord"
			>
				<img src="discord.svg" alt="discord icon" class=" text-whit h-16 w-16 border-white" />
				Discord
			</button>
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
