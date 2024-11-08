<script lang="ts">
	export let vorp: string = '';

	$: characterCount = vorp.length;
	$: isOverLimit = characterCount > 280;

	function interfere(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.execCommand('insertText', false, '\n');
		}
	}
</script>

<div class="relative">
	<div
		contenteditable="true"
		role="textbox"
		spellcheck="true"
		tabindex="0"
		bind:innerText={vorp}
		class="overflow-wrap-anywhere min-h-[40px] w-full pb-6 outline-none"
		placeholder="What's happening?"
		on:keydown={interfere}
	/>
	<div class="absolute bottom-1 right-1 rounded px-1 text-sm" class:text-red-500={isOverLimit}>
		{characterCount}/280
	</div>
</div>
