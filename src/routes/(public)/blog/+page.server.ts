import { getBlogPosts, getFeaturedBlogPosts, partitionBlogListing } from '$lib/server/blog';

export async function load() {
	const [posts, featuredPosts] = await Promise.all([getBlogPosts(), getFeaturedBlogPosts(3)]);
	const { promptGuides, decisionGuides, latest } = partitionBlogListing(posts);

	return {
		posts: latest,
		promptGuides,
		decisionGuides,
		featuredPosts
	};
}
