import { describe, expect, it } from 'vitest';
import { buildBlogPost, parseFrontmatter } from './blog';

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
});
