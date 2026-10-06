#!/usr/bin/env python3
"""Idempotent seed for the Mistral Large 4 Model Pack. Reads .env; never prints secrets."""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
LOGO = "https://img.logo.dev/mistral.ai?token=pk_Ss1kqMCwRdC9gAGPgJ4RTw&retina=true"
PACK_TAG = "Mistral Large 4"
NEW_UNTIL = "2026-10-20T21:46:00+00:00"
ADDITIONAL = """Written for [Mistral Large 4](https://mistral.ai/news/mistral-large-4/). Technique from Mistral's [prompting guide](https://docs.mistral.ai/inference/prompting) — original prompt, not an official excerpt.

Put the standing instructions in the system prompt when you can. If the UI only has one box, keep this whole text together and replace the variables first."""

PROMPTS = [
    {
        "title": "Classify a support ticket",
        "slug": "ml4-support-intent-classifier",
        "description": "Few-shot JSON triage that assigns one closed intent label to a customer message.",
        "tags": [PACK_TAG, "Customer Support", "Prompt Engineering"],
        "prompt": """You are a customer-support triage model. Your task is to assign exactly one intent label to the incoming message.

# Intent labels
Choose from this closed list:
- billing: invoices, charges, refunds, payment methods
- account_access: login, password, 2FA, locked accounts
- product_how_to: using a feature that already exists
- outage: something previously working is down
- feature_request: asking for something that does not exist
- other: none of the labels above apply

# Answer format
Respond with JSON only:
{"intent": "<label>", "confidence": "<high|medium|low>", "reason": "<one short clause>"}

Do not invent labels. Do not include markdown.

# Examples
## Billing
User: My last invoice charged me twice for the same seat.
Answer: {"intent": "billing", "confidence": "high", "reason": "duplicate charge on an invoice"}

## How-to
User: Where do I rotate an API key without downtime?
Answer: {"intent": "product_how_to", "confidence": "high", "reason": "asks how to use an existing key-rotation feature"}

# Message
{{customer_message:textarea}}""",
    },
    {
        "title": "Review a pull request with hierarchy",
        "slug": "ml4-structured-code-review",
        "description": "Role-and-heading code review that reports blockers, should-fix issues, and tests to add.",
        "tags": [PACK_TAG, "Code review", "Code quality"],
        "prompt": """You are a senior software reviewer. Your task is to review the change below and report only what a maintainer needs to decide merge vs. request changes.

# Review rules
- Name the concrete file, symbol, or line range you are talking about.
- Prefer one finding per issue. Do not restyle working code.
- If you cannot see enough context, say what is missing instead of guessing.

# Severity
Use this scale:
- Blocker: the change is wrong, unsafe, or will fail in production
- Should fix: a real defect or missing test that should not ship as-is
- Nit: optional clarity improvement

# Output
## Summary
One paragraph.

## Findings
For each finding:
- severity
- location
- what is wrong
- a concrete fix

## Tests to add
Bullet list, or "None".

# Change
Language: {{language}}
Intent of the change: {{change_intent}}

```
{{diff:textarea}}
```""",
    },
    {
        "title": "Turn a long document into a brief",
        "slug": "ml4-document-brief",
        "description": "Hierarchical summary with a purpose, frozen facts, and open questions — not a blurry recap.",
        "tags": [PACK_TAG, "Summaries", "Documentation"],
        "prompt": """You are a briefing analyst. Your task is to turn the source into a brief a busy colleague can act on without opening the original.

# Reader
Role: {{reader_role}}
Decision they must make: {{decision}}

# Brief rules
- Prefer numbers, names, dates, and owners over adjectives.
- If a claim is not in the source, omit it.
- Do not count words. Stop when the sections below are complete.

# Output
## Bottom line
Three sentences.

## Facts that cannot move
Bullet list. Each bullet: fact, then where it appears in the source.

## What is still open
Questions the source does not answer.

## Suggested next step
One action, one owner if named, otherwise "owner not specified".

# Source
{{source:textarea}}""",
    },
    {
        "title": "Score a draft on a worded scale",
        "slug": "ml4-worded-scale-draft-review",
        "description": "Editorial review that uses Very Low through Very Good instead of a numeric rating.",
        "tags": [PACK_TAG, "Writing", "Feedback"],
        "prompt": """You are an editorial reviewer. Your task is to judge whether this draft is ready to send.

# Brief
Audience: {{audience}}
Goal: {{goal}}
Channel: {{channel:select(email|doc|slide notes|chat)}}

# Scale
Score each criterion with exactly one label:
- Very Low: fails the brief
- Low: incomplete or off-voice
- Neutral: usable, not specific
- Good: ready with a light edit
- Very Good: ship it

Criteria:
- Fit to brief
- Specificity
- Voice

# Output
## Scores
One line per criterion: label, then one sentence of evidence.

## Keep
Two quotes or moments that already work.

## Change
Up to three edits, each with the replacement sentence.

# Draft
{{draft:textarea}}""",
    },
    {
        "title": "Route a record update without contradictions",
        "slug": "ml4-record-update-router",
        "description": "Decision-tree prompt for create / update / ignore so standing rules do not collide.",
        "tags": [PACK_TAG, "Decision Making", "Data"],
        "prompt": """You are a records clerk. Your task is to decide how to apply incoming data to an existing table. Follow the decision tree in order. Stop at the first matching rule.

# Decision tree
1. If every field in the incoming data already matches an existing record: ignore.
2. Else if the incoming data is not about any existing record: create.
3. Else if the incoming data directly contradicts a stored field that is marked locked: reject and quote the locked field.
4. Else: update the related record with only the fields that changed.

# Answer format
JSON only:
{"action": "ignore|create|update|reject", "record_id": "<id or null>", "fields": ["<field>", "..."], "reason": "<one sentence>"}

# Existing records
Each line is one record. Fields marked locked must not be overwritten.
{{existing_records:textarea}}

# Incoming data
{{incoming_data:textarea}}""",
    },
    {
        "title": "Extract evidence from a chart or PDF",
        "slug": "ml4-document-evidence-extractor",
        "description": "Multimodal evidence pull for charts, filings, and screenshots, with a missing-attachment fallback.",
        "tags": [PACK_TAG, "Research", "Reporting"],
        "prompt": """You are a document analyst. Your task is to extract evidence for one question from the attached image or PDF. If nothing is attached, use only the pasted excerpt.

# Question
{{question}}

# Evidence rules
- Quote or describe the exact region (title, axis, paragraph, figure id).
- Separate what the document states from what you infer.
- If the attachment is unreadable, say so and stop.

# Output
## Direct answers
Bullet list. Each bullet: answer, then evidence pointer.

## Calculations
Show the inputs you used. If you did not calculate, write "None".

## Not in the source
What the question asked that the document does not show.

# Pasted excerpt (optional)
{{excerpt:textarea}}""",
    },
    {
        "title": "Plan an agentic coding change",
        "slug": "ml4-agentic-coding-plan",
        "description": "Forces a file-level plan, verification commands, and a done-when check before writing a patch.",
        "tags": [PACK_TAG, "Development", "Architecture"],
        "prompt": """You are a software-engineering agent. Your task is to plan the change, then stop. Do not write the full patch until the plan is accepted.

# Goal
{{goal}}

# Repository facts
Language: {{language}}
Stack: {{stack}}
Constraints: {{constraints:textarea}}

# Plan format
## Approach
Five sentences or fewer.

## Files
Each file: path, why it changes, what must not change.

## Steps
Numbered. One action per step. Include the verification command for that step.

## Risks
What could break production or tests.

## Done when
A concrete check a teammate could run.

# Starting context
{{context:textarea}}""",
    },
    {
        "title": "Write a knowledge-work memo",
        "slug": "ml4-knowledge-work-memo",
        "description": "Finance or legal working memo with sources, numbers, and an explicit unknown list.",
        "tags": [PACK_TAG, "Reporting", "Research"],
        "prompt": """You are a working-memo writer for {{domain:select(finance|legal|operations)}}. Your task is to produce a memo a partner can challenge, not a slide.

# Assignment
{{assignment}}

# Source material
Treat this as the only corpus. Do not invent citations.
{{sources:textarea}}

# Memo
## Issue
One paragraph.

## Facts
Numbered. Each fact: statement, then source pointer.

## Analysis
How the facts answer the assignment. Call out where two sources disagree.

## Recommendation
One action, one alternative, and what would change the recommendation.

## Unknowns
Items that still need a human to verify.""",
    },
    {
        "title": "Route multilingual input",
        "slug": "ml4-language-router",
        "description": "Closed-set language router for mixed EU input, with a next-action instead of a bare language code.",
        "tags": [PACK_TAG, "Translation", "Communication"],
        "prompt": """You are a language router. Your task is to detect the language of the user text and choose the reply policy.

# Languages
Use these codes only:
- en, fr, de, es, it, pt, nl, pl, sv, da, fi, cs, ro, hu, el, other

# Reply policy
- If the text is a single listed language: answer in that language.
- If the text mixes listed languages: pick the language of the question, not the greeting.
- If the language is unlisted: use "other" and answer in English.

# Answer format
JSON only:
{"language_iso": "<code>", "reply_in": "<code or en>", "reason": "<one short clause>"}

# Examples
User: Bonjour, pouvez-vous résumer ce contrat ?
Answer: {"language_iso": "fr", "reply_in": "fr", "reason": "the request is a French question"}

User: Hi — ¿puedes traducir el anexo 2?
Answer: {"language_iso": "es", "reply_in": "es", "reason": "the actual ask is in Spanish"}

# Text
{{text:textarea}}""",
    },
    {
        "title": "Build a spreadsheet from messy notes",
        "slug": "ml4-spreadsheet-from-notes",
        "description": "Turns meeting notes into a sheet spec with columns, types, and formulas described in words.",
        "tags": [PACK_TAG, "Productivity", "Reporting"],
        "prompt": """You are a spreadsheet designer. Your task is to turn messy notes into a sheet a teammate can build without guessing column names.

# Outcome
{{outcome}}

# Notes
{{notes:textarea}}

# Design rules
- One fact per column. No combined "name / date" columns.
- Name types in words: text, date, currency, integer, formula.
- Describe formulas in words ("amount minus tax"), not cell gymnastics unless the user pasted a grid.
- Do not generate a giant CSV dump. Specify the shape.

# Output
## Tab name
One name.

## Columns
For each column: name, type, example, required yes/no.

## Formulas
Each formula: column it fills, inputs, rule in words.

## Rows to seed
Up to five example rows from the notes. If a value is missing, write UNKNOWN.

## Checks
Three validation checks a human should run before sharing.""",
    },
]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def request(method: str, path: str, body: object | None = None, extra: dict[str, str] | None = None):
    env = load_env()
    url = env["SUPABASE_URL"].rstrip("/") + path
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if extra:
        headers.update(extra)
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode()
        raise SystemExit(f"{method} {path} failed: {error.code} {detail[:800]}") from error


