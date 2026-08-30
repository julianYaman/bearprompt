import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'object-src': ['none'],
				'script-src': ['self', 'https://cloud.umami.is', 'https://challenges.cloudflare.com'],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.bunny.net'],
				'font-src': ['self', 'https://fonts.bunny.net'],
				'img-src': ['self', 'data:', 'https:'],
				'connect-src': ['self', 'https://cloud.umami.is', 'https://challenges.cloudflare.com'],
				'frame-src': ['https://challenges.cloudflare.com'],
				'worker-src': ['self', 'blob:']
			}
		}
	}
};

export default config;
