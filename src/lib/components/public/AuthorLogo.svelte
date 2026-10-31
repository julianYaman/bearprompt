<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		name: string;
		src: string | null | undefined;
		iconSize?: number;
		class?: string;
	}

	let { name, src, iconSize = 16, class: className = '' }: Props = $props();
</script>

{#if src}
	<img
		src={src}
		alt={`${name} logo`}
		referrerpolicy="origin"
		class="h-full w-full object-cover {className}"
	/>
{:else}
	<Icon name="globe" size={iconSize} class="opacity-50 {className}" />
{/if}
