# Bearprompt

Private prompt library with local-first storage and public discovery surfaces.

## Language

**What's New**:
A one-time, in-app product highlight that introduces the current feature to eligible users.
_Avoid_: Changelog, release notes, toast, banner, newsletter

**What's New Highlight**:
The single active feature being promoted (identified by a stable string id such as `custom-ai-providers`).
_Avoid_: Feed item, release, version notes

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
