# Internal Claude Code plugins for BeachBum engineering

A centralized plugin marketplace for Claude Code CLI.

## Available Plugins

| Name | Description | Category |
| ---- | ----------- | -------- |
| omnisharp-mcp | MCP server providing C# code analysis via OmniSharp | development |

## Adding a Plugin

### Source types

| Type | Example |
| ---- | ------- |
| Local path | `./plugins/my-plugin` |
| GitHub | `https://github.com/owner/repo` or `owner/repo` |
| Other git URL | `https://bitbucket.org/owner/repo.git` |

### Local plugins

Use the add-plugin script:

```bash
npx tsx scripts/add-plugin.ts
```

### Remote plugins (GitHub / other git)

1. Build the source object per the schema:
   - **GitHub**: `{ "source": "github", "repo": "owner/repo" }`
   - **Other git**: `{ "source": "url", "url": "https://host/owner/repo.git" }`
2. Add the plugin entry to `.claude-plugin/marketplace.json`, inserting alphabetically by name.
3. Run validation:

```bash
npm run generate-readme && npm run validate -- --local-only
```

See `.claude/skills/add-plugin.md` for full details on building plugin entries.

---

*This file is auto-generated from marketplace.json. Do not edit manually.*
*Run `npm run generate-readme` to regenerate.*
