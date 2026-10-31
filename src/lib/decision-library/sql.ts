import { DECISION_AUTHORS } from './authors';
import { DECISION_PACKS } from './packs';
import { serializeDecisionPrompt } from './serialize';
import { D1_ULTRA_SPECS } from './specs-d1-ultra';
import { JEV_SPECS } from './specs-jev';
import type { DecisionAuthor, DecisionPack, DecisionSpec } from './types';

export const DECISION_PACK_SORT_ORDER_MIN = 2000;
export const DECISION_CATEGORY_ICON_KEY = 'sparkles';

const SPECS: DecisionSpec[] = [...D1_ULTRA_SPECS, ...JEV_SPECS];

const AUTHOR_COLORS: Record<string, { light: string; dark: string }> = {
	'liquid-ai': { light: '#2563eb', dark: '#93c5fd' },
	typesafe: { light: '#c2410c', dark: '#fdba74' }
};

const PACK_TAG_NAMES: Record<string, string> = {
	'd1-ultra': 'd1-ultra',
	jev: 'Jev'
};

function dollarQuote(value: string, tag = 'bp'): string {
	let current = tag;
	while (value.includes(`$${current}$`)) {
		current += 'x';
	}
	return `$${current}$${value}$${current}$`;
}

function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

function packTagName(pack: DecisionPack): string {
	return PACK_TAG_NAMES[pack.slug] ?? pack.name;
}

function uniqueTagNames(): string[] {
	const names = new Set<string>();
	for (const pack of DECISION_PACKS) {
		names.add(packTagName(pack));
	}
	for (const spec of SPECS) {
		for (const tag of spec.tags) names.add(tag);
	}
	return [...names].sort((a, b) => a.localeCompare(b));
}

function authorSql(author: DecisionAuthor): string {
	const colors = AUTHOR_COLORS[author.slug] ?? { light: '#2563eb', dark: '#93c5fd' };
	const avatar = author.avatarUrl;
	const values = `
    ${sqlString(author.name)},
    ${sqlString(author.slug)},
    ${dollarQuote(author.publicDescription)},
    ${sqlString(author.link)},
    true,
    ${avatar ? sqlString(avatar) : 'NULL'},
    false,
    ${sqlString(colors.light)},
    ${sqlString(colors.dark)}`;

	return `-- ${author.name}
INSERT INTO authors (
  name, slug, public_description, link, verified, avatar_url, highlighted,
  featured_color_light, featured_color_dark
)
SELECT${values}
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE slug = ${sqlString(author.slug)});

UPDATE authors SET
  name = ${sqlString(author.name)},
  public_description = ${dollarQuote(author.publicDescription)},
  link = ${sqlString(author.link)},
  verified = true,
  avatar_url = ${avatar ? sqlString(avatar) : 'NULL'},
  highlighted = false,
  featured_color_light = ${sqlString(colors.light)},
  featured_color_dark = ${sqlString(colors.dark)}
WHERE slug = ${sqlString(author.slug)};`;
}

function packSql(pack: DecisionPack, sortOrder: number): string {
	const tagName = packTagName(pack);
	const colorDark = AUTHOR_COLORS[pack.authorSlug]?.dark ?? '#93c5fd';
	const imageUrl =
		DECISION_AUTHORS.find((author) => author.slug === pack.authorSlug)?.avatarUrl ?? null;
	return `-- Pack category: ${pack.name}
INSERT INTO categories (
  slug, name, description, color, color_light, color_dark, icon_key, image_url,
  source_url, sort_order, new_until
)
SELECT
  ${sqlString(pack.slug)},
  ${sqlString(pack.name)},
  ${dollarQuote(pack.description)},
  ${sqlString(pack.color)},
  ${sqlString(pack.color)},
  ${sqlString(colorDark)},
  ${sqlString(DECISION_CATEGORY_ICON_KEY)},
  ${imageUrl ? sqlString(imageUrl) : 'NULL'},
  ${sqlString(pack.sourceUrl)},
  ${sortOrder},
  ${sqlString(pack.newUntil)}
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = ${sqlString(pack.slug)});

UPDATE categories SET
  name = ${sqlString(pack.name)},
  description = ${dollarQuote(pack.description)},
  color = ${sqlString(pack.color)},
  color_light = ${sqlString(pack.color)},
  color_dark = ${sqlString(colorDark)},
  icon_key = ${sqlString(DECISION_CATEGORY_ICON_KEY)},
  image_url = ${imageUrl ? sqlString(imageUrl) : 'NULL'},
  source_url = ${sqlString(pack.sourceUrl)},
  sort_order = ${sortOrder},
  new_until = ${sqlString(pack.newUntil)}
WHERE slug = ${sqlString(pack.slug)};

INSERT INTO category_tags (category_id, tag_id)
SELECT c.id, t.id
FROM categories c
JOIN tags t ON t.name = ${sqlString(tagName)}
WHERE c.slug = ${sqlString(pack.slug)}
  AND NOT EXISTS (
    SELECT 1 FROM category_tags ct
    WHERE ct.category_id = c.id AND ct.tag_id = t.id
  );`;
}

