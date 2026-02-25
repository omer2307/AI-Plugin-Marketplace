# Internal Claude Code plugins for Omer Somekh

A centralized plugin marketplace for Claude Code CLI.

## Available Plugins

| Name | Description | Category | Setup |
| ---- | ----------- | -------- | ----- |
| omnisharp-mcp | MCP server providing C# code analysis via OmniSharp | development | Run `/setup-omnisharp-mcp` in Claude Code CLI if mcp is failing |

## Setup

```
/plugin marketplace add <marketplace-ssh-url>
```

## Adding a Plugin

```
add plugin <git-url>
```

Add SSH url if Omer Somekh hosted repo, and HTTP if open source repo.

The `add-plugin` skill handles source detection, entry creation, validation, and README regeneration.

---

*This file is auto-generated from marketplace.json. Do not edit manually.*
*Run `npm run generate-readme` to regenerate.*
