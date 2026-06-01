export interface BlogPostMeta {
	title: string;
	slug: string;
	description: string;
	publishedAt: string;
	updatedAt?: string;
	author: string;
	tags: string[];
	category: string;
	featured: boolean;
	coverImage?: string;
	coverAlt?: string;
	draft?: boolean;
	readingTimeMinutes: number;
}

export interface BlogPost extends BlogPostMeta {
	html: string;
}
