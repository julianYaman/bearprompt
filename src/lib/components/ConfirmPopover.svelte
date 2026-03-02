<script lang="ts">
	interface Props {
		message: string;
		confirmLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
		/** When set, the popover renders fixed at these viewport coordinates */
		x?: number;
		y?: number;
	}

	let { message, confirmLabel = 'Delete', onconfirm, oncancel, x, y }: Props = $props();

	let fixed = $derived(x !== undefined && y !== undefined);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') oncancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop: clicking outside cancels -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-40" onclick={oncancel}></div>

<!-- Popover panel -->
<div
	class="z-50 w-64 rounded-lg border p-3 shadow-lg"
	class:fixed={fixed}
	class:absolute={!fixed}
	class:right-0={!fixed}
	class:mt-2={!fixed}
	style="background-color: var(--color-bg-primary); border-color: var(--color-border);{fixed ? ` top: ${y}px; left: ${x}px;` : ''}"
	role="alertdialog"
	aria-modal="true"
>
	<p class="mb-3 text-sm" style="color: var(--color-text-primary);">{message}</p>
	<div class="flex justify-end gap-2">
		<button
			type="button"
			onclick={oncancel}
			class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
			style="border-color: var(--color-border); color: var(--color-text-secondary);"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={onconfirm}
			class="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
			style="background-color: var(--color-danger);"
		>
			{confirmLabel}
		</button>
	</div>
</div>

<style>
	button:hover:not(:disabled) {
		opacity: 0.85;
	}
	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
