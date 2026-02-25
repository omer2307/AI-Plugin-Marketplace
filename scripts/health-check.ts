import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import {
  validateMarketplaceSchema,
  validateSemantics,
} from "./lib/schema-validator.js";
import { validateRemoteReferences } from "./lib/remote-validator.js";
import type { MarketplaceData, PluginEntry, ValidationResult } from "./lib/types.js";

interface PluginStatus {
  name: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function crossCheckName(plugin: PluginEntry): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };

  if (typeof plugin.source !== "string" || !plugin.source.startsWith("./")) {
    return result;
  }

  const manifestPath = resolve(plugin.source, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    return result;
  }

  try {
    const manifestData = JSON.parse(readFileSync(manifestPath, "utf-8"));
    if (manifestData.name && manifestData.name !== plugin.name) {
      result.warnings.push(
        `Plugin "${plugin.name}": marketplace name "${plugin.name}" does not match plugin.json name "${manifestData.name}"`,
      );
    }
  } catch {
    // Parse errors are caught by remote validation; skip here
  }

  return result;
}

function printReport(statuses: PluginStatus[]): void {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  console.log("\nPlugin Health Check");
  console.log("========================================\n");
  console.log(`Checking ${statuses.length} plugin(s)...`);

  // Determine max name length for alignment
  const maxNameLen = Math.max(...statuses.map((s) => s.name.length));

  for (const status of statuses) {
    const paddedName = status.name.padEnd(maxNameLen);
    if (status.ok) {
      console.log(`  ${chalk.green("OK")}    ${paddedName}`);
    } else {
      console.log(`  ${chalk.red("FAIL")}  ${paddedName}`);
    }
    allErrors.push(...status.errors);
    allWarnings.push(...status.warnings);
  }

  console.log("\n========================================");

  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(chalk.green("All plugins healthy"));
    return;
  }

  for (const error of allErrors) {
    console.log(`${chalk.red("ERROR")}: ${error}`);
  }
  for (const warning of allWarnings) {
    console.log(`${chalk.yellow("WARNING")}: ${warning}`);
  }
  console.log(`${allErrors.length} error(s), ${allWarnings.length} warning(s)`);
}

async function main(): Promise<void> {
  const marketplacePath = resolve(".claude-plugin/marketplace.json");

  // Read and parse marketplace.json
  let rawData: string;
  try {
    rawData = readFileSync(marketplacePath, "utf-8");
  } catch {
    console.log(`${chalk.red("FAIL")}: Cannot read marketplace.json at ${marketplacePath}`);
    process.exit(1);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawData);
  } catch {
    console.log(`${chalk.red("FAIL")}: marketplace.json is not valid JSON`);
    process.exit(1);
  }

  // Schema validation
  const schemaResult = validateMarketplaceSchema(data);
  if (schemaResult.errors.length > 0) {
    for (const error of schemaResult.errors) {
      console.log(`${chalk.red("ERROR")}: Schema: ${error}`);
    }
    console.log(`${schemaResult.errors.length} error(s), 0 warning(s)`);
    process.exit(1);
  }

  // Semantic validation
  const typedData = data as MarketplaceData;
  const semanticResult = validateSemantics(typedData);
  if (semanticResult.errors.length > 0) {
    for (const error of semanticResult.errors) {
      console.log(`${chalk.red("ERROR")}: Semantic: ${error}`);
    }
    console.log(`${semanticResult.errors.length} error(s), 0 warning(s)`);
    process.exit(1);
  }

  const plugins = typedData.plugins;
  const statuses: PluginStatus[] = [];

  // Validate each plugin individually
  for (const plugin of plugins) {
    const status: PluginStatus = {
      name: plugin.name,
      ok: true,
      errors: [],
      warnings: [],
    };

    // Per-plugin remote/local validation
    const refResult = await validateRemoteReferences([plugin]);
    status.errors.push(...refResult.errors);
    status.warnings.push(...refResult.warnings);

    // Name cross-check for local plugins
    const crossResult = crossCheckName(plugin);
    status.warnings.push(...crossResult.warnings);

    if (status.errors.length > 0 || status.warnings.length > 0) {
      status.ok = false;
    }

    statuses.push(status);
  }

  // Add any schema/semantic warnings to first plugin status (global warnings)
  if (schemaResult.warnings.length > 0 || semanticResult.warnings.length > 0) {
    const globalWarnings = [
      ...schemaResult.warnings,
      ...semanticResult.warnings,
    ];
    if (statuses.length > 0) {
      statuses[0].warnings.push(...globalWarnings);
      if (globalWarnings.length > 0) {
        statuses[0].ok = false;
      }
    }
  }

  printReport(statuses);

  const hasErrors = statuses.some((s) => s.errors.length > 0);
  const hasWarnings = statuses.some((s) => s.warnings.length > 0);

  if (hasErrors || hasWarnings) {
    process.exit(1);
  }

  process.exit(0);
}

main();
