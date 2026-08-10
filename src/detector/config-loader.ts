import type { RiskConfig } from "../scoring/signals.js";
import {
  DEFAULT_NEXTJS_CONFIG,
  DEFAULT_PYTHON_CONFIG,
  DEFAULT_GO_CONFIG,
  DEFAULT_JAVA_CONFIG,
  DEFAULT_PHP_CONFIG,
} from "./default-config.js";

// ─── YAML parser (js-yaml) ────────────────────────────────────────────────────
// We import lazily to avoid startup cost when config file doesn't exist

let yamlLoaded = false;
let yaml: { load: (str: string) => unknown } | null = null;

async function getYaml() {
  if (!yamlLoaded) {
    const mod = await import("js-yaml");
    yaml = mod.default as { load: (str: string) => unknown };
    yamlLoaded = true;
  }
  return yaml!;
}

// ─── Config Schema (partial — only user-overridable fields) ──────────────────

interface PartialUserConfig {
  sensitivePaths?: string[];
  weights?: Partial<Record<string, number>>;
  disabledSignals?: string[];
  ignorePaths?: string[];
}

function getDefaultConfigForStack(stack: string): RiskConfig {
  const normalized = stack.toLowerCase();
  if (normalized.includes("python")) return DEFAULT_PYTHON_CONFIG;
  if (normalized.includes("go")) return DEFAULT_GO_CONFIG;
  if (normalized.includes("java")) return DEFAULT_JAVA_CONFIG;
  if (normalized.includes("php")) return DEFAULT_PHP_CONFIG;
  return DEFAULT_NEXTJS_CONFIG;
}

/**
 * Load and merge config based on detected stack and optional .riskcheck/config.yml.
 */
export async function loadConfig(
  configContent: string | null,
  stack: string = "nextjs"
): Promise<RiskConfig> {
  const defaultConfig = getDefaultConfigForStack(stack);

  if (!configContent) {
    return defaultConfig;
  }

  try {
    const yamlLib = await getYaml();
    const userConfig = yamlLib.load(configContent) as PartialUserConfig;

    return mergeConfigs(defaultConfig, userConfig ?? {});
  } catch {
    return defaultConfig;
  }
}

function mergeConfigs(
  defaults: RiskConfig,
  user: PartialUserConfig
): RiskConfig {
  return {
    ...defaults,
    sensitivePaths: [
      ...defaults.sensitivePaths,
      ...(user.sensitivePaths ?? []),
    ],
    weights: {
      ...defaults.weights,
      ...user.weights,
    },
    disabledSignals: [
      ...(defaults.disabledSignals ?? []),
      ...(user.disabledSignals ?? []),
    ],
    ignorePaths: [
      ...(defaults.ignorePaths ?? []),
      ...(user.ignorePaths ?? []),
    ],
  };
}
