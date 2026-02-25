<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { AgentToolWithSetupUrl } from '$lib/types/public';

	interface Props {
		tools: AgentToolWithSetupUrl[];
	}

	let { tools }: Props = $props();

	// Map tool slugs to icon names
	function getIconName(slug: string): 'notion' | 'ms-copilot' | 'cursor' | 'claude-code' | 'bot' {
		switch (slug) {
			case 'notion':
				return 'notion';
			case 'ms-copilot':
				return 'ms-copilot';
			case 'cursor':
				return 'cursor';
			case 'claude-code':
				return 'claude-code';
			default:
				return 'bot';
		}
	}
</script>

{#if tools.length > 0}
	<section class="p-6">
		<h2
			class="mb-4 text-sm font-semibold uppercase tracking-wide"
			style="color: var(--color-text-muted);"
		>
			Use with
		</h2>
		<div class="flex flex-wrap gap-3">
			{#each tools as tool}
				{@const href = tool.setup_url || tool.url}
				{#if href}
					<a
						{href}
						target="_blank"
						rel="noopener noreferrer"
						class="tool-link flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
						style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
					>
						<Icon name={getIconName(tool.slug)} size={18} />
						{tool.name}
						<Icon name="external-link" size={14} class="opacity-50" />
					</a>
				{:else}
					<span
						class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
						style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);"
					>
						<Icon name={getIconName(tool.slug)} size={18} />
						{tool.name}
					</span>
				{/if}
			{/each}
		</div>
	</section>
{/if}

<style>
	.tool-link:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	:global(.dark) .tool-link:hover {
		color: var(--color-accent) !important;
	}
</style>
