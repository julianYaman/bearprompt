<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { theme } from '$lib/stores';
	import type { ThemeMode } from '$lib/types';

	const faqs = [
		{
			question: 'How do I create prompts?',
			answer: 'Simply click "New Prompt" in your library, give it a title, paste or write your prompt content, and optionally add tags to organize it. Your prompt is saved instantly in your browser.'
		},
		{
			question: 'How safe is my data?',
			answer: 'Your prompts never leave your device. Everything is stored locally in your browser. We don\'t have servers that store your data, and we don\'t track what you write. Your prompts are yours alone.'
		},
		{
			question: 'Can I export my prompts?',
			answer: 'Yes! You can export all your prompts at any time. This makes it easy to back up your library or transfer it to another browser or device.'
		},
		{
			question: 'Is Bearprompt really free?',
			answer: 'Yes, Bearprompt is completely free and open-source. There are no premium tiers, no subscriptions, and no hidden costs. You can even self-host it if you prefer.'
		},
		{
			question: 'Can I contribute to the project?',
			answer: 'Absolutely! Bearprompt is open-source and we welcome contributions. Check out our GitHub repository to report issues, suggest features, or submit pull requests.'
		}
	];

	let openFaqIndex = $state<number | null>(null);
	let mobileMenuOpen = $state(false);

	function toggleFaq(index: number) {
		openFaqIndex = openFaqIndex === index ? null : index;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function cycleTheme() {
		theme.update((current) => {
			const modes: ThemeMode[] = ['system', 'light', 'dark'];
			const currentIndex = modes.indexOf(current);
			return modes[(currentIndex + 1) % modes.length];
		});
	}

	function getThemeIcon(mode: ThemeMode): 'monitor' | 'sun' | 'moon' {
		switch (mode) {
			case 'system':
				return 'monitor';
			case 'light':
				return 'sun';
			case 'dark':
				return 'moon';
		}
	}

	function getThemeLabel(mode: ThemeMode): string {
		switch (mode) {
			case 'system':
				return 'System theme';
			case 'light':
				return 'Light theme';
			case 'dark':
				return 'Dark theme';
		}
	}
</script>

<svelte:head>
	<title>Bearprompt - Your Private Prompt Library for AI</title>
	<meta name="description" content="Organize, search, and manage your AI prompts privately. Free, open-source, and your data never leaves your device." />
</svelte:head>

<!-- Navbar -->
<nav class="navbar">
	<div class="navbar-container">
		<a href="/" class="navbar-brand">
			<img src="/bearprompt.png" alt="Bearprompt logo" class="navbar-logo" />
			<span class="navbar-title">Bearprompt</span>
		</a>
		<div class="navbar-links">
			<a href="#how-it-works" class="navbar-link">How it works</a>
			<a href="#faq" class="navbar-link">FAQ</a>
			<a href="https://github.com/julianyaman/bearprompt" target="_blank" rel="noopener noreferrer" class="navbar-link">
				<Icon name="github" size={16} />
				GitHub
			</a>
			<a href="/library" class="navbar-cta">
				Create your library
				<Icon name="arrow-right" size={16} />
			</a>
		</div>
		<button
			type="button"
			class="navbar-hamburger"
			onclick={toggleMobileMenu}
			aria-label="Toggle menu"
			aria-expanded={mobileMenuOpen}
		>
			<Icon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
		</button>
	</div>
	{#if mobileMenuOpen}
		<div class="navbar-mobile-menu">
			<a href="#how-it-works" class="navbar-mobile-link" onclick={closeMobileMenu}>How it works</a>
			<a href="#faq" class="navbar-mobile-link" onclick={closeMobileMenu}>FAQ</a>
			<a href="https://github.com/julianyaman/bearprompt" target="_blank" rel="noopener noreferrer" class="navbar-mobile-link">
				<Icon name="github" size={16} />
				GitHub
			</a>
			<a href="/library" class="navbar-mobile-cta">
				Create your library
				<Icon name="arrow-right" size={16} />
			</a>
		</div>
	{/if}
</nav>

<!-- Hero Section -->
<section class="hero">
	<div class="hero-container">
		<div class="hero-content">
			<h1 class="hero-title">Your private prompt library for AI</h1>
			<p class="hero-subtitle">
				Organize, search, and manage all your AI prompts in one place. 
				Privacy-first, open-source, and completely free.
			</p>
			<a href="/library" class="hero-cta">
				Create your library
				<Icon name="arrow-right" size={20} />
			</a>
		</div>
		<div class="hero-image-wrapper">
			<img src="/hero-image.png" alt="Bearprompt app screenshot" class="hero-image" />
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="features">
	<div class="features-container">
		<h2 class="section-title">Why Bearprompt?</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<Icon name="shield" size={28} />
				</div>
				<h3 class="feature-title">Privacy-first</h3>
				<p class="feature-description">
					Your prompts stay on your device. No data leaves your browser.
				</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<Icon name="library" size={28} />
				</div>
				<h3 class="feature-title">Organize prompts</h3>
				<p class="feature-description">
					Build your personal collection of prompts for any AI tool or use case. Keep everything in one place.
				</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<Icon name="tag" size={28} />
				</div>
				<h3 class="feature-title">Search & Tags</h3>
				<p class="feature-description">
					Find any prompt instantly with search and flexible tagging.
				</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<Icon name="github" size={28} />
				</div>
				<h3 class="feature-title">Open-source</h3>
				<p class="feature-description">
					Free forever. Inspect the code, contribute, or self-host.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- How It Works Section -->
<section id="how-it-works" class="how-it-works">
	<div class="how-it-works-container">
		<h2 class="section-title">How it works</h2>
		<div class="steps">
			<div class="step">
				<div class="step-icon-wrapper">
					<div class="step-icon">
						<Icon name="plus" size={24} />
					</div>
					<div class="step-number">1</div>
				</div>
				<h3 class="step-title">Create</h3>
				<p class="step-description">Add your first prompt in seconds. Just paste and save.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step">
				<div class="step-icon-wrapper">
					<div class="step-icon">
						<Icon name="tag" size={24} />
					</div>
					<div class="step-number">2</div>
				</div>
				<h3 class="step-title">Organize</h3>
				<p class="step-description">Tag and categorize for easy access later.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step">
				<div class="step-icon-wrapper">
					<div class="step-icon">
						<Icon name="copy" size={24} />
					</div>
					<div class="step-number">3</div>
				</div>
				<h3 class="step-title">Use</h3>
				<p class="step-description">Copy and paste into any AI tool instantly.</p>
			</div>
		</div>
	</div>
</section>

<!-- FAQ Section -->
<section id="faq" class="faq">
	<div class="faq-container">
		<h2 class="section-title">Frequently asked questions</h2>
		<div class="faq-list">
			{#each faqs as faq, index}
				<div class="faq-item" class:open={openFaqIndex === index}>
					<button 
						type="button" 
						class="faq-question" 
						onclick={() => toggleFaq(index)}
						aria-expanded={openFaqIndex === index}
					>
						<span>{faq.question}</span>
						<Icon name="chevron-down" size={20} class="faq-chevron" />
					</button>
					{#if openFaqIndex === index}
						<div class="faq-answer">
							<p>{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="cta-section">
	<div class="cta-container">
		<h2 class="cta-title">Ready to organize your prompts?</h2>
		<p class="cta-subtitle">Start building your private prompt library today. No sign-up required.</p>
		<a href="/library" class="cta-button">
			Create your library
			<Icon name="arrow-right" size={20} />
		</a>
	</div>
</section>

<!-- Footer -->
<footer class="footer">
	<div class="footer-container">
		<div class="footer-brand">
			<img src="/bearprompt.png" alt="Bearprompt logo" class="footer-logo" />
			<span class="footer-title">Bearprompt</span>
		</div>
		<p class="footer-tagline">Your private prompt library for AI</p>
		<div class="footer-links">
			<a href="/about/privacy">Privacy Policy</a>
			<a href="/about/terms">Terms of Service</a>
			<a href="/about/legal">Legal Notice</a>
			<a href="https://github.com/julianyaman/bearprompt" target="_blank" rel="noopener noreferrer">
				<Icon name="github" size={16} />
				GitHub
			</a>
			<a href="https://buymeacoffee.com/julianyaman" target="_blank" rel="noopener noreferrer" class="donate-link">
				<Icon name="heart" size={16} />
				Donate
			</a>
		</div>
		<button
			type="button"
			onclick={cycleTheme}
			class="theme-toggle"
			aria-label={getThemeLabel($theme)}
		>
			<Icon name={getThemeIcon($theme)} size={16} />
			{getThemeLabel($theme)}
		</button>
		<p class="footer-credit">Made with <Icon name="heart" size={14} class="heart-icon" /> by <a href="https://yaman.pro" target="_blank" rel="noopener noreferrer" class="footer-author">Julian Yaman</a></p>
	</div>
</footer>

<style>
	/* Navbar */
	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: var(--color-bg-primary);
		border-bottom: 1px solid var(--color-border);
	}

	.navbar-container {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
	}

	.navbar-logo {
		width: 2rem;
		height: 2rem;
	}

	.navbar-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.navbar-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.navbar-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.navbar-link:hover {
		color: var(--color-text-primary);
	}

	.navbar-cta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: var(--color-accent);
		color: #271105;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.2s, transform 0.2s;
	}

	.navbar-cta:hover {
		background-color: #e8922e;
		transform: translateY(-1px);
	}

	.navbar-hamburger {
		display: none;
		padding: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-primary);
		border-radius: 0.5rem;
	}

	.navbar-hamburger:hover {
		background-color: var(--color-bg-tertiary);
	}

	.navbar-mobile-menu {
		display: none;
		flex-direction: column;
		padding: 0.75rem 1.5rem 1rem;
		border-top: 1px solid var(--color-border);
		background-color: var(--color-bg-primary);
	}

	.navbar-mobile-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 0;
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.navbar-mobile-link:hover {
		color: var(--color-text-primary);
	}

	.navbar-mobile-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--color-accent);
		color: #271105;
		font-size: 0.9375rem;
		font-weight: 500;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.navbar-mobile-cta:hover {
		background-color: #e8922e;
	}

	@media (max-width: 767px) {
		.navbar-links {
			display: none;
		}

		.navbar-hamburger {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.navbar-mobile-menu {
			display: flex;
		}
	}

	/* Hero Section */
	.hero {
		padding: 4rem 1.5rem 3rem;
		background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
	}

	.hero-container {
		max-width: 72rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
	}

	.hero-content {
		text-align: center;
		max-width: 48rem;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.hero-subtitle {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		background-color: var(--color-accent);
		color: #271105;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.2s, transform 0.2s;
	}

	.hero-cta:hover {
		background-color: #e8922e;
		transform: translateY(-2px);
	}

	.hero-image-wrapper {
		width: 100%;
		max-width: 72rem;
	}

	.hero-image {
		width: 100%;
		height: auto;
	}

	/* Section Title */
	.section-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-align: center;
		margin-bottom: 2.5rem;
	}

	/* Features Section */
	.features {
		padding: 5rem 1.5rem;
		background-color: var(--color-bg-primary);
	}

	.features-container {
		max-width: 72rem;
		margin: 0 auto;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.features-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.feature-card {
		padding: 1.5rem;
		background-color: var(--color-bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		text-align: center;
	}

	.feature-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		background-color: var(--color-accent);
		border-radius: 0.75rem;
		color: #271105;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.feature-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	/* How It Works Section */
	.how-it-works {
		padding: 5rem 1.5rem;
		background-color: var(--color-bg-secondary);
	}

	.how-it-works-container {
		max-width: 56rem;
		margin: 0 auto;
	}

	.steps {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	@media (min-width: 768px) {
		.steps {
			flex-direction: row;
			justify-content: center;
			align-items: flex-start;
		}
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1rem 1.5rem;
		flex: 1;
		max-width: 12rem;
	}

	.step-icon-wrapper {
		position: relative;
		margin-bottom: 1rem;
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background-color: var(--color-accent);
		border-radius: 50%;
		color: #271105;
	}

	.step-number {
		position: absolute;
		top: -0.25rem;
		right: -0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		background-color: var(--color-text-primary);
		color: var(--color-bg-primary);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.step-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.step-connector {
		width: 2px;
		height: 2rem;
		background-color: var(--color-border);
	}

	@media (min-width: 768px) {
		.step-connector {
			width: 4rem;
			height: 2px;
			margin-top: 3rem;
			flex-shrink: 0;
		}
	}

	/* FAQ Section */
	.faq {
		padding: 5rem 1.5rem;
		background-color: var(--color-bg-primary);
	}

	.faq-container {
		max-width: 48rem;
		margin: 0 auto;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.faq-item {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--color-bg-secondary);
	}

	.faq-item.open {
		border-color: var(--color-accent);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 1rem 1.25rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text-primary);
		text-align: left;
	}

	.faq-question:hover {
		background-color: var(--color-bg-tertiary);
	}

	.faq-item.open .faq-question {
		border-bottom: 1px solid var(--color-border);
	}

	:global(.faq-chevron) {
		transition: transform 0.2s;
		color: var(--color-text-secondary);
	}

	.faq-item.open :global(.faq-chevron) {
		transform: rotate(180deg);
	}

	.faq-answer {
		padding: 1rem 1.25rem;
	}

	.faq-answer p {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		line-height: 1.7;
	}

	/* CTA Section */
	.cta-section {
		padding: 5rem 1.5rem;
		background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
		text-align: center;
	}

	.cta-container {
		max-width: 36rem;
		margin: 0 auto;
	}

	.cta-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.75rem;
	}

	.cta-subtitle {
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin-bottom: 2rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		background-color: var(--color-accent);
		color: #271105;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.2s, transform 0.2s;
	}

	.cta-button:hover {
		background-color: #e8922e;
		transform: translateY(-2px);
	}

	/* Footer */
	.footer {
		padding: 3rem 1.5rem;
		background-color: var(--color-bg-primary);
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.footer-container {
		max-width: 72rem;
		margin: 0 auto;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.footer-logo {
		width: 1.75rem;
		height: 1.75rem;
	}

	.footer-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.footer-tagline {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
	}

	.footer-links {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.footer-links a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-links a:hover {
		color: var(--color-accent);
	}

	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1.5rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s, border-color 0.2s;
	}

	.theme-toggle:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
		border-color: var(--color-accent);
	}

	.footer-credit {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.footer-author {
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-author:hover {
		color: var(--color-accent);
	}

	:global(.heart-icon) {
		color: #e25555;
	}

	/* Responsive */
	@media (min-width: 768px) {
		.hero {
			padding: 5rem 1.5rem 4rem;
		}

		.hero-title {
			font-size: 3rem;
		}

		.hero-subtitle {
			font-size: 1.25rem;
		}
	}
</style>
