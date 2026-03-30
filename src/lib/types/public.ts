// Types for the public prompt library (Supabase data)

export type CategoryIconKey =
	| 'sparkles'
	| 'pencil-line'
	| 'briefcase'
	| 'megaphone'
	| 'code'
	| 'square-check';

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
	featured_color_light: string | null;
	featured_color_dark: string | null;
}

export interface PublicTag {
	id: string;
	name: string;
}

export type PromptType = 'prompt' | 'agent' | 'skill';

export interface PublicPrompt {
	id: string;
	created_at: string;
	title: string;
	slug: string;
	prompt: string;
	description: string | null;
	additional_information: string | null;
	author_id: string;
	type: PromptType;
	author?: PublicAuthor;
	tags: PublicTag[];
	tools?: AgentToolWithSetupUrl[];
}

export interface PublicCategory {
	id: string;
	slug: string;
	name: string;
	description: string;
	color: string;
	icon_key: CategoryIconKey | null;
	image_url?: string;
	promptCount: number;
	tags: PublicTag[];
	externalUrl?: string;
}

export interface AgentTool {
	id: string;
	name: string;
	slug: string;
	url: string | null;
}

export interface AgentToolWithSetupUrl extends AgentTool {
	setup_url: string | null;
}

export interface AuthorWithPrompts extends PublicAuthor {
	prompts: PublicPrompt[];
	totalPrompts: number;
}

export interface PublicLibraryData {
	featuredCategories?: PublicCategory[];
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

export interface CategoryPageData {
	category: PublicCategory;
	prompts: PublicPrompt[];
	totalPrompts: number;
	currentPage: number;
	totalPages: number;
}

// Extended author page data with prompts grouped by type
export interface AuthorPageDataGrouped {
	author: PublicAuthor;
	regularPrompts: PublicPrompt[];
	agentPrompts: PublicPrompt[];
	totalRegularPrompts: number;
	totalAgentPrompts: number;
	currentPage: number;
	totalPages: number;
}

// Agent library uses same structure as public library
export type AgentLibraryData = PublicLibraryData;
