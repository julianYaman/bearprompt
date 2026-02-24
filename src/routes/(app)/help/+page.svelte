<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	const CHATGPT_PROMPT = `Based on my previous chats, give me my 10 most used prompts that I can copy & paste into a prompt library. Format them in a way that I know where I have to enter custom instructions or text for this prompt. For each prompt, give me a title and a few tags. Format the result so each prompt can be directly copied into a prompt library.`;

	const gettingStarted = [
		{
			question: 'How do I add prompts?',
			answer: 'Simply click "New Prompt" in your library, give it a title, paste or write your prompt content, and optionally add tags to organize it. Your prompt is saved instantly in your browser.'
		},
		{
			question: 'Add your 10 most used prompts from ChatGPT',
			answer: 'Copy the prompt below and paste it into ChatGPT. It will generate a list of your most used prompts.',
			hasPrompt: true
		}
	];

	const faqCategories = [
		{
			title: 'My Library',
			questions: [
				{
					question: 'How safe is my data?',
					answer: 'Your prompts never leave your device. Everything is stored locally in your browser. We don\'t have servers that store your data, and we don\'t track what you write. Your prompts are yours alone.'
				},
				{
					question: 'Can I export my prompts?',
					answer: 'Yes! You can export all your prompts at any time. This makes it easy to back up your library or transfer it to another browser or device.'
				}
			]
		},
		{
			title: 'Public Prompt Library',
			questions: [
				{
					question: 'How do I add my prompt to the public library?',
					answer: 'Click "Add my Prompt" in the navigation bar. This will open GitHub with a pre-filled template where you can submit your prompt. Once reviewed, your prompt will be added to the public library for everyone to discover and use.'
				},
				{
					question: 'Can I use prompts from the public library?',
					answer: 'Yes! Browse the public library, find prompts that interest you, and copy them to your personal library with a single click.'
				}
			]
		},
		{
			title: 'Other',
			questions: [
				{
					question: 'Is Bearprompt really free?',
					answer: 'Yes, Bearprompt is completely free and open-source. There are no premium tiers, no subscriptions, and no hidden costs. You can even self-host it if you prefer.'
				},
				{
					question: 'Can I contribute to the project?',
					answer: 'Absolutely! Bearprompt is open-source and we welcome contributions. Check out our GitHub repository to report issues, suggest features, or submit pull requests.'
				}
			]
		}
	];

	let openQuestions = $state<Set<string>>(new Set());
	let copyState = $state<'idle' | 'copied'>('idle');
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	function toggleQuestion(key: string) {
		const newSet = new Set(openQuestions);
		if (newSet.has(key)) {
			newSet.delete(key);
		} else {
			newSet.add(key);
		}
		openQuestions = newSet;
	}

	async function handleCopyPrompt() {
		await navigator.clipboard.writeText(CHATGPT_PROMPT);
		copyState = 'copied';
		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copyState = 'idle';
		}, 1500);
	}
</script>

<svelte:head>
	<title>Help - Bearprompt</title>
</svelte:head>

<div class="help-page">
	<div class="help-container">
		<h1 class="page-title">Help</h1>
		<p class="page-description">Find answers to common questions about Bearprompt.</p>

		<div class="categories">
			<!-- Getting Started Section -->
			<section class="category">
				<h2 class="category-title">Getting Started</h2>
				<div class="questions">
					{#each gettingStarted as item, index}
						{@const key = `getting-started-${index}`}
						<div class="faq-item" class:open={openQuestions.has(key)}>
							<button
								type="button"
								class="faq-question"
								onclick={() => toggleQuestion(key)}
								aria-expanded={openQuestions.has(key)}
							>
								<span>{item.question}</span>
								<Icon name="chevron-down" size={20} class="faq-chevron" />
							</button>
							{#if openQuestions.has(key)}
								<div class="faq-answer">
									<p>{item.answer}</p>
									{#if item.hasPrompt}
										<pre class="prompt-content">{CHATGPT_PROMPT}</pre>
										<button
											type="button"
											onclick={handleCopyPrompt}
											class="copy-button"
											style="background-color: {copyState === 'copied' ? 'var(--color-success)' : 'var(--color-accent)'};"
										>
											<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
											{copyState === 'copied' ? 'Copied!' : 'Copy prompt'}
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>

			{#each faqCategories as category}
				<section class="category">
					<h2 class="category-title">{category.title}</h2>
					<div class="questions">
						{#each category.questions as faq, index}
							{@const key = `${category.title}-${index}`}
							<div class="faq-item" class:open={openQuestions.has(key)}>
								<button
									type="button"
									class="faq-question"
									onclick={() => toggleQuestion(key)}
									aria-expanded={openQuestions.has(key)}
								>
									<span>{faq.question}</span>
									<Icon name="chevron-down" size={20} class="faq-chevron" />
								</button>
								{#if openQuestions.has(key)}
									<div class="faq-answer">
										<p>{faq.answer}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>
</div>

<style>
	.help-page {
		height: 100%;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.help-container {
		max-width: 48rem;
		margin: 0 auto;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.page-description {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		margin-bottom: 2rem;
	}

	.categories {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.category-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.questions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.faq-item {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--color-bg-secondary);
	}

	.faq-item.open {
		border-color: var(--color-accent);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 1rem 1.25rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-text-primary);
		text-align: left;
	}

	.faq-question:hover {
		background-color: var(--color-bg-tertiary);
	}

	.faq-item.open .faq-question {
		border-bottom: 1px solid var(--color-border);
	}

	:global(.faq-chevron) {
		transition: transform 0.2s;
		color: var(--color-text-secondary);
	}

	.faq-item.open :global(.faq-chevron) {
		transform: rotate(180deg);
	}

	.faq-answer {
		padding: 1rem 1.25rem;
	}

	.faq-answer p {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.7;
	}

	.prompt-content {
		margin-top: 1rem;
		padding: 1rem;
		background-color: var(--color-bg-tertiary);
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--color-text-primary);
		white-space: pre-wrap;
		overflow-x: auto;
	}

	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		border: none;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.copy-button:hover {
		opacity: 0.9;
	}
</style>
