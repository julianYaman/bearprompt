<script lang="ts">
	import Icon from './Icon.svelte';
	import { aboutOpen } from '$lib/stores';

	const APP_VERSION = '1.0';

	function handleClose() {
		aboutOpen.set(false);
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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $aboutOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="about-title"
	>
		<!-- Modal -->
		<div
			class="w-full max-w-sm rounded-xl shadow-xl"
			style="background-color: var(--color-bg-primary);"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b p-4"
				style="border-color: var(--color-border);"
			>
				<h2 id="about-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
					About Bearprompt
				</h2>
				<button
					type="button"
					onclick={handleClose}
					class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Close about"
				>
					<Icon name="x" size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-4">
				<!-- Version -->
				<div class="text-center">
					<p class="text-sm" style="color: var(--color-text-secondary);">
						Version <span class="font-mono font-medium" style="color: var(--color-text-primary);">{APP_VERSION}</span>
					</p>
				</div>

				<!-- Description -->
				<p class="text-sm text-center" style="color: var(--color-text-secondary);">
					Your private prompt library for AI. Store, organize, and quickly access your prompts - all locally in your browser.
				</p>

				<!-- Links -->
				<div class="space-y-2">
					<!-- GitHub -->
					<a
						href="https://github.com/julianyaman/bearprompt"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
					>
						<Icon name="github" size={18} />
						View on GitHub
						<Icon name="external-link" size={14} />
					</a>

					<!-- Buy Me a Coffee -->
					<a
						href="https://buymeacoffee.com/julianyaman"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors donate-button"
					>
						<Icon name="heart" size={18} />
						Support on Buy Me a Coffee
						<Icon name="external-link" size={14} />
					</a>
				</div>

				<!-- Legal Links -->
				<div class="border-t pt-4" style="border-color: var(--color-border);">
					<p class="text-xs mb-2 text-center" style="color: var(--color-text-muted);">Legal</p>
					<div class="flex justify-center gap-4 flex-wrap">
						<a
							href="/about/privacy"
							class="text-sm transition-colors"
							style="color: var(--color-text-secondary);"
							onclick={handleClose}
						>
							Privacy Policy
						</a>
						<a
							href="/about/terms"
							class="text-sm transition-colors"
							style="color: var(--color-text-secondary);"
							onclick={handleClose}
						>
							Terms of Service
						</a>
						<a
							href="/about/legal"
							class="text-sm transition-colors"
							style="color: var(--color-text-secondary);"
							onclick={handleClose}
						>
							Impressum
						</a>
					</div>
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
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	a:hover {
		opacity: 0.9;
	}

	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	button:hover {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.donate-button {
		background-color: #ffdd00;
		color: #000000;
	}

	.donate-button:hover {
		background-color: #e5c700;
	}
</style>
