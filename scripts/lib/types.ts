export interface GitHubSource {
  source: "github";
  repo: string;
  ref?: string;
  sha?: string;
}

export interface UrlSource {
  source: "url";
  url: string;
  ref?: string;
  sha?: string;
}

export type PluginSource = string | GitHubSource | UrlSource;

export interface PluginEntry {
  name: string;
  source: PluginSource;
  description?: string;
  version?: string;
  author?: {
    name?: string;
    email?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  strict?: boolean;
  commands?: unknown;
  agents?: unknown;
  hooks?: unknown;
  mcpServers?: unknown;
  lspServers?: unknown;
  skills?: unknown;
  outputStyles?: unknown;
}

export interface MarketplaceData {
  $schema?: string;
  name: string;
  schemaVersion?: number;
  description?: string;
  owner: {
    name: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
  plugins: PluginEntry[];
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ValidationIssue {
  severity: "ERROR" | "WARNING";
  path: string;
  message: string;
}
