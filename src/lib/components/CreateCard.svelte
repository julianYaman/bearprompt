<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		onClick: () => void;
	}

	let { onClick }: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onClick();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_to_interactive_role -->
<article
	class="flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200"
	style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
	onclick={onClick}
	onkeydown={handleKeydown}
	tabindex="0"
	role="button"
	aria-label="Create new prompt"
>
	<div
		class="flex h-14 w-14 items-center justify-center rounded-full transition-colors"
		style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
	>
		<Icon name="plus" size={28} />
	</div>
	<span class="text-sm font-medium" style="color: var(--color-text-muted);">
		New Prompt
	</span>
</article>

<style>
	article:hover {
		border-color: var(--color-accent);
		background-color: var(--color-bg-hover) !important;
	}

	article:hover div {
		background-color: var(--color-accent);
		color: white;
	}

	article:hover span {
		color: var(--color-text-primary);
	}

	article:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-color: var(--color-accent);
	}
</style>
