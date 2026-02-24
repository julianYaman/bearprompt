<script lang="ts">
	import { sidebarOpen } from '$lib/stores';
	import Sidebar from './Sidebar.svelte';

	interface Props {
		currentView: 'library' | 'prompts' | 'tags' | 'help';
	}

	let { currentView }: Props = $props();

	function handleBackdropClick() {
		sidebarOpen.set(false);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			sidebarOpen.set(false);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $sidebarOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50 md:hidden"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()}
		role="button"
		tabindex="-1"
		aria-label="Close sidebar"
	></div>

	<!-- Drawer -->
	<div
		class="fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 md:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Navigation sidebar"
	>
		<Sidebar {currentView} />
	</div>
{/if}
