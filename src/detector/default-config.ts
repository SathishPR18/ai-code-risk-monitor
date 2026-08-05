import type { RiskConfig } from "../scoring/signals.js";

/**
 * Built-in default risk config for Next.js / TypeScript repos.
 *
 * These are the weights and sensitive paths from the product brief (§5b).
 * Zero configuration required — this config is active from day one.
 */
export const DEFAULT_NEXTJS_CONFIG: RiskConfig = {
  stack: "nextjs",

  // ── Signal weights ─────────────────────────────────────────────────────────
  // Matches the weights table in the brief §5b exactly.
  weights: {
    auth_config_changed: 40,
    middleware_changed: 35,
    server_action_changed: 35,
    api_route_changed: 30,
    removed_validation: 30,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20, // negative — reduces score
  },

  // ── Sensitive paths (in addition to pattern-matched signals) ──────────────
  // Users can append their own paths via .riskcheck/config.yml
  sensitivePaths: [
    // Auth-related
    "auth.config.ts",
    "auth.config.js",
    "next-auth.config.ts",
    // Environment
    ".env",
    ".env.local",
    ".env.production",
  ],

  // ── Disabled signals ──────────────────────────────────────────────────────
  // Users can add signal names here to turn them off
  disabledSignals: [],

  // ── Tier thresholds ───────────────────────────────────────────────────────
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};
