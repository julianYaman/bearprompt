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

/**
 * Estimate token count using a lightweight character-based heuristic.
 */
export function estimateTokenCount(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;

	return Math.max(1, Math.ceil(trimmed.length / 4));
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

// ─── Color Utilities ──────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
	const normalized = hex.trim().replace('#', '');
	const expanded =
		normalized.length === 3
			? normalized
					.split('')
					.map((char) => char + char)
					.join('')
			: normalized;

	if (!/^[\da-fA-F]{6}$/.test(expanded)) {
		return `rgba(255, 255, 255, ${alpha})`;
	}

	const red = Number.parseInt(expanded.slice(0, 2), 16);
	const green = Number.parseInt(expanded.slice(2, 4), 16);
	const blue = Number.parseInt(expanded.slice(4, 6), 16);

	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function buildFeatureGradient(color: string, alpha = 0.2): string {
	return `linear-gradient(180deg, ${hexToRgba(color, alpha)} 0%, rgba(0, 0, 0, 0) 100%)`;
}

export function buildFeatureBorder(color: string, alpha = 0.55): string {
	return hexToRgba(color, alpha);
}

export function resolveThemeIsDark(
	themeMode: 'system' | 'light' | 'dark',
	systemPrefersDark: boolean
): boolean {
	if (themeMode === 'system') {
		return systemPrefersDark;
	}

	return themeMode === 'dark';
}

export function resolveFeaturedAuthorColor(
	author: {
		featured_color_light: string | null;
		featured_color_dark: string | null;
	},
	isDark: boolean
): string | null {
	return isDark
		? (author.featured_color_dark ?? author.featured_color_light)
		: (author.featured_color_light ?? author.featured_color_dark);
}

export function resolveFeaturedCategoryColor(
	category: {
		color: string;
		color_light?: string | null;
		color_dark?: string | null;
	},
	isDark: boolean
): string {
	return isDark
		? (category.color_dark ?? category.color_light ?? category.color)
		: (category.color_light ?? category.color_dark ?? category.color);
}
