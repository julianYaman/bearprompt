// Prompt Library Types

export interface Prompt {
	id: string;
	title: string;
	markdown: string;
	tagIds: string[];
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
}

export interface Settings {
	version: number;
	theme: 'system' | 'light' | 'dark';
	ui: {
		cardSize: 'm' | 'l';
	};
}

export interface ExportData {
	exportVersion: number;
	exportedAt: string;
	data: {
		prompts: Prompt[];
		tags: Tag[];
	};
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type SortField = 'title' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
	field: SortField;
	direction: SortDirection;
}
