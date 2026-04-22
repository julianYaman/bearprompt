import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Renders Markdown to sanitized HTML for trusted server-side display.
 *
 * The allowlist intentionally supports images so prompt pages can show
 * generated example outputs alongside additional context.
 */
export function renderMarkdown(raw: string): string {
	const html = marked.parse(raw, { gfm: true, breaks: true }) as string;

	return sanitizeHtml(html, {
		allowedTags: [
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'br', 'hr', 'div', 'span',
			'ul', 'ol', 'li',
			'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
			'code', 'pre', 'kbd', 'samp',
			'a', 'img',
			'blockquote', 'cite',
			'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
			'details', 'summary'
		],
		allowedAttributes: {
			'a': ['href', 'title'],
			'img': ['src', 'alt', 'title', 'width', 'height'],
			'th': ['align'],
			'td': ['align'],
			'code': ['class'],
			'pre': ['class'],
			'span': ['class'],
			'div': ['class']
		},
		allowedSchemes: ['http', 'https', 'mailto', 'ftp'],
		allowedSchemesByTag: {
			img: ['http', 'https']
		},
		disallowedTagsMode: 'discard',
		allowedSchemesAppliedToAttributes: ['href', 'src', 'action']
	});
}
