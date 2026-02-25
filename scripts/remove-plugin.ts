import { parseArgs } from "node:util";
import chalk from "chalk";
import {
  readMarketplace,
  writeMarketplace,
  removePlugin,
  findPlugin,
} from "./lib/marketplace-io.js";
import {
  validateMarketplaceSchema,
  validateSemantics,
} from "./lib/schema-validator.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      yes: { type: "boolean", short: "y", default: false },
    },
    strict: true,
  });

  const data = readMarketplace();

  if (data.plugins.length === 0) {
    console.log(chalk.yellow("No plugins registered in marketplace.json."));
    process.exit(0);
  }

  let targetName: string;

  if (values.name) {
    targetName = values.name;
  } else {
    if (!process.stdin.isTTY) {
      console.error(
        chalk.red("Error:") +
          " No --name flag provided and stdin is not interactive. Use --name/-n to specify the plugin.",
      );
      process.exit(1);
    }

    const { select } = await import("@inquirer/prompts");
    targetName = await select({
      message: "Select plugin to remove:",
      choices: data.plugins.map((plugin) => ({
        name: `${plugin.name} -- ${plugin.description || "(no description)"}`,
        value: plugin.name,
      })),
    });
  }

  const existing = findPlugin(data, targetName);
  if (!existing) {
    console.error(
      chalk.red("Error:") +
        ` Plugin '${targetName}' not found in marketplace.json.`,
    );
    process.exit(1);
  }

  if (!values.yes) {
    if (!process.stdin.isTTY) {
      console.error(
        chalk.red("Error:") +
          " Cannot confirm removal in non-interactive mode. Use --yes/-y flag.",
      );
      process.exit(1);
    }

    const { confirm } = await import("@inquirer/prompts");
    const proceed = await confirm({
      message: `Remove ${targetName}? (y/n)`,
    });
    if (!proceed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  removePlugin(data, targetName);

  const schemaResult = validateMarketplaceSchema(data);
  const semanticResult = validateSemantics(data);
  const postErrors = [...schemaResult.errors, ...semanticResult.errors];
  if (postErrors.length > 0) {
    for (const error of postErrors) {
      console.error(chalk.red("Error:") + ` ${error}`);
    }
    console.error(
      chalk.red("Aborted:") +
        " Validation failed after removal. marketplace.json was not modified.",
    );
    process.exit(1);
  }

  writeMarketplace(data);
  console.log(chalk.green(`Removed ${targetName} from marketplace.json.`));
}

main().catch((error) => {
  console.error(chalk.red("Error:") + ` ${error.message || error}`);
  process.exit(1);
});
