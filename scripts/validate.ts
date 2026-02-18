import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateReadmeContent } from "./generate-readme.js";
import {
  validateMarketplaceSchema,
  validateSemantics,
} from "./lib/schema-validator.js";
import { validateRemoteReferences } from "./lib/remote-validator.js";
import { reportAndExit } from "./lib/reporter.js";
import type { MarketplaceData, ValidationResult } from "./lib/types.js";

async function main(): Promise<void> {
  const marketplacePath = resolve(".claude-plugin/marketplace.json");
  const localOnly = process.argv.includes("--local-only");

  const combined: ValidationResult = { errors: [], warnings: [] };

  // Read and parse marketplace.json
  let rawData: string;
  try {
    rawData = readFileSync(marketplacePath, "utf-8");
  } catch {
    combined.errors.push(
      `Cannot read marketplace.json at ${marketplacePath}`,
    );
    reportAndExit(combined);
    return;
  }

  let data: unknown;
  try {
    data = JSON.parse(rawData);
  } catch {
    combined.errors.push("marketplace.json is not valid JSON");
    reportAndExit(combined);
    return;
  }

  // Pass 1: Schema validation (fast, local)
  const schemaResult = validateMarketplaceSchema(data);
  combined.errors.push(...schemaResult.errors);
  combined.warnings.push(...schemaResult.warnings);

  // Pass 1b: Semantic validation (fast, local)
  if (
    data !== null &&
    typeof data === "object" &&
    "plugins" in data &&
    Array.isArray((data as MarketplaceData).plugins)
  ) {
    const semanticResult = validateSemantics(data as MarketplaceData);
    combined.errors.push(...semanticResult.errors);
    combined.warnings.push(...semanticResult.warnings);
  }

  // Pass 2: Remote validation (slow, network)
  if (!localOnly) {
    if (
      data !== null &&
      typeof data === "object" &&
      "plugins" in data &&
      Array.isArray((data as MarketplaceData).plugins)
    ) {
      const remoteResult = await validateRemoteReferences(
        (data as MarketplaceData).plugins,
        { localOnly },
      );
      combined.errors.push(...remoteResult.errors);
      combined.warnings.push(...remoteResult.warnings);
    }
  }

  // Pass 3: README staleness check
  if (
    data !== null &&
    typeof data === "object" &&
    "plugins" in data &&
    Array.isArray((data as MarketplaceData).plugins)
  ) {
    const readmeResult = checkReadmeStaleness(data as MarketplaceData);
    combined.warnings.push(...readmeResult.warnings);
  }

  reportAndExit(combined);
}

function checkReadmeStaleness(data: MarketplaceData): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };
  const readmePath = resolve("README.md");

  if (!existsSync(readmePath)) {
    result.warnings.push(
      "README.md does not exist. Run `npm run generate-readme` to create it.",
    );
    return result;
  }

  const expected = generateReadmeContent(data).replace(/\r\n/g, "\n");
  const actual = readFileSync(readmePath, "utf-8").replace(/\r\n/g, "\n");

  if (expected !== actual) {
    result.warnings.push(
      "README.md is out of date. Run `npm run generate-readme` to update it.",
    );
  }

  return result;
}

main();
