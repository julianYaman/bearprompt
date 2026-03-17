<svelte:head>
	<title>Privacy Policy - Bearprompt</title>
	<meta name="description" content="Privacy Policy for Bearprompt - Your private prompt library" />
</svelte:head>

<article>
	<h1>Privacy Policy</h1>
	<p class="last-updated">Last updated: March 17, 2026</p>

	<p>
		Welcome to Bearprompt ("we", "us", or "our"). We are committed to protecting your privacy. 
		This Privacy Policy explains how we handle information when you use our website at 
		<a href="https://bearprompt.com">bearprompt.com</a> (the "Service").
	</p>

	<h2>1. Information We Process</h2>
	<p>
		Bearprompt is designed to be privacy-first. Most prompt data is stored locally in your browser.
		When you use optional features such as encrypted sharing, limited server-side processing is required.
	</p>
	<ul>
		<li>Local library data: prompts, tags, folders, and settings in your browser (IndexedDB)</li>
		<li>Optional sharing data: encrypted prompt payloads you choose to upload for link sharing</li>
		<li>Operational data: basic request metadata needed for security and abuse prevention</li>
		<li>Analytics data: privacy-focused aggregate usage metrics (see section 4)</li>
	</ul>

	<h2>2. Local Data Storage</h2>
	<p>
		By default, data you create in Bearprompt (prompts, tags, folders, settings) is stored in your
		browser's IndexedDB. This means:
	</p>
	<ul>
		<li>We cannot access your local library unless you explicitly use a server-backed feature</li>
		<li>If you clear your browser data, your prompts will be deleted</li>
		<li>Your data is not synced across devices unless you manually export and import it</li>
	</ul>

	<h2>3. Optional End-to-End Encrypted Sharing</h2>
	<p>
		If you use the Share feature, Bearprompt uploads an encrypted prompt payload to our backend so another
		user can import it via link. The decryption key remains client-side in the URL fragment/hash and is not
		stored on our servers.
	</p>
	<ul>
		<li>Only encrypted payloads are stored server-side for sharing</li>
		<li>Shared payloads are automatically deleted after 14 days</li>
		<li>Links can be revoked by the share creator while the share dialog remains open</li>
		<li>Anyone with the full link can import that shared prompt</li>
	</ul>

	<h2>4. Analytics, Fonts, and Security Services</h2>
	<p>
		We use the following service providers to operate Bearprompt:
	</p>
	<ul>
		<li>
			<a href="https://umami.is" target="_blank" rel="noopener noreferrer">Umami Analytics</a>
			for privacy-focused aggregate usage analytics
		</li>
		<li>Supabase for encrypted share storage and backend database operations</li>
		<li>
			Cloudflare Turnstile for bot and abuse protection on sensitive endpoints (for example share creation)
		</li>
		<li>
			<a href="https://fonts.bunny.net" target="_blank" rel="noopener noreferrer">Bunny Fonts</a>
			for web font delivery (Space Grotesk and Bricolage Grotesque typefaces)
		</li>
	</ul>
	<p>
		Bunny Fonts is a privacy-focused font CDN operated by BunnyWay d.o.o. that does not track users
		or collect personal data. Unlike Google Fonts, Bunny Fonts is fully GDPR-compliant and does not
		log IP addresses or use cookies for tracking purposes.
	</p>
	<p>
		For invisible Turnstile mode, we reference Cloudflare's
		<a href="https://www.cloudflare.com/de-de/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Turnstile Privacy Addendum</a>
		in accordance with their requirements.
	</p>

	<h2>5. Cookies and Similar Technologies</h2>
	<p>
		Bearprompt does not use advertising cookies. Umami is configured to be privacy-focused and does not rely on
		cross-site ad tracking cookies. Security tooling (such as Turnstile/Cloudflare) may use strictly necessary
		technical storage or cookies for abuse protection and request integrity.
	</p>

	<h2>6. Data Retention</h2>
	<ul>
		<li>Local library data: retained in your browser until you delete it or clear browser storage</li>
		<li>Encrypted shared payloads: up to 14 days, or shorter if revoked/deleted earlier</li>
		<li>Operational security logs/metadata: retained only as needed for service security and abuse prevention</li>
	</ul>

	<h2>7. Data Security</h2>
	<p>
		We use technical and organizational measures appropriate to the risk, including encrypted payload handling
		for sharing, transport security, and abuse protection controls.
	</p>
	<p>
		Because local data remains on your device, you are also responsible for device/browser security.
		We recommend:
	</p>
	<ul>
		<li>Regularly backing up your prompts using the export feature</li>
		<li>Using a secure and up-to-date browser</li>
		<li>Being cautious when using shared or public computers</li>
	</ul>

	<h2>8. International Data Transfers</h2>
	<p>
		Depending on your location and provider infrastructure, data may be processed in countries outside your own.
		Where required, we rely on appropriate safeguards provided by our processors.
	</p>

	<h2>9. Children's Privacy</h2>
	<p>
		Our Service is not directed to children under 13. We do not knowingly collect any 
		information from children under 13.
	</p>

	<h2>10. Changes to This Policy</h2>
	<p>
		We may update this Privacy Policy from time to time. We will notify you of any changes 
		by posting the new Privacy Policy on this page and updating the "Last updated" date.
	</p>

	<h2>11. Contact Us</h2>
	<p>
		If you have any questions about this Privacy Policy, please contact us at:
	</p>
	<p>
		<strong>Email:</strong> <a href="mailto:mail@yaman.pro">mail@yaman.pro</a>
	</p>
</article>
