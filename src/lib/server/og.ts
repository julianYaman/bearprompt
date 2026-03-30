import { readFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { ImageResponse } from '@vercel/og';
import {
	OG_IMAGE_CACHE_CONTROL,
	OG_IMAGE_HEIGHT,
	OG_IMAGE_WIDTH,
	SITE_URL,
	type OgAuthorSection
} from '$lib/seo';
import type { PublicAuthor, PublicCategory, PublicPrompt, PromptType } from '$lib/types/public';

const h = React.createElement;
const STATIC_ROOT = path.join(process.cwd(), 'static');
const BEARPROMPT_LOGO_URL =
	'https://wrirnpjj3p.ufs.sh/f/10v7IlGJcYPNyI8gg2GZzIKqMNfxHOB43pYgdQ9yTJFVACo8';
const OG_FONT_PATH = path.join(STATIC_ROOT, 'og-font.ttf');
const OG_FONT_BOLD_PATH = path.join(STATIC_ROOT, 'og-font-bold.ttf');
const SITE_ORIGIN = new URL(SITE_URL).origin;
const OG_FONT_FAMILY = 'OG Font';
const OG_REMOTE_ASSET_REFERER = 'https://bearprompt.com';

let ogFontsPromise: Promise<
	{ name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[]
> | null = null;

type BaseImageOptions = {
	title: string;
	badge: string | null;
	author: PublicAuthor;
	avatarSrc: string | ArrayBuffer | null;
};

function toDataUrl(buffer: ArrayBuffer, mimeType: string): string {
	return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

function getMimeType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === '.png') return 'image/png';
	if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
	if (ext === '.webp') return 'image/webp';
	if (ext === '.gif') return 'image/gif';
	if (ext === '.svg') return 'image/svg+xml';
	return 'application/octet-stream';
}

async function readStaticAssetDataUrl(filePath: string): Promise<string> {
	const buffer = await readFile(filePath);
	return toDataUrl(
		buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
		getMimeType(filePath)
	);
}

async function getOgFonts() {
		
	const [fontBoldRes, fontRegularRes] = await Promise.all([
		fetch(`https://wrirnpjj3p.ufs.sh/f/10v7IlGJcYPNs4eY3aSBFNeIVfPizd7gGcA8RohrL1UkMbu6`),
		fetch(`https://wrirnpjj3p.ufs.sh/f/10v7IlGJcYPNmGwtD1ToEuaSktVMFgfzjXIx1mT6rcGQqyWe`)
	])

	ogFontsPromise = Promise.resolve([
		{
			name: OG_FONT_FAMILY,
			data: await fontRegularRes.arrayBuffer(),
			style: 'normal' as const,
			weight: 400 as const
		},
		{
			name: OG_FONT_FAMILY,
			data: await fontBoldRes.arrayBuffer(),
			style: 'normal' as const,
			weight: 700 as const
		}
	]);

	return ogFontsPromise;
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
	if (parts.length === 0) return 'B';
	return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

function getPromptBadgeText(type: PromptType): string | null {
	if (type === 'agent') return 'Agent';
	if (type === 'skill') return 'Skill';
	return null;
}

function getAuthorBadgeText(section: OgAuthorSection): string {
	return section === 'agents' ? 'Agent Prompts' : 'Prompt Library';
}

function getTitleFontSize(title: string): number {
	const length = title.trim().length;

	if (length <= 28) return 76;
	if (length <= 56) return 68;
	if (length <= 88) return 60;
	if (length <= 120) return 52;
	return 46;
}

async function resolveAvatarSrc(avatarUrl: string | null): Promise<string | null> {
	if (!avatarUrl) {
		return null;
	}

	let resolvedUrl: URL;
	try {
		resolvedUrl = new URL(avatarUrl, SITE_URL);
	} catch (error) {
		return null;
	}

	if (resolvedUrl.origin !== SITE_ORIGIN) {
		try {
			const res = await fetch(resolvedUrl, {
				headers: {
					Referer: OG_REMOTE_ASSET_REFERER
				}
			});
			if (!res.ok) {
				return null;
			}

			const contentType = res.headers.get('Content-Type') || getMimeType(resolvedUrl.pathname);
			if (!contentType.startsWith('image/')) {
				return null;
			}

			const arrayBuffer = await res.arrayBuffer();
			return toDataUrl(arrayBuffer, contentType);
		} catch (error) {
			return null;
		}
	}

	const relativePath = decodeURIComponent(resolvedUrl.pathname).replace(/^\/+/, '');
	if (!relativePath || relativePath.includes('..')) {
		return null;
	}

	const localPath = path.join(STATIC_ROOT, relativePath);

	try {
		const dataUrl = await readStaticAssetDataUrl(localPath);
		return dataUrl;
	} catch (error) {
		return null;
	}
}

function avatarNode(author: PublicAuthor, avatarSrc: string | ArrayBuffer | null) {
	const avatarShellStyle = {
		width: '66px',
		height: '66px',
		borderRadius: '9999px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		backgroundColor: '#fffdf8',
		border: '2px solid rgba(180, 83, 9, 0.16)',
		boxShadow: '0 10px 20px rgba(146, 64, 14, 0.10)'
	} as const;

	if (avatarSrc) {

		return h(
			'div',
			{
				style: avatarShellStyle
			},
				h('img', {
					src: avatarSrc,
					alt: `${author.name} avatar`,
					referrerPolicy: "origin",
					style: {
						display: 'flex',
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						borderRadius: '9999px',
						flexShrink: 0
					}
				})
			);
	}

	return h(
		'div',
		{
			style: {
				...avatarShellStyle,
				background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
				color: '#fffdf9',
				fontSize: '24px',
				fontWeight: 700,
				letterSpacing: '-0.04em'
			}
		},
		getInitials(author.name)
	);
}

function badgeNode(badge: string | null) {
	if (!badge) return null;

	return h(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				alignSelf: 'flex-start',
				padding: '10px 18px',
				borderRadius: '9999px',
				backgroundColor: '#fff1d6',
				border: '1px solid rgba(180, 83, 9, 0.18)',
				color: '#9a3412',
				fontSize: '24px',
				fontWeight: 700,
				letterSpacing: '0.01em',
				textTransform: 'uppercase'
			}
		},
		badge
	);
}

