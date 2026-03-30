<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { buildFeatureBorder, buildFeatureGradient, hexToRgba } from '$lib/utils';
	import type { PublicCategory } from '$lib/types/public';

	interface Props {
		categories: PublicCategory[];
	}

	let { categories }: Props = $props();

	function getCategoryHref(category: PublicCategory): string {
		return category.externalUrl || `/prompts/category/${category.slug}`;
	}

	function isExternalLink(category: PublicCategory): boolean {
		return Boolean(category.externalUrl && /^https?:\/\//.test(category.externalUrl));
	}

	function getHoverShadow(category: PublicCategory): string {
		return `0 16px 28px ${hexToRgba(category.color, 0.18)}`;
	}

	function getCategoryIcon(category: PublicCategory): NonNullable<PublicCategory['icon_key']> | 'sparkles' {
		return category.icon_key ?? 'sparkles';
	}
</script>

{#if categories.length > 0}
	<section class="mb-10">
		<div class="mb-4 flex items-end justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.18em]" style="color: var(--color-text-muted);">
					Featured Prompts
				</p>
				<h2 class="text-2xl font-semibold" style="color: var(--color-text-primary);">
					Browse by category
				</h2>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each categories as category (category.slug)}
				<a
					href={getCategoryHref(category)}
					class="category-card group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200"
					style={`border-color: ${buildFeatureBorder(category.color)}; background: ${buildFeatureGradient(category.color, 0.2)}; --category-hover-shadow: ${getHoverShadow(category)};`}
					target={isExternalLink(category) ? '_blank' : undefined}
					rel={isExternalLink(category) ? 'noopener noreferrer' : undefined}
				>
					<div class="relative z-10 flex h-full flex-col justify-between gap-6">
						<div>
							<div class="mb-2 flex items-center justify-between gap-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
										style={`background-color: ${hexToRgba(category.color, 0.14)}; color: ${category.color};`}
									>
										{#if category.image_url}
											<img
												src={category.image_url}
												alt={`${category.name} logo`}
												class="h-full w-full object-cover"
											/>
										{:else}
											<Icon name={getCategoryIcon(category)} size={18} />
										{/if}
									</div>
									<h3 class="text-xl font-semibold" style={`color: ${category.color};`}>
										{category.name}
									</h3>
								</div>
								<Icon name={isExternalLink(category) ? 'external-link' : 'arrow-right'} size={18} />
							</div>
							<p class="max-w-sm text-sm leading-6" style="color: var(--color-text-secondary);">
								{category.description}
							</p>
						</div>

						<div class="text-sm">
							{#if category.tags.length > 0}
								<div class="mb-1 truncate" style="color: var(--color-text-muted);">
									{category.tags.slice(0, 3).map((tag) => tag.name).join(' · ')}
								</div>
							{/if}
							<span style="color: var(--color-text-primary);">
								{category.externalUrl ? 'Explore prompts' : `${category.promptCount} prompt${category.promptCount === 1 ? '' : 's'}`}
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	.category-card {
		min-height: 12.5rem;
		background-color: var(--color-bg-secondary);
	}

	.category-card::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0));
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.category-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--category-hover-shadow);
	}

	.category-card:hover::after {
		opacity: 1;
	}
</style>
