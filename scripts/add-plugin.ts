import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import chalk from "chalk";
import {
  readMarketplace,
  writeMarketplace,
  insertPlugin,
  findPlugin,
} from "./lib/marketplace-io.js";
import { validateLocalSource } from "./lib/remote-validator.js";
import {
  validateMarketplaceSchema,
  validateSemantics,
} from "./lib/schema-validator.js";
import type { PluginEntry } from "./lib/types.js";

const RECOMMENDED_CATEGORIES = [
  "development",
  "productivity",
  "testing",
  "devops",
  "security",
  "integration",
  "learning",
];

interface AddPluginOptions {
  name: string;
  source: string;
  category: string;
  tags: string[];
  description?: string;
}

function normalizeSource(source: string): string {
  let normalized = source.replace(/\/+$/, "");
  if (!normalized.startsWith("./")) {
    normalized = `./${normalized}`;
  }
  return normalized;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function readPluginJson(
  sourcePath: string,
): Record<string, unknown> | undefined {
  const resolved = resolve(sourcePath);
  if (!existsSync(resolved) || statSync(resolved).isFile()) {
    return undefined;
  }
  const manifestPath = resolve(resolved, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return undefined;
  }
}

async function promptMissingFields(
  partial: Partial<AddPluginOptions>,
): Promise<AddPluginOptions> {
  const { input, select } = await import("@inquirer/prompts");

  const name =
    partial.name ??
    (await input({
      message: "Plugin name:",
      validate: (value) => {
        if (!value.trim()) {
          return "Name is required";
        }
        if (!/^[a-z][a-z0-9-]*$/.test(value.trim())) {
          return "Name must be kebab-case (lowercase alphanumeric with hyphens, starting with a letter)";
        }
        return true;
      },
    }));

  const source =
    partial.source ??
    (await input({
      message: "Source path (relative):",
      validate: (value) => {
        if (!value.trim()) {
          return "Source path is required";
        }
        return true;
      },
    }));

  const category =
    partial.category ??
    (await select({
      message: "Category:",
      choices: RECOMMENDED_CATEGORIES.map((c) => ({ name: c, value: c })),
    }));

  let tags = partial.tags;
  if (!tags || tags.length === 0) {
    const tagsInput = await input({
      message: "Tags (comma-separated):",
      validate: (value) => {
        const parsed = parseTags(value);
        if (parsed.length === 0) {
          return "At least one tag is required";
        }
        return true;
      },
    });
    tags = parseTags(tagsInput);
  }

  const description =
    partial.description ??
    (await input({
      message: "Description (optional):",
      default: "",
    }));

  return {
    name: name.trim(),
    source: source.trim(),
    category,
    tags,
    description: description || undefined,
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      source: { type: "string", short: "s" },
      category: { type: "string", short: "c" },
      tags: { type: "string", short: "t" },
      description: { type: "string", short: "d" },
      yes: { type: "boolean", short: "y", default: false },
    },
    strict: true,
  });

  const partial: Partial<AddPluginOptions> = {};
  if (values.name) {
    partial.name = values.name;
  }
  if (values.source) {
    partial.source = values.source;
  }
  if (values.category) {
    partial.category = values.category;
  }
  if (values.tags) {
    partial.tags = parseTags(values.tags);
  }
  if (values.description) {
    partial.description = values.description;
  }

  const allRequired =
    partial.name &&
    partial.source &&
    partial.category &&
    partial.tags &&
    partial.tags.length > 0;

  let options: AddPluginOptions;

  if (allRequired) {
    options = {
      name: partial.name!,
      source: partial.source!,
      category: partial.category!,
      tags: partial.tags!,
      description: partial.description,
    };
  } else {
    if (!process.stdin.isTTY) {
      const missing: string[] = [];
      if (!partial.name) {
        missing.push("--name");
      }
      if (!partial.source) {
        missing.push("--source");
      }
      if (!partial.category) {
        missing.push("--category");
      }
      if (!partial.tags || partial.tags.length === 0) {
        missing.push("--tags");
      }
      console.error(
        chalk.red("Error:") +
          ` Missing required flags: ${missing.join(", ")}. ` +
          "Provide all required flags for non-interactive mode.",
      );
      process.exit(1);
    }
    options = await promptMissingFields(partial);
  }

  options.source = normalizeSource(options.source);

  // Auto-populate from plugin.json
  const pluginJson = readPluginJson(options.source);
  if (pluginJson) {
    if (!options.description && typeof pluginJson.description === "string") {
      options.description = pluginJson.description;
    }
  }

  // Validation: read marketplace and check for duplicates
  const data = readMarketplace();

  const existing = findPlugin(data, options.name);
  if (existing) {
    console.error(
      chalk.red("Error:") +
        ` Plugin name '${options.name}' already exists in marketplace.json. Use a different name.`,
    );
    process.exit(1);
  }

  // Validate source path
  const sourceResult = await validateLocalSource(
    { name: options.name, source: options.source } as PluginEntry,
    options.source,
  );
  if (sourceResult.errors.length > 0) {
    for (const error of sourceResult.errors) {
      console.error(chalk.red("Error:") + ` ${error}`);
    }
    process.exit(1);
  }

  // Confirmation summary
  console.log("");
  console.log("Plugin to add:");
  console.log(`  Name:        ${options.name}`);
  console.log(`  Source:      ${options.source}`);
  console.log(`  Category:    ${options.category}`);
  console.log(`  Tags:        ${options.tags.join(", ")}`);
  console.log(`  Description: ${options.description || "(none)"}`);
  console.log("");

  if (!values.yes) {
    const { confirm } = await import("@inquirer/prompts");
    const proceed = await confirm({
      message: "Add this plugin to marketplace.json?",
    });
    if (!proceed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  // Build plugin entry
  const entry: PluginEntry = {
    name: options.name,
    source: options.source,
  };
  if (options.description) {
    entry.description = options.description;
  }
  if (pluginJson && typeof pluginJson.version === "string") {
    entry.version = pluginJson.version;
  }
  if (
    pluginJson &&
    typeof pluginJson.author === "object" &&
    pluginJson.author !== null
  ) {
    entry.author = pluginJson.author as PluginEntry["author"];
  }
  entry.category = options.category;
  entry.tags = options.tags;

  // Insert in sorted position
  insertPlugin(data, entry);

  // Post-write validation (safety net)
  const schemaResult = validateMarketplaceSchema(data);
  const semanticResult = validateSemantics(data);
  const postErrors = [
    ...schemaResult.errors,
    ...semanticResult.errors,
  ];
  if (postErrors.length > 0) {
    for (const error of postErrors) {
      console.error(chalk.red("Error:") + ` ${error}`);
    }
    console.error(
      chalk.red("Aborted:") +
        " Validation failed after insertion. marketplace.json was not modified.",
    );
    process.exit(1);
  }

  // Write to disk
  writeMarketplace(data);
  console.log(chalk.green(`Added ${options.name} to marketplace.json.`));
}

main().catch((error) => {
  console.error(chalk.red("Error:") + ` ${error.message || error}`);
  process.exit(1);
});
