<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getAllPrompts } from '$lib/db';
	import type { BlogPostMeta } from '$lib/types/blog';

	interface PageData {
		posts: BlogPostMeta[];
		featuredPosts: BlogPostMeta[];
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

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}
</script>

<svelte:head>
	<title>Blog | Bearprompt</title>
	<meta
		name="description"
		content="Guides for AI, prompt management, and Bearprompt product updates."
	/>
	<link rel="canonical" href="https://bearprompt.com/blog" />
	<meta property="og:title" content="Blog | Bearprompt" />
	<meta
		property="og:description"
		content="Guides for AI, prompt management, and Bearprompt product updates."
	/>
	<meta property="og:image" content="https://bearprompt.com/og-image.png" />
	<meta property="og:url" content="https://bearprompt.com/blog" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Blog | Bearprompt" />
	<meta
		name="twitter:description"
		content="Guides for AI, prompt management, and Bearprompt product updates."
	/>
	<meta name="twitter:image" content="https://bearprompt.com/og-image.png" />
</svelte:head>

<div class="neo-page">
	<nav class="neo-navbar">
		<div class="neo-navbar-container">
			<a href="/" class="neo-navbar-brand">
				<img src="/bearprompt.png" alt="Bearprompt logo" class="neo-navbar-logo" />
				<span class="neo-navbar-title">Bearprompt</span>
			</a>
			<div class="neo-navbar-links">
				<a href="/blog" class="neo-navbar-link" aria-current="page">Blog</a>
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
				<a href="/library" class="neo-btn neo-btn-primary neo-navbar-cta" data-vmtrc="Create Library Navbar">
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
				<a href="/blog" class="neo-mobile-link" aria-current="page" onclick={closeMobileMenu}>Blog</a>
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
				<a href="/library" class="neo-btn neo-btn-primary neo-mobile-cta" data-vmtrc="Create Library Navbar">
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
					<h1 class="neo-hero-title">Blog</h1>
					<p class="neo-hero-subtitle">
						Guides for AI, prompt management, and product updates from Bearprompt.
					</p>
				</div>
			</div>
		</section>

		{#if data.featuredPosts.length > 0}
			<section class="blog-section" aria-labelledby="featured-heading">
				<div class="neo-container">
					<h2 id="featured-heading" class="neo-section-title">Featured</h2>
					<div class="blog-grid">
						{#each data.featuredPosts as post}
							<a href={`/blog/${post.slug}`} class="neo-card blog-card">
								<div class="blog-card-meta">
									<span class="neo-sticker neo-sticker-primary">{post.category}</span>
									<span>{formatDate(post.publishedAt)}</span>
									<span>{post.readingTimeMinutes} min read</span>
								</div>
								<h3>{post.title}</h3>
								<p>{post.description}</p>
								<div class="blog-tags" aria-label="Tags">
									{#each post.tags as tag}
										<span>{tag}</span>
									{/each}
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<section class="blog-section blog-section-alt" aria-labelledby="latest-heading">
			<div class="neo-container">
				<div class="blog-section-heading">
					<h2 id="latest-heading" class="neo-section-title">Latest Posts</h2>
					<a href="/rss.xml" class="neo-btn neo-btn-secondary neo-btn-md">
						<Icon name="rss" size={16} />
						RSS
					</a>
				</div>

				{#if data.posts.length > 0}
					<div class="blog-list">
						{#each data.posts as post}
							<a href={`/blog/${post.slug}`} class="neo-card blog-card blog-row">
								<div>
									<div class="blog-card-meta">
										<span class="neo-sticker neo-sticker-primary">{post.category}</span>
										<span>{formatDate(post.publishedAt)}</span>
										<span>{post.readingTimeMinutes} min read</span>
										{#if post.draft}
											<span>Draft</span>
										{/if}
									</div>
									<h3>{post.title}</h3>
									<p>{post.description}</p>
									<div class="blog-tags" aria-label="Tags">
										{#each post.tags as tag}
											<span>{tag}</span>
										{/each}
									</div>
								</div>
								<Icon name="arrow-right" size={24} />
							</a>
						{/each}
					</div>
				{:else}
					<div class="neo-card blog-card empty-state">
						<h3>No posts yet</h3>
						<p>Guides and notes will appear here once they are published.</p>
					</div>
				{/if}
			</div>
		</section>
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
	/* Same neobrutalist system used by the landing page. */
	.neo-page {
		--neo-bg: #ffffff;
		--neo-bg-alt: #fef3e2;
		--neo-bg-dark: #1a1a1a;
		--neo-accent: #f5a623;
		--neo-accent-hover: #e8922e;
		--neo-accent-secondary: #00d4ff;
		--neo-accent-secondary-hover: #00b8e6;
		--neo-text: #1a1a1a;
		--neo-text-muted: #4a4a4a;
		--neo-border: #000000;
		--neo-shadow: #000000;
		--neo-border-width: 3px;
		--neo-shadow-offset: 4px;
		--neo-radius: 0;

		background-color: var(--neo-bg);
		color: var(--neo-text);
		font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		scroll-behavior: smooth;
	}

	.neo-page h1,
	.neo-page h2,
	.neo-page h3 {
		font-family: 'Bricolage Grotesque', system-ui, sans-serif;
	}

	.neo-container {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.neo-section-title {
		font-size: 2rem;
		font-weight: 800;
		text-align: center;
		margin-bottom: 3rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.neo-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-weight: 700;
		text-decoration: none;
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: var(--neo-shadow-offset) var(--neo-shadow-offset) 0 var(--neo-shadow);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.875rem;
	}

	.neo-btn:hover {
		transform: translate(2px, 2px) scale(1.02);
		box-shadow: 2px 2px 0 var(--neo-shadow);
	}

	.neo-btn:active {
		transform: translate(4px, 4px) scale(0.98);
		box-shadow: none;
	}

	.neo-btn:focus-visible {
		outline: 3px solid var(--neo-accent-secondary);
		outline-offset: 2px;
	}

	.neo-btn-primary {
		background-color: var(--neo-accent);
		color: var(--neo-text);
	}

	.neo-btn-primary:hover {
		background-color: var(--neo-accent-hover);
	}

	.neo-btn-secondary {
		background-color: #fffdf8;
		color: var(--neo-text);
	}

	.neo-btn-secondary:hover {
		background-color: #ffffff;
	}

	.neo-btn-md,
	.neo-navbar-cta {
		padding: 0.5rem 1rem;
	}

	.neo-sticker {
		display: inline-block;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 3px 3px 0 var(--neo-shadow);
		white-space: nowrap;
	}

	.neo-sticker-primary {
		background-color: var(--neo-accent);
		color: var(--neo-text);
	}

	.neo-card {
		background-color: var(--neo-bg);
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 6px 6px 0 var(--neo-shadow);
		padding: 1.5rem;
		text-align: center;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.neo-card:hover {
		transform: translate(-2px, -2px);
		box-shadow: 8px 8px 0 var(--neo-shadow);
	}

	.neo-card:focus-within {
		outline: 3px solid var(--neo-accent-secondary);
		outline-offset: 2px;
	}

	.neo-navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: var(--neo-bg);
		border-bottom: var(--neo-border-width) solid var(--neo-border);
	}

	.neo-navbar-container {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.neo-navbar-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--neo-text);
	}

	.neo-navbar-logo {
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid var(--neo-border);
	}

	.neo-navbar-title {
		font-size: 1.25rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.neo-navbar-links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.neo-navbar-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--neo-text);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
		transition: border-color 0.15s ease;
	}

	.neo-navbar-link:hover {
		border-bottom-color: var(--neo-border);
	}

	.neo-navbar-link:focus-visible {
		outline: 2px solid var(--neo-accent-secondary);
		outline-offset: 2px;
	}

	.neo-hamburger {
		display: none;
		padding: 0.5rem;
		background: var(--neo-bg);
		border: var(--neo-border-width) solid var(--neo-border);
		cursor: pointer;
		color: var(--neo-text);
		transition: background-color 0.15s ease;
	}

	.neo-hamburger:hover {
		background-color: var(--neo-bg-alt);
	}

	.neo-mobile-menu {
		display: none;
		flex-direction: column;
		padding: 1rem 1.5rem 1.5rem;
		border-top: var(--neo-border-width) solid var(--neo-border);
		background-color: var(--neo-bg);
	}

	.neo-mobile-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--neo-text);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid var(--neo-border);
	}

	.neo-mobile-cta {
		margin-top: 1rem;
		justify-content: center;
	}

	.neo-hero {
		padding: 4rem 1.5rem 3rem;
		background-color: var(--neo-bg-alt);
		border-bottom: var(--neo-border-width) solid var(--neo-border);
	}

	.neo-hero-container {
		max-width: 90rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
	}

	.neo-hero-content {
		text-align: center;
		max-width: 56rem;
	}

	.neo-hero-title {
		font-size: 2.5rem;
		font-weight: 900;
		line-height: 1.1;
		margin-bottom: 1.25rem;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	.neo-hero-subtitle {
		font-size: 1.125rem;
		color: var(--neo-text-muted);
		margin-bottom: 2rem;
		line-height: 1.6;
		text-transform: none;
	}

	.blog-section {
		padding: 5rem 0;
		background-color: var(--neo-bg);
	}

	.blog-section-alt {
		background-color: var(--neo-bg-alt);
		border-top: var(--neo-border-width) solid var(--neo-border);
	}

	.blog-section-heading {
		position: relative;
	}

	.blog-section-heading .neo-btn {
		position: absolute;
		right: 0;
		top: -0.5rem;
	}

	.blog-grid,
	.blog-list {
		display: grid;
		gap: 1.5rem;
	}

	.blog-grid {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
	}

	.blog-card {
		color: var(--neo-text);
		text-align: left;
		text-decoration: none;
	}

	.blog-card h3 {
		margin: 1rem 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.15;
		text-transform: uppercase;
	}

	.blog-card p {
		margin: 0;
		color: var(--neo-text-muted);
		line-height: 1.6;
	}

	.blog-card-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		color: var(--neo-text-muted);
		font-size: 0.875rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.blog-card-meta .neo-sticker,
	.blog-tags span {
		font-size: 0.75rem;
		padding: 0.25rem 0.625rem;
	}

	.blog-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.blog-tags span {
		border: 2px solid var(--neo-border);
		background: #fffdf8;
		color: var(--neo-text);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.blog-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.blog-row :global(svg) {
		flex: 0 0 auto;
	}

	.empty-state {
		text-align: center;
	}

	.neo-footer {
		padding: 3rem 0;
		background-color: var(--neo-bg);
		border-top: var(--neo-border-width) solid var(--neo-border);
		text-align: center;
	}

	.neo-footer-brand {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.neo-footer-logo {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--neo-border);
	}

	.neo-footer-title {
		font-size: 1.125rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.neo-footer-tagline {
		font-size: 0.9375rem;
		color: var(--neo-text-muted);
		margin-bottom: 1.5rem;
	}

	.neo-featured-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.neo-footer-links {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.neo-footer-links-row {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.neo-footer-links-legal {
		gap: 1.25rem;
	}

	.neo-footer-links a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--neo-text);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
		transition: border-color 0.15s ease;
	}

	.neo-footer-links-legal a {
		font-size: 0.8125rem;
		text-transform: none;
		font-weight: 500;
	}

	.neo-footer-links a:hover {
		border-bottom-color: var(--neo-accent-secondary);
	}

	.neo-footer-links a:focus-visible {
		outline: 2px solid var(--neo-accent-secondary);
		outline-offset: 2px;
	}

	.neo-footer-credit {
		font-size: 0.875rem;
		color: var(--neo-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.neo-footer-author {
		color: var(--neo-text);
		text-decoration: none;
		font-weight: 600;
		border-bottom: 2px solid transparent;
		transition: border-color 0.15s ease;
	}

	.neo-footer-author:hover {
		border-bottom-color: var(--neo-accent-secondary);
	}

	.neo-footer-attribution {
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: var(--neo-text-muted);
	}

	.neo-footer-attribution a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.15s ease;
	}

	.neo-footer-attribution a:hover {
		border-bottom-color: var(--neo-accent-secondary);
	}

	:global(.neo-heart-icon) {
		color: var(--neo-accent);
		fill: var(--neo-accent);
	}

	@media (min-width: 768px) {
		.neo-hero {
			padding: 5rem 1.5rem 4rem;
		}

		.neo-hero-title {
			font-size: 3.25rem;
		}

		.neo-hero-subtitle {
			font-size: 1.25rem;
		}
	}

	@media (min-width: 1024px) {
		.neo-hero-title {
			font-size: 3.75rem;
		}
	}

	@media (max-width: 767px) {
		.neo-navbar-links {
			display: none;
		}

		.neo-hamburger {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.neo-mobile-menu {
			display: flex;
		}

		.blog-section-heading {
			display: flex;
			align-items: center;
			flex-direction: column;
		}

		.blog-section-heading .neo-btn {
			position: static;
			margin-top: -2rem;
			margin-bottom: 3rem;
		}

		.blog-row {
			align-items: flex-start;
		}
	}
</style>
