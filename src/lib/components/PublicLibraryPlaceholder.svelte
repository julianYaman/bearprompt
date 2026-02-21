<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<div class="flex h-full flex-col items-center justify-center p-8 text-center">
	<div
		class="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
		style="background-color: var(--color-bg-tertiary);"
	>
		<Icon name="globe" size={40} class="text-muted" />
	</div>
	<h2 class="mb-2 text-xl font-semibold" style="color: var(--color-text-primary);">
		Public Library
	</h2>
	<p class="max-w-md text-sm" style="color: var(--color-text-secondary);">
		A curated collection of community prompts is coming soon. Stay tuned for updates!
	</p>
	<span
		class="mt-4 rounded-full px-4 py-1.5 text-xs font-medium"
		style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
	>
		Coming Soon
	</span>
</div>

<style>
	.text-muted {
		color: var(--color-text-muted);
	}
</style>
