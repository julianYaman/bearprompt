<script lang="ts">
	// Skeleton card for loading states
</script>

<article
	class="flex h-64 flex-col overflow-hidden rounded-xl border shadow-sm"
	style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
>
	<!-- Preview Section Skeleton -->
	<div class="skeleton-shimmer relative flex-1 p-4">
		<div class="space-y-2">
			<div class="skeleton-line h-3 w-full rounded"></div>
			<div class="skeleton-line h-3 w-11/12 rounded"></div>
			<div class="skeleton-line h-3 w-4/5 rounded"></div>
			<div class="skeleton-line h-3 w-9/12 rounded"></div>
			<div class="skeleton-line h-3 w-3/4 rounded"></div>
		</div>
	</div>

	<!-- Content Section Skeleton -->
	<div
		class="border-t p-4"
		style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
	>
		<!-- Title skeleton -->
		<div class="skeleton-line h-4 w-3/4 rounded"></div>

		<!-- Tags skeleton -->
		<div class="mt-2 flex gap-1">
			<div class="skeleton-line h-5 w-14 rounded-full"></div>
			<div class="skeleton-line h-5 w-16 rounded-full"></div>
			<div class="skeleton-line h-5 w-12 rounded-full"></div>
		</div>
	</div>
</article>

<style>
	.skeleton-line {
		background: linear-gradient(
			90deg,
			var(--color-bg-tertiary) 25%,
			var(--color-bg-secondary) 50%,
			var(--color-bg-tertiary) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
