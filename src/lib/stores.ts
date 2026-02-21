import { writable, derived } from 'svelte/store';
import type { Prompt, Tag, ThemeMode, SortOption } from './types';

// UI State
export const sidebarOpen = writable(false);
export const mobileMenuOpen = writable(false);
export const settingsOpen = writable(false);
export const aboutOpen = writable(false);

// Theme
export const theme = writable<ThemeMode>('system');

// Search and filter
export const searchQuery = writable('');
export const selectedTagIds = writable<string[]>([]);

// Sort
export const sortOption = writable<SortOption>({ field: 'createdAt', direction: 'desc' });

// Library data (populated from IndexedDB on mount)
export const prompts = writable<Prompt[]>([]);
export const tags = writable<Tag[]>([]);

// Editing state
export const editingPromptId = writable<string | null>(null);
export const isCreating = writable(false);

// Copy feedback
export const copiedPromptId = writable<string | null>(null);

// Import/Export modal
export const importExportOpen = writable(false);

// Filtered and sorted prompts (derived)
export const filteredPrompts = derived(
	[prompts, searchQuery, selectedTagIds, sortOption],
	([$prompts, $searchQuery, $selectedTagIds, $sortOption]) => {
		const query = $searchQuery.toLowerCase().trim();

		// Filter prompts
		const filtered = $prompts.filter((prompt) => {
			// Text search
			const matchesText =
				!query ||
				prompt.title.toLowerCase().includes(query) ||
				prompt.markdown.toLowerCase().includes(query);

			// Tag filter (AND logic)
			const matchesTags =
				$selectedTagIds.length === 0 ||
				$selectedTagIds.every((tagId) => prompt.tagIds.includes(tagId));

			return matchesText && matchesTags;
		});

		// Sort prompts
		const sorted = [...filtered].sort((a, b) => {
			const { field, direction } = $sortOption;
			let comparison = 0;

			if (field === 'title') {
				comparison = a.title.localeCompare(b.title);
			} else if (field === 'createdAt') {
				comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}

			return direction === 'asc' ? comparison : -comparison;
		});

		return sorted;
	}
);

// Helper to get tags by IDs
export function getTagsForPrompt(tagIds: string[], allTags: Tag[]): Tag[] {
	return tagIds.map((id) => allTags.find((t) => t.id === id)).filter((t): t is Tag => !!t);
}
