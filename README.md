# Internal Claude Code plugins for BeachBum engineering

A centralized plugin marketplace for Claude Code CLI.

## Available Plugins

| Name | Description | Category | Setup |
| ---- | ----------- | -------- | ----- |
| omnisharp-mcp | MCP server providing C# code analysis via OmniSharp | development | Run `/setup-omnisharp-mcp` in Claude Code CLI if mcp is failing |

## Adding a Plugin

```
add plugin <github-url-or-git-url>
```

The `add-plugin` skill handles source detection, entry creation, validation, and README regeneration.

---

*This file is auto-generated from marketplace.json. Do not edit manually.*
*Run `npm run generate-readme` to regenerate.*