function titleNode(title: string) {
	const fontSize = getTitleFontSize(title);

	return h(
		'div',
		{
			style: {
				display: 'flex',
				color: '#1f2937',
				fontSize: `${fontSize}px`,
				fontWeight: 800,
				letterSpacing: '-0.05em',
				lineHeight: 1.08,
				maxHeight: `${Math.round(fontSize * 1.08 * 3)}px`,
				overflow: 'hidden'
			}
		},
		title
	);
}

function authorFooterNode(author: PublicAuthor, avatarSrc: string | ArrayBuffer | null) {
	return h(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				gap: '14px'
			}
		},
		avatarNode(author, avatarSrc),
		h(
			'div',
				{
					style: {
						display: 'flex',
						flexDirection: 'column',
						gap: '2px',
						alignItems: 'flex-start'
					}
				},
				h(
					'div',
				{
					style: {
						display: 'flex',
						fontSize: '18px',
						color: '#92400e',
						fontWeight: 600
					}
				},
				'By'
			),
			h(
				'div',
				{
					style: {
						display: 'flex',
						fontSize: '22px',
						color: '#111827',
						fontWeight: 700,
						letterSpacing: '-0.03em'
					}
				},
				author.name
			)
		)
	);
}

function imageFrame(logoSrc: string, children: React.ReactNode) {
	return h(
		'div',
		{
			style: {
				width: '100%',
				height: '100%',
					display: 'flex',
					position: 'relative',
					overflow: 'hidden',
					backgroundColor: '#fffaf2',
					fontFamily: `"${OG_FONT_FAMILY}", system-ui, sans-serif`
				}
			},
		h('div', {
			style: {
				position: 'absolute',
				top: '-140px',
				right: '-80px',
				width: '420px',
				height: '420px',
				borderRadius: '9999px',
				background: 'rgba(245, 158, 11, 0.14)'
			}
		}),
		h('div', {
			style: {
				position: 'absolute',
				bottom: '-120px',
				left: '-20px',
				width: '360px',
				height: '360px',
				borderRadius: '9999px',
				background: 'rgba(251, 191, 36, 0.18)'
			}
		}),
		h(
			'div',
			{
				style: {
					position: 'relative',
					display: 'flex',
					width: '100%',
					height: '100%',
					padding: '44px'
				}
			},
			h(
				'div',
				{
					style: {
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						height: '100%',
						padding: '34px 38px',
						borderRadius: '30px',
						background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,251,235,0.97) 100%)',
						border: '1px solid rgba(180, 83, 9, 0.12)',
						boxShadow: '0 24px 60px rgba(146, 64, 14, 0.12)'
					}
				},
				h(
					'div',
					{
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '16px',
							marginBottom: '34px'
						}
					},
					h('img', {
						src: logoSrc,
						alt: 'Bearprompt logo',
						style: {
							width: '54px',
							height: '54px',
							borderRadius: '14px'
						}
					}),
					h(
						'div',
						{
							style: {
								display: 'flex',
								fontSize: '28px',
								fontWeight: 700,
								color: '#111827',
								letterSpacing: '-0.04em'
							}
						},
						'Bearprompt'
					)
				),
				children
			)
		)
	);
}

