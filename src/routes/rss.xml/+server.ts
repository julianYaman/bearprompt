import type { RequestHandler } from '@sveltejs/kit';
import { getBlogPosts } from '$lib/server/blog';

const SITE_URL = 'https://bearprompt.com';
const FEED_DESCRIPTION = 'Guides for AI, prompt management, and Bearprompt product updates.';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	const posts = await getBlogPosts();
	const items = posts
		.map((post) => {
			const url = `${SITE_URL}/blog/${post.slug}`;
			const categories = [post.category, ...post.tags]
				.map((category) => `      <category>${escapeXml(category)}</category>`)
				.join('\n');

			return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
${categories}
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bearprompt Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

	setHeaders({
		'Content-Type': 'application/rss+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=3600, s-maxage=3600'
	});

	return new Response(xml);
};
