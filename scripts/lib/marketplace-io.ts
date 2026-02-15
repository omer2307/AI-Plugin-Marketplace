import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MarketplaceData, PluginEntry } from "./types.js";

export const MARKETPLACE_PATH = resolve(".claude-plugin/marketplace.json");

export function readMarketplace(): MarketplaceData {
  const raw = readFileSync(MARKETPLACE_PATH, "utf-8");
  return JSON.parse(raw) as MarketplaceData;
}

export function writeMarketplace(data: MarketplaceData): void {
  writeFileSync(MARKETPLACE_PATH, JSON.stringify(data, null, 2) + "\n");
}

export function insertPlugin(data: MarketplaceData, entry: PluginEntry): void {
  const insertIndex = data.plugins.findIndex(
    (p) => p.name.localeCompare(entry.name) > 0,
  );

  if (insertIndex === -1) {
    data.plugins.push(entry);
  } else {
    data.plugins.splice(insertIndex, 0, entry);
  }
}

export function removePlugin(data: MarketplaceData, name: string): boolean {
  const index = data.plugins.findIndex((p) => p.name === name);
  if (index === -1) {
    return false;
  }
  data.plugins.splice(index, 1);
  return true;
}

export function findPlugin(
  data: MarketplaceData,
  name: string,
): PluginEntry | undefined {
  return data.plugins.find((p) => p.name === name);
}
