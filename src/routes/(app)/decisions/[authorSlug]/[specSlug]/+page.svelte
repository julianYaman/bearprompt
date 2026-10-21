<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import DecisionWorkedExample from '$lib/components/public/DecisionWorkedExample.svelte';
	import { questionTypeLabel } from '$lib/decision-library/format';
	import type { DecisionCodeLanguage } from '$lib/decision-library';
	import { buildPromptOgImageUrl } from '$lib/seo';

	let { data } = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let language = $state<DecisionCodeLanguage>('python');

	const spec = $derived(data.spec);
	const code = $derived(data.code[language]);
	const howToRunLabel = $derived(`How to run ${spec.recommendedModel}`);
	const questionTypes = $derived([...new Set(spec.questions.map((question) => question.type))]);
	const canonicalUrl = $derived(
		`https://bearprompt.com/decisions/${spec.author.slug}/${spec.slug}`
	);
	const ogImageUrl = $derived(
		buildPromptOgImageUrl('decisions', spec.author.slug, spec.slug)
	);

	const languages: { id: DecisionCodeLanguage; label: string }[] = [
		{ id: 'python', label: 'Python' },
		{ id: 'typescript', label: 'TypeScript' },
		{ id: 'json', label: 'JSON' }
	];

	async function handleCopy() {
		if (!navigator.clipboard) {
			alert('Clipboard API not available. Please copy manually.');
			return;
		}

		try {
			await navigator.clipboard.writeText(code);
			copyState = 'copied';
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copyState = 'idle';
			}, 1500);
		} catch {
			alert('Failed to copy to clipboard.');
		}
	}
</script>

<svelte:head>
	<title>{spec.title} | Decision Library | Bearprompt</title>
	<meta name="description" content={spec.description} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content={`${spec.title} | Decision Library | Bearprompt`} />
	<meta property="og:description" content={spec.description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${spec.title} | Decision Library | Bearprompt`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${spec.title} | Decision Library | Bearprompt`} />
	<meta name="twitter:description" content={spec.description} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-6">
	<a
		href={`/decisions/category/${spec.pack.slug}`}
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to {spec.pack.name}
	</a>

	<article
		class="overflow-hidden rounded-2xl border"
		style="border-color: var(--color-border); background-color: var(--color-bg-primary);"
	>
		<header class="border-b p-6" style="border-color: var(--color-border);">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="rounded-full px-2 py-0.5 text-xs font-medium"
					style="background-color: var(--color-accent); color: white;"
				>
					{spec.recommendedModel}
				</span>
				{#each questionTypes as type (type)}
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
					>
						{questionTypeLabel(type)}
					</span>
				{/each}
			</div>
			<a
				href={spec.pack.setupUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-sm"
				style="color: var(--color-accent);"
			>
				{howToRunLabel}
				<Icon name="external-link" size={14} />
			</a>
			</div>
			<h1 class="text-xl font-bold sm:text-2xl" style="color: var(--color-text-primary);">
				{spec.title}
			</h1>
			<div class="mt-2 flex flex-wrap items-center gap-2">
				<a
					href={`/decisions/${spec.author.slug}`}
					class="inline-flex items-center gap-1.5 text-sm"
					style="color: var(--color-text-secondary);"
				>
					<Icon name={spec.author.icon} size={14} />
					{spec.author.name}
				</a>
				{#if spec.author.verified}
					<VerifiedBadge size={14} />
				{/if}
			</div>
		</header>

		<section class="border-b p-6" style="border-color: var(--color-border);">
			<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-muted);">
				Description
			</h2>
			<p style="color: var(--color-text-secondary);">{spec.description}</p>
		</section>

		<section class="border-b p-6" style="border-color: var(--color-border);">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-muted);">
					Copy
				</h2>
				<div class="flex flex-wrap items-center gap-2">
					{#each languages as option (option.id)}
						<button
							type="button"
							onclick={() => (language = option.id)}
							class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium"
							style="background-color: {language === option.id
								? 'var(--color-bg-tertiary)'
								: 'transparent'}; color: var(--color-text-secondary);"
						>
							{option.label}
						</button>
					{/each}
					<button
						onclick={handleCopy}
						class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
						style="background-color: {copyState === 'copied'
							? 'var(--color-success)'
							: 'var(--color-bg-secondary)'}; color: {copyState === 'copied'
							? 'white'
							: 'var(--color-text-secondary)'};"
					>
						<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={14} />
						{copyState === 'copied' ? 'Copied!' : 'Copy'}
					</button>
				</div>
			</div>
			<pre
				class="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed"
				style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
			>{code}</pre>
		</section>

		<DecisionWorkedExample
			state={spec.sampleState}
			questions={spec.questions}
			answers={spec.sampleAnswers}
			nextSteps={spec.nextSteps}
		/>

		{#if spec.tags.length > 0}
			<section class="p-6">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-muted);">
					Tags
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each spec.tags as tag (tag)}
						<span
							class="rounded-full px-3 py-1 text-sm"
							style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
						>
							{tag}
						</span>
					{/each}
				</div>
			</section>
		{/if}
	</article>
</div>
