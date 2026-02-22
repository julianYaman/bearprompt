<script lang="ts">
	import Icon from './Icon.svelte';
	import { sidebarOpen, aboutOpen } from '$lib/stores';

	interface Props {
		currentView: 'library' | 'prompts' | 'tags';
	}

	let { currentView }: Props = $props();

	function handleLinkClick() {
		// Close sidebar on mobile after navigation
		sidebarOpen.set(false);
	}

	function handleAboutClick() {
		aboutOpen.set(true);
		sidebarOpen.set(false);
	}
</script>

<aside
	class="flex h-full w-64 flex-col border-r"
	style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
>
	<!-- Logo / Brand -->
	<div class="flex h-16 items-center gap-2.5 border-b px-4" style="border-color: var(--color-border);">
		<img src="/bearprompt.png" alt="Bearprompt logo" class="h-8 w-8" />
		<h1 class="text-lg font-semibold" style="color: var(--color-text-primary);">
			Bearprompt
		</h1>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 p-3" aria-label="Main navigation">
		<ul class="space-y-1">
			<li>
				<a
					href="/library"
					onclick={handleLinkClick}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					class:active={currentView === 'library'}
					style="color: {currentView === 'library'
						? 'var(--color-text-primary)'
						: 'var(--color-text-secondary)'}; background-color: {currentView === 'library'
						? 'var(--color-bg-tertiary)'
						: 'transparent'};"
					aria-current={currentView === 'library' ? 'page' : undefined}
				>
					<Icon name="library" size={18} />
					My Library
				</a>
			</li>
			<li>
				<a
					href="/prompts"
					onclick={handleLinkClick}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					class:active={currentView === 'prompts'}
					style="color: {currentView === 'prompts'
						? 'var(--color-text-primary)'
						: 'var(--color-text-secondary)'}; background-color: {currentView === 'prompts'
						? 'var(--color-bg-tertiary)'
						: 'transparent'};"
					aria-current={currentView === 'prompts' ? 'page' : undefined}
				>
					<Icon name="globe" size={18} />
					Public Library
				</a>
			</li>
		</ul>
	</nav>

	<!-- Bottom Section -->
	<div class="border-t p-3" style="border-color: var(--color-border);">
		<a
			href="/tags"
			onclick={handleLinkClick}
			class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
			class:active={currentView === 'tags'}
			style="color: {currentView === 'tags'
				? 'var(--color-text-primary)'
				: 'var(--color-text-secondary)'}; background-color: {currentView === 'tags'
				? 'var(--color-bg-tertiary)'
				: 'transparent'};"
			aria-current={currentView === 'tags' ? 'page' : undefined}
		>
			<Icon name="tag" size={18} />
			Tags
		</a>
		<button
			type="button"
			onclick={handleAboutClick}
			class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-1"
			style="color: var(--color-text-secondary);"
		>
			<Icon name="info" size={18} />
			About
		</button>
	</div>
</aside>

<style>
	a:hover,
	button:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
</style>
