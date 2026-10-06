---
title: "Prompts to use with Mistral Large 4"
slug: "prompts-to-use-mistral-large-4"
description: "Mistral Large 4 is out. Ten prompts for classification, coding, documents, and everyday knowledge work — plus how Mistral actually wants you to write them."
publishedAt: "2026-10-06"
author: "Bearprompt"
tags:
  - mistral
  - prompting
  - large 4
category: "Prompt Guides"
featured: false
---

<div class="blog-ai-callout">This post was generated with AI.</div>

Mistral released Large 4 today. Internally it's ML4; on the blog they went with *le Chonk*. It's a trillion-parameter multimodal model with 49 billion active, and the [preview](https://mistral.ai/news/mistral-large-4/) is already up. Weights come later this month.

We put a pack in the public library. The prompts follow Mistral's [prompting guide](https://docs.mistral.ai/inference/prompting) — role, headings, a couple of examples, a fixed output shape — but they aren't copied from the docs.

[Browse the Mistral Large 4 pack](/prompts/category/mistral-large-4)

## How to prompt it

Mistral's advice is pretty ordinary, and it still works:

- Standing rules go in the system prompt. The live task goes in the user message. One-box UIs: paste both.
- Say who the model is and what it should return.
- Use headings. Write it so someone else could run the task from the prompt alone.
- Add examples when the format matters.
- Skip "make it better" and "keep it short." Don't ask it to count characters.
- Score with words (`Very Low` … `Very Good`), not 1–5.

The snippets below use [prompt variables](/blog/prompt-variables) like `{{customer_message:textarea}}`. Fill those in when you copy.

## Three you can paste today

### 1. Classify a support ticket

Closed labels, a few examples, JSON only. Use this as the system prompt and send the ticket as the user message.

```text
You are a customer-support triage model. Your task is to assign exactly one intent label to the incoming message.

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
{{customer_message:textarea}}
```

[Open in the library](/prompts/mistral/ml4-support-intent-classifier)

### 2. Score a draft without fake precision

Mistral prefers a worded scale over "rate this 1–5". This one checks a draft against a brief.

```text
You are an editorial reviewer. Your task is to judge whether this draft is ready to send.

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
{{draft:textarea}}
```

[Open in the library](/prompts/mistral/ml4-worded-scale-draft-review)

### 3. Plan a coding change before writing it

Large 4 is meant for repo work. This one asks for a plan — files, risks, a done-when check — and then stops.

```text
You are a software-engineering agent. Your task is to plan the change, then stop. Do not write the full patch until the plan is accepted.

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
{{context:textarea}}
```

[Open in the library](/prompts/mistral/ml4-agentic-coding-plan)

## The rest of the pack

The same category also has PR reviews, document briefs, record-update routing, evidence pulls from charts and PDFs, finance or legal memos, language routing, and turning messy notes into a spreadsheet.

[See the full Mistral Large 4 pack](/prompts/category/mistral-large-4)

Add what you need to your private library. The public copies stay public; yours stay on your machine.

[Open your library](/library)
