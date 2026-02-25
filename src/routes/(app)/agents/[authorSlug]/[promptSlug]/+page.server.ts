import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getPromptBySlug } from '$lib/server/queries';
import { getCachedPromptData, CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Renders Markdown to HTML and sanitizes the result server-side.
 *
 * sanitize-html's allowlist ensures no XSS vectors survive:
 *  - Only a strict set of structural/typographic tags are allowed.
 *  - All event handlers (onload, onerror, onclick, …) are stripped.
 *  - Only safe URL schemes (http, https, mailto, ftp) are permitted on href/src.
 *  - The `javascript:` scheme is never allowed.
 *  - `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, and `<form>` are
 *    not in the allowlist and are therefore removed entirely along with their content.
 */
function renderMarkdown(raw: string): string {
	const html = marked.parse(raw, { gfm: true, breaks: true }) as string;

	return sanitizeHtml(html, {
		allowedTags: [
			// Structure
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'br', 'hr', 'div', 'span',
			// Lists
			'ul', 'ol', 'li',
			// Inline text
			'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
			// Code
			'code', 'pre', 'kbd', 'samp',
			// Links & media
			'a', 'img',
			// Quotes & semantic
			'blockquote', 'cite',
			// Tables
			'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
			// Details / summary (GFM extras)
			'details', 'summary'
		],
		allowedAttributes: {
			'a': ['href', 'title'],
			'img': ['src', 'alt', 'title', 'width', 'height'],
			'th': ['align'],
			'td': ['align'],
			'code': ['class'],   // allow language-* classes added by marked
			'pre': ['class'],
			'span': ['class'],
			'div': ['class']
		},
		allowedSchemes: ['http', 'https', 'mailto', 'ftp'],
		allowedSchemesByTag: {
			img: ['http', 'https']
		},
		// Strip disallowed tags entirely (don't keep their text content for
		// dangerous tags like <script> and <style>)
		disallowedTagsMode: 'discard',
		// Never allow data: URIs — avoids data:text/html XSS via img src
		allowedSchemesAppliedToAttributes: ['href', 'src', 'action']
	});
}

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const supabase = getSupabase();
	const { authorSlug, promptSlug } = params;

	// Set cache headers
	setHeaders({
		'Cache-Control': CACHE_CONTROL.PROMPT_PAGE
	});

	try {
		const prompt = await getCachedPromptData(authorSlug, promptSlug, () =>
			getPromptBySlug(supabase, authorSlug, promptSlug)
		);

		if (!prompt) {
			throw error(404, 'Agent prompt not found');
		}

		// Verify this is an agent prompt
		if (prompt.type !== 'agent') {
			throw error(404, 'Agent prompt not found');
		}

		// Pre-render and sanitize additional_information on the server so the
		// client receives safe HTML — no Markdown library is ever shipped to or
		// executed in the browser.
		const additionalInfoHtml = prompt.additional_information
			? renderMarkdown(prompt.additional_information)
			: null;

		return {
			prompt,
			additionalInfoHtml
		};
	} catch (err) {
		// Re-throw SvelteKit errors (like 404)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to load agent prompt:', err);
		throw error(500, 'Failed to load agent prompt');
	}
};
