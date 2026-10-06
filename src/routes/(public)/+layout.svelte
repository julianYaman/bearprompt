<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';
	import AnnouncementBar from '$lib/components/AnnouncementBar.svelte';
	import { initializeTheme } from '$lib/theme';

	let { children } = $props();

	onMount(async () => {
		await initializeTheme();
	});
</script>

<svelte:head>
	<style>
		body {
			background-color: #FDFCFD;
		}
		@media (prefers-color-scheme: dark) {
			body {
				background-color: #1a1a1a;
			}
		}
	</style>
</svelte:head>

<div class="marketing-page">
	<AnnouncementBar />
	{@render children()}
	<FeedbackWidget />
</div>

<style>
	.marketing-page {
		min-height: 100vh;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: var(--color-bg-primary);
		color: var(--color-text-primary);
		--neo-accent: #f5a623;
		--neo-text: #1a1a1a;
	}
</style>
