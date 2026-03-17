<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { serializeJsonLd } from '$lib/security';

	const products = ['Text Files', 'Notion', 'Sticky Notes', 'Apple Notes', 'Google Docs', 'Slack DMs'];

	type Phase = 'typing' | 'pausing' | 'deleting';

	// CTA typewriter state
	let ctaProductIndex = $state(0);
	let ctaDisplayText = $state('');
	let ctaPhase = $state<Phase>('typing');
	let ctaShowCursor = $state(true);

	// Hero typewriter state
	let heroProductIndex = $state(0);
	let heroDisplayText = $state('');
	let heroPhase = $state<Phase>('typing');
	let heroShowCursor = $state(true);

	onMount(() => {
		const TYPE_SPEED = 60;
		const DELETE_SPEED = 40;
		const PAUSE_DURATION = 3000;
		const CURSOR_BLINK = 530;

		let ctaTimeout: ReturnType<typeof setTimeout>;
		let heroTimeout: ReturnType<typeof setTimeout>;

		const ctaCursorInterval = setInterval(() => {
			ctaShowCursor = !ctaShowCursor;
		}, CURSOR_BLINK);

		const heroCursorInterval = setInterval(() => {
			heroShowCursor = !heroShowCursor;
		}, CURSOR_BLINK);

		function ctaTick() {
			const current = products[ctaProductIndex];
			if (ctaPhase === 'typing') {
				if (ctaDisplayText.length < current.length) {
					ctaDisplayText = current.slice(0, ctaDisplayText.length + 1);
					ctaTimeout = setTimeout(ctaTick, TYPE_SPEED);
				} else {
					ctaPhase = 'pausing';
					ctaTimeout = setTimeout(ctaTick, PAUSE_DURATION);
				}
			} else if (ctaPhase === 'pausing') {
				ctaPhase = 'deleting';
				ctaTick();
			} else if (ctaPhase === 'deleting') {
				if (ctaDisplayText.length > 0) {
					ctaDisplayText = ctaDisplayText.slice(0, -1);
					ctaTimeout = setTimeout(ctaTick, DELETE_SPEED);
				} else {
					ctaProductIndex = (ctaProductIndex + 1) % products.length;
					ctaPhase = 'typing';
					ctaTimeout = setTimeout(ctaTick, TYPE_SPEED);
				}
			}
		}

		function heroTick() {
			const current = products[heroProductIndex];
			if (heroPhase === 'typing') {
				if (heroDisplayText.length < current.length) {
					heroDisplayText = current.slice(0, heroDisplayText.length + 1);
					heroTimeout = setTimeout(heroTick, TYPE_SPEED);
				} else {
					heroPhase = 'pausing';
					heroTimeout = setTimeout(heroTick, PAUSE_DURATION);
				}
			} else if (heroPhase === 'pausing') {
				heroPhase = 'deleting';
				heroTick();
			} else if (heroPhase === 'deleting') {
				if (heroDisplayText.length > 0) {
					heroDisplayText = heroDisplayText.slice(0, -1);
					heroTimeout = setTimeout(heroTick, DELETE_SPEED);
				} else {
					heroProductIndex = (heroProductIndex + 1) % products.length;
					heroPhase = 'typing';
					heroTimeout = setTimeout(heroTick, TYPE_SPEED);
				}
			}
		}

		ctaTick();
		// Offset hero by 500ms so they don't animate in lockstep
		heroTimeout = setTimeout(heroTick, 500);

		return () => {
			clearTimeout(ctaTimeout);
			clearTimeout(heroTimeout);
			clearInterval(ctaCursorInterval);
			clearInterval(heroCursorInterval);
		};
	});

	const faqs = [
		{
			question: 'How do I create prompts?',
			answer: 'Simply click "New Prompt" in your library, give it a title, paste or write your prompt content, and optionally add tags to organize it. Your prompt is saved instantly in your browser.'
		},
		{
			question: 'How safe is my data?',
			answer: "Your prompts never leave your device. Everything is stored locally in your browser. We don't have servers that store your data, and we don't track what you write. Your prompts are yours alone."
		},
		{
			question: 'Can I export my prompts?',
			answer: 'Yes! You can export all your prompts at any time. This makes it easy to back up your library or transfer it to another browser or device.'
		},
		{
			question: 'How do I add my prompt or agent to the public libraries?',
			answer: 'Click "Add my Prompt" or "Add my Agent Prompt" in the navigation bar. This will open GitHub with a pre-filled template where you can submit your prompt or agent. Once reviewed, your submission will be added to the public library for everyone to discover and use.'
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

	const jsonLd = serializeJsonLd({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Bearprompt',
		url: 'https://bearprompt.com',
		description:
			'Your AI prompts deserve better than scattered notes. Keep them safe, organized, and ready to use—without handing them to another company. 100% private, free, and open-source.',
		publisher: {
			'@type': 'Organization',
			name: 'Bearprompt',
			url: 'https://bearprompt.com',
			logo: {
				'@type': 'ImageObject',
				url: 'https://bearprompt.com/bearprompt.png'
			}
		}
	});
</script>

<svelte:head>
	<title>Bearprompt - Your Prompts Deserve Better | AI Prompt Library</title>
	<meta
		name="description"
		content="Your AI prompts deserve better than scattered notes. Keep them safe, organized, and ready to use—without handing them to another company. Free, open-source, 100% private."
	/>
	<link rel="canonical" href="https://bearprompt.com/" />

	<meta property="og:title" content="Bearprompt - Your private prompt library" />
	<meta
		property="og:description"
		content="The prompts that make AI actually useful? Keep them safe, organized, and ready to use—without handing them to another company. 100% private, free, and open-source."
	/>
	<meta property="og:image" content="https://bearprompt.com/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Bearprompt - Your private prompt library" />
	<meta property="og:url" content="https://bearprompt.com/" />
	<meta property="og:type" content="website" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Bearprompt - Your private prompt library" />
	<meta
		name="twitter:description"
		content="The prompts that make AI actually useful? Keep them safe, organized, and ready to use—without handing them to another company. 100% private, free, and open-source."
	/>
	<meta name="twitter:image" content="https://bearprompt.com/og-image.png" />
	<meta name="twitter:image:alt" content="Bearprompt - Your private prompt library" />

	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">{jsonLd}</script>
</svelte:head>

<div class="neo-page">
	<!-- Navbar -->
	<nav class="neo-navbar">
		<div class="neo-navbar-container">
			<a href="/" class="neo-navbar-brand">
				<img src="/bearprompt.png" alt="Bearprompt logo" class="neo-navbar-logo" />
				<span class="neo-navbar-title">Bearprompt</span>
			</a>
			<div class="neo-navbar-links">
				<a href="#how-it-works" class="neo-navbar-link">How it works</a>
				<a href="#faq" class="neo-navbar-link">FAQ</a>
				<a
					href="https://github.com/julianyaman/bearprompt"
					target="_blank"
					rel="noopener noreferrer"
					class="neo-navbar-link"
				>
					<Icon name="github" size={16} />
					GitHub
				</a>
				<a href="/library" class="neo-btn neo-btn-primary neo-navbar-cta">
					Get Started
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
				<a href="#how-it-works" class="neo-mobile-link" onclick={closeMobileMenu}>How it works</a>
				<a href="#faq" class="neo-mobile-link" onclick={closeMobileMenu}>FAQ</a>
				<a
					href="https://github.com/julianyaman/bearprompt"
					target="_blank"
					rel="noopener noreferrer"
					class="neo-mobile-link"
				>
					<Icon name="github" size={16} />
					GitHub
				</a>
				<a href="/library" class="neo-btn neo-btn-primary neo-mobile-cta">
					Get Started
					<Icon name="arrow-right" size={16} />
				</a>
			</div>
		{/if}
	</nav>

	<!-- Hero Section -->
	<section class="neo-hero">
		<div class="neo-hero-container">
			<div class="neo-hero-content">
				<h1 class="neo-hero-title">Your prompts deserve better than <span class="neo-hero-rotating-word">{heroDisplayText}<span class="neo-cursor" class:visible={heroShowCursor}>|</span></span>.</h1>
				<p class="neo-hero-subtitle">
					The prompts that make AI and Agents actually useful?<br />Keep them safe, organized, and ready to
					use&mdash;without handing them to another company.
				</p>
				<div class="neo-hero-cta-wrapper">
					<a href="/library" class="neo-btn neo-btn-primary neo-btn-lg">
						Create your library
						<Icon name="arrow-right" size={20} />
					</a>
					<span class="neo-sticker neo-sticker-secondary neo-sticker-rotate-right neo-hero-cta-sticker">No signup</span>
				</div>
			</div>
			<div class="neo-hero-image-wrapper">
				<div class="neo-sticker neo-sticker-secondary neo-sticker-rotate-left">
					100% Private
				</div>
				<div class="neo-hero-image-frame">
					<img src="/hero-image.png" alt="Bearprompt app screenshot" class="neo-hero-image" />
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="neo-features">
		<div class="neo-container">
			<h2 class="neo-section-title">Why Bearprompt?</h2>
			<div class="neo-features-grid">
				<div class="neo-card">
					<div class="neo-card-icon">
						<Icon name="shield" size={28} />
					</div>
					<h3 class="neo-card-title">Your Data Stays Yours</h3>
					<p class="neo-card-description">
						Your prompts never leave your browser&mdash;not even we can
						see them.
					</p>
				</div>
				<div class="neo-card">
					<div class="neo-card-icon">
						<Icon name="library" size={28} />
					</div>
					<h3 class="neo-card-title">Find Any Prompt in Seconds</h3>
					<p class="neo-card-description">
						Tags, folders, search. Build a system that works for how you think.
					</p>
				</div>
				<div class="neo-card">
					<div class="neo-card-icon">
						<Icon name="globe" size={28} />
					</div>
					<h3 class="neo-card-title">Steal From <br>the Best</h3>
					<p class="neo-card-description">
						Browse community prompts and agents. Copy what works. Make it your own.
					</p>
				</div>
				<div class="neo-card">
					<div class="neo-card-icon">
						<Icon name="github" size={28} />
					</div>
					<h3 class="neo-card-title">Trust,<br>Don't Hope</h3>
					<p class="neo-card-description">
						Every line of code is public. Audit it. Fork it. Self-host it. 100% Free.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section id="how-it-works" class="neo-how-it-works">
		<div class="neo-container">
			<h2 class="neo-section-title">How it works</h2>
			<div class="neo-steps">
				<div class="neo-step">
					<div class="neo-step-icon-wrapper">
						<div class="neo-step-icon">
							<Icon name="plus" size={24} />
						</div>
						<div class="neo-step-number">1</div>
					</div>
					<h3 class="neo-step-title">Create</h3>
					<p class="neo-step-description">
						Paste that perfect prompt before you forget it.
					</p>
				</div>
				<div class="neo-step-connector"></div>
				<div class="neo-step">
					<div class="neo-step-icon-wrapper">
						<div class="neo-step-icon">
							<Icon name="tag" size={24} />
						</div>
						<div class="neo-step-number">2</div>
					</div>
					<h3 class="neo-step-title">Organize</h3>
					<p class="neo-step-description">Tag it. Folder it. Find it instantly next time.</p>
				</div>
				<div class="neo-step-connector"></div>
				<div class="neo-step">
					<div class="neo-step-icon-wrapper">
						<div class="neo-step-icon">
							<Icon name="copy" size={24} />
						</div>
						<div class="neo-step-number">3</div>
					</div>
					<h3 class="neo-step-title">Use</h3>
					<p class="neo-step-description">One click. Copied. Back to work.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section id="faq" class="neo-faq">
		<div class="neo-container neo-faq-container">
			<h2 class="neo-section-title">Frequently asked questions</h2>
			<div class="neo-faq-list">
				{#each faqs as faq, index}
					<div class="neo-faq-item" class:open={openFaqIndex === index}>
						<button
							type="button"
							class="neo-faq-question"
							onclick={() => toggleFaq(index)}
							aria-expanded={openFaqIndex === index}
						>
							<span>{faq.question}</span>
							<Icon name="chevron-down" size={20} class="neo-faq-chevron" />
						</button>
						{#if openFaqIndex === index}
							<div class="neo-faq-answer">
								<p>{faq.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="neo-cta-section">
		<div class="neo-container">
			<div class="neo-cta-box">
				<div class="neo-sticker neo-sticker-primary neo-sticker-rotate-right neo-cta-sticker">
					100% Free
				</div>
	<h2 class="neo-cta-title">
				Your Best Prompts Deserve Better Than
				<span class="neo-rotating-word">{ctaDisplayText}<span class="neo-cursor" class:visible={ctaShowCursor}>|</span></span>
			</h2>
				<p class="neo-cta-subtitle">
					Start in 10 seconds. No account. No email. Just prompts.
				</p>
				<a href="/library" class="neo-btn neo-btn-primary neo-btn-lg">
					Create your library
					<Icon name="arrow-right" size={20} />
				</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="neo-footer">
		<div class="neo-container">
			<div class="neo-footer-brand">
				<img src="/bearprompt.png" alt="Bearprompt logo" class="neo-footer-logo" />
				<span class="neo-footer-title">Bearprompt</span>
			</div>
			<p class="neo-footer-tagline">Your private prompt library for AI</p>
			<div class="neo-featured-list">
				<a
					href="https://findly.tools/bearprompt?utm_source=bearprompt"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src="https://findly.tools/badges/findly-tools-badge-light.svg"
						alt="Featured on Findly.tools"
						width="175"
						height="55"
					/>
				</a>
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
		</div>
	</footer>
</div>

<style>
	/* ============================================
	   NEOBRUTALISM DESIGN SYSTEM
	   ============================================ */

	/* CSS Custom Properties */
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
	.neo-page h3,
	.neo-page h4 {
		font-family: 'Bricolage Grotesque', system-ui, sans-serif;
	}

	/* ============================================
	   ANIMATIONS
	   ============================================ */

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes bounceIn {
		0% {
			opacity: 0;
			transform: rotate(var(--sticker-rotation, -12deg)) scale(0);
		}
		60% {
			opacity: 1;
			transform: rotate(var(--sticker-rotation, -12deg)) scale(1.1);
		}
		100% {
			opacity: 1;
			transform: rotate(var(--sticker-rotation, -12deg)) scale(1);
		}
	}

	@keyframes wobble {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(-3deg);
		}
		75% {
			transform: rotate(3deg);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.neo-page {
			scroll-behavior: auto;
		}

		.neo-sticker,
		.neo-faq-answer,
		.neo-btn,
		.neo-card,
		.neo-faq-item,
		.neo-step-icon,
		.neo-cursor {
			animation: none !important;
			transition: none !important;
		}
	}

	/* ============================================
	   BASE COMPONENTS
	   ============================================ */

	/* Container */
	.neo-container {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Section Title */
	.neo-section-title {
		font-size: 2rem;
		font-weight: 800;
		text-align: center;
		margin-bottom: 3rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	/* Buttons */
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

	.neo-btn-lg {
		padding: 1rem 2rem;
		font-size: 1rem;
	}

	/* Stickers */
	.neo-sticker {
		display: inline-block;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 3px 3px 0 var(--neo-shadow);
		animation: bounceIn 0.5s ease-out forwards;
		white-space: nowrap;
	}

	.neo-sticker-primary {
		background-color: var(--neo-accent);
		color: var(--neo-text);
		--sticker-rotation: 8deg;
	}

	.neo-sticker-secondary {
		background-color: var(--neo-accent-secondary);
		color: var(--neo-text);
		--sticker-rotation: -12deg;
	}

	.neo-sticker-rotate-left {
		transform: rotate(-12deg);
	}

	.neo-sticker-rotate-right {
		transform: rotate(8deg);
	}

	/* Cards */
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

	.neo-card-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background-color: var(--neo-accent);
		border: var(--neo-border-width) solid var(--neo-border);
		margin-bottom: 1rem;
	}

	.neo-card-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
	}

	.neo-card-description {
		font-size: 0.9375rem;
		color: var(--neo-text-muted);
		line-height: 1.6;
	}

	/* ============================================
	   NAVBAR
	   ============================================ */

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

	.neo-navbar-cta {
		padding: 0.5rem 1rem;
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

	.neo-hamburger:focus-visible {
		outline: 2px solid var(--neo-accent-secondary);
		outline-offset: 2px;
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
	}

	/* ============================================
	   HERO SECTION
	   ============================================ */

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

	.neo-hero-cta-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.neo-hero-cta-sticker {
		position: absolute;
		bottom: -0.625rem;
		right: -1.25rem;
		z-index: 10;
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
	}

	@media (min-width: 768px) {
		.neo-hero-cta-sticker {
			bottom: -0.75rem;
			right: -1.5rem;
			font-size: 0.75rem;
			padding: 0.3rem 0.75rem;
		}
	}

	.neo-hero-image-wrapper {
		position: relative;
		width: 100%;
		max-width: 64rem;
	}

	.neo-hero-image-wrapper > .neo-sticker {
		position: absolute;
		top: -1rem;
		left: -0.5rem;
		z-index: 10;
	}

	.neo-hero-image-frame {
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 8px 8px 0 var(--neo-shadow);
		background-color: var(--neo-bg);
		overflow: hidden;
	}

	.neo-hero-image {
		width: 100%;
		height: auto;
		display: block;
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

		.neo-hero-cta-wrapper {
			flex-direction: row;
			gap: 1.5rem;
		}

		.neo-hero-image-wrapper > .neo-sticker {
			top: -1.5rem;
			left: -1rem;
		}
	}

	@media (min-width: 1024px) {
		.neo-hero-title {
			font-size: 3.75rem;
		}
	}

	/* ============================================
	   FEATURES SECTION
	   ============================================ */

	.neo-features {
		padding: 5rem 0;
		background-color: var(--neo-bg);
	}

	.neo-features-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.neo-features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.neo-features-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	/* ============================================
	   HOW IT WORKS SECTION
	   ============================================ */

	.neo-how-it-works {
		padding: 5rem 0;
		background-color: var(--neo-bg-alt);
		border-top: var(--neo-border-width) solid var(--neo-border);
		border-bottom: var(--neo-border-width) solid var(--neo-border);
	}

	.neo-steps {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	@media (min-width: 768px) {
		.neo-steps {
			flex-direction: row;
			justify-content: center;
			align-items: flex-start;
		}
	}

	.neo-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1rem 1.5rem;
		flex: 1;
		max-width: 14rem;
	}

	.neo-step-icon-wrapper {
		position: relative;
		margin-bottom: 1.25rem;
	}

	.neo-step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		background-color: var(--neo-accent);
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 4px 4px 0 var(--neo-shadow);
		transition: transform 0.2s ease;
	}

	.neo-step:hover .neo-step-icon {
		animation: wobble 0.4s ease;
	}

	.neo-step-number {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		width: 2rem;
		height: 2rem;
		background-color: var(--neo-accent-secondary);
		color: var(--neo-text);
		border: var(--neo-border-width) solid var(--neo-border);
		font-size: 0.875rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.neo-step-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
	}

	.neo-step-description {
		font-size: 0.9375rem;
		color: var(--neo-text-muted);
		line-height: 1.5;
	}

	.neo-step-connector {
		width: 4px;
		height: 2.5rem;
		background-color: var(--neo-border);
	}

	@media (min-width: 768px) {
		.neo-step-connector {
			width: 4rem;
			height: 4px;
			margin-top: 3.5rem;
			flex-shrink: 0;
			background: repeating-linear-gradient(
				90deg,
				var(--neo-border),
				var(--neo-border) 8px,
				transparent 8px,
				transparent 16px
			);
		}
	}

	/* ============================================
	   FAQ SECTION
	   ============================================ */

	.neo-faq {
		padding: 5rem 0;
		background-color: var(--neo-bg);
	}

	.neo-faq-container {
		max-width: 48rem;
	}

	.neo-faq-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.neo-faq-item {
		border: var(--neo-border-width) solid var(--neo-border);
		background-color: var(--neo-bg);
		box-shadow: 4px 4px 0 var(--neo-shadow);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.neo-faq-item.open {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 var(--neo-shadow);
		background-color: var(--neo-bg-alt);
	}

	.neo-faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 700;
		color: var(--neo-text);
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		transition: background-color 0.15s ease;
	}

	.neo-faq-question:hover {
		background-color: var(--neo-bg-alt);
	}

	.neo-faq-question:focus-visible {
		outline: 2px solid var(--neo-accent-secondary);
		outline-offset: -2px;
	}

	.neo-faq-item.open .neo-faq-question {
		border-bottom: var(--neo-border-width) solid var(--neo-border);
	}

	:global(.neo-faq-chevron) {
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.neo-faq-item.open :global(.neo-faq-chevron) {
		transform: rotate(180deg);
	}

	.neo-faq-answer {
		padding: 1.25rem 1.5rem;
		animation: slideDown 0.2s ease-out;
	}

	.neo-faq-answer p {
		font-size: 1rem;
		color: var(--neo-text-muted);
		line-height: 1.7;
	}

	/* ============================================
	   CTA SECTION
	   ============================================ */

	.neo-cta-section {
		padding: 5rem 0;
		background-color: var(--neo-accent);
		border-top: var(--neo-border-width) solid var(--neo-border);
		border-bottom: var(--neo-border-width) solid var(--neo-border);
	}

	.neo-cta-box {
		position: relative;
		text-align: center;
		max-width: 40rem;
		margin: 0 auto;
		padding: 3rem 2rem;
		background-color: var(--neo-bg);
		border: var(--neo-border-width) solid var(--neo-border);
		box-shadow: 8px 8px 0 var(--neo-shadow);
	}

	.neo-cta-sticker {
		position: absolute;
		top: -1rem;
		right: -0.5rem;
	}

	@media (min-width: 768px) {
		.neo-cta-sticker {
			top: -1.25rem;
			right: -1rem;
		}
	}

	.neo-cta-title {
		font-size: 1.5rem;
		font-weight: 800;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		line-height: 1.3;
	}

	.neo-rotating-word {
		display: inline;
		background-color: var(--neo-accent-secondary);
		padding: 0 0.3rem;
		border: 2px solid var(--neo-border);
	}

	.neo-hero-rotating-word {
		display: inline-block;
		border-bottom: 6px solid var(--neo-accent-secondary);
	}

	.neo-cursor {
		display: inline-block;
		font-weight: 900;
		opacity: 0;
		transition: opacity 0.1s;
		margin-left: 1px;
	}

	.neo-cursor.visible {
		opacity: 1;
	}

	@media (min-width: 768px) {
		.neo-cta-title {
			font-size: 1.75rem;
		}
	}

	.neo-cta-subtitle {
		font-size: 1rem;
		color: var(--neo-text-muted);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	/* ============================================
	   FOOTER
	   ============================================ */

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

	:global(.neo-heart-icon) {
		color: #e25555;
	}
</style>
