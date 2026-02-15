# BeachBum Plugin Marketplace

## What This Is

A centralized plugin registry for the Claude Code CLI, enabling BeachBum's engineering team to discover, install, and manage internal plugins. The marketplace is a lightweight registry (marketplace.json) served via raw Git URL, with CLI tooling for plugin validation, registration, and CI-based quality gates.

## Core Value

Engineers can find and install approved internal plugins for Claude Code with a single command -- no hunting through repos or Slack threads.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] marketplace.json registry listing all available plugins with metadata
- [ ] Plugin template structure supporting commands (.md), skills (.md), and MCP servers
- [ ] Validation script to check plugin.json manifests against schema
- [ ] Add/remove scripts to manage plugins in the registry
- [ ] CI/CD pipeline to validate marketplace.json on PRs and check plugin references
- [ ] Plugin scaffold/template for creating new plugins quickly
- [ ] Raw Git URL hosting via GitHub (no server infrastructure)

### Out of Scope

- Role-based access control / governance gateway -- deferred to future milestone
- Web UI / storefront -- the CLI is the interface
- Plugin hosting -- plugins live in their own repos, marketplace only indexes them
- Public/open-source distribution -- internal team only for now
- Plugin versioning/dependency resolution -- keep it simple, latest-only

## Context

- **Ecosystem:** Claude Code CLI supports plugins with `.claude-plugin/plugin.json` manifests. Plugin components include slash commands, skills, and MCP server configs -- many of which are plain `.md` prompt files, not traditional code.
- **Team:** BeachBum internal engineering. Developers already use Claude Code CLI daily.
- **Distribution model:** Decentralized. Marketplace is a JSON index pointing to separate Git repos. The CLI consumes the registry URL to discover plugins.
- **Hosting:** Raw file URL from this GitHub repo (e.g., `https://raw.githubusercontent.com/.../marketplace.json`). No backend server needed.
- **Plugin format:** `.claude-plugin/plugin.json` manifest + component folders (commands/, skills/, mcp-servers/). Components are often markdown files, not executable code.

## Constraints

- **Tech stack**: Node.js/shell scripts for tooling -- lightweight, no heavy frameworks
- **Hosting**: Static file serving only (raw Git URL) -- no server infrastructure
- **Auth**: Git-level access control (private repo = private marketplace) -- no custom auth layer
- **Plugin format**: Must follow Claude Code CLI's `.claude-plugin/plugin.json` convention

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Raw Git URL over server hosting | Simplest approach, no infra to maintain | -- Pending |
| Flat access (no role-based filtering) | Start simple, add governance later | -- Pending |
| Node.js for tooling scripts | Common in JS/TS ecosystem, team familiarity | -- Pending |
| Registry-only repo (plugins in separate repos) | Clean separation, each plugin has own lifecycle | -- Pending |

---
*Last updated: 2026-02-15 after initialization*
