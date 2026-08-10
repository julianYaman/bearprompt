---
title: "How to Add Custom AI Providers"
slug: "custom-ai-providers"
description: "Connect web chat tools and desktop agents like Cursor, Claude Code, and Codex, then open prompts from Bearprompt with one click."
publishedAt: "2026-08-08"
updatedAt: "2026-08-10"
author: "Bearprompt"
tags:
  - ai providers
  - settings
  - workflows
  - desktop agents
category: "Product Updates"
featured: true
---

Custom AI providers let you open prompts in the chat tools and coding agents you actually use—not only the built-in web options.

If a tool accepts a prompt through a URL query parameter (HTTPS or a supported desktop deep link), you can add it in Settings and it will show up in every **Open in…** menu.

## Why this exists

New chat UIs and coding agents appear often. Hardcoding each one does not scale, and your preferred tools may not match the defaults.

Bearprompt opens prompts in ChatGPT, Claude, Perplexity, Grok, **Cursor**, **Claude Code**, and **Codex**. Custom providers use the same idea: build a URL, put your prompt in a query parameter, and open it.

Everything stays local. Provider settings are stored in your browser with the rest of your private library.

## Desktop agents (Cursor, Claude Code, Codex)

These built-ins use **custom URL schemes** (deep links) so the OS can open a locally installed app with your prompt pre-filled. Nothing is sent to the model until you confirm in the app.

| Tool | Default URL template |
| --- | --- |
| Cursor | `cursor://anysphere.cursor-deeplink/prompt?text={{prompt}}` |
| Claude Code | `claude-cli://open?q={{prompt}}` |
| Codex | `codex://new?prompt={{prompt}}` |

They are **enabled by default**. Hide any you do not use under **Settings → AI Tools**.

Notes:

- The app must be installed and registered with your OS (Claude Code registers its handler after you send a prompt in an interactive session at least once).
- If the app is missing, the link may do nothing or show an OS error — that is expected.
- Desktop deep links allow longer prompts than typical HTTPS chat URLs before Bearprompt warns you.

Official docs: [Cursor deeplinks](https://cursor.com/docs/reference/deeplinks), [Claude Code deep links](https://code.claude.com/docs/en/deep-links), [Codex deep links](https://developers.openai.com/codex/app/commands#deep-links).

## Add a provider in Settings

1. Open **Settings** → **AI Tools**.
2. Under **Add custom provider**, enter a name (for example, `My Chat`).
3. Enter a URL template that includes `{{prompt}}` where the prompt text should go.
4. Click **Test** to open a sample prompt, then **Add provider**.

Example (web):

```text
https://chat.example.com/?q={{prompt}}
```

Example (desktop — only if you need a custom variant):

```text
cursor://anysphere.cursor-deeplink/prompt?text={{prompt}}
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

- Templates must use `http`, `https`, `cursor`, `claude-cli`, or `codex`, and must include `{{prompt}}` or `%q`.
- Very long prompts can hit URL limits. If that happens, copy the prompt and paste it into the tool instead.
- Exporting your library includes your AI provider settings, so backups and imports can bring them along.

## Related

- [How to Use Prompt Variables](/blog/prompt-variables)
- [Settings](/settings)
- [Help](/help)
