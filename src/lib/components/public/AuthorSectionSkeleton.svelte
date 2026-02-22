<script lang="ts">
	import PromptCardSkeleton from './PromptCardSkeleton.svelte';
</script>

<section class="mb-8">
	<!-- Author header skeleton -->
	<div class="mb-4 flex items-center gap-3">
		<!-- Avatar skeleton -->
		<div
			class="skeleton-line h-12 w-12 shrink-0 rounded-full"
		></div>

		<div class="flex-1">
			<!-- Name skeleton -->
			<div class="skeleton-line mb-2 h-5 w-40 rounded"></div>
			<!-- Description skeleton -->
			<div class="skeleton-line h-3 w-64 rounded"></div>
		</div>
	</div>

	<!-- Prompts row skeleton -->
	<div class="flex gap-4 overflow-x-auto pb-2">
		{#each Array(6) as _}
			<div class="w-64 shrink-0">
				<PromptCardSkeleton />
			</div>
		{/each}
	</div>
</section>

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
