// Prompt Library Types

export interface Prompt {
	id: string;
	title: string;
	markdown: string;
	tagIds: string[];
	folderId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Folder {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
}

export interface AiProviderConfig {
	id: string;
	name: string;
	urlTemplate: string;
	isBuiltIn: boolean;
	enabled: boolean;
	sortOrder: number;
}

export interface Settings {
	version: number;
	theme: 'system' | 'light' | 'dark';
	hasCompletedOnboarding: boolean;
	/** Id of the What's New Highlight the user last acknowledged, or null if none. */
	lastSeenWhatsNewId: string | null;
	ui: {
		cardSize: 'm' | 'l';
	};
	aiProviders: AiProviderConfig[];
}

export interface ExportData {
	exportVersion: number;
	exportedAt: string;
	data: {
		prompts: Prompt[];
		tags: Tag[];
		folders: Folder[];
		aiProviders?: AiProviderConfig[];
	};
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type SortField = 'title' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
	field: SortField;
	direction: SortDirection;
}
