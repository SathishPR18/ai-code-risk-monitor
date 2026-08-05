import type { PathDetector, ScoringInput } from "./signals.js";

/**
 * Layer 1 signal detectors — path/pattern matching only.
 * Fast, no AST parsing. Runs on every file.
 *
 * Order matters: detectors are evaluated top to bottom.
 * The engine collects ALL triggered detectors (not just the first).
 */
export const PATH_DETECTORS: PathDetector[] = [
  // ── Auth config (weight: +40) ────────────────────────────────────────────
  {
    signal: "auth_config_changed",
    reason: "Auth config changed",
    detect: ({ filePath }: ScoringInput): boolean => {
      return /next-?auth|auth\.(config|options)\.(ts|js)|session|jwt\.config/i.test(
        filePath
      );
    },
  },

  // ── Middleware (weight: +35) ──────────────────────────────────────────────
  {
    signal: "middleware_changed",
    reason: "Middleware changed (runs on every matching request)",
    detect: ({ filePath }: ScoringInput): boolean => {
      return /^(src\/)?middleware\.(ts|js)$/.test(filePath);
    },
  },

  // ── API route changed (weight: +30) ──────────────────────────────────────
  {
    signal: "api_route_changed",
    reason: "API route changed",
    detect: ({ filePath }: ScoringInput): boolean => {
      return (
        /^(src\/)?(app|pages)\/api\/.+\.(ts|js|tsx|jsx)$/.test(filePath) ||
        // App router route handlers
        /^(src\/)?app\/.+\/route\.(ts|js)$/.test(filePath)
      );
    },
  },

  // ── Data fetching (weight: +20) ───────────────────────────────────────────
  {
    signal: "data_fetching_changed",
    reason: "Data-fetching function changed (getServerSideProps / generateStaticParams / dynamic fetch)",
    detect: ({ patch }: ScoringInput): boolean => {
      if (!patch) return false;
      const changedLines = patch
        .split("\n")
        .filter((l) => l.startsWith("+") || l.startsWith("-"));
      return changedLines.some((line) =>
        /getServerSideProps|getStaticProps|generateStaticParams|getInitialProps/i.test(
          line
        )
      );
    },
  },

  // ── New env var, no .env.example update (weight: +15) ────────────────────
  {
    signal: "new_env_var_no_example",
    reason: "New env var used but .env.example not updated",
    detect: ({ patch, allChangedPaths }: ScoringInput): boolean => {
      if (!patch) return false;
      const addedLines = patch.split("\n").filter((l) => l.startsWith("+"));
      const hasNewEnvRead = addedLines.some((l) =>
        /process\.env\.\w+/.test(l)
      );
      const exampleUpdated = allChangedPaths.some((p) =>
        /\.env\.example/.test(p)
      );
      return hasNewEnvRead && !exampleUpdated;
    },
  },

  // ── No test file changed (weight: +15) ────────────────────────────────────
  {
    signal: "no_test_changed",
    reason: "No test file changed in this PR",
    detect: ({ allChangedPaths }: ScoringInput): boolean => {
      return !allChangedPaths.some((p) =>
        /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(p)
      );
    },
  },

  // ── Pure addition — no existing logic removed (weight: -20) ──────────────
  {
    signal: "pure_addition",
    reason: "Pure addition — no existing logic removed (lower risk)",
    detect: ({ patch, status }: ScoringInput): boolean => {
      // Brand new file — clearly pure addition
      if (status === "added") return true;
      if (!patch) return false;
      // For modified/renamed files: only flag as pure addition if there are
      // genuinely zero removed lines in the actual diff content.
      // Exclude diff header lines (starting with "@@" or "---" / "+++")
      const contentLines = patch
        .split("\n")
        .filter((l) => !l.startsWith("@@") && !l.startsWith("---") && !l.startsWith("+++"));
      const hasRemovals = contentLines.some(
        (l) => l.startsWith("-") && l.trim().length > 1
      );
      return !hasRemovals;
    },
  },
];
