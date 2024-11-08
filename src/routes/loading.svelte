<script lang="ts">
	export let occupy_screen = true;
	export let srcImg = '/default.jpg';
	export let size = 'w-94 h-94';
</script>

<div class="flex {occupy_screen ? 'h-dvh' : 'h-full'} animation-pulse">
	<div class="m-auto">
		<img src={srcImg} alt="throbber" class={`${size} object-contain`} />
	</div>
</div>

<style>
	@keyframes custom-pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.animation-pulse {
		animation: custom-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
