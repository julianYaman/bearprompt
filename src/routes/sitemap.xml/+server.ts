import type { RequestHandler } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { getCachedSitemapXml, CACHE_CONTROL } from '$lib/server/cache';

const BASE_URL = 'https://bearprompt.com';

function buildUrl(loc: string, lastmod?: string): string {
	if (lastmod) {
		return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
	}
	return `  <url><loc>${loc}</loc></url>`;
}

function toIsoDate(value?: string | null): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
}

type PromptRow = {
	slug: string | null;
	updated_at: string | null;
	type: string | null;
	author: { slug: string | null } | { slug: string | null }[] | null;
};

type CategoryRow = {
	slug: string | null;
	updated_at: string | null;
};

async function generateSitemapXml(): Promise<string> {
	const supabase = getSupabase();
	const [{ data, error }, { data: categoryData, error: categoryError }] = await Promise.all([
		supabase
			.from('prompts')
			.select('slug, updated_at, type, author:author_id (slug)')
			.order('updated_at', { ascending: false }),
		supabase
			.from('categories')
			.select('slug, updated_at')
			.order('sort_order', { ascending: true })
	]);

	if (error) {
		throw error;
	}
	if (categoryError && categoryError.code !== '42P01' && categoryError.code !== 'PGRST205') {
		throw categoryError;
	}

	const promptUrls: string[] = [];
	const authorPromptPages = new Map<string, string>();
	const authorAgentPages = new Map<string, string>();

	const rows = (data || []) as unknown as PromptRow[];
	for (const row of rows) {
		const authorSlug = Array.isArray(row.author)
			? row.author[0]?.slug
			: row.author?.slug;
		if (!authorSlug || !row.slug) continue;

		const isAgent = row.type === 'agent';
		const basePath = isAgent ? 'agents' : 'prompts';
		const lastmod = toIsoDate(row.updated_at);
		promptUrls.push(buildUrl(`${BASE_URL}/${basePath}/${authorSlug}/${row.slug}`, lastmod));

		const authorMap = isAgent ? authorAgentPages : authorPromptPages;
		const existing = authorMap.get(authorSlug);
		if (!existing || (lastmod && lastmod > existing)) {
			authorMap.set(authorSlug, lastmod || '');
		}
	}

	const authorUrls: string[] = [];
	const categoryUrls: string[] = [];
	for (const [authorSlug, lastmod] of authorPromptPages.entries()) {
		authorUrls.push(buildUrl(`${BASE_URL}/prompts/${authorSlug}`, lastmod || undefined));
	}
	for (const [authorSlug, lastmod] of authorAgentPages.entries()) {
		authorUrls.push(buildUrl(`${BASE_URL}/agents/${authorSlug}`, lastmod || undefined));
	}
	for (const row of (categoryData || []) as CategoryRow[]) {
		if (!row.slug) continue;
		categoryUrls.push(
			buildUrl(`${BASE_URL}/prompts/category/${row.slug}`, toIsoDate(row.updated_at))
		);
	}

	const staticUrls = [
		buildUrl(`${BASE_URL}/`),
		buildUrl(`${BASE_URL}/prompts`),
		buildUrl(`${BASE_URL}/agents`),
		buildUrl(`${BASE_URL}/library`),
		buildUrl(`${BASE_URL}/help`)
	];

	const urls = [...staticUrls, ...categoryUrls, ...authorUrls, ...promptUrls].join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	const xml = await getCachedSitemapXml(generateSitemapXml);

	setHeaders({
		'Content-Type': 'application/xml',
		'Cache-Control': CACHE_CONTROL.SITEMAP
	});

	return new Response(xml);
};
