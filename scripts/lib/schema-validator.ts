import { createRequire } from "node:module";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";
import type { MarketplaceData, ValidationResult } from "./types.js";

const require = createRequire(import.meta.url);
const marketplaceSchema = require("../../schemas/marketplace.schema.json");
const pluginSchema = require("../../schemas/plugin.schema.json");

const RECOMMENDED_CATEGORIES = [
  "development",
  "productivity",
  "testing",
  "devops",
  "security",
  "integration",
  "learning",
];

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv, ["uri", "email"]);
ajvErrors(ajv);

const validateMarketplace = ajv.compile(marketplaceSchema);
const validatePlugin = ajv.compile(pluginSchema);

function formatAjvErrors(
  errors: typeof validateMarketplace.errors,
): string[] {
  if (!errors) {
    return [];
  }

  return errors.map((err) => {
    const path = err.instancePath || "/";
    const message = err.message || "unknown error";
    return `${path} ${message}`;
  });
}

export function validateMarketplaceSchema(data: unknown): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };

  const valid = validateMarketplace(data);
  if (!valid) {
    result.errors = formatAjvErrors(validateMarketplace.errors);
  }

  if (
    data !== null &&
    typeof data === "object" &&
    "plugins" in data &&
    Array.isArray((data as MarketplaceData).plugins)
  ) {
    const plugins = (data as MarketplaceData).plugins;
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (!plugin.description) {
        result.warnings.push(
          `/plugins/${i} missing recommended field "description"`,
        );
      }
      if (!plugin.category) {
        result.warnings.push(
          `/plugins/${i} missing recommended field "category"`,
        );
      }
      if (!plugin.tags || plugin.tags.length === 0) {
        result.warnings.push(
          `/plugins/${i} missing recommended field "tags"`,
        );
      }
    }
  }

  return result;
}

export function validatePluginSchema(data: unknown): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };

  const valid = validatePlugin(data);
  if (!valid) {
    result.errors = formatAjvErrors(validatePlugin.errors);
  }

  return result;
}

export function validateSemantics(data: MarketplaceData): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };
  const plugins = data.plugins;

  if (!Array.isArray(plugins)) {
    return result;
  }

  // Check for duplicate plugin names
  const namesSeen = new Map<string, number>();
  for (let i = 0; i < plugins.length; i++) {
    const name = plugins[i].name;
    if (namesSeen.has(name)) {
      result.errors.push(
        `Duplicate plugin name "${name}" at index ${namesSeen.get(name)} and ${i}`,
      );
    } else {
      namesSeen.set(name, i);
    }
  }

  // Check alphabetical sort order
  for (let i = 1; i < plugins.length; i++) {
    const prev = plugins[i - 1].name;
    const curr = plugins[i].name;
    if (prev.localeCompare(curr) > 0) {
      result.errors.push(
        `Plugins not sorted alphabetically: "${prev}" should come after "${curr}"`,
      );
    }
  }

  // Check for unrecognized categories (warning only)
  for (let i = 0; i < plugins.length; i++) {
    const category = plugins[i].category;
    if (category && !RECOMMENDED_CATEGORIES.includes(category)) {
      result.warnings.push(
        `Plugin "${plugins[i].name}" has unrecognized category "${category}" (recommended: ${RECOMMENDED_CATEGORIES.join(", ")})`,
      );
    }
  }

  return result;
}
