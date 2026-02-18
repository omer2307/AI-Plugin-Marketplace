import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import chalk from "chalk";
import { readMarketplace } from "./lib/marketplace-io.js";
import { validatePluginSchema } from "./lib/schema-validator.js";

const RECOMMENDED_CATEGORIES = [
  "development",
  "productivity",
  "testing",
  "devops",
  "security",
  "integration",
  "learning",
];

const VALID_COMPONENTS = ["commands", "skills", "mcp-servers"] as const;
type ComponentType = (typeof VALID_COMPONENTS)[number];

interface ScaffoldOptions {
  name: string;
  description: string;
  owner: string;
  version: string;
  category: string;
  tags: string[];
  components: ComponentType[];
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseComponents(raw: string): ComponentType[] {
  const parts = raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (!VALID_COMPONENTS.includes(part as ComponentType)) {
      console.error(
        chalk.red("Error:") +
          ` Unknown component "${part}". Valid components: ${VALID_COMPONENTS.join(", ")}`,
      );
      process.exit(1);
    }
  }

  return parts as ComponentType[];
}

async function promptMissingFields(
  partial: Partial<ScaffoldOptions>,
): Promise<ScaffoldOptions> {
  const { input, select, checkbox } = await import("@inquirer/prompts");

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

  const description =
    partial.description ??
    (await input({
      message: "Plugin description:",
      validate: (value) => {
        if (!value.trim()) {
          return "Description is required";
        }
        return true;
      },
    }));

  const owner =
    partial.owner ??
    (await input({
      message: "Author name:",
      validate: (value) => {
        if (!value.trim()) {
          return "Author name is required";
        }
        return true;
      },
    }));

  const version =
    partial.version ??
    (await input({
      message: "Version:",
      default: "0.1.0",
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

  let components = partial.components;
  if (!components || components.length === 0) {
    components = await checkbox({
      message: "Components to include:",
      choices: VALID_COMPONENTS.map((c) => ({ name: c, value: c })),
      required: true,
    });
  }

  return {
    name: name.trim(),
    description: description.trim(),
    owner: owner.trim(),
    version: version.trim(),
    category,
    tags,
    components,
  };
}

function scaffoldPlugin(options: ScaffoldOptions): void {
  const pluginDir = resolve(".claude-plugin");

  if (existsSync(pluginDir)) {
    console.error(
      chalk.red("Error:") +
        " .claude-plugin/ directory already exists in current directory. Scaffold is for new plugins only.",
    );
    process.exit(1);
  }

  mkdirSync(pluginDir, { recursive: true });

  // Read schemaVersion from marketplace.json
  let schemaVersion = 1;
  try {
    const data = readMarketplace();
    schemaVersion = data.schemaVersion ?? 1;
  } catch {
    // marketplace.json may not be accessible from cwd; use default
  }

  const pluginJson: Record<string, unknown> = {
    name: options.name,
    description: options.description,
    version: options.version,
    author: {
      name: options.owner,
    },
    schemaVersion,
  };

  writeFileSync(
    join(pluginDir, "plugin.json"),
    JSON.stringify(pluginJson, null, 2) + "\n",
  );

  // Create component directories based on selection only
  for (const component of options.components) {
    const componentDir = resolve(component);
    mkdirSync(componentDir, { recursive: true });

    if (component === "commands") {
      const exampleCommand = [
        "---",
        'description: "TODO: describe what this command does"',
        "---",
        "",
        "# Command Name",
        "",
        "TODO: Add command instructions here.",
        "",
      ].join("\n");
      writeFileSync(join(componentDir, "example.md"), exampleCommand);
    }
  }

  // Post-scaffold validation (safety net)
  const generatedJson = JSON.parse(
    readFileSync(join(pluginDir, "plugin.json"), "utf-8"),
  );
  const validationResult = validatePluginSchema(generatedJson);
  if (validationResult.errors.length > 0) {
    for (const error of validationResult.errors) {
      console.error(chalk.red("Validation error:") + ` ${error}`);
    }
    console.error(
      chalk.red("Error:") +
        " Generated plugin.json failed schema validation. This is a scaffold bug.",
    );
    process.exit(1);
  }

  console.log("");
  console.log(chalk.green("Plugin scaffolded successfully!"));
  console.log(`  Name:       ${options.name}`);
  console.log(`  Directory:  .claude-plugin/`);
  console.log(`  Components: ${options.components.join(", ")}`);
  console.log("");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      description: { type: "string", short: "d" },
      owner: { type: "string", short: "o" },
      version: { type: "string", short: "v" },
      category: { type: "string", short: "c" },
      tags: { type: "string", short: "t" },
      components: { type: "string" },
    },
    strict: true,
  });

  const partial: Partial<ScaffoldOptions> = {};
  if (values.name) {
    partial.name = values.name;
  }
  if (values.description) {
    partial.description = values.description;
  }
  if (values.owner) {
    partial.owner = values.owner;
  }
  if (values.version) {
    partial.version = values.version;
  }
  if (values.category) {
    partial.category = values.category;
  }
  if (values.tags) {
    partial.tags = parseTags(values.tags);
  }
  if (values.components) {
    partial.components = parseComponents(values.components);
  }

  const allRequired =
    partial.name &&
    partial.description &&
    partial.owner &&
    partial.category &&
    partial.tags &&
    partial.tags.length > 0 &&
    partial.components &&
    partial.components.length > 0;

  let options: ScaffoldOptions;

  if (allRequired) {
    options = {
      name: partial.name!,
      description: partial.description!,
      owner: partial.owner!,
      version: partial.version ?? "0.1.0",
      category: partial.category!,
      tags: partial.tags!,
      components: partial.components!,
    };
  } else {
    if (!process.stdin.isTTY) {
      const missing: string[] = [];
      if (!partial.name) {
        missing.push("--name");
      }
      if (!partial.description) {
        missing.push("--description");
      }
      if (!partial.owner) {
        missing.push("--owner");
      }
      if (!partial.category) {
        missing.push("--category");
      }
      if (!partial.tags || partial.tags.length === 0) {
        missing.push("--tags");
      }
      if (!partial.components || partial.components.length === 0) {
        missing.push("--components");
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

  scaffoldPlugin(options);
}

main().catch((error) => {
  console.error(chalk.red("Error:") + ` ${error.message || error}`);
  process.exit(1);
});
