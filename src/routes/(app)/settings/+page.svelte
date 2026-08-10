<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import Icon from '$lib/components/Icon.svelte';
	import {
		DEFAULT_PROVIDERS,
		PROMPT_PLACEHOLDER,
		buildProviderUrl,
		getBuiltinDefault,
		getProviderIconName,
		normalizeProviderOrder,
		validateProviderTemplate
	} from '$lib/ai-providers';
	import { aiProviders, persistAiProviders, theme } from '$lib/stores';
	import type { AiProviderConfig, ThemeMode } from '$lib/types';

	onMount(() => {
		if (window.location.hash !== '#ai-tools') return;
		requestAnimationFrame(() => {
			document.getElementById('ai-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});

	function setTheme(mode: ThemeMode) {
		theme.set(mode);
	}

	const themeOptions: { value: ThemeMode; label: string; icon: 'monitor' | 'sun' | 'moon' }[] = [
		{ value: 'system', label: 'System', icon: 'monitor' },
		{ value: 'light', label: 'Light', icon: 'sun' },
		{ value: 'dark', label: 'Dark', icon: 'moon' }
	];

	const SAMPLE_PROMPT = 'Write a short product launch announcement.';

	let draftName = $state('');
	let draftUrl = $state(`https://example.com/chat?q=${PROMPT_PLACEHOLDER}`);
	let draftError = $state('');
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editUrl = $state('');
	let editError = $state('');
	let saveFeedback = $state('');

	const providers = $derived(normalizeProviderOrder($aiProviders));

	async function commitProviders(next: AiProviderConfig[]) {
		await persistAiProviders(next);
		saveFeedback = 'Saved';
		setTimeout(() => {
			saveFeedback = '';
		}, 1200);
	}

	async function toggleEnabled(id: string) {
		const next = providers.map((provider) =>
			provider.id === id ? { ...provider, enabled: !provider.enabled } : provider
		);
		await commitProviders(next);
	}

	async function moveProvider(id: string, direction: -1 | 1) {
		const index = providers.findIndex((provider) => provider.id === id);
		const target = index + direction;
		if (index < 0 || target < 0 || target >= providers.length) return;

		const next = [...providers];
		const [item] = next.splice(index, 1);
		next.splice(target, 0, item);
		await commitProviders(next);
	}

	async function resetBuiltin(id: string) {
		const builtin = getBuiltinDefault(id);
		if (!builtin) return;
		const next = providers.map((provider) =>
			provider.id === id
				? {
						...provider,
						name: builtin.name,
						urlTemplate: builtin.urlTemplate
					}
				: provider
		);
		await commitProviders(next);
		if (editingId === id) {
			editName = builtin.name;
			editUrl = builtin.urlTemplate;
			editError = '';
		}
	}

	async function deleteCustom(id: string) {
		const provider = providers.find((item) => item.id === id);
		if (!provider || provider.isBuiltIn) return;
		if (!window.confirm(`Remove "${provider.name}" from your AI tools?`)) return;
		await commitProviders(providers.filter((item) => item.id !== id));
		if (editingId === id) {
			editingId = null;
		}
	}

	function startEdit(provider: AiProviderConfig) {
		editingId = provider.id;
		editName = provider.name;
		editUrl = provider.urlTemplate;
		editError = '';
		draftError = '';
	}

	function cancelEdit() {
		editingId = null;
		editError = '';
	}

	async function saveEdit() {
		if (!editingId) return;
		const name = editName.trim();
		if (!name) {
			editError = 'Name is required.';
			return;
		}
		const validation = validateProviderTemplate(editUrl);
		if (!validation.ok) {
			editError = validation.error;
			return;
		}

		const next = providers.map((provider) =>
			provider.id === editingId
				? {
						...provider,
						name,
						urlTemplate: editUrl.trim()
					}
				: provider
		);
		await commitProviders(next);
		editingId = null;
	}

	async function addCustomProvider() {
		const name = draftName.trim();
		if (!name) {
			draftError = 'Name is required.';
			return;
		}
		const validation = validateProviderTemplate(draftUrl);
		if (!validation.ok) {
			draftError = validation.error;
			return;
		}

		const provider: AiProviderConfig = {
			id: uuidv4(),
			name,
			urlTemplate: draftUrl.trim(),
			isBuiltIn: false,
			enabled: true,
			sortOrder: providers.length
		};

		await commitProviders([...providers, provider]);
		draftName = '';
		draftUrl = `https://example.com/chat?q=${PROMPT_PLACEHOLDER}`;
		draftError = '';
	}

	function testTemplate(template: string) {
		const validation = validateProviderTemplate(template);
		if (!validation.ok) {
			window.alert(validation.error);
			return;
		}
		const url = buildProviderUrl(template.trim(), SAMPLE_PROMPT);
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	async function restoreDefaults() {
		if (
			!window.confirm(
				'Reset AI tools to the default providers? Custom providers will be removed.'
			)
		) {
			return;
		}
		await commitProviders(DEFAULT_PROVIDERS.map((provider) => ({ ...provider })));
		editingId = null;
	}
</script>

<svelte:head>
	<title>Settings | Bearprompt</title>
</svelte:head>

<div class="settings-page">
	<div class="settings-container">
		<header class="settings-header">
			<h1 class="page-title">Settings</h1>
			<p class="page-description">
				Customize how Bearprompt looks and behaves. Your changes are saved locally.
			</p>
		</header>

		<section class="settings-section">
			<h2 class="section-title">Appearance</h2>
			<div class="section-card">
				<label class="section-label">Theme</label>
				<div class="theme-options">
					{#each themeOptions as option}
						<button
							type="button"
							onclick={() => setTheme(option.value)}
							class="theme-option"
							class:selected={$theme === option.value}
							aria-pressed={$theme === option.value}
						>
							<Icon name={option.icon} size={22} />
							<span>{option.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</section>

		<section id="ai-tools" class="settings-section">
			<div class="section-title-row">
				<h2 class="section-title">AI Tools</h2>
				{#if saveFeedback}
					<span class="save-feedback">{saveFeedback}</span>
				{/if}
			</div>
			<div class="section-card">
				<p class="section-help">
					Choose which tools appear in “Open in…”. Use
					<code>{PROMPT_PLACEHOLDER}</code>
					in the URL where the prompt should go. Desktop agents (Cursor, Claude Code, Codex)
					open locally when the app is installed — nothing is sent until you confirm in the app.
					Custom providers stay on this device.
					<a href="/blog/custom-ai-providers">Learn more</a>
				</p>

				<ul class="provider-list">
					{#each providers as provider, index (provider.id)}
						<li class="provider-row" class:disabled={!provider.enabled}>
							{#if editingId === provider.id}
								<div class="provider-edit">
									<label class="field-label" for={`edit-name-${provider.id}`}>Name</label>
									<input
										id={`edit-name-${provider.id}`}
										type="text"
										bind:value={editName}
										class="field-input"
									/>
									<label class="field-label" for={`edit-url-${provider.id}`}>URL template</label>
									<input
										id={`edit-url-${provider.id}`}
										type="text"
										bind:value={editUrl}
										class="field-input mono"
										spellcheck="false"
									/>
									{#if editError}
										<p class="field-error">{editError}</p>
									{/if}
									<div class="row-actions">
										<button type="button" class="btn btn-primary" onclick={saveEdit}>Save</button>
										<button type="button" class="btn" onclick={cancelEdit}>Cancel</button>
										<button
											type="button"
											class="btn"
											onclick={() => testTemplate(editUrl)}
										>
											Test
										</button>
									</div>
								</div>
							{:else}
								<div class="provider-main">
									<div class="provider-identity">
										<span class="provider-icon">
											<Icon name={getProviderIconName(provider)} size={18} />
										</span>
										<div>
											<div class="provider-name">
												{provider.name}
												{#if provider.isBuiltIn}
													<span class="badge">Built-in</span>
												{/if}
											</div>
											<div class="provider-url mono">{provider.urlTemplate}</div>
										</div>
									</div>
									<div class="row-actions">
										<button
											type="button"
											class="btn icon-btn"
											onclick={() => moveProvider(provider.id, -1)}
											disabled={index === 0}
											aria-label={`Move ${provider.name} up`}
										>
											<Icon name="chevron-up" size={16} />
										</button>
										<button
											type="button"
											class="btn icon-btn"
											onclick={() => moveProvider(provider.id, 1)}
											disabled={index === providers.length - 1}
											aria-label={`Move ${provider.name} down`}
										>
											<Icon name="chevron-down" size={16} />
										</button>
										<button
											type="button"
											class="btn"
											onclick={() => toggleEnabled(provider.id)}
											aria-pressed={provider.enabled}
										>
											{provider.enabled ? 'Hide' : 'Show'}
										</button>
										<button type="button" class="btn" onclick={() => startEdit(provider)}>
											Edit
										</button>
										{#if provider.isBuiltIn}
											<button
												type="button"
												class="btn"
												onclick={() => resetBuiltin(provider.id)}
											>
												Reset
											</button>
										{:else}
											<button
												type="button"
												class="btn danger"
												onclick={() => deleteCustom(provider.id)}
											>
												Delete
											</button>
										{/if}
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>

				<div class="add-provider">
					<h3 class="subsection-title">Add custom provider</h3>
					<label class="field-label" for="draft-name">Name</label>
					<input
						id="draft-name"
						type="text"
						bind:value={draftName}
						placeholder="My chat tool"
						class="field-input"
					/>
					<label class="field-label" for="draft-url">URL template</label>
					<input
						id="draft-url"
						type="text"
						bind:value={draftUrl}
						class="field-input mono"
						spellcheck="false"
					/>
					<p class="field-hint">
						Example:
						<code>https://chat.example.com/?q={PROMPT_PLACEHOLDER}</code>
					</p>
					{#if draftError}
						<p class="field-error">{draftError}</p>
					{/if}
					<div class="row-actions">
						<button type="button" class="btn btn-primary" onclick={addCustomProvider}>
							Add provider
						</button>
						<button type="button" class="btn" onclick={() => testTemplate(draftUrl)}>
							Test
						</button>
						<button type="button" class="btn" onclick={restoreDefaults}>
							Restore defaults
						</button>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.settings-page {
		height: 100%;
		overflow-y: auto;
		padding: 1.5rem;
		color: var(--color-text-primary);
	}

	.settings-container {
		max-width: 48rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
	}

	.page-description {
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scroll-margin-top: 1.5rem;
	}

	.section-title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.section-title-row .section-title {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.save-feedback {
		font-size: 0.8rem;
		color: var(--color-success, #16a34a);
	}

	.section-card {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text-secondary);
	}

	.section-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--color-text-primary);
	}

	.section-help {
		font-size: 0.9rem;
		line-height: 1.6;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
	}

	.section-help a {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.section-help code,
	.field-hint code,
	.mono {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
			monospace;
		font-size: 0.85em;
	}

	.theme-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.theme-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 0.75rem;
		background-color: var(--color-bg-primary);
		color: var(--color-text-secondary);
		transition: border-color 0.2s, background-color 0.2s, color 0.2s;
	}

	.theme-option.selected {
		border-color: var(--color-accent);
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.theme-option:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.theme-option:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.provider-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.provider-row {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 0.85rem;
		background-color: var(--color-bg-primary);
	}

	.provider-row.disabled {
		opacity: 0.65;
	}

	.provider-main,
	.provider-edit {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.provider-identity {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.provider-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text-primary);
		flex-shrink: 0;
	}

	.provider-name {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.provider-url {
		margin-top: 0.25rem;
		color: var(--color-text-muted);
		word-break: break-all;
		font-size: 0.8rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		padding: 0.1rem 0.45rem;
		font-size: 0.7rem;
		font-weight: 600;
		background-color: color-mix(in oklab, var(--color-accent) 16%, transparent);
		color: var(--color-accent);
	}

	.row-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.field-label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.35rem;
	}

	.field-input {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.6rem 0.75rem;
		background-color: var(--color-bg-primary);
		color: var(--color-text-primary);
		margin-bottom: 0.65rem;
	}

	.field-input::placeholder {
		color: var(--color-text-muted);
	}

	.field-input:focus {
		outline: 2px solid color-mix(in oklab, var(--color-accent) 40%, transparent);
		border-color: var(--color-accent);
		background-color: var(--color-bg-primary);
	}

	.field-hint {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: -0.25rem 0 0.75rem;
		line-height: 1.5;
	}

	.field-error {
		color: #dc2626;
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
	}

	.subsection-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.75rem;
	}

	.add-provider {
		border-top: 1px solid var(--color-border);
		padding-top: 1rem;
	}

	.btn {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.45rem 0.7rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.btn:hover:not(:disabled) {
		background-color: var(--color-bg-tertiary);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-accent-hover);
	}

	.btn.danger {
		color: #dc2626;
	}

	.icon-btn {
		padding: 0.45rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	button {
		cursor: pointer;
	}

	@media (max-width: 640px) {
		.settings-page {
			padding: 1.25rem;
		}

		.page-title {
			font-size: 1.5rem;
		}
	}
</style>
