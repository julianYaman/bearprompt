---
title: "How to Use Prompt Variables"
slug: "prompt-variables"
description: "Turn reusable prompts into quick fill-in workflows with text fields, dropdowns, and longer context inputs."
publishedAt: "2026-05-29"
author: "Bearprompt"
tags:
  - prompt variables
  - prompt management
  - workflows
category: "Product Updates"
featured: true
---

Prompt Variables make reusable prompts easier to run. Instead of editing the same words every time you copy a prompt, you can mark the parts that change and fill them in when you use it.

Use variables for anything you regularly swap out: a topic, audience, tone, product name, customer message, code snippet, or longer context block.

## Basic text variables

Wrap a variable name in double curly braces:

```text
Write a launch announcement for {{product}}.
```

When you copy the prompt, Bearprompt asks for `Product` and replaces `{{product}}` with your answer.

Variable names can use letters, numbers, underscores, and hyphens:

```text
Create a summary for {{project_name}} aimed at {{target-audience}}.
```

## Dropdown variables

Use dropdowns when you want to choose from a fixed set of options:

```text
Rewrite this in a {{tone(formal|friendly|casual)}} tone.
```

You can also use the explicit `select` syntax:

```text
Rewrite this in a {{tone:select(formal|friendly|casual)}} tone.
```

Dropdowns are useful for tone, format, audience, priority, channel, or any repeated choice where free-form typing slows you down.

## Longer context fields

Use `textarea` for larger inputs:

```text
Summarize this customer feedback:

{{feedback:textarea}}
```

Text areas are a better fit for meeting notes, customer messages, source material, bug reports, or any context that needs multiple lines.

## Reuse the same variable

If the same variable appears more than once, Bearprompt asks for it once and fills every matching placeholder:

```text
Explain {{topic}} in simple terms, then give three examples of {{topic}}.
```

This keeps longer prompts consistent without making you retype the same value.

## A complete example

```text
Act as a product marketer.

Write a {{format:select(launch email|release note|social post)}} for {{product}}.

Audience: {{audience}}
Tone: {{tone(formal|friendly|direct)}}

Context:
{{context:textarea}}
```

This prompt becomes a small form when copied. Fill in the product, choose a format and tone, paste the context, and Bearprompt generates the final prompt for you.

## When to use variables

Prompt Variables work best for prompts you use repeatedly but customize slightly each time. If you always edit the same two or three parts before sending a prompt to an AI tool, those parts should probably be variables.

They keep your library reusable without forcing every prompt to become generic.
