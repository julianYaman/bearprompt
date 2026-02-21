<script lang="ts">
	import Icon from './Icon.svelte';
	import { theme, settingsOpen, mobileMenuOpen, sidebarOpen, importExportOpen } from '$lib/stores';
	import type { ThemeMode } from '$lib/types';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

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

	function handleImportExport() {
		importExportOpen.set(true);
		mobileMenuOpen.set(false);
	}
</script>

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
				<button
					type="button"
					onclick={handleImportExport}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
					style="color: var(--color-text-secondary);"
					role="menuitem"
				>
					<Icon name="download" size={18} />
					Import / Export
				</button>
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
		<button
			type="button"
			onclick={handleImportExport}
			class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
			style="color: var(--color-text-secondary);"
			aria-label="Import / Export"
		>
			<Icon name="download" size={20} />
		</button>
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
