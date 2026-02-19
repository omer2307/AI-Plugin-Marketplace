import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { readMarketplace } from "./lib/marketplace-io.js";
import type { MarketplaceData } from "./lib/types.js";

export function generateReadmeContent(data: MarketplaceData): string {
  const title = data.description || data.name;
  const lines: string[] = [
    `# ${title}`,
    "",
    "A centralized plugin marketplace for Claude Code CLI.",
    "",
    "## Available Plugins",
    "",
    "| Name | Description | Category |",
    "| ---- | ----------- | -------- |",
  ];

  for (const plugin of data.plugins) {
    const name = plugin.name;
    const description = plugin.description || "";
    const category = plugin.category || "";
    lines.push(`| ${name} | ${description} | ${category} |`);
  }

  lines.push(
    "",
    "## Adding a Plugin",
    "",
    "### Supported sources",
    "",
    "| Type | Example |",
    "| ---- | ------- |",
    "| GitHub | `https://github.com/owner/repo` or `owner/repo` |",
    "| Other git URL | `https://bitbucket.org/owner/repo.git` |",
    "",
    "### Steps",
    "",
    "1. Build the source object per the schema:",
    '   - **GitHub**: `{ "source": "github", "repo": "owner/repo" }`',
    '   - **Other git**: `{ "source": "url", "url": "https://host/owner/repo.git" }`',
    "2. Add the plugin entry to `.claude-plugin/marketplace.json`, inserting alphabetically by name.",
    "3. Run validation:",
    "",
    "```bash",
    "npm run generate-readme && npm run validate -- --local-only",
    "```",
    "",
    "See `.claude/skills/add-plugin.md` for full details on building plugin entries.",
    "",
    "---",
    "",
    "*This file is auto-generated from marketplace.json. Do not edit manually.*",
    "*Run `npm run generate-readme` to regenerate.*",
    "",
  );

  return lines.join("\n");
}

async function main(): Promise<void> {
  const data = readMarketplace();
  const content = generateReadmeContent(data);
  const readmePath = resolve("README.md");
  writeFileSync(readmePath, content);
  console.log(chalk.green("README.md generated successfully."));
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err: unknown) => {
    console.error(chalk.red("Failed to generate README.md:"), err);
    process.exit(1);
  });
}
