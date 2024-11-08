<script>
	import { createEventDispatcher } from 'svelte';

	// export let size = 12;
	export let src = './Aliens.jpg';
	export let alt = 'Avatar';
	export let editable = false;

	const dispatch = createEventDispatcher();

	function handleAvatarChange() {
		if (editable) {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.onchange = (e) => {
				const file = e.target.files[0];
				if (file) {
					dispatch('change', { file });

					const reader = new FileReader();
					reader.onload = (e) => {
						src = e.target.result;
					};
					reader.readAsDataURL(file);
				}
			};
			input.click();
		}
	}
</script>

<img {src} {alt} on:click={handleAvatarChange} class="h-32 w-32 rounded-full text-center" />
