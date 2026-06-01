import { dev } from '$app/environment';
import { renderMarkdown } from '$lib/server/markdown';
import type { BlogPost, BlogPostMeta } from '$lib/types/blog';

type RawFrontmatterValue = string | string[] | boolean;

type RawPostModule = () => Promise<string>;

const postModules = import.meta.glob('/src/content/blog/*.md', {
	query: '?raw',
	import: 'default'
}) as Record<string, RawPostModule>;

const REQUIRED_FIELDS = [
	'title',
	'slug',
	'description',
	'publishedAt',
	'author',
	'tags',
	'category',
	'featured'
] as const;

export function parseFrontmatter(raw: string): {
	frontmatter: Record<string, RawFrontmatterValue>;
	body: string;
} {
	if (!raw.startsWith('---\n')) {
		throw new Error('Blog post is missing frontmatter');
	}

	const endIndex = raw.indexOf('\n---', 4);
	if (endIndex === -1) {
		throw new Error('Blog post frontmatter is not closed');
	}

	const frontmatterSource = raw.slice(4, endIndex).trim();
	const body = raw.slice(endIndex + 4).trim();
	const frontmatter: Record<string, RawFrontmatterValue> = {};
	const lines = frontmatterSource.split('\n');

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.trim()) continue;

		const match = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line);
		if (!match) {
			throw new Error(`Invalid frontmatter line: ${line}`);
		}

		const [, key, rawValue] = match;
		if (rawValue === '') {
			const values: string[] = [];
			while (index + 1 < lines.length && /^\s+-\s+/.test(lines[index + 1])) {
				index += 1;
				values.push(unquoteValue(lines[index].replace(/^\s+-\s+/, '').trim()));
			}
			frontmatter[key] = values;
		} else {
			frontmatter[key] = parseScalarValue(rawValue.trim());
		}
	}

	return { frontmatter, body };
}

export function buildBlogPost(raw: string, source = 'blog post'): BlogPost {
	const { frontmatter, body } = parseFrontmatter(raw);

	for (const field of REQUIRED_FIELDS) {
		if (frontmatter[field] === undefined) {
			throw new Error(`${source} is missing required frontmatter field: ${field}`);
		}
	}

	const title = requireString(frontmatter.title, 'title', source);
	const slug = requireString(frontmatter.slug, 'slug', source);
	const description = requireString(frontmatter.description, 'description', source);
	const publishedAt = requireDateString(frontmatter.publishedAt, 'publishedAt', source);
	const updatedAt =
		frontmatter.updatedAt === undefined
			? undefined
			: requireDateString(frontmatter.updatedAt, 'updatedAt', source);
	const author = requireString(frontmatter.author, 'author', source);
	const tags = requireStringArray(frontmatter.tags, 'tags', source);
	const category = requireString(frontmatter.category, 'category', source);
	const featured = requireBoolean(frontmatter.featured, 'featured', source);
	const coverImage =
		frontmatter.coverImage === undefined
			? undefined
			: requireString(frontmatter.coverImage, 'coverImage', source);
	const coverAlt =
		frontmatter.coverAlt === undefined
			? undefined
			: requireString(frontmatter.coverAlt, 'coverAlt', source);
	const draft =
		frontmatter.draft === undefined
			? undefined
			: requireBoolean(frontmatter.draft, 'draft', source);

	return {
		title,
		slug,
		description,
		publishedAt,
		updatedAt,
		author,
		tags,
		category,
		featured,
		coverImage,
		coverAlt,
		draft,
		readingTimeMinutes: calculateReadingTime(body),
		html: renderMarkdown(body)
	};
}

export async function getBlogPosts(): Promise<BlogPostMeta[]> {
	const posts = await loadBlogPosts();
	return posts.map(stripHtml);
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPostMeta[]> {
	const posts = await getBlogPosts();
	return posts.filter((post) => post.featured).slice(0, limit);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
	const posts = await loadBlogPosts();
	return posts.find((post) => post.slug === slug) ?? null;
}

export async function getBlogCategories(): Promise<string[]> {
	const posts = await getBlogPosts();
	return [...new Set(posts.map((post) => post.category))].sort((a, b) => a.localeCompare(b));
}

export async function getBlogTags(): Promise<string[]> {
	const posts = await getBlogPosts();
	return [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b));
}

function parseScalarValue(value: string): string | boolean {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return unquoteValue(value);
}

function unquoteValue(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function requireString(
	value: RawFrontmatterValue | undefined,
	field: string,
	source: string
): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${source} has invalid frontmatter field: ${field}`);
	}
	return value;
}

function requireDateString(
	value: RawFrontmatterValue | undefined,
	field: string,
	source: string
): string {
	const dateValue = requireString(value, field, source);
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`${source} has invalid date frontmatter field: ${field}`);
	}
	return dateValue;
}

function requireStringArray(
	value: RawFrontmatterValue | undefined,
	field: string,
	source: string
): string[] {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
		throw new Error(`${source} has invalid frontmatter field: ${field}`);
	}
	return value;
}

function requireBoolean(
	value: RawFrontmatterValue | undefined,
	field: string,
	source: string
): boolean {
	if (typeof value !== 'boolean') {
		throw new Error(`${source} has invalid frontmatter field: ${field}`);
	}
	return value;
}

function calculateReadingTime(markdown: string): number {
	const words = markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length;

	return Math.max(1, Math.ceil(words / 200));
}

async function loadBlogPosts(): Promise<BlogPost[]> {
	const posts = await Promise.all(
		Object.entries(postModules).map(async ([path, loadPost]) => buildBlogPost(await loadPost(), path))
	);

	return posts
		.filter((post) => dev || !post.draft)
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function stripHtml(post: BlogPost): BlogPostMeta {
	const { html: _html, ...meta } = post;
	return meta;
}
