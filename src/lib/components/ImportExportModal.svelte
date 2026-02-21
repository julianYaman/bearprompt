<script lang="ts">
	import Icon from './Icon.svelte';
	import { importExportOpen, prompts, tags } from '$lib/stores';
	import {
		exportLibrary,
		importLibrary,
		validateImportData,
		getAllPrompts,
		getAllTags,
		type ImportResult
	} from '$lib/db';

	let activeTab: 'export' | 'import' = $state('export');
	let isExporting = $state(false);
	let isImporting = $state(false);
	let importResult = $state<ImportResult | null>(null);
	let importError = $state('');
	let fileInput: HTMLInputElement;

	function handleClose() {
		importExportOpen.set(false);
		// Reset state
		importResult = null;
		importError = '';
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	async function handleExport() {
		isExporting = true;
		try {
			const data = await exportLibrary();
			const json = JSON.stringify(data, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			// Generate filename with date
			const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
			const filename = `promptlib-export-v1-${date}.json`;

			// Trigger download
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
			alert('Failed to export library. Please try again.');
		} finally {
			isExporting = false;
		}
	}

	function handleFileSelect() {
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importError = '';
		importResult = null;
		isImporting = true;

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			if (!validateImportData(data)) {
				importError = 'Invalid file format. Please select a valid Prompt Library export file (v1).';
				return;
			}

			const result = await importLibrary(data);
			importResult = result;

			// Refresh stores with new data
			const [newPrompts, newTags] = await Promise.all([getAllPrompts(), getAllTags()]);
			prompts.set(newPrompts);
			tags.set(newTags);
		} catch (error) {
			console.error('Import failed:', error);
			if (error instanceof SyntaxError) {
				importError = 'Invalid JSON file. Please select a valid export file.';
			} else {
				importError = 'Failed to import library. Please try again.';
			}
		} finally {
			isImporting = false;
			// Reset file input
			if (input) input.value = '';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $importExportOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="import-export-title"
	>
		<!-- Modal -->
		<div
			class="w-full max-w-md rounded-xl shadow-xl"
			style="background-color: var(--color-bg-primary);"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b p-4"
				style="border-color: var(--color-border);"
			>
				<h2 id="import-export-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
					Import / Export
				</h2>
				<button
					type="button"
					onclick={handleClose}
					class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Close"
				>
					<Icon name="x" size={20} />
				</button>
			</div>

			<!-- Tabs -->
			<div class="flex border-b" style="border-color: var(--color-border);">
				<button
					type="button"
					onclick={() => (activeTab = 'export')}
					class="flex-1 border-b-2 py-3 text-sm font-medium transition-colors"
					class:active={activeTab === 'export'}
					style="border-color: {activeTab === 'export'
						? 'var(--color-accent)'
						: 'transparent'}; color: {activeTab === 'export'
						? 'var(--color-accent)'
						: 'var(--color-text-secondary)'};"
					aria-selected={activeTab === 'export'}
					role="tab"
				>
					Export
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'import')}
					class="flex-1 border-b-2 py-3 text-sm font-medium transition-colors"
					class:active={activeTab === 'import'}
					style="border-color: {activeTab === 'import'
						? 'var(--color-accent)'
						: 'transparent'}; color: {activeTab === 'import'
						? 'var(--color-accent)'
						: 'var(--color-text-secondary)'};"
					aria-selected={activeTab === 'import'}
					role="tab"
				>
					Import
				</button>
			</div>

			<!-- Content -->
			<div class="p-4">
				{#if activeTab === 'export'}
					<div class="space-y-4">
						<p class="text-sm" style="color: var(--color-text-secondary);">
							Export your entire library (prompts and tags) as a JSON file. You can use this file
							to backup your data or transfer it to another device.
						</p>

						<div
							class="rounded-lg p-4"
							style="background-color: var(--color-bg-secondary);"
						>
							<div class="flex items-center justify-between text-sm">
								<span style="color: var(--color-text-muted);">Prompts:</span>
								<span style="color: var(--color-text-primary);">{$prompts.length}</span>
							</div>
							<div class="mt-2 flex items-center justify-between text-sm">
								<span style="color: var(--color-text-muted);">Tags:</span>
								<span style="color: var(--color-text-primary);">{$tags.length}</span>
							</div>
						</div>

						<button
							type="button"
							onclick={handleExport}
							disabled={isExporting}
							class="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
							style="background-color: var(--color-accent);"
						>
							<Icon name="download" size={18} />
							{isExporting ? 'Exporting...' : 'Export Library'}
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						<p class="text-sm" style="color: var(--color-text-secondary);">
							Import prompts and tags from a previously exported JSON file. New items will be
							added to your existing library.
						</p>

						<input
							bind:this={fileInput}
							type="file"
							accept=".json"
							onchange={handleFileChange}
							class="hidden"
						/>

						<button
							type="button"
							onclick={handleFileSelect}
							disabled={isImporting}
							class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-sm transition-colors disabled:opacity-50"
							style="border-color: var(--color-border); color: var(--color-text-secondary);"
						>
							<Icon name="upload" size={24} />
							<span>{isImporting ? 'Importing...' : 'Select JSON File'}</span>
						</button>

						{#if importError}
							<div
								class="rounded-lg p-3 text-sm"
								style="background-color: rgba(239, 68, 68, 0.1); color: var(--color-danger);"
							>
								{importError}
							</div>
						{/if}

						{#if importResult}
							<div
								class="rounded-lg p-4"
								style="background-color: rgba(16, 185, 129, 0.1);"
							>
								<div class="mb-2 flex items-center gap-2" style="color: var(--color-success);">
									<Icon name="check" size={18} />
									<span class="font-medium">Import Complete!</span>
								</div>
								<div class="space-y-1 text-sm" style="color: var(--color-text-secondary);">
									<p>Prompts imported: {importResult.promptsImported}</p>
									<p>Tags imported: {importResult.tagsImported}</p>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t p-4" style="border-color: var(--color-border);">
				<button
					type="button"
					onclick={handleClose}
					class="w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
					style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
