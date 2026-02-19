---
name: add-plugin
description: Add a plugin to the marketplace from a git repository. Handles GitHub, Bitbucket, GitLab URLs (HTTPS or SSH).
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
| GitHub shorthand | `owner/repo` | `githubSource` |
| GitHub HTTPS | `https://github.com/owner/repo` or `https://github.com/owner/repo.git` | `githubSource` |
| GitHub SSH | `git@github.com:owner/repo.git` | `githubSource` |
| Other HTTPS git URL | `https://bitbucket.org/owner/repo.git` | `urlSource` |
| Other SSH git URL | `git@bitbucket.org:owner/repo.git` | `sshSource` |

## How to determine the source object

### Step 1: Detect the source type

1. **GitHub** -- the host is `github.com` (from URL) or the input matches `owner/repo` (no dots, slashes, or protocol).
2. **Other SSH** -- SSH URL where the host is NOT `github.com` (e.g. `git@bitbucket.org:...`).
3. **Other HTTPS** -- HTTPS git URL where the host is NOT `github.com`.

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

**Other SSH** (`sshSource` in schema):
```json
{
  "source": "ssh",
  "url": "git@<host>:<owner>/<repo>.git"
}
```
- Keep the SSH URL as-is. Do NOT convert to HTTPS.
- The URL **must** end in `.git`. Append `.git` if missing.
- The URL must match pattern `^git@[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+\.git$`.
- Optionally include `"ref"` if the user specifies a branch/tag.

**Other HTTPS** (`urlSource` in schema):
```json
{
  "source": "url",
  "url": "<https-url-ending-in-.git>"
}
```
- The URL **must** end in `.git` (schema pattern: `\.git$`). Append `.git` if missing.
- Optionally include `"ref"` if the user specifies a branch/tag.

## How to build the plugin entry

The full entry in `marketplace.json` looks like:
```json
{
  "name": "<kebab-case-name>",
  "source": <source object>,
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

1. Detect: SSH URL, host is `bitbucket.org` (not GitHub) -> `sshSource`.
2. Keep SSH URL as-is.
3. Derive name: `omnisharp-mcp`.
4. Ask user for description, category, and tags.
5. Build entry:
   ```json
   {
     "name": "omnisharp-mcp",
     "source": {
       "source": "ssh",
       "url": "git@bitbucket.org:paraplay/omnisharp-mcp.git"
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
- `urlSource` requires `"source": "url"` and `"url"` as a valid HTTPS URI ending in `.git`.
- `sshSource` requires `"source": "ssh"` and `"url"` in `git@host:owner/repo.git` format.
- Plugin names must be unique across the marketplace.
