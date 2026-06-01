import { error } from '@sveltejs/kit';
import { getBlogPostBySlug, getBlogPosts } from '$lib/server/blog';

export async function load({ params }) {
	const post = await getBlogPostBySlug(params.slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	const posts = await getBlogPosts();
	const relatedPosts = posts
		.filter((candidate) => candidate.slug !== post.slug)
		.map((candidate) => ({
			post: candidate,
			score:
				(candidate.category === post.category ? 2 : 0) +
				candidate.tags.filter((tag) => post.tags.includes(tag)).length
		}))
		.filter((candidate) => candidate.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map((candidate) => candidate.post);

	return {
		post,
		relatedPosts
	};
}
