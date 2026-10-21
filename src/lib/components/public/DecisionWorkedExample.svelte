<script lang="ts">
	import { formatPercent, formatScore, questionTypeLabel } from '$lib/decision-library/format';
	import type {
		ChoiceQuestion,
		DecisionQuestion,
		SampleAnswer,
		ScoreQuestion
	} from '$lib/decision-library/types';

	interface Props {
		state: unknown;
		questions: DecisionQuestion[];
		answers: Record<string, SampleAnswer>;
		nextSteps: string;
	}

	let { state, questions, answers, nextSteps }: Props = $props();

	function stateText(value: unknown): string {
		return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
	}

	function choiceCriteria(question: DecisionQuestion): Record<string, string> {
		return question.type === 'choice' ? (question as ChoiceQuestion).criteria : {};
	}

	function scoreCriteria(question: DecisionQuestion): string[] {
		return question.type === 'score' ? (question as ScoreQuestion).criteria : [];
	}

	function barWidth(value: number): string {
		return `${Math.max(2, Math.min(100, value * 100))}%`;
	}
</script>

<section class="border-b p-6" style="border-color: var(--color-border);">
	<div class="mb-2 flex flex-wrap items-end justify-between gap-2">
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-muted);">
			Worked example
		</h2>
		<p class="text-xs" style="color: var(--color-text-muted);">
			Illustrative for this sample state, not a live run
		</p>
	</div>

	<h3 class="mb-2 text-sm font-medium" style="color: var(--color-text-secondary);">Sample state</h3>
	<pre
		class="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed"
		style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
	>{stateText(state)}</pre>

	<div class="mt-6 space-y-5">
		{#each questions as question (question.name)}
			{@const answer = answers[question.name]}
			<div class="rounded-xl border p-4" style="border-color: var(--color-border);">
				<div class="mb-2 flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
					>
						{questionTypeLabel(question.type)}
					</span>
					<code class="text-sm" style="color: var(--color-text-muted);">{question.name}</code>
				</div>
				<p class="text-sm leading-6" style="color: var(--color-text-primary);">
					{question.instructions}
				</p>

				{#if answer?.type === 'noul'}
					<div class="mt-3">
						<div class="mb-1 flex justify-between text-sm" style="color: var(--color-text-secondary);">
							<span>Yes</span>
							<span>{formatPercent(answer.noul)}</span>
						</div>
						<div class="h-2 overflow-hidden rounded-full" style="background-color: var(--color-bg-tertiary);">
							<div
								class="h-full rounded-full"
								style={`width: ${barWidth(answer.noul)}; background-color: var(--color-accent);`}
							></div>
						</div>
					</div>
				{:else if answer?.type === 'choice'}
					<ul class="mt-3 space-y-2">
						{#each Object.entries(choiceCriteria(question)) as [option, label] (option)}
							{@const probability = answer.probabilities[option] ?? 0}
							<li>
								<div class="mb-1 flex justify-between gap-3 text-sm">
									<span style="color: var(--color-text-primary);">
										{option}{option === answer.choice ? ' · selected' : ''}
									</span>
									<span style="color: var(--color-text-secondary);">{formatPercent(probability)}</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full" style="background-color: var(--color-bg-tertiary);">
									<div
										class="h-full rounded-full"
										style={`width: ${barWidth(probability)}; background-color: ${
											option === answer.choice ? 'var(--color-accent)' : 'var(--color-text-muted)'
										};`}
									></div>
								</div>
								<p class="mt-1 text-xs" style="color: var(--color-text-muted);">{label}</p>
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-xs" style="color: var(--color-text-muted);">
						Confidence {formatPercent(answer.confidence)}
					</p>
				{:else if answer?.type === 'score'}
					{@const levels = scoreCriteria(question)}
					<p class="mt-3 text-sm" style="color: var(--color-text-secondary);">
						Score {formatScore(answer.score)} on 0–{Math.max(levels.length - 1, 0)}
					</p>
					<ul class="mt-3 space-y-2">
						{#each levels as label, index (index)}
							{@const probability = answer.probabilities[String(index)] ?? 0}
							<li>
								<div class="mb-1 flex justify-between gap-3 text-sm">
									<span style="color: var(--color-text-primary);">{index}. {label}</span>
									<span style="color: var(--color-text-secondary);">{formatPercent(probability)}</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full" style="background-color: var(--color-bg-tertiary);">
									<div
										class="h-full rounded-full"
										style={`width: ${barWidth(probability)}; background-color: var(--color-accent);`}
									></div>
								</div>
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-xs" style="color: var(--color-text-muted);">
						Confidence {formatPercent(answer.confidence)}
					</p>
				{:else}
					<p class="mt-3 text-xs" style="color: var(--color-text-muted);">
						The vendor docs do not publish a sample answer for this question.
					</p>
				{/if}
			</div>
		{/each}
	</div>

	{#if nextSteps}
		<div class="mt-6">
			<h3 class="mb-2 text-sm font-medium" style="color: var(--color-text-secondary);">
				What you might do next
			</h3>
			<p class="text-sm leading-6" style="color: var(--color-text-secondary);">{nextSteps}</p>
		</div>
	{/if}
</section>
