import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { Prompt, Tag, Folder, Settings, ExportData } from './types';

const DB_NAME = 'promptlib';
const DB_VERSION = 2;

interface PromptLibDB extends DBSchema {
	prompts: {
		key: string;
		value: Prompt;
		indexes: { 'by-title': string; 'by-updated': string; 'by-folder': string };
	};
	tags: {
		key: string;
		value: Tag;
		indexes: { 'by-name': string; 'by-slug': string };
	};
	folders: {
		key: string;
		value: Folder;
		indexes: { 'by-name': string };
	};
	settings: {
		key: number;
		value: Settings;
	};
}

let dbInstance: IDBPDatabase<PromptLibDB> | null = null;

async function getDB(): Promise<IDBPDatabase<PromptLibDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<PromptLibDB>(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion, _newVersion, transaction) {
			// Prompts store
			if (!db.objectStoreNames.contains('prompts')) {
				const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
				promptStore.createIndex('by-title', 'title');
				promptStore.createIndex('by-updated', 'updatedAt');
				promptStore.createIndex('by-folder', 'folderId');
			}

			// Tags store
			if (!db.objectStoreNames.contains('tags')) {
				const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
				tagStore.createIndex('by-name', 'name');
				tagStore.createIndex('by-slug', 'slug');
			}

			// Settings store
			if (!db.objectStoreNames.contains('settings')) {
				db.createObjectStore('settings', { keyPath: 'version' });
			}

			// Folders store (added in version 2)
			if (oldVersion < 2) {
				if (!db.objectStoreNames.contains('folders')) {
					const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
					folderStore.createIndex('by-name', 'name');
				}
				// Add by-folder index to existing prompts store if upgrading
				if (db.objectStoreNames.contains('prompts') && transaction) {
					const promptStore = transaction.objectStore('prompts');
					if (!promptStore.indexNames.contains('by-folder')) {
						promptStore.createIndex('by-folder', 'folderId');
					}
				}
			}
		}
	});

	return dbInstance;
}

// Helper to generate slug from tag name
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// ============ PROMPTS ============

export async function getAllPrompts(): Promise<Prompt[]> {
	const db = await getDB();
	const prompts = await db.getAllFromIndex('prompts', 'by-updated');
	return prompts.reverse(); // Most recent first
}

export async function getPromptById(id: string): Promise<Prompt | undefined> {
	const db = await getDB();
	return db.get('prompts', id);
}

export async function createPrompt(
	title: string,
	markdown: string,
	tagIds: string[],
	folderId: string | null = null
): Promise<Prompt> {
	const db = await getDB();
	const now = new Date().toISOString();
	const prompt: Prompt = {
		id: uuidv4(),
		title,
		markdown,
		tagIds: [...tagIds], // Convert to plain array (handles Svelte 5 Proxy)
		folderId,
		createdAt: now,
		updatedAt: now
	};
	await db.put('prompts', prompt);
	return prompt;
}

export async function updatePrompt(
	id: string,
	updates: Partial<Pick<Prompt, 'title' | 'markdown' | 'tagIds' | 'folderId'>>
): Promise<Prompt | undefined> {
	const db = await getDB();
	const existing = await db.get('prompts', id);
	if (!existing) return undefined;

	const updated: Prompt = {
		...existing,
		...updates,
		// Ensure tagIds is a plain array (handles Svelte 5 Proxy)
		tagIds: updates.tagIds ? [...updates.tagIds] : existing.tagIds,
		// Preserve existing folderId if not in updates, handle undefined vs null
		folderId: 'folderId' in updates ? updates.folderId! : (existing.folderId ?? null),
		updatedAt: new Date().toISOString()
	};
	await db.put('prompts', updated);
	return updated;
}

export async function deletePrompt(id: string): Promise<boolean> {
	const db = await getDB();
	const existing = await db.get('prompts', id);
	if (!existing) return false;
	await db.delete('prompts', id);
	return true;
}

export async function searchPrompts(query: string, tagIds?: string[]): Promise<Prompt[]> {
	const prompts = await getAllPrompts();
	const lowerQuery = query.toLowerCase().trim();

	return prompts.filter((prompt) => {
		// Text search
		const matchesText =
			!lowerQuery ||
			prompt.title.toLowerCase().includes(lowerQuery) ||
			prompt.markdown.toLowerCase().includes(lowerQuery);

		// Tag filter (AND logic)
		const matchesTags =
			!tagIds || tagIds.length === 0 || tagIds.every((tagId) => prompt.tagIds.includes(tagId));

		return matchesText && matchesTags;
	});
}

// ============ TAGS ============

export async function getAllTags(): Promise<Tag[]> {
	const db = await getDB();
	return db.getAllFromIndex('tags', 'by-name');
}

