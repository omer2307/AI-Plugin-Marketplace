---
name: add-plugin
description: Add a plugin to the marketplace from a git repository or local file. Handles GitHub, Bitbucket, GitLab URLs (HTTPS or SSH) and local plugin files.
argument-hint: [source-url-or-path]
---

# Skill: Add Plugin to Marketplace

## When to use

When the user asks to add a plugin to the marketplace. Common phrasings:
- "add plugin X"
- "register plugin X"
- "add git@... to marketplace"
- "add https://github.com/... as a plugin"
- "add local-plugins/my-plugin.md"
- "add ./path/to/plugin"

## Input formats

The user may provide a source in any of these forms:

| Input | Example | Source type |
|---|---|---|
| Local file path (absolute) | `/Users/.../omer-somekh-plugins/local-plugins/review.md` | `localSource` |
| Local file path (relative) | `local-plugins/review.md` or `./local-plugins/review.md` | `localSource` |
| GitHub shorthand | `owner/repo` | `githubSource` |
| GitHub HTTPS | `https://github.com/owner/repo` or `https://github.com/owner/repo.git` | `githubSource` |
| GitHub SSH | `git@github.com:owner/repo.git` | `githubSource` |
| Other HTTPS git URL | `https://bitbucket.org/owner/repo.git` | `urlSource` |
| Other SSH git URL | `git@bitbucket.org:owner/repo.git` | `urlSource` (convert to HTTPS) |

## How to determine the source object

### Step 1: Detect the source type

1. **Local file** -- the input is a file path (absolute or relative) pointing to a file inside this repository. Detected when:
   - The path starts with `/`, `./`, or `../`
   - The path points to an existing file within the omer-somekh-plugins repo
   - The path contains a file extension (e.g. `.md`)
   - The input does NOT look like a URL or `owner/repo` shorthand
2. **GitHub** -- the host is `github.com` (from URL) or the input matches `owner/repo` (no dots, slashes, or protocol).
3. **Other SSH** -- SSH URL where the host is NOT `github.com` (e.g. `git@bitbucket.org:...`). Convert to HTTPS `urlSource`.
4. **Other HTTPS** -- HTTPS git URL where the host is NOT `github.com`.

### Step 2: Build the source object

**Local file** (`localSource` -- a relative path string in schema):
- The source value is a **relative path starting with `./`** from the repo root to the plugin file or directory.
- The file **must exist** in the repository. Verify the file exists before proceeding.
- Convert absolute paths to relative: strip the repo root prefix and prepend `./`.
- Convert bare relative paths (e.g. `local-plugins/foo.md`) to `./local-plugins/foo.md`.
- The path must match schema pattern `^\.\/`.
- Example source value: `"./local-plugins/my-plugin.md"`
- Read the file content to extract description and context for the plugin entry.

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

**Other SSH** -- convert to `urlSource`:
- Convert `git@<host>:<owner>/<repo>.git` to `https://<host>/<owner>/<repo>.git`
- Then use the HTTPS `urlSource` format below.

**Other HTTPS** (`urlSource` in schema):
```json
{
  "source": "url",
  "url": "<https-url-ending-in-.git>"
}
```
- The URL **must** end in `.git` (schema pattern: `\.git$`). Append `.git` if missing.
- Optionally include `"ref"` if the user specifies a branch/tag.

### SSH authentication note

Since we use HTTPS URLs in the marketplace but may need SSH keys for private repos, team members should configure git to rewrite HTTPS to SSH automatically:

```bash
# For Bitbucket:
git config --global url."git@bitbucket.org:".insteadOf "https://bitbucket.org/"

# For GitLab (if needed):
git config --global url."git@gitlab.com:".insteadOf "https://gitlab.com/"
```

This lets Claude Code's schema validation pass (it only recognizes `urlSource` with HTTPS URLs) while still using SSH keys for actual git operations.

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
- **name**: kebab-case, 3-50 chars, pattern `^[a-z][a-z0-9-]*$`. Derive from the repo name or file name (e.g. `omnisharp-mcp` from `paraplay/omnisharp-mcp`, or `code-review` from `code-review.md`). Convert to lowercase. Ask the user to confirm or provide an alternative.
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

## Example walkthroughs

### Local plugin

User says: "add local-plugins/my-plugin.md"

1. Detect: file path pointing to a file in the repo -> `localSource`.
2. Verify file exists at `local-plugins/my-plugin.md`.
3. Read the file to extract description context (e.g. from frontmatter or content).
4. Convert to relative path: `./local-plugins/my-plugin.md`.
5. Derive name from file name: `my-plugin`.
6. Ask user for description, category, and tags.
7. Build entry:
   ```json
   {
     "name": "my-plugin",
     "source": "./local-plugins/my-plugin.md",
     "description": "<user-provided>",
     "category": "<user-chosen>",
     "tags": ["<user-provided>"]
   }
   ```
8. Insert into `plugins` array alphabetically.
9. Run `npm run generate-readme && npm run validate -- --local-only`.

### Remote git plugin

User says: "add plugin git@bitbucket.org:paraplay/omnisharp-mcp.git"

1. Detect: SSH URL, host is `bitbucket.org` (not GitHub) -> convert to HTTPS `urlSource`.
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
- `localSource` is a plain string starting with `./` (schema pattern `^\.\/`). The file must exist in the repo.
- `githubSource` requires `"source": "github"` and `"repo"` in `owner/repo` format.
- `urlSource` requires `"source": "url"` and `"url"` as a valid HTTPS URI ending in `.git`.
- Plugin names must be unique across the marketplace.
