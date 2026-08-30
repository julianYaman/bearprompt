export const MAX_SEARCH_LENGTH = 200;

export function normalizeSearchQuery(query: string): string {
	return query.trim().slice(0, MAX_SEARCH_LENGTH);
}

/** Quote a value for PostgREST filters so commas and operators cannot break `.or()`. */
export function escapePostgrestQuotedValue(value: string): string {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '""')}"`;
}

export function buildPromptSearchOrFilter(query: string): string {
	const quoted = escapePostgrestQuotedValue(`%${query}%`);
	return `title.ilike.${quoted},description.ilike.${quoted},prompt.ilike.${quoted}`;
}
