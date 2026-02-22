<script lang="ts">
	import Icon from '../Icon.svelte';
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		style="background-color: var(--color-bg-secondary);"
	>
		<Icon name="globe" size={32} class="opacity-50" />
	</div>
	<h2 class="mb-2 text-xl font-semibold" style="color: var(--color-text-primary);">
		Unable to Load
	</h2>
	<p class="mb-4 max-w-md text-sm" style="color: var(--color-text-secondary);">
		We couldn't load the public library right now. Please check your connection and try again later.
	</p>
	<a
		href="/prompts"
		class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
		style="background-color: var(--color-accent); color: white;"
	>
		Try Again
	</a>
</div>
