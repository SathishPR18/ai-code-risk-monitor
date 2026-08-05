import type { RiskConfig } from "../scoring/signals.js";
import { DEFAULT_NEXTJS_CONFIG } from "./default-config.js";

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
  // Extra sensitive paths the user wants to flag (in addition to built-ins)
  sensitivePaths?: string[];
  // Override weights for specific signals
  weights?: Partial<Record<string, number>>;
  // Signals to disable
  disabledSignals?: string[];
}

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Load and merge config.
 *
 * Priority order (highest wins):
 *   user's .riskcheck/config.yml  >  built-in defaults
 *
 * If no config file is found, returns built-in defaults unchanged.
 */
export async function loadConfig(
  configContent: string | null
): Promise<RiskConfig> {
  if (!configContent) {
    return DEFAULT_NEXTJS_CONFIG;
  }

  try {
    const yamlLib = await getYaml();
    const userConfig = yamlLib.load(configContent) as PartialUserConfig;

    // Deep merge: user config layers on top of defaults
    return mergeConfigs(DEFAULT_NEXTJS_CONFIG, userConfig ?? {});
  } catch {
    // Malformed YAML — fall back to defaults silently
    return DEFAULT_NEXTJS_CONFIG;
  }
}

function mergeConfigs(
  defaults: RiskConfig,
  user: PartialUserConfig
): RiskConfig {
  return {
    ...defaults,
    // Append user's extra sensitive paths to the built-in list
    sensitivePaths: [
      ...defaults.sensitivePaths,
      ...(user.sensitivePaths ?? []),
    ],
    // Override weights where user has specified them
    weights: {
      ...defaults.weights,
      ...user.weights,
    },
    // Merge disabled signals
    disabledSignals: [
      ...(defaults.disabledSignals ?? []),
      ...(user.disabledSignals ?? []),
    ],
  };
}