export async function getTagById(id: string): Promise<Tag | undefined> {
	const db = await getDB();
	return db.get('tags', id);
}

export async function getTagsByIds(ids: string[]): Promise<Tag[]> {
	const db = await getDB();
	const tags: Tag[] = [];
	for (const id of ids) {
		const tag = await db.get('tags', id);
		if (tag) tags.push(tag);
	}
	return tags;
}

export async function createTag(name: string): Promise<Tag> {
	const db = await getDB();
	const now = new Date().toISOString();
	const tag: Tag = {
		id: uuidv4(),
		name: name.trim(),
		slug: generateSlug(name),
		createdAt: now
	};
	await db.put('tags', tag);
	return tag;
}

export async function updateTag(id: string, name: string): Promise<Tag | undefined> {
	const db = await getDB();
	const existing = await db.get('tags', id);
	if (!existing) return undefined;

	const updated: Tag = {
		...existing,
		name: name.trim(),
		slug: generateSlug(name)
	};
	await db.put('tags', updated);
	return updated;
}

export async function deleteTag(id: string): Promise<boolean> {
	const db = await getDB();
	const existing = await db.get('tags', id);
	if (!existing) return false;
	await db.delete('tags', id);
	return true;
}

export async function getTagByName(name: string): Promise<Tag | undefined> {
	const db = await getDB();
	return db.getFromIndex('tags', 'by-name', name.trim());
}

export async function deletePrompts(ids: string[]): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('prompts', 'readwrite');
	await Promise.all(ids.map((id) => tx.store.delete(id)));
	await tx.done;
}

export async function movePrompts(ids: string[], folderId: string | null): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('prompts', 'readwrite');
	await Promise.all(
		ids.map(async (id) => {
			const prompt = await tx.store.get(id);
			if (prompt) {
				await tx.store.put({ ...prompt, folderId });
			}
		})
	);
	await tx.done;
}

export async function deleteTags(ids: string[]): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('tags', 'readwrite');
	await Promise.all(ids.map((id) => tx.store.delete(id)));
	await tx.done;
}

// ============ FOLDERS ============

export async function getAllFolders(): Promise<Folder[]> {
	const db = await getDB();
	return db.getAllFromIndex('folders', 'by-name');
}

export async function getFolderById(id: string): Promise<Folder | undefined> {
	const db = await getDB();
	return db.get('folders', id);
}

export async function createFolder(name: string): Promise<Folder> {
	const db = await getDB();
	const now = new Date().toISOString();
	const folder: Folder = {
		id: uuidv4(),
		name: name.trim(),
		createdAt: now,
		updatedAt: now
	};
	await db.put('folders', folder);
	return folder;
}

export async function updateFolder(id: string, name: string): Promise<Folder | undefined> {
	const db = await getDB();
	const existing = await db.get('folders', id);
	if (!existing) return undefined;

	const updated: Folder = {
		...existing,
		name: name.trim(),
		updatedAt: new Date().toISOString()
	};
	await db.put('folders', updated);
	return updated;
}

export async function deleteFolder(id: string): Promise<{ promptsDeleted: number }> {
	const db = await getDB();
	
	// Get all prompts in this folder first
	const allPrompts = await getAllPrompts();
	const promptsInFolder = allPrompts.filter((p) => p.folderId === id);
	const promptIdsToDelete = promptsInFolder.map((p) => p.id);
	
	// Delete folder and its prompts in a single transaction
	const tx = db.transaction(['folders', 'prompts'], 'readwrite');
	const folderStore = tx.objectStore('folders');
	const promptStore = tx.objectStore('prompts');
	
	await folderStore.delete(id);
	await Promise.all(promptIdsToDelete.map((pid) => promptStore.delete(pid)));
	await tx.done;
	
	return { promptsDeleted: promptIdsToDelete.length };
}

export async function getFolderByName(name: string): Promise<Folder | undefined> {
	const db = await getDB();
	return db.getFromIndex('folders', 'by-name', name.trim());
}

// ============ SETTINGS ============

const DEFAULT_SETTINGS: Settings = {
	version: 1,
	theme: 'system',
	ui: {
		cardSize: 'm'
	}
};

export async function getSettings(): Promise<Settings> {
	const db = await getDB();
	const settings = await db.get('settings', 1);
	return settings || DEFAULT_SETTINGS;
}

export async function updateSettings(updates: Partial<Omit<Settings, 'version'>>): Promise<Settings> {
	const db = await getDB();
	const current = await getSettings();
	const updated: Settings = {
		...current,
		...updates,
		version: 1
	};
	await db.put('settings', updated);
	return updated;
}

// ============ IMPORT / EXPORT ============

