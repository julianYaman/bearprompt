import { describe, expect, it } from 'vitest';
import type { Folder, FolderExportData, Prompt, Tag } from './types';
import {
	FOLDER_EXPORT_KIND,
	FOLDER_EXPORT_VERSION,
	buildFolderExport,
	isFolderExportData,
	planFolderImport,
	uniqueFolderName
} from './folder-export';

const folder: Folder = {
	id: 'folder-writing',
	name: 'Writing',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
};

const otherFolder: Folder = {
	id: 'folder-seo',
	name: 'SEO',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
};

const tags: Tag[] = [
	{ id: 'tag-blog', name: 'blog', slug: 'blog', createdAt: '2026-01-01T00:00:00.000Z' },
	{ id: 'tag-unused', name: 'unused', slug: 'unused', createdAt: '2026-01-01T00:00:00.000Z' }
];

const prompts: Prompt[] = [
	{
		id: 'prompt-1',
		title: 'Blog outline',
		markdown: 'Write an outline for {{topic}}',
		tagIds: ['tag-blog'],
		folderId: 'folder-writing',
		createdAt: '2026-01-02T00:00:00.000Z',
		updatedAt: '2026-01-02T00:00:00.000Z'
	},
	{
		id: 'prompt-2',
		title: 'SEO audit',
		markdown: 'Audit this page',
		tagIds: ['tag-unused'],
		folderId: 'folder-seo',
		createdAt: '2026-01-03T00:00:00.000Z',
		updatedAt: '2026-01-03T00:00:00.000Z'
	},
	{
		id: 'prompt-unfiled',
		title: 'Scratch',
		markdown: 'Unfiled note',
		tagIds: [],
		folderId: null,
		createdAt: '2026-01-04T00:00:00.000Z',
		updatedAt: '2026-01-04T00:00:00.000Z'
	}
];

function createIds() {
	let n = 0;
	return () => `new-${++n}`;
}

describe('uniqueFolderName', () => {
	it('keeps the original name when it is free', () => {
		expect(uniqueFolderName('Writing', ['SEO'])).toBe('Writing');
	});

	it('adds a numeric suffix when the name is taken, case-insensitively', () => {
		expect(uniqueFolderName('Writing', ['writing'])).toBe('Writing (2)');
		expect(uniqueFolderName('Writing', ['Writing', 'Writing (2)'])).toBe('Writing (3)');
	});

	it('trims whitespace and falls back when the name is empty', () => {
		expect(uniqueFolderName('  Writing  ', [])).toBe('Writing');
		expect(uniqueFolderName('   ', ['Inbox'])).toBe('Folder');
	});
});

describe('buildFolderExport', () => {
	it('includes only the folder, its prompts, and tags those prompts use', () => {
		const exported = buildFolderExport(folder, prompts, tags, '2026-04-01T00:00:00.000Z');

		expect(exported).toEqual({
			kind: FOLDER_EXPORT_KIND,
			exportVersion: FOLDER_EXPORT_VERSION,
			exportedAt: '2026-04-01T00:00:00.000Z',
			data: {
				folder,
				prompts: [prompts[0]],
				tags: [tags[0]]
			}
		});
	});

	it('exports an empty folder without tags', () => {
		const exported = buildFolderExport(folder, [], tags, '2026-04-01T00:00:00.000Z');
		expect(exported.data.prompts).toEqual([]);
		expect(exported.data.tags).toEqual([]);
	});
});

describe('isFolderExportData', () => {
	it('accepts a valid folder export', () => {
		expect(isFolderExportData(buildFolderExport(folder, prompts, tags))).toBe(true);
	});

	it('rejects full library exports and other payloads', () => {
		expect(
			isFolderExportData({
				kind: 'library',
				exportVersion: 1,
				exportedAt: '2026-04-01T00:00:00.000Z',
				data: { prompts: [], tags: [], folders: [] }
			})
		).toBe(false);
		expect(
			isFolderExportData({
				exportVersion: 1,
				exportedAt: '2026-04-01T00:00:00.000Z',
				data: { prompts: [], tags: [], folders: [] }
			})
		).toBe(false);
		expect(isFolderExportData({ kind: 'folder' })).toBe(false);
	});
});

describe('planFolderImport', () => {
	const exported: FolderExportData = buildFolderExport(
		folder,
		prompts,
		tags,
		'2026-04-01T00:00:00.000Z'
	);

	it('always creates a new folder, even when the name is free', () => {
		const plan = planFolderImport(exported, [], [], '2026-05-01T00:00:00.000Z', createIds());

		expect(plan.folder).toEqual({
			id: 'new-1',
			name: 'Writing',
			createdAt: '2026-05-01T00:00:00.000Z',
			updatedAt: '2026-05-01T00:00:00.000Z'
		});
		expect(plan.folder.id).not.toBe(folder.id);
	});

	it('renames the folder when the recipient already has that name', () => {
		const plan = planFolderImport(
			exported,
			[folder],
			[],
			'2026-05-01T00:00:00.000Z',
			createIds()
		);
		expect(plan.folder.name).toBe('Writing (2)');
	});

	it('assigns new prompt ids to the new folder and merges tags by name', () => {
		const existingTag: Tag = {
			id: 'local-blog',
			name: 'Blog',
			slug: 'blog',
			createdAt: '2025-01-01T00:00:00.000Z'
		};
		const plan = planFolderImport(
			exported,
			[],
			[existingTag],
			'2026-05-01T00:00:00.000Z',
			createIds()
		);

		expect(plan.tagsToCreate).toEqual([]);
		expect(plan.tagsSkipped).toBe(1);
		expect(plan.prompts).toEqual([
			{
				...prompts[0],
				id: 'new-2',
				folderId: 'new-1',
				tagIds: ['local-blog']
			}
		]);
	});

	it('creates missing tags and drops unknown tag ids', () => {
		const withUnknownTag: FolderExportData = {
			...exported,
			data: {
				...exported.data,
				prompts: [
					{
						...prompts[0],
						tagIds: ['tag-blog', 'tag-missing']
					}
				]
			}
		};
		const plan = planFolderImport(
			withUnknownTag,
			[],
			[],
			'2026-05-01T00:00:00.000Z',
			createIds()
		);

		expect(plan.tagsToCreate).toEqual([
			{
				...tags[0],
				id: 'new-2'
			}
		]);
		expect(plan.prompts[0].tagIds).toEqual(['new-2']);
	});
});
