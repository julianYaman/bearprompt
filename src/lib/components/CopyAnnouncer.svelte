<script lang="ts">
	import { copiedPromptId, prompts } from '$lib/stores';

	let message = $derived.by(() => {
		if (!$copiedPromptId) return '';
		const prompt = $prompts.find((p) => p.id === $copiedPromptId);
		return prompt ? `Copied "${prompt.title}" to clipboard` : 'Copied to clipboard';
	});
</script>

<!-- Screen reader announcements for copy feedback -->
<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class="sr-only"
>
	{message}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
