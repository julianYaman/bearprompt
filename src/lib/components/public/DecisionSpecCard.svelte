<script lang="ts">
	import Icon from '../Icon.svelte';
	import AuthorLogo from './AuthorLogo.svelte';
	import VerifiedBadge from './VerifiedBadge.svelte';
	import { questionTypeLabel } from '$lib/decision-library/format';
	import type { ResolvedDecisionSpec } from '$lib/decision-library/types';

	interface Props {
		spec: ResolvedDecisionSpec;
	}

	let { spec }: Props = $props();

	const href = $derived(`/decisions/${spec.author.slug}/${spec.slug}`);
	const types = $derived([...new Set(spec.questions.map((question) => question.type))]);
</script>

<a
	href={href}
	class="group flex h-full cursor-pointer flex-col rounded-xl border p-4 shadow-sm transition-all duration-200"
	style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
>
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<span
			class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
			style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
		>
			{spec.recommendedModel}
		</span>
		{#each types as type (type)}
			<span
				class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
				style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
			>
				{questionTypeLabel(type)}
			</span>
		{/each}
	</div>

	<h3 class="text-base font-semibold leading-snug" style="color: var(--color-text-primary);">
		{spec.title}
	</h3>
	<p class="mt-2 flex-1 text-sm leading-6" style="color: var(--color-text-secondary);">
		{spec.description}
	</p>

	<div class="mt-4 flex items-center justify-between gap-2">
		<div class="flex min-w-0 items-center gap-2">
			<span
				class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full"
				style="background-color: var(--color-bg-tertiary);"
			>
				<AuthorLogo name={spec.author.name} src={spec.author.avatarUrl} iconSize={12} />
			</span>
			<span class="truncate text-sm" style="color: var(--color-text-secondary);">
				{spec.author.name}
			</span>
			{#if spec.author.verified}
				<VerifiedBadge size={12} />
			{/if}
		</div>
		<span class="inline-flex items-center gap-1 text-sm" style="color: var(--color-text-muted);">
			{spec.questions.length} question{spec.questions.length === 1 ? '' : 's'}
			<Icon name="arrow-right" size={14} />
		</span>
	</div>
</a>
