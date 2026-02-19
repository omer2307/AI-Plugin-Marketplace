---
name: add-plugin
description: Add a plugin to the marketplace from a git repository or local path. Handles GitHub, Bitbucket, GitLab URLs (HTTPS or SSH) and local paths.
argument-hint: [source-url]
---

# Skill: Add Plugin to Marketplace

## When to use

When the user asks to add a plugin to the marketplace. Common phrasings:
- "add plugin X"
- "register plugin X"
- "add git@... to marketplace"
- "add https://github.com/... as a plugin"

## Input formats

The user may provide a source in any of these forms:

| Input | Example | Source type |
|---|---|---|
| Local path | `plugins/my-plugin` or `./plugins/my-plugin` | Local string |
| GitHub shorthand | `owner/repo` | `githubSource` |
| GitHub HTTPS | `https://github.com/owner/repo` or `https://github.com/owner/repo.git` | `githubSource` |
| GitHub SSH | `git@github.com:owner/repo.git` | `githubSource` |
| Other HTTPS git URL | `https://bitbucket.org/owner/repo.git` | `urlSource` |
| Other SSH git URL | `git@bitbucket.org:owner/repo.git` | `urlSource` |

## How to determine the source object

### Step 1: Detect the source type

1. **Local path** -- starts with `./` or contains no `:` / `@` and looks like a relative path.
   Delegate to the existing script: `npx tsx scripts/add-plugin.ts` (it handles local sources).
2. **GitHub** -- the host is `github.com` (from URL) or the input matches `owner/repo` (no dots, slashes, or protocol).
3. **Other remote** -- any other SSH or HTTPS git URL.

### Step 2: Build the source object

**GitHub** (`githubSource` in schema):
```json
{
  "source": "github",
  "repo": "<owner>/<repo>"
}
```
- Extract `owner/repo` from the URL. Strip `.git` suffix if present.
- The `repo` field must match pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`.
- Optionally include `"ref"` (branch/tag) if the user specifies one.

**Other remote** (`urlSource` in schema):
```json
{
  "source": "url",
  "url": "<https-url-ending-in-.git>"
}
```
- **Always convert SSH URLs to HTTPS.** The schema requires `"format": "uri"` which means valid HTTPS.
  - `git@bitbucket.org:owner/repo.git` becomes `https://bitbucket.org/owner/repo.git`
  - `git@gitlab.com:owner/repo.git` becomes `https://gitlab.com/owner/repo.git`
- The URL **must** end in `.git` (schema pattern: `\.git$`). Append `.git` if missing.
- Optionally include `"ref"` if the user specifies a branch/tag.

**Local** (string):
```json
"./plugins/my-plugin"
```
- Must start with `./` (schema pattern: `^\.\/`).

## How to build the plugin entry

The full entry in `marketplace.json` looks like:
```json
{
  "name": "<kebab-case-name>",
  "source": <source object or string>,
  "description": "<one-line description>",
  "category": "<category>",
  "tags": ["<tag1>", "<tag2>"]
}
```

### Required fields
- **name**: kebab-case, 3-50 chars, pattern `^[a-z][a-z0-9-]*$`. Derive from the repo name (e.g. `omnisharp-mcp` from `paraplay/omnisharp-mcp`). Convert to lowercase. Ask the user to confirm or provide an alternative.
- **source**: built per the rules above.

### Recommended fields (ask the user)
- **description**: a brief one-line description of what the plugin does.
- **category**: one of `development`, `productivity`, `testing`, `devops`, `security`, `integration`, `learning`.
- **tags**: array of short lowercase strings for searchability.

## Where to insert

Edit `.claude-plugin/marketplace.json` directly. Insert the new entry into the `plugins` array in **alphabetical order by name** (using `localeCompare` semantics -- same as `scripts/lib/marketplace-io.ts:insertPlugin`).

## After inserting

Run validation:
```bash
npm run generate-readme && npm run validate -- --local-only
```

If validation fails, fix the entry and re-run. The `--local-only` flag skips network checks for remote sources.

## Example walkthrough

User says: "add plugin git@bitbucket.org:paraplay/omnisharp-mcp.git"

1. Detect: SSH URL, host is `bitbucket.org` (not GitHub) -> `urlSource`.
2. Convert SSH to HTTPS: `https://bitbucket.org/paraplay/omnisharp-mcp.git`.
3. Derive name: `omnisharp-mcp`.
4. Ask user for description, category, and tags.
5. Build entry:
   ```json
   {
     "name": "omnisharp-mcp",
     "source": {
       "source": "url",
       "url": "https://bitbucket.org/paraplay/omnisharp-mcp.git"
     },
     "description": "<user-provided>",
     "category": "<user-chosen>",
     "tags": ["<user-provided>"]
   }
   ```
6. Insert into `plugins` array alphabetically (after any entry whose name < "omnisharp-mcp").
7. Run `npm run generate-readme && npm run validate -- --local-only`.

## Important schema details

- Schema file: `schemas/marketplace.schema.json`
- Marketplace file: `.claude-plugin/marketplace.json`
- `githubSource` requires `"source": "github"` and `"repo"` in `owner/repo` format.
- `urlSource` requires `"source": "url"` and `"url"` as a valid URI ending in `.git`.
- Local source is a plain string starting with `./`.
- Plugin names must be unique across the marketplace.
