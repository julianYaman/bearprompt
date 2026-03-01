// ─── Shared Constants ─────────────────────────────────────────────────────────

/** Maximum number of tags shown inline on a prompt card before showing "+N more". */
export const MAX_VISIBLE_TAGS = 3;

/** Duration (ms) the "Copied!" state is shown after copying to clipboard. */
export const COPY_TIMEOUT_MS = 1500;

/** Maximum allowed length (characters) for a prompt title. */
export const MAX_TITLE_LENGTH = 200;

/** Maximum number of prompt cards shown per author row before a "See All" card appears. */
export const AUTHOR_ROW_LIMIT = 6;

// ─── Text Utilities ───────────────────────────────────────────────────────────

/**
 * Strip basic Markdown syntax from a string, returning plain text suitable
 * for use in card previews.
 */
export function stripMarkdown(text: string): string {
	return text
		.replace(/#{1,6}\s/g, '') // headers
		.replace(/\*\*|__/g, '') // bold
		.replace(/\*|_/g, '') // italic
		.replace(/`{1,3}[^`]*`{1,3}/g, '') // inline/fenced code
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → label only
		.replace(/^\s*[-*+]\s/gm, '') // unordered list items
		.replace(/^\s*\d+\.\s/gm, '') // ordered list items
		.trim();
}

// ─── Export / Download Utilities ─────────────────────────────────────────────

/**
 * Serialise `data` as formatted JSON and trigger a browser file download.
 *
 * @param data     The object to serialise.
 * @param filename The suggested filename for the downloaded file.
 */
export function downloadJson(data: unknown, filename: string): void {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Build the standard export filename: `promptlib-export-v1-YYYYMMDD.json`.
 */
export function buildExportFilename(): string {
	const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
	return `promptlib-export-v1-${date}.json`;
}
