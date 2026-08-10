<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from './Icon.svelte';
	import { whatsNewOpen } from '$lib/stores';
	import {
		CURRENT_WHATS_NEW,
		markWhatsNewSeen,
		trackWhatsNewEvent
	} from '$lib/whats-new';

	let hasTrackedView = $state(false);

	$effect(() => {
		if ($whatsNewOpen && !hasTrackedView) {
			trackWhatsNewEvent('Whats New View');
			hasTrackedView = true;
		}
		if (!$whatsNewOpen) {
			hasTrackedView = false;
		}
	});

	async function dismiss() {
		trackWhatsNewEvent('Whats New Dismiss');
		await markWhatsNewSeen();
		whatsNewOpen.set(false);
	}

	async function handleCta() {
		trackWhatsNewEvent('Whats New CTA');
		await markWhatsNewSeen();
		whatsNewOpen.set(false);
		await goto(CURRENT_WHATS_NEW.ctaHref);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			void dismiss();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && $whatsNewOpen) {
			void dismiss();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $whatsNewOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="whats-new-title"
	>
		<div
			class="whats-new-modal w-full max-w-md rounded-xl shadow-xl"
			style="background-color: var(--color-bg-primary);"
		>
			<div
				class="flex items-center justify-between border-b p-4"
				style="border-color: var(--color-border);"
			>
				<h2
					id="whats-new-title"
					class="text-lg font-semibold"
					style="color: var(--color-text-primary);"
				>
					What's new
				</h2>
				<button
					type="button"
					onclick={() => void dismiss()}
					class="whats-new-close flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Dismiss what's new"
				>
					<Icon name="x" size={20} />
				</button>
			</div>

			<div class="whats-new-items p-5">
				{#each CURRENT_WHATS_NEW.items as item, index (item.title)}
					<div class="whats-new-item flex items-start gap-3">
						<span
							class="whats-new-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
							aria-hidden="true"
						>
							<Icon name={index === 0 ? 'sparkles' : 'bot'} size={20} />
						</span>
						<div>
							<h3 class="text-base font-semibold" style="color: var(--color-text-primary);">
								{item.title}
							</h3>
							<p
								class="whats-new-body text-sm leading-relaxed"
								style="color: var(--color-text-secondary);"
							>
								{item.body}
							</p>
							{#if item.guideHref && item.guideLabel}
								<a
									href={item.guideHref}
									class="whats-new-guide text-sm font-medium transition-colors"
									onclick={() => {
										void markWhatsNewSeen();
										whatsNewOpen.set(false);
									}}
								>
									{item.guideLabel}
									<Icon name="external-link" size={14} />
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="border-t p-4" style="border-color: var(--color-border);">
				<button
					type="button"
					onclick={() => void handleCta()}
					class="whats-new-cta flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
				>
					{CURRENT_WHATS_NEW.ctaLabel}
					<Icon name="arrow-right" size={16} />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.whats-new-items {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.whats-new-icon {
		background-color: var(--color-bg-tertiary);
		color: var(--color-accent);
	}

	.whats-new-body {
		margin-top: 0.5rem;
	}

	.whats-new-guide {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.875rem;
		color: var(--color-accent);
		cursor: pointer;
		text-decoration: none;
	}

	.whats-new-guide:hover {
		opacity: 0.85;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.whats-new-close,
	.whats-new-cta {
		cursor: pointer;
	}

	.whats-new-cta {
		background-color: var(--color-accent);
		color: #fff;
	}

	.whats-new-cta:hover,
	.whats-new-close:hover {
		opacity: 0.9;
	}

	.whats-new-cta:focus-visible,
	.whats-new-close:focus-visible,
	.whats-new-guide:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
