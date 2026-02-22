<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		baseUrl?: string;
	}

	let { currentPage, totalPages, baseUrl = '' }: Props = $props();

	// Generate page numbers to display
	let pageNumbers = $derived.by(() => {
		const pages: (number | 'ellipsis')[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage > 3) {
				pages.push('ellipsis');
			}

			// Show pages around current
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - 2) {
				pages.push('ellipsis');
			}

			// Always show last page
			pages.push(totalPages);
		}

		return pages;
	});

	function getPageUrl(page: number): string {
		if (!baseUrl) return `?page=${page}`;
		const separator = baseUrl.includes('?') ? '&' : '?';
		return `${baseUrl}${separator}page=${page}`;
	}
</script>

{#if totalPages > 1}
	<nav class="flex items-center justify-center gap-1" aria-label="Pagination">
		<!-- Previous button -->
		{#if currentPage > 1}
			<a
				href={getPageUrl(currentPage - 1)}
				class="flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors"
				style="color: var(--color-text-secondary); background-color: var(--color-bg-secondary);"
				aria-label="Go to previous page"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
				Prev
			</a>
		{:else}
			<span
				class="flex h-9 cursor-not-allowed items-center gap-1 rounded-lg px-3 text-sm font-medium opacity-50"
				style="color: var(--color-text-muted); background-color: var(--color-bg-secondary);"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
				Prev
			</span>
		{/if}

		<!-- Page numbers -->
		<div class="flex items-center gap-1">
			{#each pageNumbers as pageNum, index}
				{#if pageNum === 'ellipsis'}
					<span
						class="flex h-9 w-9 items-center justify-center text-sm"
						style="color: var(--color-text-muted);"
					>
						...
					</span>
				{:else if pageNum === currentPage}
					<span
						class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold"
						style="background-color: var(--color-accent); color: white;"
						aria-current="page"
					>
						{pageNum}
					</span>
				{:else}
					<a
						href={getPageUrl(pageNum)}
						class="pagination-link flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors"
						style="color: var(--color-text-secondary); background-color: var(--color-bg-secondary);"
						aria-label="Go to page {pageNum}"
					>
						{pageNum}
					</a>
				{/if}
			{/each}
		</div>

		<!-- Next button -->
		{#if currentPage < totalPages}
			<a
				href={getPageUrl(currentPage + 1)}
				class="flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors"
				style="color: var(--color-text-secondary); background-color: var(--color-bg-secondary);"
				aria-label="Go to next page"
			>
				Next
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</a>
		{:else}
			<span
				class="flex h-9 cursor-not-allowed items-center gap-1 rounded-lg px-3 text-sm font-medium opacity-50"
				style="color: var(--color-text-muted); background-color: var(--color-bg-secondary);"
			>
				Next
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</span>
		{/if}
	</nav>
{/if}

<style>
	.pagination-link:hover {
		background-color: var(--color-bg-tertiary) !important;
	}
</style>
