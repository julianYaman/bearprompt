// Types for the public prompt library (Supabase data)

export interface PublicAuthor {
	id: string;
	created_at: string;
	name: string;
	slug: string;
	public_description: string | null;
	link: string | null;
	verified: boolean;
	avatar_url: string | null;
	highlighted: boolean;
}

export interface PublicTag {
	id: string;
	name: string;
}

export interface PublicPrompt {
	id: string;
	created_at: string;
	title: string;
	slug: string;
	prompt: string;
	description: string | null;
	author_id: string;
	author?: PublicAuthor;
	tags: PublicTag[];
}

export interface AuthorWithPrompts extends PublicAuthor {
	prompts: PublicPrompt[];
	totalPrompts: number;
}

export interface PublicLibraryData {
	highlightedAuthors: AuthorWithPrompts[];
	authors: AuthorWithPrompts[];
	totalAuthors: number;
	currentPage: number;
	totalPages: number;
}

export interface SearchResults {
	prompts: PublicPrompt[];
	totalResults: number;
	currentPage: number;
	totalPages: number;
	query: string;
}

export interface AuthorPageData {
	author: PublicAuthor;
	prompts: PublicPrompt[];
	totalPrompts: number;
	currentPage: number;
	totalPages: number;
}
