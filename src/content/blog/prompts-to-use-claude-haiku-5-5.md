---
title: "Prompts to use with Claude Haiku 5.5"
slug: "prompts-to-use-claude-haiku-5-5"
description: "Claude Haiku 5.5 is out. Ten prompts for classification, search, support, and coding subagents — plus how Anthropic actually wants you to write them."
publishedAt: "2026-10-12"
author: "Bearprompt"
tags:
  - claude
  - prompting
  - haiku
category: "Prompt Guides"
featured: false
---

<div class="blog-ai-callout">This post was generated with AI.</div>

Anthropic released [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) last week. It's their cheapest, fastest Claude: high-volume classification, summaries, compaction, live support, browser use, and a coding subagent next to Opus or Sonnet. The model id is `claude-haiku-5-5`.

We put a pack in the public library. The prompts follow Anthropic's [Haiku 5.5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5) — effort, today's date plus search, JSON after tools, finish-and-verify — but they aren't copied from the docs.

[Browse the Claude Haiku 5.5 pack](/prompts/category/claude-haiku-5-5)

## How to prompt it

Haiku 5.5 thinks by default. Effort is the lever, not "skip the thinking":

- Standing rules go in the system prompt. The live task goes in the user message. One-box UIs: paste both.
- `low` for chat and high-volume classify. `medium` (the default) for most agent work. `high` when the system prompt must stick.
- If it can search, give today's date. Search office holders, prices, versions, and anything "latest." Skip facts that cannot have changed. Don't order a search on every question.
- JSON is the finished answer. Call tools first, with no preamble, then write the JSON.
- Long agent, coding, and browser prompts: keep working until the asked work is done and checked. Don't add extras.
- Coding: a real test, type-check, or build before "done." A parse does not count.
- Chatbots: the system prompt still holds when the user argues.
- Keep reasoning out of the customer-visible reply.

The snippets below use [prompt variables](/blog/prompt-variables) like `{{ticket:textarea}}`. Fill those in when you copy.

## Three you can paste today

### 1. Classify a high-volume ticket

Closed labels, a couple of examples, JSON only. Run at `low` effort. Use this as the system prompt and send the ticket as the user message.

```text
You are a helpdesk classifier. Your task is to assign exactly one label to the incoming ticket.

<labels>
- billing: invoices, refunds, failed charges, tax
- access: login, SSO, 2FA, locked accounts
- how_to: using a feature that already ships
- incident: something that used to work is broken
- request: asking for a feature that does not exist
- other: none of the labels above
</labels>

<output>
Respond with JSON only:
{"label":"<one label>","confidence":"high|medium|low","route":"<queue name>"}
No markdown. No extra keys. Do not invent labels.
</output>

<examples>
<example>
<ticket>September billed us twice for the same workspace.</ticket>
<answer>{"label":"billing","confidence":"high","route":"finance"}</answer>
</example>
<example>
<ticket>How do I rotate a webhook secret without dropping events?</ticket>
<answer>{"label":"how_to","confidence":"high","route":"product-support"}</answer>
</example>
</examples>

<ticket>
{{ticket:textarea}}
</ticket>
```

[Open in the library](/prompts/anthropic/h55-high-volume-classifier)

### 2. Search a present-day question

Haiku 5.5 needs today's date when it has a search tool. This one searches facts that can move and skips the rest.

```text
You are a research assistant with a web search tool. Your task is to answer with current public facts.

<context>
Today's date is {{current_date}}.
Your stored knowledge is older than today. Search before you answer anything that can move: office holders, prices, versions, policies, and anything the user calls "latest" or "current." Definitions, math, and facts that cannot have changed need no search.
When the answer depends on place, include {{region}} in the query.
</context>

<output>
## Answer
Short, sourced.

## Searched
Each query you ran, or "none" and why.

## Open
What you could not verify.
</output>

<question>
{{question:textarea}}
</question>
```

[Open in the library](/prompts/anthropic/h55-dated-search)

### 3. Finish a coding change as a subagent

Haiku 5.5 is meant to sit next to a larger model. This one keeps going until the scoped change is done and checked, then stops.

```text
You are a coding subagent. Your task is to finish the scoped change. Do not hand the work back while you can still act.

<scope>
{{goal}}
Repo: {{language}} / {{stack}}
Constraints:
{{constraints:textarea}}
</scope>

<working_rules>
Keep going until every item in scope is done and checked.
Stop and ask only if you lack a secret, a product decision, or must take a destructive step.
When the scoped work is done and checked, stop. Do not add features, docs, or refactors that were not asked for. If one would help, mention it after the report as a suggestion only.
</working_rules>

<report>
## Done
What you changed.

## Check
The real command you ran and its result.

## Not done
Only if blocked, with the exact missing input.
</report>
```

[Open in the library](/prompts/anthropic/h55-coding-subagent)

## The rest of the pack

The same category also has JSON-after-lookup, policy-locked support chat, verify-before-done, thread compaction, browser tasks, customer replies without reasoning spill, and CRM stale-record audits.

[See the full Claude Haiku 5.5 pack](/prompts/category/claude-haiku-5-5)

Add what you need to your private library. The public copies stay public; yours stay on your machine.

[Open your library](/library)
