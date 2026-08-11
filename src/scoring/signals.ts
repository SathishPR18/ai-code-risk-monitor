// ─── Core Type Definitions ───────────────────────────────────────────────────

export type RiskTier = "low" | "medium" | "high";

export type SignalName =
  | "auth_config_changed"
  | "middleware_changed"
  | "server_action_changed"
  | "api_route_changed"
  | "removed_validation"
  | "data_fetching_changed"
  | "new_env_var_no_example"
  | "no_test_changed"
  | "pure_addition"
  | "dangling_import_reference"
  | "cross_file_broken_reference";

export interface Signal {
  name: SignalName;
  weight: number;
  reason: string; // Human-readable, e.g. "Auth config changed"
}

// ─── Scoring Input / Output ───────────────────────────────────────────────────

export interface ScoringInput {
  filePath: string;       // "app/api/users/route.ts"
  patch: string;          // Raw unified diff text (may be empty for binary files)
  status: string;         // "added" | "modified" | "removed" | "renamed"
  allChangedPaths: string[]; // All file paths changed in this PR
  config: RiskConfig;
}

export interface ScoringResult {
  filePath: string;
  score: number;           // 0–100 (clamped)
  tier: RiskTier;
  reasons: string[];       // ["Auth config changed (+40)", "No test file (+15)"]
  triggeredSignals: Signal[];
}

export interface PRScoringResult {
  prTier: RiskTier;       // worst-case across all files
  fileResults: ScoringResult[];
  totalFilesScored: number;
  highRiskFiles: ScoringResult[];
  mediumRiskFiles: ScoringResult[];
  lowRiskFiles: ScoringResult[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

export interface TierThreshold {
  min: number;
  max: number;
}

export interface RiskConfig {
  stack: string;
  weights: Partial<Record<SignalName, number>>;
  sensitivePaths: string[];
  disabledSignals: string[];
  ignorePaths?: string[];
  tiers: {
    low: TierThreshold;
    medium: TierThreshold;
    high: TierThreshold;
  };
}

// ─── Detector Contract ────────────────────────────────────────────────────────

export interface PathDetector {
  signal: SignalName;
  reason: string;
  detect: (input: ScoringInput) => boolean;
}

export interface ASTDetector {
  signal: SignalName;
  reason: string;
  // Only runs on TS/JS files — receives raw patch text
  detect: (input: ScoringInput) => boolean;
}