def get(path: str):
    return request("GET", path) or []


def one(path: str):
    rows = get(path)
    return rows[0] if rows else None


def main() -> None:
    author = one("/rest/v1/authors?slug=eq.mistral&select=*")
    author_payload = {
        "name": "Mistral",
        "slug": "mistral",
        "public_description": "Original prompts for Mistral models, starting with Mistral Large 4 — classification, coding, documents, and knowledge work.",
        "link": "https://mistral.ai",
        "verified": True,
        "highlighted": False,
        "avatar_url": LOGO,
        "featured_color_light": "#FA520F",
        "featured_color_dark": "#FFD6C2",
    }
    if author:
        author = request("PATCH", f"/rest/v1/authors?id=eq.{author['id']}", author_payload)[0]
    else:
        author = request("POST", "/rest/v1/authors", author_payload)[0]
    print(f"author id={author['id']} slug={author['slug']}")

    tag_ids: dict[str, int] = {}
    needed_tags = sorted({PACK_TAG, *(tag for prompt in PROMPTS for tag in prompt["tags"])})
    for name in needed_tags:
        existing = one(f"/rest/v1/tags?name=eq.{urllib.parse.quote(name)}&select=id,name")
        if existing:
            tag_ids[name] = existing["id"]
        else:
            created = request("POST", "/rest/v1/tags", {"name": name})[0]
            tag_ids[name] = created["id"]
            print(f"created tag {name!r} id={created['id']}")

    category = one("/rest/v1/categories?slug=eq.mistral-large-4&select=*")
    category_payload = {
        "slug": "mistral-large-4",
        "name": "Mistral Large 4",
        "description": "Original prompts for Mistral Large 4 — classification, coding, documents, and knowledge work.",
        "color": "#FA520F",
        "color_light": "#FA520F",
        "color_dark": "#FFD6C2",
        "icon_key": "sparkles",
        "image_url": LOGO,
        "source_url": "https://docs.mistral.ai/inference/prompting",
        "sort_order": 1000,
        "new_until": NEW_UNTIL,
    }
    if category:
        category = request("PATCH", f"/rest/v1/categories?id=eq.{category['id']}", category_payload)[0]
    else:
        category = request("POST", "/rest/v1/categories", category_payload)[0]
    print(f"category id={category['id']}")

    pack_link = one(
        f"/rest/v1/category_tags?category_id=eq.{category['id']}&tag_id=eq.{tag_ids[PACK_TAG]}&select=category_id"
    )
    if not pack_link:
        request("POST", "/rest/v1/category_tags", {"category_id": category["id"], "tag_id": tag_ids[PACK_TAG]})

    prompt_ids: dict[str, int] = {}
    for spec in PROMPTS:
        row = {
            "title": spec["title"],
            "slug": spec["slug"],
            "prompt": spec["prompt"].strip() + "\n",
            "description": spec["description"],
            "additional_information": ADDITIONAL,
            "author_id": author["id"],
            "type": "prompt",
        }
        existing = one(f"/rest/v1/prompts?slug=eq.{spec['slug']}&select=id,slug")
        if existing:
            saved = request("PATCH", f"/rest/v1/prompts?id=eq.{existing['id']}", row)[0]
        else:
            saved = request("POST", "/rest/v1/prompts", row)[0]
        prompt_ids[spec["slug"]] = saved["id"]
        for tag_name in spec["tags"]:
            link = one(
                f"/rest/v1/tag-to-prompt?prompt_id=eq.{saved['id']}&tag_id=eq.{tag_ids[tag_name]}&select=prompt_id"
            )
            if not link:
                request(
                    "POST",
                    "/rest/v1/tag-to-prompt",
                    {"prompt_id": saved["id"], "tag_id": tag_ids[tag_name]},
                )
        print(f"prompt {spec['slug']} id={saved['id']}")

    request(
        "POST",
        "/rest/v1/prompt_drafts",
        {
            "pack_slug": "mistral-large-4",
            "status": "approved",
            "source_url": "https://docs.mistral.ai/inference/prompting",
            "payload": {
                "author_slug": "mistral",
                "prompt_slugs": [spec["slug"] for spec in PROMPTS],
            },
        },
        extra={"Prefer": "resolution=merge-duplicates,return=representation"},
    )

    for row in get("/rest/v1/announcements?select=id,enabled,href"):
        if row["enabled"]:
            request("PATCH", f"/rest/v1/announcements?id=eq.{row['id']}", {"enabled": False})

    existing_bar = one("/rest/v1/announcements?href=eq./prompts/category/mistral-large-4&select=*")
    bar = {
        "enabled": True,
        "message": "NEW: Prompts for Mistral Large 4 are in the public library",
        "href": "/prompts/category/mistral-large-4",
        "cta_label": "Browse prompts",
    }
    if existing_bar:
        request("PATCH", f"/rest/v1/announcements?id=eq.{existing_bar['id']}", bar)
        print(f"announcement id={existing_bar['id']}")
    else:
        created = request("POST", "/rest/v1/announcements", bar)[0]
        print(f"announcement id={created['id']}")

    print(f"seeded {len(prompt_ids)} prompts")


if __name__ == "__main__":
    main()
