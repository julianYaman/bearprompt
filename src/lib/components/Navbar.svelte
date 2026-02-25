<script lang="ts">
	import Icon from './Icon.svelte';
	import { page } from '$app/stores';
	import { theme, settingsOpen, mobileMenuOpen, sidebarOpen, prompts, tags } from '$lib/stores';
	import { exportLibrary, importLibrary, validateImportData, getAllPrompts, getAllTags } from '$lib/db';
	import type { ThemeMode } from '$lib/types';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
	let fileInput: HTMLInputElement;
	let isExporting = $state(false);
	let isImporting = $state(false);

	let isLibraryRoute = $derived($page.url.pathname === '/library' || $page.url.pathname === '/');
	let isPublicRoute = $derived($page.url.pathname === '/prompts' || $page.url.pathname.startsWith('/prompts/'));
	let isAgentRoute = $derived($page.url.pathname.startsWith('/agents'));

	const ADD_PROMPT_URL = 'https://github.com/julianyaman/bearprompt/issues/new?template=add-prompt.yml';

	function cycleTheme() {
		theme.update((current) => {
			const modes: ThemeMode[] = ['system', 'light', 'dark'];
			const currentIndex = modes.indexOf(current);
			return modes[(currentIndex + 1) % modes.length];
		});
	}

	function getThemeIcon(mode: ThemeMode): 'monitor' | 'sun' | 'moon' {
		switch (mode) {
			case 'system':
				return 'monitor';
			case 'light':
				return 'sun';
			case 'dark':
				return 'moon';
		}
	}

	function getThemeLabel(mode: ThemeMode): string {
		switch (mode) {
			case 'system':
				return 'System theme';
			case 'light':
				return 'Light theme';
			case 'dark':
				return 'Dark theme';
		}
	}

	function handleSettings() {
		settingsOpen.set(true);
		mobileMenuOpen.set(false);
	}

	async function handleSave() {
		isExporting = true;
		try {
			const data = await exportLibrary();
			const json = JSON.stringify(data, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
			const filename = `promptlib-export-v1-${date}.json`;
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
			alert('Failed to save library. Please try again.');
		} finally {
			isExporting = false;
		}
	}

	function handleLoadClick() {
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isImporting = true;
		try {
			const text = await file.text();
			const data = JSON.parse(text);

			if (!validateImportData(data)) {
				alert('Invalid file format. Please select a valid Prompt Library export file.');
				return;
			}

			await importLibrary(data);
			const [newPrompts, newTags] = await Promise.all([getAllPrompts(), getAllTags()]);
			prompts.set(newPrompts);
			tags.set(newTags);
			alert('Library loaded successfully!');
		} catch (error) {
			console.error('Import failed:', error);
			alert('Failed to load library. Please try again.');
		} finally {
			isImporting = false;
			if (input) input.value = '';
		}
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept=".json"
	onchange={handleFileChange}
	class="hidden"
/>

{#if isMobile}
	<!-- Mobile Navbar -->
	<header
		class="flex h-14 items-center justify-between border-b px-4 md:hidden"
		style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
	>
		<!-- Left: Sidebar toggle -->
		<button
			type="button"
			onclick={() => sidebarOpen.update((v) => !v)}
			class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label="Toggle sidebar"
			aria-expanded={$sidebarOpen}
		>
			<Icon name="panel-left" size={22} />
		</button>

		<!-- Center: Brand name with logo -->
		<div class="flex items-center gap-2">
			<img src="/bearprompt.png" alt="Bearprompt logo" class="h-7 w-7" />
			<span class="text-base font-semibold" style="color: var(--color-text-primary);">
				Bearprompt
			</span>
		</div>

		<!-- Right: Hamburger menu -->
		<button
			type="button"
			onclick={() => mobileMenuOpen.update((v) => !v)}
			class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label="Toggle menu"
			aria-expanded={$mobileMenuOpen}
		>
			<Icon name={$mobileMenuOpen ? 'x' : 'menu'} size={22} />
		</button>
	</header>

	<!-- Mobile Menu Dropdown -->
	{#if $mobileMenuOpen}
		<div
			class="absolute top-14 right-0 z-40 w-56 rounded-bl-lg border-l border-b shadow-lg md:hidden"
			style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
			role="menu"
		>
			<div class="p-2">
		{#if isPublicRoute || isAgentRoute}
			<a
				href={ADD_PROMPT_URL}
				target="_blank"
				rel="noopener noreferrer"
				class="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
				style="border-color: var(--color-border); color: var(--color-text-secondary);"
				role="menuitem"
			>
				<Icon name="plus" size={18} />
				{isAgentRoute ? 'Add my Agent Prompt' : 'Add my Prompt'}
			</a>
		{/if}
				{#if isLibraryRoute}
					<button
						type="button"
						onclick={handleSave}
						disabled={isExporting}
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
						style="color: var(--color-text-secondary);"
						role="menuitem"
					>
						<Icon name="download" size={18} />
						{isExporting ? 'Saving...' : 'Save'}
					</button>
					<button
						type="button"
						onclick={handleLoadClick}
						disabled={isImporting}
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
						style="color: var(--color-text-secondary);"
						role="menuitem"
					>
						<Icon name="upload" size={18} />
						{isImporting ? 'Loading...' : 'Load'}
					</button>
				{/if}
				<a
					href="https://github.com/julianyaman"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
					style="color: var(--color-text-secondary);"
					role="menuitem"
				>
					<Icon name="github" size={18} />
					GitHub
				</a>
				<button
					type="button"
					onclick={cycleTheme}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
					style="color: var(--color-text-secondary);"
					role="menuitem"
					aria-label={getThemeLabel($theme)}
				>
					<Icon name={getThemeIcon($theme)} size={18} />
					{$theme.charAt(0).toUpperCase() + $theme.slice(1)} Theme
				</button>
				<button
					type="button"
					onclick={handleSettings}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
					style="color: var(--color-text-secondary);"
					role="menuitem"
				>
					<Icon name="settings" size={18} />
					Settings
				</button>
			</div>
		</div>
	{/if}
{:else}
	<!-- Desktop Navbar -->
	<header
		class="hidden h-16 items-center justify-end gap-1 border-b px-4 md:flex"
		style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
	>
		{#if isPublicRoute || isAgentRoute}
			<a
				href={ADD_PROMPT_URL}
				target="_blank"
				rel="noopener noreferrer"
				class="add-prompt-btn flex h-10 items-center gap-2 rounded-lg border px-4 text-sm transition-colors"
				style="border-color: var(--color-border); color: var(--color-text-secondary);"
			>
				<Icon name="plus" size={18} />
				{isAgentRoute ? 'Add my Agent Prompt' : 'Add my Prompt'}
			</a>
		{/if}
		{#if isLibraryRoute}
			<button
				type="button"
				onclick={handleSave}
				disabled={isExporting}
				class="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50"
				style="color: var(--color-text-secondary);"
			>
				<Icon name="download" size={18} />
				{isExporting ? 'Saving...' : 'Save'}
			</button>
			<button
				type="button"
				onclick={handleLoadClick}
				disabled={isImporting}
				class="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50"
				style="color: var(--color-text-secondary);"
			>
				<Icon name="upload" size={18} />
				{isImporting ? 'Loading...' : 'Load'}
			</button>
		{/if}
		<a
			href="https://github.com/julianyaman"
			target="_blank"
			rel="noopener noreferrer"
			class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label="GitHub profile"
		>
			<Icon name="github" size={20} />
		</a>
		<button
			type="button"
			onclick={cycleTheme}
			class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label={getThemeLabel($theme)}
		>
			<Icon name={getThemeIcon($theme)} size={20} />
		</button>
		<button
			type="button"
			onclick={handleSettings}
			class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label="Settings"
		>
			<Icon name="settings" size={20} />
		</button>
	</header>
{/if}

<style>
	button:hover,
	a:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
</style>
