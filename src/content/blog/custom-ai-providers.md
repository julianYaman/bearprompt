---
title: "How to Add Custom AI Providers"
slug: "custom-ai-providers"
description: "Connect any chat tool that accepts prompts via a URL query parameter, then open prompts from Bearprompt with one click."
publishedAt: "2026-08-08"
author: "Bearprompt"
tags:
  - ai providers
  - settings
  - workflows
category: "Product Updates"
featured: true
---

Custom AI providers let you open prompts in the chat tools you actually use—not only the built-in options.

If a tool accepts a prompt through a URL query parameter, you can add it in Settings and it will show up in every **Open in…** menu.

## Why this exists

New chat UIs appear often. Hardcoding each one does not scale, and your preferred tools may not match the defaults.

Bearprompt already opens prompts in ChatGPT, Claude, Perplexity, and Grok. Custom providers use the same idea: build a URL, put your prompt in a query parameter, and open it in a new tab.

Everything stays local. Provider settings are stored in your browser with the rest of your private library.

## Add a provider in Settings

1. Open **Settings** → **AI Tools**.
2. Under **Add custom provider**, enter a name (for example, `My Chat`).
3. Enter a URL template that includes `{{prompt}}` where the prompt text should go.
4. Click **Test** to open a sample prompt, then **Add provider**.

Example:

```text
https://chat.example.com/?q={{prompt}}
```

When you open a prompt, Bearprompt replaces `{{prompt}}` with the encoded prompt text.

You can also use `%q` as a shorter alias for the same placeholder:

```text
https://chat.example.com/?q=%q
```

## Manage built-in and custom tools

In **AI Tools** you can:

- **Show / Hide** any provider so it no longer appears in Open in…
- **Reorder** providers with the up/down controls
- **Edit** the name or URL template
- **Reset** a built-in provider to its default URL
- **Delete** custom providers you no longer need

The first two enabled providers appear as primary buttons on public prompt pages. The rest sit under **More**.

## Tips

- Templates must be `http` or `https` URLs and must include `{{prompt}}` or `%q`.
- Very long prompts can hit browser URL limits. If that happens, copy the prompt and paste it into the chat tool instead.
- Exporting your library includes your AI provider settings, so backups and imports can bring them along.

## Related

- [How to Use Prompt Variables](/blog/prompt-variables)
- [Settings](/settings)
- [Help](/help)
