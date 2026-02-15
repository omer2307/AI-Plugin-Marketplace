import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PluginEntry, ValidationResult } from "./types.js";
import { validatePluginSchema } from "./schema-validator.js";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

interface RemoteValidatorOptions {
  localOnly?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    return { Authorization: `token ${token}` };
  }
  return {};
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const baseOptions: RequestInit = {
    ...options,
    signal: controller.signal,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, baseOptions);

      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAYS_MS[attempt]);
          continue;
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGitHubSource(
  source: PluginEntry["source"],
): source is { source: "github"; repo: string; ref?: string; sha?: string } {
  return (
    typeof source === "object" &&
    source !== null &&
    "source" in source &&
    source.source === "github"
  );
}

function isUrlSource(
  source: PluginEntry["source"],
): source is { source: "url"; url: string; ref?: string; sha?: string } {
  return (
    typeof source === "object" &&
    source !== null &&
    "source" in source &&
    source.source === "url"
  );
}

function isLocalPath(source: PluginEntry["source"]): source is string {
  return typeof source === "string" && source.startsWith("./");
}

async function validateLocalSource(
  plugin: PluginEntry,
  source: string,
): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };

  const pluginDir = resolve(source);
  if (!existsSync(pluginDir)) {
    result.errors.push(
      `Plugin "${plugin.name}": local path "${source}" does not exist`,
    );
    return result;
  }

  const manifestPath = resolve(pluginDir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    result.errors.push(
      `Plugin "${plugin.name}": missing .claude-plugin/plugin.json in "${source}"`,
    );
    return result;
  }

  try {
    const manifestData = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const schemaResult = validatePluginSchema(manifestData);
    for (const error of schemaResult.errors) {
      result.errors.push(
        `Plugin "${plugin.name}" manifest: ${error}`,
      );
    }
  } catch {
    result.errors.push(
      `Plugin "${plugin.name}": failed to parse .claude-plugin/plugin.json in "${source}"`,
    );
  }

  return result;
}

async function validateGitHubSource(
  plugin: PluginEntry,
  source: { source: "github"; repo: string; ref?: string },
): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };
  const headers = getAuthHeaders();

  // Check repo exists
  try {
    const repoUrl = `https://api.github.com/repos/${source.repo}`;
    const response = await fetchWithRetry(repoUrl, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...headers,
      },
    });

    if (!response.ok) {
      result.errors.push(
        `Plugin "${plugin.name}": GitHub repo "${source.repo}" not accessible (HTTP ${response.status})`,
      );
      return result;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(
      `Plugin "${plugin.name}": failed to reach GitHub repo "${source.repo}": ${message}`,
    );
    return result;
  }

  // Check plugin.json manifest exists
  const ref = source.ref || "main";
  const manifestUrl = `https://raw.githubusercontent.com/${source.repo}/${ref}/.claude-plugin/plugin.json`;

  try {
    const response = await fetchWithRetry(manifestUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      result.errors.push(
        `Plugin "${plugin.name}": no .claude-plugin/plugin.json found in "${source.repo}" (ref: ${ref})`,
      );
      return result;
    }

    const text = await response.text();
    try {
      const manifestData = JSON.parse(text);
      const schemaResult = validatePluginSchema(manifestData);
      for (const error of schemaResult.errors) {
        result.errors.push(
          `Plugin "${plugin.name}" remote manifest: ${error}`,
        );
      }
    } catch {
      result.errors.push(
        `Plugin "${plugin.name}": .claude-plugin/plugin.json in "${source.repo}" is not valid JSON`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(
      `Plugin "${plugin.name}": failed to fetch manifest from "${source.repo}": ${message}`,
    );
  }

  return result;
}

async function validateUrlSource(
  plugin: PluginEntry,
  source: { source: "url"; url: string },
): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };

  try {
    const response = await fetchWithRetry(source.url, {
      method: "HEAD",
    });

    if (!response.ok) {
      result.errors.push(
        `Plugin "${plugin.name}": source URL "${source.url}" not reachable (HTTP ${response.status})`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(
      `Plugin "${plugin.name}": failed to reach source URL "${source.url}": ${message}`,
    );
  }

  return result;
}

export async function validateRemoteReferences(
  plugins: PluginEntry[],
  options: RemoteValidatorOptions = {},
): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };

  if (options.localOnly) {
    return result;
  }

  for (const plugin of plugins) {
    let pluginResult: ValidationResult;

    if (isLocalPath(plugin.source)) {
      pluginResult = await validateLocalSource(plugin, plugin.source);
    } else if (isGitHubSource(plugin.source)) {
      pluginResult = await validateGitHubSource(plugin, plugin.source);
    } else if (isUrlSource(plugin.source)) {
      pluginResult = await validateUrlSource(plugin, plugin.source);
    } else {
      result.errors.push(
        `Plugin "${plugin.name}": unrecognized source type`,
      );
      continue;
    }

    result.errors.push(...pluginResult.errors);
    result.warnings.push(...pluginResult.warnings);
  }

  return result;
}
