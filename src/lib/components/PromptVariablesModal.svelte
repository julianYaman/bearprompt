<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Icon from './Icon.svelte';
	import {
		formatVariableLabel,
		parsePromptVariables,
		renderPrompt,
		tokenizePromptForPreview
	} from '$lib/prompt-variables';
	import type { PromptVariable } from '$lib/prompt-variables';

	interface Props {
		title: string;
		prompt: string;
		onClose: () => void;
	}

	let { title, prompt, onClose }: Props = $props();

	let values = $state<Record<string, string>>({});
	let focusedVariableName = $state<string | null>(null);
	let copyState = $state<'idle' | 'copied' | 'opened'>('idle');
	let openMenu = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let openMenuContainer: HTMLDivElement | undefined = $state();
	const fieldRefs = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();

	const variables = $derived(parsePromptVariables(prompt));
	const renderedPrompt = $derived(renderPrompt(prompt, values));
	const previewTokens = $derived(tokenizePromptForPreview(prompt, values));

	const providerUrls = $derived({
		chatgpt: `https://chat.openai.com/?q=${encodeURIComponent(renderedPrompt)}`,
		claude: `https://claude.ai/new?q=${encodeURIComponent(renderedPrompt)}`,
		perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(renderedPrompt)}`,
		grok: `https://grok.com/?q=${encodeURIComponent(renderedPrompt)}`
	});

	onMount(() => {
		void tick().then(() => {
			fieldRefs.get(variables[0]?.name)?.focus();
		});

		return () => {
			if (copyTimeout) clearTimeout(copyTimeout);
		};
	});

	function fieldRef(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, name: string) {
		fieldRefs.set(name, element);

		return {
			update(nextName: string) {
				if (nextName !== name) {
					fieldRefs.delete(name);
					fieldRefs.set(nextName, element);
					name = nextName;
				}
			},
			destroy() {
				fieldRefs.delete(name);
			}
		};
	}

	function resetFeedback(state: 'copied' | 'opened') {
		copyState = state;
		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copyState = 'idle';
		}, 1500);
	}

	async function copyRenderedPrompt(state: 'copied' | 'opened' = 'copied') {
		if (!navigator.clipboard) {
			alert('Clipboard API not available. Please copy manually.');
			return false;
		}

		try {
			await navigator.clipboard.writeText(renderedPrompt);
			resetFeedback(state);
			return true;
		} catch {
			alert('Failed to copy to clipboard.');
			return false;
		}
	}

	async function handleCopy() {
		await copyRenderedPrompt();
	}

	function handleOpenProvider(provider: keyof typeof providerUrls) {
		resetFeedback('opened');
		openMenu = false;
		window.open(providerUrls[provider], '_blank', 'noopener,noreferrer');
	}

	function focusVariable(name: string) {
		fieldRefs.get(name)?.focus();
	}

	function focusNextField(variable: PromptVariable) {
		const currentIndex = variables.findIndex((item) => item.name === variable.name);
		const nextVariable = variables[currentIndex + 1];

		if (nextVariable) {
			fieldRefs.get(nextVariable.name)?.focus();
			return;
		}

		void copyRenderedPrompt();
	}

	function handleTextKeydown(event: KeyboardEvent, variable: PromptVariable) {
		if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
			return;
		}

		event.preventDefault();
		focusNextField(variable);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void copyRenderedPrompt();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleWindowClick(event: MouseEvent) {
		if (!openMenu || !openMenuContainer) return;

		if (event.target instanceof Node && !openMenuContainer.contains(event.target)) {
			openMenu = false;
		}
	}

	function formatOption(option: string): string {
		return option ? option[0].toUpperCase() + option.slice(1) : option;
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="prompt-variables-title"
	onclick={handleBackdropClick}
	onkeydown={(event) => {
		if (event.target === event.currentTarget) handleKeydown(event);
	}}
	tabindex="-1"
>
	<div
		class="flex h-[92vh] w-full max-w-2xl flex-col rounded-t-xl shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl"
		style="background-color: var(--color-bg-primary);"
	>
		<header
			class="flex items-center justify-between gap-4 border-b p-4"
			style="border-color: var(--color-border);"
		>
			<h2
				id="prompt-variables-title"
				class="min-w-0 truncate text-lg font-semibold"
				style="color: var(--color-text-primary);"
			>
				Use "{title}"
			</h2>
			<button
				type="button"
				onclick={onClose}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
				style="color: var(--color-text-muted);"
				aria-label="Close prompt variables"
			>
				<Icon name="x" size={20} />
			</button>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto p-4">
			<div
				class="prompt-preview mb-5 max-h-[38vh] overflow-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed"
				style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
			>
				{#each previewTokens as token}
					{#if token.type === 'text'}
						{token.value}
					{:else if token.value}
						<span>{token.value}</span>
					{:else}
						<button
							type="button"
							class="preview-variable cursor-pointer rounded px-1.5 py-0.5 font-medium transition-colors"
							class:preview-variable-focused={focusedVariableName === token.name}
							onclick={() => focusVariable(token.name)}
						>
							{token.placeholder}
						</button>
					{/if}
				{/each}
			</div>

			<div class="space-y-4">
				{#each variables as variable}
					<div>
						<label
							for={`prompt-variable-${variable.name}`}
							class="mb-1.5 block text-sm font-medium"
							style="color: var(--color-text-primary);"
						>
							{formatVariableLabel(variable.name)}
						</label>
						{#if variable.type === 'select'}
							<select
								id={`prompt-variable-${variable.name}`}
								use:fieldRef={variable.name}
								value={values[variable.name] || ''}
								onchange={(event) => {
									values[variable.name] = event.currentTarget.value;
								}}
								onfocus={() => (focusedVariableName = variable.name)}
								onblur={() => {
									if (focusedVariableName === variable.name) focusedVariableName = null;
								}}
								class="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
								style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
							>
								<option value=""></option>
								{#each variable.options ?? [] as option}
									<option value={option}>{formatOption(option)}</option>
								{/each}
							</select>
						{:else if variable.type === 'textarea'}
							<textarea
								id={`prompt-variable-${variable.name}`}
								use:fieldRef={variable.name}
								value={values[variable.name] || ''}
								rows="5"
								oninput={(event) => {
									values[variable.name] = event.currentTarget.value;
								}}
								onfocus={() => (focusedVariableName = variable.name)}
								onblur={() => {
									if (focusedVariableName === variable.name) focusedVariableName = null;
								}}
								class="min-h-32 w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
								style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
							></textarea>
						{:else}
							<input
								id={`prompt-variable-${variable.name}`}
								use:fieldRef={variable.name}
								type="text"
								value={values[variable.name] || ''}
								oninput={(event) => {
									values[variable.name] = event.currentTarget.value;
								}}
								onfocus={() => (focusedVariableName = variable.name)}
								onblur={() => {
									if (focusedVariableName === variable.name) focusedVariableName = null;
								}}
								onkeydown={(event) => handleTextKeydown(event, variable)}
								class="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
								style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
							/>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<footer
			class="flex flex-wrap items-center gap-2 border-t p-4"
			style="border-color: var(--color-border);"
		>
			<button
				type="button"
				onclick={handleCopy}
				class="modal-button modal-button-primary inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
				style="background-color: {copyState === 'copied' ? 'var(--color-success)' : 'var(--color-accent)'};"
			>
				<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
				{copyState === 'copied' ? 'Copied' : 'Copy'}
			</button>

			<div class="relative" bind:this={openMenuContainer}>
				<button
					type="button"
					onclick={() => (openMenu = !openMenu)}
					class="modal-button modal-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
					style="background-color: {copyState === 'opened' ? 'var(--color-success)' : 'var(--color-bg-secondary)'}; border-color: var(--color-border); color: {copyState === 'opened' ? 'white' : 'var(--color-text-primary)'};"
				>
					<Icon name={copyState === 'opened' ? 'check' : 'external-link'} size={16} />
					{copyState === 'opened' ? 'Opened' : 'Open in...'}
					{#if copyState !== 'opened'}
						<Icon name="chevron-down" size={14} />
					{/if}
				</button>

				{#if openMenu}
					<div
						class="absolute bottom-full left-0 z-10 mb-2 w-44 overflow-hidden rounded-lg border shadow-lg"
						style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
					>
						<button
							type="button"
							onclick={() => handleOpenProvider('chatgpt')}
							class="dropdown-item flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
							style="color: var(--color-text-primary);"
						>
							<Icon name="chatgpt" size={18} />
							ChatGPT
							<Icon name="external-link" size={12} class="ml-auto opacity-50" />
						</button>
						<button
							type="button"
							onclick={() => handleOpenProvider('claude')}
							class="dropdown-item flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
							style="color: var(--color-text-primary);"
						>
							<Icon name="claude" size={18} />
							Claude
							<Icon name="external-link" size={12} class="ml-auto opacity-50" />
						</button>
						<button
							type="button"
							onclick={() => handleOpenProvider('perplexity')}
							class="dropdown-item flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
							style="color: var(--color-text-primary);"
						>
							<Icon name="perplexity" size={18} />
							Perplexity
							<Icon name="external-link" size={12} class="ml-auto opacity-50" />
						</button>
						<button
							type="button"
							onclick={() => handleOpenProvider('grok')}
							class="dropdown-item flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
							style="color: var(--color-text-primary);"
						>
							<Icon name="grok" size={18} />
							Grok
							<Icon name="external-link" size={12} class="ml-auto opacity-50" />
						</button>
					</div>
				{/if}
			</div>

			<button
				type="button"
				onclick={onClose}
				class="modal-button modal-button-secondary ml-auto cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
				style="background-color: transparent; border-color: var(--color-border); color: var(--color-text-primary);"
			>
				Close
			</button>
		</footer>
	</div>
</div>

<style>
	.prompt-preview {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
			monospace;
	}

	.preview-variable {
		background-color: color-mix(in oklab, var(--color-accent) 18%, var(--color-bg-primary));
		color: var(--color-text-primary);
		outline: 1px solid color-mix(in oklab, var(--color-accent) 55%, transparent);
	}

	.preview-variable:hover,
	.preview-variable-focused {
		background-color: var(--color-accent);
		color: #271105;
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-color: var(--color-accent) !important;
		box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-accent) 28%, transparent);
	}

	.dropdown-item:hover {
		background-color: var(--color-bg-tertiary);
	}

	.modal-button-primary:hover {
		background-color: var(--color-accent-hover) !important;
	}

	.modal-button-secondary:hover {
		background-color: var(--color-bg-tertiary) !important;
	}
</style>
