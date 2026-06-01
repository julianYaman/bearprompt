<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getAllPrompts } from '$lib/db';
	import { serializeJsonLd } from '$lib/security';
	import type { BlogPost, BlogPostMeta } from '$lib/types/blog';

	interface PageData {
		post: BlogPost;
		relatedPosts: BlogPostMeta[];
	}

	let { data }: { data: PageData } = $props();
	let mobileMenuOpen = $state(false);
	let hasExistingLibrary = $state(false);

	const navbarCtaLabel = $derived(hasExistingLibrary ? 'Open your library' : 'Get Started');

	onMount(() => {
		getAllPrompts()
			.then((prompts) => {
				hasExistingLibrary = prompts.length > 0;
			})
			.catch((error) => {
				console.error('Failed to inspect local library state:', error);
			});
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const canonicalUrl = $derived(`https://bearprompt.com/blog/${data.post.slug}`);
	const imageUrl = $derived(
		data.post.coverImage
			? `https://bearprompt.com${data.post.coverImage}`
			: 'https://bearprompt.com/og-image.png'
	);
	const publishedIso = $derived(new Date(data.post.publishedAt).toISOString());
	const updatedIso = $derived(new Date(data.post.updatedAt || data.post.publishedAt).toISOString());
	const jsonLd = $derived(
		serializeJsonLd({
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: data.post.title,
			description: data.post.description,
			datePublished: publishedIso,
			dateModified: updatedIso,
			author: {
				'@type': 'Organization',
				name: 'Bearprompt'
			},
			publisher: {
				'@type': 'Organization',
				name: 'Bearprompt',
				url: 'https://bearprompt.com',
				logo: {
					'@type': 'ImageObject',
					url: 'https://bearprompt.com/bearprompt.png'
				}
			},
			mainEntityOfPage: canonicalUrl,
			image: imageUrl
		})
	);

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}
</script>

<svelte:head>
	<title>{data.post.title} | Bearprompt Blog</title>
	<meta name="description" content={data.post.description} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="article" />
	<meta property="article:published_time" content={publishedIso} />
	<meta property="article:modified_time" content={updatedIso} />
	{#each data.post.tags as tag}
		<meta property="article:tag" content={tag} />
	{/each}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={data.post.description} />
	<meta name="twitter:image" content={imageUrl} />
	<script type="application/ld+json">{jsonLd}</script>
</svelte:head>

<div class="neo-page">
	<nav class="neo-navbar">
		<div class="neo-navbar-container">
			<a href="/" class="neo-navbar-brand">
				<img src="/bearprompt.png" alt="Bearprompt logo" class="neo-navbar-logo" />
				<span class="neo-navbar-title">Bearprompt</span>
			</a>
			<div class="neo-navbar-links">
				<a href="/blog" class="neo-navbar-link">Blog</a>
				<a href="/#how-it-works" class="neo-navbar-link">How it works</a>
				<a href="/#faq" class="neo-navbar-link">FAQ</a>
				<a
					href="https://github.com/julianyaman/bearprompt"
					target="_blank"
					rel="noopener noreferrer"
					class="neo-navbar-link"
				>
					<Icon name="github" size={16} />
					GitHub
				</a>
				<a href="/library" class="neo-btn neo-btn-primary neo-navbar-cta" data-umami-event="Create Library Navbar">
					{navbarCtaLabel}
					<Icon name="arrow-right" size={16} />
				</a>
			</div>
			<button
				type="button"
				class="neo-hamburger"
				onclick={toggleMobileMenu}
				aria-label="Toggle menu"
				aria-expanded={mobileMenuOpen}
			>
				<Icon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
			</button>
		</div>
		{#if mobileMenuOpen}
			<div class="neo-mobile-menu">
				<a href="/blog" class="neo-mobile-link" onclick={closeMobileMenu}>Blog</a>
				<a href="/#how-it-works" class="neo-mobile-link" onclick={closeMobileMenu}>How it works</a>
				<a href="/#faq" class="neo-mobile-link" onclick={closeMobileMenu}>FAQ</a>
				<a
					href="https://github.com/julianyaman/bearprompt"
					target="_blank"
					rel="noopener noreferrer"
					class="neo-mobile-link"
				>
					<Icon name="github" size={16} />
					GitHub
				</a>
				<a href="/library" class="neo-btn neo-btn-primary neo-mobile-cta" data-umami-event="Create Library Navbar">
					{navbarCtaLabel}
					<Icon name="arrow-right" size={16} />
				</a>
			</div>
		{/if}
	</nav>

	<main>
		<section class="neo-hero">
			<div class="neo-hero-container">
				<div class="neo-hero-content">
					<span class="neo-sticker neo-sticker-primary hero-category">{data.post.category}</span>
					<h1 class="neo-hero-title">{data.post.title}</h1>
					<div class="hero-meta-details">
						<span>{formatDate(data.post.publishedAt)}</span>
						<span>{data.post.readingTimeMinutes} min read</span>
					</div>
					<p class="neo-hero-subtitle">{data.post.description}</p>
					<div class="blog-tags hero-tags" aria-label="Tags">
						{#each data.post.tags as tag}
							<span>{tag}</span>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<article class="post-section">
			<div class="neo-container post-container">
				<div class="post-content-frame">
					<article class="prose max-w-none">
						{@html data.post.html}
					</article>
				</div>
			</div>
		</article>

		{#if data.relatedPosts.length > 0}
			<section class="blog-section blog-section-alt" aria-labelledby="related-heading">
				<div class="neo-container">
					<h2 id="related-heading" class="neo-section-title">Related Posts</h2>
					<div class="blog-grid">
						{#each data.relatedPosts as post}
							<a href={`/blog/${post.slug}`} class="neo-card blog-card">
								<div class="blog-card-meta">
									<span class="neo-sticker neo-sticker-primary">{post.category}</span>
									<span>{post.readingTimeMinutes} min read</span>
								</div>
								<h3>{post.title}</h3>
								<p>{post.description}</p>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</main>

	<footer class="neo-footer">
		<div class="neo-container">
			<div class="neo-footer-brand">
				<img src="/bearprompt.png" alt="Bearprompt logo" class="neo-footer-logo" />
				<span class="neo-footer-title">Bearprompt</span>
			</div>
			<p class="neo-footer-tagline">Your private prompt library for AI</p>
			<div class="neo-featured-list neo-footer-links">
				<div class="neo-footer-links-row">
					<a
						href="https://findly.tools/bearprompt?utm_source=bearprompt"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src="https://findly.tools/badges/findly-tools-badge-light.svg"
							alt="Featured on Findly.tools"
							width="160"
							height="54"
						/>
					</a>
					<a
						href="https://neeed.directory/products/bearprompt?utm_source=bearprompt"
						target="_blank"
						rel="noopener"
					>
						<img
							src="https://neeed.directory/badges/neeed-badge-light.svg"
							alt="Featured on neeed.directory"
							width="160"
							height="54"
						/>
					</a>
					<a href="https://wired.business" target="_blank">
						<img
							src="https://wired.business/badge0-white.svg"
							alt="Featured on Wired Business"
							width="180"
							height="54"
						/>
					</a>
				</div>
			</div>
			<div class="neo-footer-links">
				<div class="neo-footer-links-row">
					<a href="https://status.yaman.pro" target="_blank" rel="noopener noreferrer">Status</a>
					<a
						href="https://github.com/julianyaman/bearprompt"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icon name="github" size={16} />
						GitHub
					</a>
					<a href="https://x.com/bearprompt" target="_blank" rel="noopener noreferrer">
						<Icon name="x-logo" size={16} />
						X
					</a>
					<a href="https://buymeacoffee.com/julianyaman" target="_blank" rel="noopener noreferrer">
						<Icon name="heart" size={16} />
						Donate
					</a>
				</div>
				<div class="neo-footer-links-row neo-footer-links-legal">
					<a href="/about/privacy">Privacy Policy</a>
					<a href="/about/terms">Terms of Service</a>
					<a href="/about/legal">Legal Notice</a>
					<a href="/about/contact">Contact</a>
				</div>
			</div>
			<p class="neo-footer-credit">
				Made with <Icon name="heart" size={14} class="neo-heart-icon" /> by
				<a
					href="https://yaman.pro"
					target="_blank"
					rel="noopener noreferrer"
					class="neo-footer-author">Julian Yaman</a
				>
			</p>
			<p class="neo-footer-attribution">
				<a href="https://logo.dev" target="_blank" rel="noopener noreferrer">
					Logos provided by Logo.dev
				</a>
			</p>
		</div>
	</footer>
</div>

<style>
	@import '../blog-shared.css';

	.post-section {
		padding: 5rem 0;
		background-color: var(--neo-bg);
	}

	.post-container {
		max-width: 56rem;
	}

	.post-content-frame {
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 6px 6px 0 var(--neo-shadow);
		background: var(--neo-bg);
		padding: 2rem;
	}

	.post-content-frame :global(.prose) {
		--tw-prose-body: var(--neo-text);
		--tw-prose-headings: var(--neo-text);
		--tw-prose-lead: var(--neo-text);
		--tw-prose-links: var(--neo-text);
		--tw-prose-bold: var(--neo-text);
		--tw-prose-counters: var(--neo-text);
		--tw-prose-bullets: var(--neo-text);
		--tw-prose-quotes: var(--neo-text);
		--tw-prose-code: var(--neo-text);
		font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 1.05rem;
		line-height: 1.8;
	}

	.post-content-frame :global(.prose h2),
	.post-content-frame :global(.prose h3) {
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.hero-tags {
		justify-content: center;
	}

	.hero-category {
		display: inline-block;
		margin-bottom: 1.25rem;
	}

	.hero-meta-details {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
		margin-bottom: 1.5rem;
		color: var(--neo-text-muted);
		font-size: 0.875rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.hero-meta-details span + span::before {
		content: '·';
		margin-right: 0.75rem;
		color: var(--neo-text-muted);
	}

	@media (max-width: 767px) {
		.post-content-frame {
			padding: 1.25rem;
		}
	}
</style>
