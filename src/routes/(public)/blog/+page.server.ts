import { getBlogPosts, getFeaturedBlogPosts } from '$lib/server/blog';

export async function load() {
	const [posts, featuredPosts] = await Promise.all([getBlogPosts(), getFeaturedBlogPosts(3)]);

	return {
		posts,
		featuredPosts
	};
}
