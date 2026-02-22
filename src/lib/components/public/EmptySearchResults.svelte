<script lang="ts">
	import Icon from '../Icon.svelte';

	interface Props {
		query?: string;
		onClear?: () => void;
	}

	let { query = '', onClear }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		style="background-color: var(--color-bg-secondary);"
	>
		<Icon name="search" size={32} class="opacity-50" />
	</div>
	<h2 class="mb-2 text-xl font-semibold" style="color: var(--color-text-primary);">
		No Results Found
	</h2>
	<p class="mb-4 max-w-md text-sm" style="color: var(--color-text-secondary);">
		{#if query}
			No prompts found matching "<span class="font-medium">{query}</span>". Try adjusting your
			search terms or browse the library.
		{:else}
			No prompts found. Try a different search term.
		{/if}
	</p>
	{#if onClear}
		<button
			onclick={onClear}
			class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
			style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
		>
			Clear Search
		</button>
	{/if}
</div>

<style>
	button:hover {
		background-color: var(--color-bg-tertiary) !important;
	}
</style>
