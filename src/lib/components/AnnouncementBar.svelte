<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';
	import {
		announcementAppliesToPath,
		isAnnouncementActive,
		isHttpAnnouncementHref,
		readSeenAnnouncementId,
		writeSeenAnnouncementId,
		type Announcement
	} from '$lib/announcement';

	let browser = $state(false);
	let loaded = $state(false);
	let announcement = $state<Announcement | null>(null);
	let reduceMotion = $state(false);

	const pathname = $derived($page.url.pathname);
	const visible = $derived(
		browser &&
			announcement !== null &&
			announcementAppliesToPath(pathname) &&
			isAnnouncementActive(announcement)
	);

	onMount(() => {
		browser = true;
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = motionQuery.matches;
		const onMotionChange = () => {
			reduceMotion = motionQuery.matches;
		};
		motionQuery.addEventListener('change', onMotionChange);
		return () => motionQuery.removeEventListener('change', onMotionChange);
	});

	$effect(() => {
		if (!browser) return;
		if (!announcementAppliesToPath(pathname)) return;
		if (loaded) return;
		loaded = true;
		void loadAnnouncement();
	});

	async function loadAnnouncement() {
		try {
			const response = await fetch('/api/announcement');
			if (!response.ok) return;
			const body = (await response.json()) as { announcement?: Announcement | null };
			const next = body.announcement ?? null;
			if (!next?.id || !isAnnouncementActive(next)) return;
			if (readSeenAnnouncementId(localStorage) === next.id) return;
			announcement = next;
		} catch {
			announcement = null;
		}
	}

	function dismiss() {
		if (announcement) {
			writeSeenAnnouncementId(localStorage, announcement.id);
		}
		announcement = null;
	}
</script>

{#if visible && announcement}
	<div
		class="announcement-bar flex items-center gap-3 px-4 py-2"
		transition:slide={{ duration: reduceMotion ? 0 : 320, axis: 'y' }}
		role="status"
	>
		<p class="announcement-copy min-w-0 flex-1 text-center text-sm font-medium">
			{announcement.message}
		</p>
		{#if announcement.href}
			<a
				href={announcement.href}
				class="announcement-cta shrink-0"
				target={isHttpAnnouncementHref(announcement.href) ? '_blank' : undefined}
				rel={isHttpAnnouncementHref(announcement.href) ? 'noopener noreferrer' : undefined}
			>
				{announcement.cta_label || 'Browse'}
			</a>
		{/if}
		<button
			type="button"
			class="announcement-dismiss flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
			onclick={dismiss}
			aria-label="Dismiss announcement"
		>
			<Icon name="x" size={16} />
		</button>
	</div>
{/if}

<style>
	.announcement-bar {
		background-color: #ffc530;
		color: #1a1a1a;
		font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
			sans-serif;
	}

	.announcement-copy {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.announcement-cta {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.8rem;
		border-radius: 0.5rem;
		background-color: #1a1a1a;
		color: #ffc530;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		line-height: 1.2;
		text-decoration: none;
		text-transform: uppercase;
	}

	.announcement-cta:hover {
		background-color: #271105;
	}

	.announcement-dismiss {
		color: inherit;
	}

	.announcement-dismiss:hover {
		background-color: color-mix(in srgb, currentColor 12%, transparent);
	}

	.announcement-dismiss:focus-visible,
	.announcement-cta:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.announcement-bar {
			transition: none;
		}
	}
</style>
