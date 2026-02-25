<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import MobileDrawer from '$lib/components/MobileDrawer.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ImportExportModal from '$lib/components/ImportExportModal.svelte';
	import AboutModal from '$lib/components/AboutModal.svelte';
	import CopyAnnouncer from '$lib/components/CopyAnnouncer.svelte';
	import { initializeTheme } from '$lib/theme';
	import { prompts, tags, mobileMenuOpen } from '$lib/stores';
	import { getAllPrompts, getAllTags } from '$lib/db';

	let { children } = $props();

	let isInitialized = $state(false);

	// Derive current view from the URL path
	let currentView: 'library' | 'prompts' | 'agents' | 'tags' | 'help' = $derived.by(() => {
		const pathname = $page.url.pathname;
		if (pathname.startsWith('/tags')) return 'tags';
		if (pathname.startsWith('/agents')) return 'agents';
		if (pathname.startsWith('/prompts')) return 'prompts';
		if (pathname.startsWith('/help')) return 'help';
		return 'library';
	});

	// Derive page title from current view
	let pageTitle = $derived.by(() => {
		switch (currentView) {
			case 'library':
				return 'My Library | Bearprompt';
			case 'prompts':
				return 'Prompt Library | Bearprompt';
			case 'agents':
				return 'Agent Library | Bearprompt';
			case 'tags':
				return 'Tags | Bearprompt';
			case 'help':
				return 'Help | Bearprompt';
			default:
				return 'Bearprompt';
		}
	});

	onMount(async () => {
		try {
			// Initialize theme
			await initializeTheme();

			// Load data from IndexedDB
			const [loadedPrompts, loadedTags] = await Promise.all([
				getAllPrompts(),
				getAllTags()
			]);
			prompts.set(loadedPrompts);
			tags.set(loadedTags);
			isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize app:', error);
			isInitialized = true; // Still show UI even if DB fails
		}
	});

	// Close mobile menu when clicking outside
	function handleMainClick() {
		mobileMenuOpen.set(false);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{pageTitle}</title>
	<meta name="description" content="Your private prompt library for managing your AI prompts. Increase your productivity for your AI work." />
</svelte:head>

<div class="flex h-screen w-screen overflow-hidden" style="background-color: var(--color-bg-primary);">
	<!-- Desktop Sidebar -->
	<div class="hidden md:block">
		<Sidebar {currentView} />
	</div>

	<!-- Mobile Drawer -->
	<MobileDrawer {currentView} />

	<!-- Main Content Area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Mobile Navbar -->
		<Navbar isMobile={true} />

		<!-- Desktop Navbar -->
		<Navbar isMobile={false} />

		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions a11y_no_redundant_roles -->
		<!-- Main Content -->
		<main
			class="flex-1 overflow-auto"
			onclick={handleMainClick}
		>
			{#if isInitialized}
				{@render children()}
			{:else}
				<div class="flex h-full items-center justify-center">
					<span style="color: var(--color-text-muted);">Loading...</span>
				</div>
			{/if}
		</main>
	</div>
</div>

<!-- Modals -->
<SettingsModal />
<ImportExportModal />
<AboutModal />

<!-- Accessibility -->
<CopyAnnouncer />
