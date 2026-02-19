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
    "```",
    "add plugin <github-url-or-git-url>",
    "```",
    "",
    "The `add-plugin` skill handles source detection, entry creation, validation, and README regeneration.",
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
