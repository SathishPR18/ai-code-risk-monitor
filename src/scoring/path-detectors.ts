import type { PathDetector, ScoringInput } from "./signals.js";

/**
 * Returns true if a patch ONLY contains comment changes, empty lines, or whitespace changes.
 * Used to avoid triggering false alarms on doc/comment touchups in critical files.
 */
export function isCommentOrWhitespaceOnly(patch: string): boolean {
  if (!patch) return false;
  const changedLines = patch
    .split("\n")
    .filter((l) => (l.startsWith("+") || l.startsWith("-")) && !l.startsWith("+++") && !l.startsWith("---"));

  if (changedLines.length === 0) return true;

  return changedLines.every((line) => {
    const content = line.slice(1).trim();
    if (content === "") return true; // empty line / whitespace
    // JS/TS/Java/PHP single-line comment: //
    if (content.startsWith("//")) return true;
    // Multi-line comment markers: /*, *, */
    if (content.startsWith("/*") || content.startsWith("*") || content.endsWith("*/")) return true;
    // Python/Shell comment: #
    if (content.startsWith("#")) return true;
    // HTML/XML comment: <!--
    if (content.startsWith("<!--") || content.startsWith("-->")) return true;
    return false;
  });
}

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
    detect: ({ filePath, patch }: ScoringInput): boolean => {
      const isAuthFile = /next-?auth|auth\.(config|options)\.(ts|js)|session|jwt\.config|SecurityConfig|auth\.py|auth\.go|config\/auth\.php|IdentityConfig|JwtSettings/i.test(
        filePath
      );
      if (!isAuthFile) return false;
      // Suppress false positive if patch is present and contains only comments/whitespace
      if (patch && patch.trim().length > 0 && isCommentOrWhitespaceOnly(patch)) return false;
      return true;
    },
  },

  // ── Middleware (weight: +35) ──────────────────────────────────────────────
  {
    signal: "middleware_changed",
    reason: "Middleware changed (runs on every matching request)",
    detect: ({ filePath, patch }: ScoringInput): boolean => {
      const isMiddleware = /^(src\/)?middleware\.(ts|js)$/.test(filePath);
      if (!isMiddleware) return false;
      // Suppress false positive if patch is present and contains only comments/whitespace
      if (patch && patch.trim().length > 0 && isCommentOrWhitespaceOnly(patch)) return false;
      return true;
    },
  },

  // ── API route changed (weight: +30) ──────────────────────────────────────
  {
    signal: "api_route_changed",
    reason: "API route changed",
    detect: ({ filePath, patch }: ScoringInput): boolean => {
      const isApiRoute =
        /^(src\/)?(app|pages)\/api\/.+\.(ts|js|tsx|jsx)$/.test(filePath) ||
        // App router route handlers
        /^(src\/)?app\/.+\/route\.(ts|js)$/.test(filePath) ||
        // C# / ASP.NET Controllers and Endpoints
        /(Controllers?\/.*Controller\.cs|Endpoints\/.*\.cs)$/i.test(filePath);
      if (!isApiRoute) return false;
      // Suppress false positive if patch is present and contains only comments/whitespace
      if (patch && patch.trim().length > 0 && isCommentOrWhitespaceOnly(patch)) return false;
      return true;
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
      // Only penalize if the PR actually modifies at least one executable code/template file
      const hasExecutableCodeFiles = allChangedPaths.some((p) =>
        /\.(ts|tsx|js|jsx|py|go|java|php|rb|rs|cs|c|cpp|html|htm)$/i.test(p) &&
        !/\.(test|spec)\.(ts|js|tsx|jsx|py|go|java|php|cs)$/i.test(p) &&
        !/Tests?\.cs$/i.test(p)
      );
      if (!hasExecutableCodeFiles) return false;

      return !allChangedPaths.some((p) =>
        /\.(test|spec)\.(ts|js|tsx|jsx|py|go|java|php|cs)$/i.test(p) ||
        /Tests?\.cs$/i.test(p)
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
