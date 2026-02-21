<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<style>
		body {
			background-color: #FDFCFD;
		}
		@media (prefers-color-scheme: dark) {
			body {
				background-color: #1a1a1a;
			}
		}
	</style>
</svelte:head>

<div class="legal-page">
	<div class="legal-container">
		<nav class="legal-nav">
			<a href="/" class="back-link">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
				Back to Bearprompt
			</a>
		</nav>
		{@render children()}
		<footer class="legal-footer">
			<p>&copy; {new Date().getFullYear()} Julian Yaman. All rights reserved.</p>
			<div class="legal-links">
				<a href="/about/privacy">Privacy Policy</a>
				<a href="/about/terms">Terms of Service</a>
				<a href="/about/legal">Impressum</a>
			</div>
		</footer>
	</div>
</div>

<style>
	.legal-page {
		min-height: 100vh;
		padding: 2rem 1rem;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #FDFCFD;
		color: #271105;
	}

	@media (prefers-color-scheme: dark) {
		.legal-page {
			background-color: #1a1a1a;
			color: #FDFCFD;
		}
	}

	.legal-container {
		max-width: 48rem;
		margin: 0 auto;
	}

	.legal-nav {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #BD6D38;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #FCA238;
	}

	@media (prefers-color-scheme: dark) {
		.back-link {
			color: #F7C792;
		}
		.back-link:hover {
			color: #FCA238;
		}
	}

	.legal-footer {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #E8D4B8;
		text-align: center;
		font-size: 0.875rem;
		color: #BD6D38;
	}

	@media (prefers-color-scheme: dark) {
		.legal-footer {
			border-top-color: #404040;
			color: #9ca3af;
		}
	}

	.legal-links {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.legal-links a {
		color: #BD6D38;
		text-decoration: none;
		transition: color 0.2s;
	}

	.legal-links a:hover {
		color: #FCA238;
	}

	@media (prefers-color-scheme: dark) {
		.legal-links a {
			color: #9ca3af;
		}
		.legal-links a:hover {
			color: #FCA238;
		}
	}

	:global(.legal-page h1) {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	:global(.legal-page .last-updated) {
		color: #BD6D38;
		font-size: 0.875rem;
		margin-bottom: 2rem;
	}

	@media (prefers-color-scheme: dark) {
		:global(.legal-page .last-updated) {
			color: #9ca3af;
		}
	}

	:global(.legal-page h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	:global(.legal-page h3) {
		font-size: 1.1rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.legal-page p) {
		line-height: 1.7;
		margin-bottom: 1rem;
	}

	:global(.legal-page ul) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.legal-page li) {
		line-height: 1.7;
		margin-bottom: 0.5rem;
	}

	:global(.legal-page a:not(.back-link):not(.legal-links a)) {
		color: #FCA238;
		text-decoration: underline;
	}

	@media (prefers-color-scheme: dark) {
		:global(.legal-page a:not(.back-link):not(.legal-links a)) {
			color: #FCA238;
		}
	}
</style>
