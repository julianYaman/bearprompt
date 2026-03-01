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
