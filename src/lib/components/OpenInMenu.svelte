<script lang="ts">
	import Icon from './Icon.svelte';
	import {
		getProviderIconName,
		isUrlTooLong,
		resolveProviderOpenUrl
	} from '$lib/ai-providers';
	import { enabledAiProviders } from '$lib/stores';
	import type { AiProviderConfig } from '$lib/types';

	interface Props {
		promptText: string;
		variant?: 'buttons' | 'dropdown' | 'modal-footer';
		primaryCount?: number;
		opened?: boolean;
		onOpened?: () => void;
	}

	let {
		promptText,
		variant = 'dropdown',
		primaryCount = 2,
		opened = false,
		onOpened
	}: Props = $props();

	let openMenu = $state(false);
	let menuContainer: HTMLDivElement | undefined = $state();

	const providers = $derived($enabledAiProviders);
	const primaryProviders = $derived(
		variant === 'buttons' ? providers.slice(0, primaryCount) : []
	);
	const overflowProviders = $derived(
		variant === 'buttons' ? providers.slice(primaryCount) : providers
	);

	function openProvider(provider: AiProviderConfig) {
		const url = resolveProviderOpenUrl(provider.urlTemplate, promptText);
		if (!url) return;
		if (isUrlTooLong(url)) {
			const proceed = window.confirm(
				`This prompt may be too long for ${provider.name}. Open anyway?`
			);
			if (!proceed) return;
		}

		openMenu = false;
		onOpened?.();
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function handleWindowClick(event: MouseEvent) {
		if (!openMenu || !menuContainer) return;
		if (event.target instanceof Node && !menuContainer.contains(event.target)) {
			openMenu = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

{#if providers.length > 0}
	{#if variant === 'buttons'}
		<div class="flex flex-wrap gap-3">
			{#each primaryProviders as provider (provider.id)}
				<button
					type="button"
					onclick={() => openProvider(provider)}
					class="use-btn flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
					style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
				>
					<Icon name={getProviderIconName(provider)} size={18} />
					{provider.name}
					<Icon name="external-link" size={14} class="opacity-50" />
				</button>
			{/each}

			{#if overflowProviders.length > 0}
				<div class="relative" bind:this={menuContainer}>
					<button
						type="button"
						onclick={() => (openMenu = !openMenu)}
						class="use-btn flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
						style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
						aria-expanded={openMenu}
						aria-haspopup="menu"
					>
						<Icon name="sparkles" size={18} />
						More
						<Icon name="chevron-down" size={14} />
					</button>

					{#if openMenu}
						<div
							class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border shadow-lg"
							style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
							role="menu"
						>
							{#each overflowProviders as provider (provider.id)}
								<button
									type="button"
									onclick={() => openProvider(provider)}
									class="dropdown-item flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
									style="color: var(--color-text-primary);"
									role="menuitem"
								>
									<Icon name={getProviderIconName(provider)} size={18} />
									{provider.name}
									<Icon name="external-link" size={12} class="ml-auto opacity-50" />
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="relative" bind:this={menuContainer}>
			<button
				type="button"
				onclick={() => (openMenu = !openMenu)}
				class="modal-button modal-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
				style="background-color: {opened ? 'var(--color-success)' : 'var(--color-bg-secondary)'}; border-color: var(--color-border); color: {opened ? 'white' : 'var(--color-text-primary)'};"
				aria-expanded={openMenu}
				aria-haspopup="menu"
			>
				<Icon name={opened ? 'check' : 'external-link'} size={16} />
				{opened ? 'Opened' : 'Open in...'}
				{#if !opened}
					<Icon name="chevron-down" size={14} />
				{/if}
			</button>

			{#if openMenu}
				<div
					class="absolute bottom-full left-0 z-10 mb-2 max-h-64 w-48 overflow-y-auto rounded-lg border shadow-lg"
					style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
					role="menu"
				>
					{#each overflowProviders as provider (provider.id)}
						<button
							type="button"
							onclick={() => openProvider(provider)}
							class="dropdown-item flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
							style="color: var(--color-text-primary);"
							role="menuitem"
						>
							<Icon name={getProviderIconName(provider)} size={18} />
							{provider.name}
							<Icon name="external-link" size={12} class="ml-auto opacity-50" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.use-btn:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	:global(.dark) .use-btn:hover {
		color: var(--color-accent) !important;
	}

	.dropdown-item:hover {
		background-color: var(--color-bg-tertiary);
	}

	.modal-button-secondary:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	button {
		cursor: pointer;
	}
</style>
