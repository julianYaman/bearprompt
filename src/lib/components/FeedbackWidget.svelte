<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	const feedbackUrl = 'https://tally.so/r/RGYg4Q';
	const issueUrl = 'https://github.com/julianYaman/bearprompt/issues/new';

	let isOpen = $state(false);
	let root: HTMLElement | null = null;

	function toggleDialog() {
		isOpen = !isOpen;
	}

	function closeDialog() {
		isOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!isOpen || !root) return;

		const target = event.target;
		if (target instanceof Node && !root.contains(target)) {
			closeDialog();
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDialog();
		}
	}

	onMount(() => {
		window.addEventListener('click', handleWindowClick);
		window.addEventListener('keydown', handleWindowKeydown);

		return () => {
			window.removeEventListener('click', handleWindowClick);
			window.removeEventListener('keydown', handleWindowKeydown);
		};
	});
</script>

<div class="feedback-widget" bind:this={root}>
	{#if isOpen}
		<div
			class="feedback-dialog"
			role="dialog"
			aria-label="Feedback options"
		>
			<a
				class="feedback-option"
				href={feedbackUrl}
				target="_blank"
				rel="noreferrer"
			>
				<span class="feedback-option__icon">
					<Icon name="message-square" size={18} />
				</span>
				<span class="feedback-option__title">Feedback</span>
			</a>

			<a
				class="feedback-option"
				href={issueUrl}
				target="_blank"
				rel="noreferrer"
			>
				<span class="feedback-option__icon feedback-option__icon--warning">
					<Icon name="triangle-alert" size={18} />
				</span>
				<span class="feedback-option__title">Report Issue</span>
			</a>
		</div>
	{/if}

	<button
		type="button"
		class="feedback-trigger"
		onclick={toggleDialog}
		aria-label={isOpen ? 'Close feedback dialog' : 'Open feedback dialog'}
		aria-haspopup="dialog"
		aria-expanded={isOpen}
	>
		<Icon name="message-square" size={18} />
	</button>
</div>

<style>
	.feedback-widget {
		position: fixed;
		right: 24px;
		bottom: 24px;
		z-index: 60;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.feedback-dialog {
		width: min(220px, calc(100vw - 32px));
		padding: 6px;
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, transparent);
		border-radius: 18px;
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--color-bg-primary) 94%, white 6%), color-mix(in srgb, var(--color-bg-secondary) 90%, transparent)),
			var(--color-bg-primary);
		box-shadow:
			0 20px 45px rgba(0, 0, 0, 0.18),
			0 4px 14px rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(14px);
	}

	.feedback-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 13px;
		color: inherit;
		text-decoration: none;
		transition: background-color 0.18s ease, transform 0.18s ease;
	}

	.feedback-option:hover {
		background-color: color-mix(in srgb, var(--color-bg-hover) 78%, transparent);
		transform: translateY(-1px);
	}

	.feedback-option__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		border-radius: 10px;
		background-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
		color: var(--color-accent-hover);
	}

	.feedback-option__icon--warning {
		background-color: color-mix(in srgb, var(--color-danger) 14%, transparent);
		color: var(--color-danger);
	}

	.feedback-option__title {
		font-family: "Bricolage Grotesque", system-ui, sans-serif;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.feedback-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
		border-radius: 999px;
		background: #fef3e2;
		color: var(--color-text-primary);
		box-shadow:
			0 20px 35px rgba(0, 0, 0, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.28);
		cursor: pointer;
		transition: transform 0.18s ease, box-shadow 0.18s ease;
	}

	.feedback-trigger:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 24px 38px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.28);
	}

	.feedback-trigger:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 4px;
	}

	:global(.dark) .feedback-trigger {
		background: var(--color-bg-primary);
	}

	@media (max-width: 640px) {
		.feedback-widget {
			right: 16px;
			bottom: 16px;
		}

		.feedback-trigger {
			width: 48px;
			height: 48px;
		}
	}
</style>
