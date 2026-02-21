<script lang="ts">
	import Icon from './Icon.svelte';
	import { settingsOpen, theme } from '$lib/stores';
	import type { ThemeMode } from '$lib/types';

	function handleClose() {
		settingsOpen.set(false);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	function setTheme(mode: ThemeMode) {
		theme.set(mode);
	}

	const themeOptions: { value: ThemeMode; label: string; icon: 'monitor' | 'sun' | 'moon' }[] = [
		{ value: 'system', label: 'System', icon: 'monitor' },
		{ value: 'light', label: 'Light', icon: 'sun' },
		{ value: 'dark', label: 'Dark', icon: 'moon' }
	];
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $settingsOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-title"
	>
		<!-- Modal -->
		<div
			class="w-full max-w-md rounded-xl shadow-xl"
			style="background-color: var(--color-bg-primary);"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b p-4"
				style="border-color: var(--color-border);"
			>
				<h2 id="settings-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
					Settings
				</h2>
				<button
					type="button"
					onclick={handleClose}
					class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Close settings"
				>
					<Icon name="x" size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-6">
				<!-- Theme Selection -->
				<div>
					<label class="mb-2 block text-sm font-medium" style="color: var(--color-text-primary);">
						Theme
					</label>
					<div class="flex gap-2">
						{#each themeOptions as option}
							<button
								type="button"
								onclick={() => setTheme(option.value)}
								class="flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors"
								class:selected={$theme === option.value}
								style="border-color: {$theme === option.value
									? 'var(--color-accent)'
									: 'var(--color-border)'}; background-color: {$theme === option.value
									? 'var(--color-bg-tertiary)'
									: 'transparent'};"
								aria-pressed={$theme === option.value}
							>
								<Icon
									name={option.icon}
									size={24}
									class={$theme === option.value ? 'text-accent' : ''}
								/>
								<span
									class="text-sm"
									style="color: {$theme === option.value
										? 'var(--color-text-primary)'
										: 'var(--color-text-secondary)'};"
								>
									{option.label}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Placeholder for future settings -->
				<div
					class="rounded-lg border-2 border-dashed p-4 text-center"
					style="border-color: var(--color-border);"
				>
					<p class="text-sm" style="color: var(--color-text-muted);">
						More settings coming soon...
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t p-4" style="border-color: var(--color-border);">
				<button
					type="button"
					onclick={handleClose}
					class="w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
					style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	button:hover {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.text-accent {
		color: var(--color-accent);
	}
</style>
