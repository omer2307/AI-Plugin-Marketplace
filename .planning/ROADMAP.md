# Roadmap: BeachBum Plugin Marketplace

## Overview

This roadmap delivers a centralized plugin registry for Claude Code CLI, starting with the core registry schema and validation, then proving it with real seed plugins, adding CLI tooling for plugin management, and finishing with developer experience improvements. The four phases follow a strict dependency chain: schema before validation, validation before seed content, stable schema before scripts, and working system before onboarding tooling.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Registry Foundation** - Define the marketplace schema, create marketplace.json, and build validation scripts
- [x] **Phase 2: Seed Content** - Populate registry with real plugins and verify end-to-end health
- [x] **Phase 3: CLI Tooling** - Scripts to add and remove plugins from the registry programmatically
- [x] **Phase 4: Developer Experience** - Plugin scaffold, README catalog, and team-wide settings for easy adoption

## Phase Details

### Phase 1: Registry Foundation
**Goal**: Engineers have a valid, schema-enforced marketplace.json that can be consumed by Claude Code CLI
**Depends on**: Nothing (first phase)
**Requirements**: REG-01, REG-02, REG-03, VAL-01, VAL-02
**Success Criteria** (what must be TRUE):
  1. marketplace.json exists at `.claude-plugin/marketplace.json` and follows Claude Code's official schema (name, owner, plugins array)
  2. Each plugin entry in marketplace.json includes category and tags fields for discovery
  3. Running `npm run validate` checks marketplace.json against JSON Schema and reports errors for missing/invalid fields
  4. Running `npm run validate` checks individual plugin.json manifests against their schema
  5. marketplace.json is accessible via raw GitHub URL when the repo is pushed
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md -- Project setup, JSON Schema definitions, and marketplace.json structure
- [x] 01-02-PLAN.md -- Validation scripts for marketplace.json and plugin.json manifests

### Phase 2: Seed Content
**Goal**: The registry contains real, working plugins that prove the end-to-end flow from registration to CLI discovery
**Depends on**: Phase 1
**Requirements**: SEED-01, SEED-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. At least 2 seed plugins are registered in marketplace.json with valid entries
  2. Each seed plugin has a `.claude-plugin/plugin.json` manifest and at least one functional component (command, skill, or MCP server)
  3. Health check script verifies that all referenced plugin repos exist and contain valid `.claude-plugin/plugin.json` files
  4. Claude Code CLI can discover and list the seed plugins when pointed at the marketplace URL
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md -- Create seed plugins (bb-code-review command, bb-project-helper skill) and register in marketplace.json
- [x] 02-02-PLAN.md -- Health check script with per-plugin status reporting and end-to-end verification

### Phase 3: CLI Tooling
**Goal**: Engineers can add and remove plugins from the registry using scripts instead of manual JSON editing
**Depends on**: Phase 2
**Requirements**: TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):
  1. Running the add-plugin script with valid fields inserts a new plugin entry into marketplace.json with correct formatting and sorted placement
  2. The add-plugin script rejects duplicate plugin names and invalid/missing fields with clear error messages
  3. Running the remove-plugin script marks a plugin as deprecated (or removes it) from marketplace.json
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md -- Shared marketplace I/O module, @inquirer/prompts install, and add-plugin script with dual-mode CLI
- [x] 03-02-PLAN.md -- Remove-plugin script with interactive selection and end-to-end verification

### Phase 4: Developer Experience
**Goal**: Engineers can create new plugins quickly and any repo can auto-register the BeachBum marketplace
**Depends on**: Phase 3
**Requirements**: DX-01, DX-02, DX-03
**Success Criteria** (what must be TRUE):
  1. Running the scaffold command generates a correct `.claude-plugin/` directory structure with plugin.json, commands/, skills/, and mcp-servers/ folders
  2. The generated scaffold passes validation against the plugin.json schema without modification
  3. README contains a human-readable catalog table listing all plugins currently in marketplace.json
  4. A `.claude/settings.json` template snippet exists that auto-registers the BeachBum marketplace for any repo that includes it
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md -- Plugin scaffold CLI with dual-mode (interactive + flags) and file generation
- [x] 04-02-PLAN.md -- README catalog generator, validate staleness check, and team settings template

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Registry Foundation | 2/2 | Complete | 2026-02-15 |
| 2. Seed Content | 2/2 | Complete | 2026-02-15 |
| 3. CLI Tooling | 2/2 | Complete | 2026-02-15 |
| 4. Developer Experience | 2/2 | Complete | 2026-02-18 |
