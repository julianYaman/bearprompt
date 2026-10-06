import type { Folder, FolderExportData, Prompt, Tag } from './types';

export const FOLDER_EXPORT_KIND = 'folder' as const;
export const LIBRARY_EXPORT_KIND = 'library' as const;
export const FOLDER_EXPORT_VERSION = 1;

export interface FolderImportPlan {
	folder: Folder;
	prompts: Prompt[];
	tagsToCreate: Tag[];
	tagsSkipped: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object';
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isFolderLike(value: unknown): value is Folder {
	if (!isRecord(value)) return false;
	return isNonEmptyString(value.id) && isNonEmptyString(value.name);
}

function isTagLike(value: unknown): value is Tag {
	if (!isRecord(value)) return false;
	return isNonEmptyString(value.id) && isNonEmptyString(value.name);
}

function isPromptLike(value: unknown): value is Prompt {
	if (!isRecord(value)) return false;
	return (
		isNonEmptyString(value.id) &&
		typeof value.title === 'string' &&
		typeof value.markdown === 'string' &&
		Array.isArray(value.tagIds) &&
		value.tagIds.every((tagId) => typeof tagId === 'string')
	);
}

export function uniqueFolderName(desired: string, existingNames: string[]): string {
	const base = desired.trim() || 'Folder';
	const taken = new Set(existingNames.map((name) => name.trim().toLowerCase()));
	if (!taken.has(base.toLowerCase())) return base;

	let suffix = 2;
	while (taken.has(`${base} (${suffix})`.toLowerCase())) {
		suffix += 1;
	}
	return `${base} (${suffix})`;
}

export function buildFolderExport(
	folder: Folder,
	allPrompts: Prompt[],
	allTags: Tag[],
	exportedAt = new Date().toISOString()
): FolderExportData {
	const prompts = allPrompts.filter((prompt) => prompt.folderId === folder.id);
	const usedTagIds = new Set(prompts.flatMap((prompt) => prompt.tagIds));
	const tags = allTags.filter((tag) => usedTagIds.has(tag.id));

	return {
		kind: FOLDER_EXPORT_KIND,
		exportVersion: FOLDER_EXPORT_VERSION,
		exportedAt,
		data: {
			folder,
			prompts,
			tags
		}
	};
}

export function isFolderExportData(data: unknown): data is FolderExportData {
	if (!isRecord(data)) return false;
	if (data.kind !== FOLDER_EXPORT_KIND) return false;
	if (data.exportVersion !== FOLDER_EXPORT_VERSION) return false;
	if (typeof data.exportedAt !== 'string' || !data.exportedAt) return false;
	if (!isRecord(data.data)) return false;
	if (!isFolderLike(data.data.folder)) return false;
	if (!Array.isArray(data.data.prompts) || !data.data.prompts.every(isPromptLike)) return false;
	if (!Array.isArray(data.data.tags) || !data.data.tags.every(isTagLike)) return false;
	return true;
}

export function planFolderImport(
	data: FolderExportData,
	existingFolders: Folder[],
	existingTags: Tag[],
	now = new Date().toISOString(),
	createId: () => string
): FolderImportPlan {
	const folder: Folder = {
		id: createId(),
		name: uniqueFolderName(
			data.data.folder.name,
			existingFolders.map((existing) => existing.name)
		),
		createdAt: now,
		updatedAt: now
	};

	const tagsByName = new Map(existingTags.map((tag) => [tag.name.trim().toLowerCase(), tag]));
	const tagIdMap = new Map<string, string>();
	const tagsToCreate: Tag[] = [];
	let tagsSkipped = 0;

	for (const tag of data.data.tags) {
		if (tagIdMap.has(tag.id)) continue;

		const nameKey = tag.name.trim().toLowerCase();
		const existing = tagsByName.get(nameKey);
		if (existing) {
			tagIdMap.set(tag.id, existing.id);
			tagsSkipped += 1;
			continue;
		}

		const newTag: Tag = {
			...tag,
			id: createId(),
			name: tag.name.trim()
		};
		tagsToCreate.push(newTag);
		tagIdMap.set(tag.id, newTag.id);
		tagsByName.set(nameKey, newTag);
	}

	const prompts: Prompt[] = data.data.prompts.map((prompt) => ({
		...prompt,
		id: createId(),
		folderId: folder.id,
		tagIds: prompt.tagIds
			.map((oldId) => tagIdMap.get(oldId))
			.filter((tagId): tagId is string => Boolean(tagId))
	}));

	return { folder, prompts, tagsToCreate, tagsSkipped };
}