function specSql(spec: DecisionSpec): string {
	const pack = DECISION_PACKS.find((entry) => entry.slug === spec.packSlug);
	if (!pack) {
		throw new Error(`Unknown pack for spec ${spec.slug}: ${spec.packSlug}`);
	}
	const tagNames = [packTagName(pack), ...spec.tags];
	const tagList = tagNames.map(sqlString).join(', ');
	const body = serializeDecisionPrompt(spec);

	return `-- ${spec.title}
INSERT INTO prompts (
  title, slug, prompt, description, additional_information, author_id, type
)
SELECT
  ${sqlString(spec.title)},
  ${sqlString(spec.slug)},
  ${dollarQuote(body)},
  ${dollarQuote(spec.description)},
  ${dollarQuote(spec.nextSteps)},
  a.id,
  'decision'
FROM authors a
WHERE a.slug = ${sqlString(spec.authorSlug)}
  AND NOT EXISTS (
    SELECT 1
    FROM prompts p
    WHERE p.slug = ${sqlString(spec.slug)}
      AND p.author_id = a.id
  );

UPDATE prompts AS p
SET
  title = ${sqlString(spec.title)},
  prompt = ${dollarQuote(body)},
  description = ${dollarQuote(spec.description)},
  additional_information = ${dollarQuote(spec.nextSteps)},
  type = 'decision'
FROM authors a
WHERE a.slug = ${sqlString(spec.authorSlug)}
  AND p.author_id = a.id
  AND p.slug = ${sqlString(spec.slug)};

INSERT INTO "tag-to-prompt" (tag_id, prompt_id)
SELECT t.id, p.id
FROM tags t
JOIN prompts p ON p.slug = ${sqlString(spec.slug)}
JOIN authors a ON a.id = p.author_id AND a.slug = ${sqlString(spec.authorSlug)}
WHERE t.name IN (${tagList})
  AND NOT EXISTS (
    SELECT 1 FROM "tag-to-prompt" tp
    WHERE tp.tag_id = t.id AND tp.prompt_id = p.id
  );`;
}

export function buildDecisionLibrarySql(): string {
	const tagValues = uniqueTagNames().map((name) => `  (${sqlString(name)})`).join(',\n');
	const authors = DECISION_AUTHORS.map(authorSql).join('\n\n');
	const packs = DECISION_PACKS.map((pack, index) =>
		packSql(pack, DECISION_PACK_SORT_ORDER_MIN + index)
	).join('\n\n');
	const specs = SPECS.map(specSql).join('\n\n');

	return `-- Bearprompt Decision Library seed
-- Paste into the Supabase SQL editor and run once. Safe to re-run.
-- Loads Decision examples as prompts.type = 'decision' so /decisions can read the
-- same authors / prompts / tags / categories tables as /prompts and /agents.
-- Pack categories use sort_order ${DECISION_PACK_SORT_ORDER_MIN}+ so they do not
-- appear under Prompt Guides (those use 1000–1999). icon_key stays sparkles;
-- vendor logos live on authors.avatar_url and categories.image_url.

-- 1. Allow type = 'decision' (enum or CHECK).
-- ALTER TYPE ... ADD VALUE cannot run inside this DO block. If the notice
-- names an enum, run that ALTER once, then re-run this file.
DO $$
DECLARE
  type_oid oid;
  type_name text;
  type_kind "char";
BEGIN
  SELECT a.atttypid, t.typname, t.typtype
  INTO type_oid, type_name, type_kind
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public'
    AND c.relname = 'prompts'
    AND c.relkind = 'r'
    AND a.attname = 'type'
    AND NOT a.attisdropped;

  IF type_kind = 'e' THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum WHERE enumtypid = type_oid AND enumlabel = 'decision'
    ) THEN
      RAISE EXCEPTION
        'prompts.type is enum %. Run: ALTER TYPE % ADD VALUE ''decision''; then re-run this file.',
        type_name,
        type_name;
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.prompts'::regclass
        AND conname = 'prompts_type_check'
    ) THEN
      ALTER TABLE prompts DROP CONSTRAINT prompts_type_check;
    END IF;

    ALTER TABLE prompts
      ADD CONSTRAINT prompts_type_check
      CHECK (type IN ('prompt', 'agent', 'skill', 'decision'));
  END IF;
END $$;

-- 2. Vendor authors (not Featured Authors).
${authors}

-- 3. Pack tags and use-case tags.
INSERT INTO tags (name)
SELECT v.name
FROM (
  VALUES
${tagValues}
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM tags t WHERE t.name = v.name
);

-- 4. Decision Pack categories (exclusive pack tag, sort_order ${DECISION_PACK_SORT_ORDER_MIN}+).
${packs}

-- 5. Decision examples. Structured body lives in prompts.prompt as JSON;
--    nextSteps lives in additional_information.
-- Drop previous Decision Library rows so renamed slugs do not linger.
DELETE FROM "tag-to-prompt" tp
USING prompts p
WHERE tp.prompt_id = p.id AND p.type = 'decision';

DELETE FROM prompts WHERE type = 'decision';

${specs}
`;
}