export async function exportLibrary(): Promise<ExportData> {
	const [prompts, tags, folders] = await Promise.all([getAllPrompts(), getAllTags(), getAllFolders()]);

	return {
		exportVersion: 1,
		exportedAt: new Date().toISOString(),
		data: {
			prompts,
			tags,
			folders
		}
	};
}

export interface ImportResult {
	promptsImported: number;
	tagsImported: number;
	foldersImported: number;
	promptsSkipped: number;
	tagsSkipped: number;
	foldersSkipped: number;
}

export async function importLibrary(data: ExportData): Promise<ImportResult> {
	const db = await getDB();

	// Get existing IDs to handle collisions
	const existingPrompts = await getAllPrompts();
	const existingTags = await getAllTags();
	const existingFolders = await getAllFolders();
	const existingPromptIds = new Set(existingPrompts.map((p) => p.id));
	const existingTagIds = new Set(existingTags.map((t) => t.id));
	const existingFolderIds = new Set(existingFolders.map((f) => f.id));
	// Build a name→id map for deduplication by name
	const existingTagsByName = new Map(existingTags.map((t) => [t.name.toLowerCase(), t.id]));
	const existingFoldersByName = new Map(existingFolders.map((f) => [f.name.toLowerCase(), f.id]));

	const result: ImportResult = {
		promptsImported: 0,
		tagsImported: 0,
		foldersImported: 0,
		promptsSkipped: 0,
		tagsSkipped: 0,
		foldersSkipped: 0
	};

	// Import folders first (since prompts reference them)
	const folderIdMap = new Map<string, string>(); // old ID -> new ID
	const importFolders = data.data.folders || []; // Handle old export files without folders

	for (const folder of importFolders) {
		// Deduplicate by name first (case-insensitive)
		const nameKey = folder.name.trim().toLowerCase();
		const existingByName = existingFoldersByName.get(nameKey);
		if (existingByName) {
			// Map the incoming ID to the existing folder — skip writing
			folderIdMap.set(folder.id, existingByName);
			result.foldersSkipped++;
			continue;
		}

		let newId = folder.id;
		if (existingFolderIds.has(newId)) {
			newId = uuidv4();
		}
		folderIdMap.set(folder.id, newId);

		const newFolder: Folder = {
			...folder,
			id: newId
		};
		await db.put('folders', newFolder);
		existingFolderIds.add(newId);
		existingFoldersByName.set(nameKey, newId);
		result.foldersImported++;
	}

	// Import tags (since prompts reference them)
	const tagIdMap = new Map<string, string>(); // old ID -> new ID

	for (const tag of data.data.tags) {
		// Deduplicate by name first (case-insensitive)
		const nameKey = tag.name.trim().toLowerCase();
		const existingByName = existingTagsByName.get(nameKey);
		if (existingByName) {
			// Map the incoming ID to the existing tag — skip writing
			tagIdMap.set(tag.id, existingByName);
			result.tagsSkipped++;
			continue;
		}

		let newId = tag.id;
		if (existingTagIds.has(newId)) {
			newId = uuidv4();
		}
		tagIdMap.set(tag.id, newId);

		const newTag: Tag = {
			...tag,
			id: newId
		};
		await db.put('tags', newTag);
		existingTagIds.add(newId);
		existingTagsByName.set(nameKey, newId);
		result.tagsImported++;
	}

	// Import prompts
	for (const prompt of data.data.prompts) {
		let newId = prompt.id;
		if (existingPromptIds.has(newId)) {
			newId = uuidv4();
		}

		// Remap tag IDs
		const newTagIds = prompt.tagIds.map((oldId) => tagIdMap.get(oldId) || oldId);
		
		// Remap folder ID (handle old exports without folderId)
		const oldFolderId = prompt.folderId ?? null;
		const newFolderId = oldFolderId ? (folderIdMap.get(oldFolderId) || oldFolderId) : null;

		const newPrompt: Prompt = {
			...prompt,
			id: newId,
			tagIds: newTagIds,
			folderId: newFolderId
		};
		await db.put('prompts', newPrompt);
		existingPromptIds.add(newId);
		result.promptsImported++;
	}

	return result;
}

export function validateImportData(data: unknown): data is ExportData {
	if (!data || typeof data !== 'object') return false;

	const d = data as Record<string, unknown>;
	if (d.exportVersion !== 1) return false;
	if (typeof d.exportedAt !== 'string') return false;
	if (!d.data || typeof d.data !== 'object') return false;

	const inner = d.data as Record<string, unknown>;
	if (!Array.isArray(inner.prompts)) return false;
	if (!Array.isArray(inner.tags)) return false;
	// folders is optional for backward compatibility with old exports
	if (inner.folders !== undefined && !Array.isArray(inner.folders)) return false;

	return true;
}
