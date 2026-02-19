# BeachBum Plugins

Internal Claude Code plugin marketplace for BeachBum engineering.

## Skills

See `.claude/skills/` for automated workflows:

- **`add-plugin.md`** -- Step-by-step instructions for adding a plugin to the marketplace (local, GitHub, or other git sources).

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `add-plugin.ts` | `npx tsx scripts/add-plugin.ts` | Add a local plugin to the marketplace |
| `remove-plugin.ts` | `npx tsx scripts/remove-plugin.ts` | Remove a plugin from the marketplace |
| `scaffold-plugin.ts` | `npx tsx scripts/scaffold-plugin.ts` | Scaffold a new plugin directory |
| `validate.ts` | `npm run validate` | Validate marketplace.json against schema |
| `generate-readme.ts` | `npm run generate-readme` | Regenerate README.md from marketplace.json |
| `health-check.ts` | `npx tsx scripts/health-check.ts` | Check plugin health and availability |

## Key Conventions

- Plugins in `marketplace.json` are sorted **alphabetically by name**.
- Plugin names use **kebab-case** (e.g. `bb-code-review`).
- After any change to `marketplace.json`, run: `npm run generate-readme && npm run validate -- --local-only`
- README.md is auto-generated -- do not edit it manually.
- Marketplace file: `.claude-plugin/marketplace.json`
- Schema file: `schemas/marketplace.schema.json`
