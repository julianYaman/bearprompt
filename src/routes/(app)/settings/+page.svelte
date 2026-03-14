<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { theme } from '$lib/stores';
	import type { ThemeMode } from '$lib/types';

	function setTheme(mode: ThemeMode) {
		theme.set(mode);
	}

	const themeOptions: { value: ThemeMode; label: string; icon: 'monitor' | 'sun' | 'moon' }[] = [
		{ value: 'system', label: 'System', icon: 'monitor' },
		{ value: 'light', label: 'Light', icon: 'sun' },
		{ value: 'dark', label: 'Dark', icon: 'moon' }
	];
</script>

<svelte:head>
	<title>Settings | Bearprompt</title>
</svelte:head>

<div class="settings-page">
	<div class="settings-container">
		<header class="settings-header">
			<h1 class="page-title">Settings</h1>
			<p class="page-description">
				Customize how Bearprompt looks and behaves. Your changes are saved locally.
			</p>
		</header>

		<section class="settings-section">
			<h2 class="section-title">Appearance</h2>
			<div class="section-card">
				<label class="section-label">Theme</label>
				<div class="theme-options">
					{#each themeOptions as option}
						<button
							type="button"
							onclick={() => setTheme(option.value)}
							class="theme-option"
							class:selected={$theme === option.value}
							aria-pressed={$theme === option.value}
						>
							<Icon name={option.icon} size={22} />
							<span>{option.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</section>

		<section class="settings-section">
			<h2 class="section-title">AI Tools</h2>
			<div class="section-card muted">
				<p>Add your preferred AI providers to improve your prompts.</p>
			</div>
		</section>

		<section class="settings-section">
			<h2 class="section-title">Coming soon</h2>
			<div class="section-card dashed">
				<p>More settings will land here as the product grows.</p>
			</div>
		</section>
	</div>
</div>

<style>
	.settings-page {
		height: 100%;
		overflow-y: auto;
		padding: 1.5rem;
		color: var(--color-text-primary);
	}

	.settings-container {
		max-width: 48rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
	}

	.page-description {
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.section-card {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text-secondary);
	}

	.section-card.muted {
		background-color: var(--color-bg-primary);
	}

	.section-card.dashed {
		border-style: dashed;
		text-align: center;
	}

	.section-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--color-text-primary);
	}

	.theme-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.theme-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 0.75rem;
		background-color: var(--color-bg-primary);
		color: var(--color-text-secondary);
		transition: border-color 0.2s, background-color 0.2s, color 0.2s;
	}

	.theme-option.selected {
		border-color: var(--color-accent);
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.theme-option:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.theme-option:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	button {
		cursor: pointer;
	}

	@media (max-width: 640px) {
		.settings-page {
			padding: 1.25rem;
		}

		.page-title {
			font-size: 1.5rem;
		}
	}
</style>
