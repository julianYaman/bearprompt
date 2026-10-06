import { describe, expect, it } from 'vitest';
import { buildBlogPost, parseFrontmatter, partitionBlogListing } from './blog';

const validPost = `---
title: "Example Post"
slug: "example-post"
description: "An example post."
publishedAt: "2026-05-14"
author: "Bearprompt"
tags:
  - privacy
  - workflows
category: "Guides"
featured: true
---

# Hello

This is a test post with <script>alert('bad')</script> unsafe markup.
`;

describe('blog content helpers', () => {
	it('parses frontmatter and markdown body', () => {
		const { frontmatter, body } = parseFrontmatter(validPost);

		expect(frontmatter.title).toBe('Example Post');
		expect(frontmatter.tags).toEqual(['privacy', 'workflows']);
		expect(frontmatter.featured).toBe(true);
		expect(body).toContain('# Hello');
	});

	it('builds a sanitized blog post', () => {
		const post = buildBlogPost(validPost);

		expect(post.slug).toBe('example-post');
		expect(post.readingTimeMinutes).toBe(1);
		expect(post.html).toContain('<h1>Hello</h1>');
		expect(post.html).not.toContain('<script>');
	});

	it('rejects missing required metadata', () => {
		const invalidPost = validPost.replace('featured: true\n', '');

		expect(() => buildBlogPost(invalidPost)).toThrow(/featured/);
	});

	it('rejects invalid dates', () => {
		const invalidPost = validPost.replace('publishedAt: "2026-05-14"', 'publishedAt: "not-a-date"');

		expect(() => buildBlogPost(invalidPost)).toThrow(/publishedAt/);
	});

	it('keeps Prompt Guides out of Latest Posts', () => {
		const { promptGuides, latest } = partitionBlogListing([
			{
				title: 'Featured product note',
				slug: 'product',
				description: 'Product',
				publishedAt: '2026-05-14',
				author: 'Bearprompt',
				tags: ['product'],
				category: 'Product Updates',
				featured: true,
				readingTimeMinutes: 3
			},
			{
				title: 'Prompts to use with Mistral Large 4',
				slug: 'prompts-to-use-mistral-large-4',
				description: 'Mistral',
				publishedAt: '2026-10-06',
				author: 'Bearprompt',
				tags: ['mistral'],
				category: 'Prompt Guides',
				featured: false,
				readingTimeMinutes: 6
			}
		]);

		expect(promptGuides.map((post) => post.slug)).toEqual(['prompts-to-use-mistral-large-4']);
		expect(latest.map((post) => post.slug)).toEqual(['product']);
	});
});