function promptBody(options: BaseImageOptions) {
	return h(
		'div',
		{
			style: {
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				justifyContent: 'flex-end',
				paddingTop: '12px'
			}
		},
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					gap: '20px',
					maxWidth: '780px'
				}
			},
			badgeNode(options.badge),
			titleNode(options.title),
			authorFooterNode(options.author, options.avatarSrc)
		)
	);
}

function authorBody(options: BaseImageOptions) {
	return h(
		'div',
		{
			style: {
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				justifyContent: 'flex-end',
				paddingTop: '12px'
			}
		},
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					gap: '18px',
					maxWidth: '780px'
				}
			},
			badgeNode(options.badge),
			titleNode(options.title)
		)
	);
}

function categoryBody(options: BaseImageOptions) {
	return h(
		'div',
		{
			style: {
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				justifyContent: 'flex-end',
				paddingTop: '12px'
			}
		},
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					gap: '18px',
					maxWidth: '780px'
				}
			},
			badgeNode(options.badge),
			titleNode(options.title)
		)
	);
}

function baseImageContent(
	logoSrc: string,
	options: BaseImageOptions,
	mode: 'prompt' | 'author' | 'category'
) {
	if (mode === 'author') {
		return imageFrame(logoSrc, authorBody(options));
	}

	if (mode === 'category') {
		return imageFrame(logoSrc, categoryBody(options));
	}

	return imageFrame(logoSrc, promptBody(options));
}

async function imageResponse(element: React.ReactElement) {
	const response = new ImageResponse(element, {
		width: OG_IMAGE_WIDTH,
		height: OG_IMAGE_HEIGHT,
		fonts: await getOgFonts()
	});

	response.headers.set('Cache-Control', OG_IMAGE_CACHE_CONTROL);
	return response;
}

export async function renderPromptOgImage(prompt: PublicPrompt): Promise<Response> {
	if (!prompt.author) {
		throw new Error('Prompt author is required for OG rendering');
	}

	const avatarSrc = await resolveAvatarSrc(prompt.author.avatar_url);

	return imageResponse(
		baseImageContent(
			BEARPROMPT_LOGO_URL,
			{
				title: prompt.title,
				badge: getPromptBadgeText(prompt.type),
				author: prompt.author,
				avatarSrc
			},
			'prompt'
		)
	);
}

export async function renderAuthorOgImage(
	author: PublicAuthor,
	section: OgAuthorSection
): Promise<Response> {
	const avatarSrc = await resolveAvatarSrc(author.avatar_url);

	return imageResponse(
		baseImageContent(
			BEARPROMPT_LOGO_URL,
			{
				title: author.name,
				badge: getAuthorBadgeText(section),
				author,
				avatarSrc
			},
			'author'
		)
	);
}

export async function renderCategoryOgImage(category: PublicCategory): Promise<Response> {
	const fallbackAuthor: PublicAuthor = {
		id: category.id,
		created_at: '',
		name: category.name,
		slug: category.slug,
		public_description: null,
		link: null,
		verified: false,
		avatar_url: null,
		highlighted: false,
		featured_color_light: null,
		featured_color_dark: null
	};

	return imageResponse(
		baseImageContent(
			BEARPROMPT_LOGO_URL,
			{
				title: category.name,
				badge: 'Category',
				author: fallbackAuthor,
				avatarSrc: null
			},
			'category'
		)
	);
}
