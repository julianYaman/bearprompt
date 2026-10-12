---
title: "How to Import and Export Folders"
slug: "import-export-folders"
description: "Share a folder of prompts as a JSON file, or add someone else's folder to your library without mixing it with what you already have."
publishedAt: "2026-10-12"
author: "Bearprompt"
tags:
  - folders
  - import export
  - workflows
category: "Product Updates"
featured: true
---

<div class="blog-ai-callout">This post was generated with AI.</div>

You can share one folder from your private library as a JSON file. The other person imports it, and Bearprompt adds it as a new folder — nothing merges into My Library or their existing folders.

This is separate from **Save** and **Load** in the header, which back up or restore the whole library.

## Export a folder

1. Open the folder in My Library.
2. Click **Export folder** in the header, or the download icon next to the folder in the sidebar.
3. Bearprompt downloads a JSON file named like `promptlib-folder-writing-v1-YYYYMMDD.json`.

The file contains that folder, its prompts, and the tags those prompts use. Prompts that live only in My Library are not included.

Send the file however you like — email, chat, or a USB stick.

## Import a folder

1. In the sidebar, expand My Library.
2. Click **Import Folder**.
3. Choose a folder export JSON file.

Bearprompt creates a new folder and opens it. If you already have a folder with the same name, the import is named `Writing (2)` (and so on).

Existing tags with the same name are reused. New tags are created. Import never overwrites prompts you already have.

If you pick a full library backup instead, Bearprompt will tell you to use **Load** in the header. If you try to Load a folder export, it will tell you to use Import Folder.

## Folder export vs Save / Load

| | Folder export | Save / Load |
| --- | --- | --- |
| What it includes | One folder, its prompts, and their tags | Your whole library, including My Library and AI Tools settings |
| What import does | Always adds a new folder | Replaces your local library |
| Best for | Sharing a set of prompts | Backing up or moving to another browser |

## Related

- [How to Use Prompt Variables](/blog/prompt-variables)
- [Help](/help)
