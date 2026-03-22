export const SITE_URL = 'https://bearprompt.com';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_CACHE_CONTROL =
	'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400';

export type PromptSection = 'prompts' | 'agents';
export type OgAuthorSection = PromptSection;

export function buildPromptOgImageUrl(
	section: PromptSection,
	authorSlug: string,
	promptSlug: string
): string {
	return `${SITE_URL}/api/og/${section}/${authorSlug}/${promptSlug}`;
}

export function buildAuthorOgImageUrl(section: OgAuthorSection, authorSlug: string): string {
	return `${SITE_URL}/api/og/authors/${section}/${authorSlug}`;
}
