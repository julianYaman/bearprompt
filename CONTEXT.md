# Bearprompt

Private prompt library with local-first storage and public discovery surfaces.

## Language

**What's New**:
A one-time, in-app product highlight that introduces the current feature to eligible users.
_Avoid_: Changelog, release notes, toast, newsletter, Announcement

**What's New Highlight**:
The single active feature being promoted (identified by a stable string id such as `custom-ai-providers`).
_Avoid_: Feed item, release, version notes, Announcement

**Seen Highlight**:
A What's New Highlight the user has already acknowledged, recorded as `lastSeenWhatsNewId` in local settings.
_Avoid_: Dismissed banner, read receipt, notification state

**My Library**:
The private library root that holds unfiled prompts. It is not a Folder.
_Avoid_: main folder, uncategorized folder, root folder

**Folder**:
A named collection of prompts in the private library.
_Avoid_: directory, category, pack

**Folder Export**:
A JSON file containing one Folder, its prompts, and the tags those prompts use.
_Avoid_: collection file, backup, library export

**Announcement**:
The single current editor-controlled message shown in the Announcement Bar when enabled. Stored outside the app so copy and on/off do not require a deploy.
_Avoid_: What's New, news, newsletter, release notes

**Announcement Bar**:
The header chrome that renders the current Announcement on the landing page, the public prompt library, and the public agent library. Visitors can dismiss it.
_Avoid_: toast, modal, What's New, news bar

**Seen Announcement**:
An Announcement the visitor has dismissed, recorded by Announcement id locally.
_Avoid_: Seen Highlight

**Category New**:
A featured category whose newness window has not expired.
_Avoid_: What's New, hardcoded New, highlight

**Prompt Guide**:
Vendor documentation describing how to prompt a specific model.
_Avoid_: Model Pack, official prompts

**Prompt Guides**:
The public library and blog section below Featured that lists Model Packs and their write-ups. Not Featured.
_Avoid_: Featured Prompts, Featured Authors, vendor documentation page

**Model Pack**:
A small collection of original prompts synthesized from a Prompt Guide for one model release. Prompts belong to a vendor author. Discovery is the pack category page under Prompt Guides (`sort_order` 1000+).
_Avoid_: official prompts, Prompt Guide reprint, Folder, Featured

**Vendor Author**:
A verified public author for a model vendor. Not a Featured Author.
_Avoid_: highlighted author, official author

**Pack Tag**:
The tag that exclusively defines a Model Pack category. Use-case tags on the same prompts may also place them in Writing, Productivity, and similar categories.
_Avoid_: Writing, category tag

**Prompt Draft**:
A Model Pack written for review before it is published to the public library.
_Avoid_: live prompt

**Pack Update**:
Approving a Prompt Draft for a Model Pack that is already live replaces that pack in place and refreshes Category New.
_Avoid_: new pack, revision category
