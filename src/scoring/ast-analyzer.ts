import type { ASTDetector, ScoringInput } from "./signals.js";

/**
 * Layer 2 AST-level detectors.
 *
 * These use ts-morph for deep TypeScript analysis, but for the diff-based
 * signals (like "was a Zod schema removed?"), we extract OLD/NEW code from
 * the patch and analyze the pattern in the removed lines — this avoids needing
 * to download the full file for every check.
 *
 * ts-morph is used for structural analysis (e.g. detecting "use server" directives)
 * on the added lines reconstructed from the patch.
 *
 * Only runs on TypeScript/JavaScript files.
 */

/**
 * Returns true if the file extension is TypeScript or JavaScript.
 */
function isTsOrJs(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/.test(filePath);
}

/**
 * Extract lines from a unified diff patch by prefix:
 *   "+" = added lines (new code)
 *   "-" = removed lines (old code)
 */
function extractLines(patch: string, prefix: "+" | "-"): string[] {
  return patch
    .split("\n")
    .filter((l) => l.startsWith(prefix))
    .map((l) => l.slice(1)); // strip the "+" or "-" prefix
}

// ─── Language Validation Patterns ─────────────────────────────────────────────

const LANGUAGE_VALIDATION_PATTERNS: Record<string, RegExp> = {
  // TypeScript/JavaScript: Zod, Yup, Joi, class-validator, safeParse, etc.
  js: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  ts: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  tsx: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  jsx: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  mjs: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  cjs: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  mts: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,
  cts: /z\.(object|string|number|boolean|array|enum|union|literal|parse|safeParse)|yup\.(object|string|number|array|mixed)|\.validate\(|\.safeParse\(|\.parse\(|joi\.|class-validator/i,

  // Python: Pydantic schemas, Marshmallow, Django forms/serializers, WTForms
  py: /BaseModel|Field\(|validate|marshmallow|Serializer|wtforms|Validator/i,

  // Go: struct tags for validation or validator packages
  go: /validate:".+"|\.Struct\(|validator\.New\(\)/i,

  // Java: jakarta/javax validation annotations
  java: /@(NotNull|NotEmpty|NotBlank|Size|Pattern|Min|Max|Valid|Email)/,

  // PHP: Laravel request/validator, Symfony validator
  php: /\$request->validate\(|Validator::make\(|\$this->validate\(/i,

  // HTML: HTML5 form validation attributes
  html: /\s(required|pattern|minlength|maxlength)[\s=>]/i,
  htm: /\s(required|pattern|minlength|maxlength)[\s=>]/i,
};

function extractImportedSymbols(line: string): string[] {
  const symbols: string[] = [];
  const trimmed = line.trim();

  // Named imports: import { Header, Footer as MyFooter } from "..."
  const namedMatch = trimmed.match(/\{([^}]+)\}/);
  if (namedMatch) {
    const rawNames = namedMatch[1].split(",");
    for (const raw of rawNames) {
      const parts = raw.trim().split(/\s+as\s+/i);
      const name = (parts[1] || parts[0]).trim();
      if (name && /^[a-zA-Z0-9_$]+$/.test(name)) {
        symbols.push(name);
      }
    }
  }

  // Default import: import Header from "..."
  const defaultMatch = trimmed.match(/import\s+([a-zA-Z0-9_$]+)\s+(from|,)/);
  if (defaultMatch && defaultMatch[1] && defaultMatch[1] !== "type") {
    symbols.push(defaultMatch[1].trim());
  }

  // Python: from module import Header, Footer
  const pythonFromMatch = trimmed.match(/from\s+[\w.]+\s+import\s+([a-zA-Z0-9_$,\s]+)/);
  if (pythonFromMatch) {
    const names = pythonFromMatch[1].split(",");
    for (const n of names) {
      const clean = n.trim();
      if (clean && /^[a-zA-Z0-9_$]+$/.test(clean)) {
        symbols.push(clean);
      }
    }
  }

  return Array.from(new Set(symbols));
}

export function extractRemovedExports(patch: string): string[] {
  if (!patch) return [];
  const removedLines = extractLines(patch, "-");
  const addedLines = extractLines(patch, "+");

  const removedSymbols: string[] = [];
  const addedSymbols: string[] = [];

  for (const line of removedLines) {
    const m = line.match(/^\s*export\s+(?:default\s+)?(?:function|const|class|type|interface|var|let)\s+([a-zA-Z0-9_$]+)/);
    if (m && m[1]) removedSymbols.push(m[1]);
  }

  for (const line of addedLines) {
    const m = line.match(/^\s*export\s+(?:default\s+)?(?:function|const|class|type|interface|var|let)\s+([a-zA-Z0-9_$]+)/);
    if (m && m[1]) addedSymbols.push(m[1]);
  }

  const addedSet = new Set(addedSymbols);
  return Array.from(new Set(removedSymbols)).filter((s) => !addedSet.has(s));
}

// ─── Detectors ────────────────────────────────────────────────────────────────

export const AST_DETECTORS: ASTDetector[] = [
  // ── Cross-file broken reference (weight: +45) ───────────────────────────────
  {
    signal: "cross_file_broken_reference",
    reason: "Exported symbol was deleted but is still referenced in other PR files",
    detect: ({ patch }: ScoringInput): boolean => {
      if (!patch) return false;
      const removedExports = extractRemovedExports(patch);
      if (removedExports.length === 0) return false;

      // In multi-file analysis, orchestrator checks if removed export is present in other PR files
      return false;
    },
  },

  // ── Dangling import reference (weight: +40) ────────────────────────────────
  {
    signal: "dangling_import_reference",
    reason: "Import statement removed while component/function is still referenced in code",
    detect: ({ patch }: ScoringInput): boolean => {
      if (!patch) return false;

      const removedLines = extractLines(patch, "-");
      const addedLines = extractLines(patch, "+");
      const allLines = patch.split("\n");

      const removedImportLines = removedLines.filter((l) =>
        /^\s*(import|from)\s+/i.test(l) || /require\(/.test(l)
      );
      if (removedImportLines.length === 0) return false;

      const addedImportLines = addedLines.filter((l) =>
        /^\s*(import|from)\s+/i.test(l) || /require\(/.test(l)
      );

      const removedSymbols = new Set<string>();
      removedImportLines.forEach((l) => {
        extractImportedSymbols(l).forEach((s) => removedSymbols.add(s));
      });

      const addedSymbols = new Set<string>();
      addedImportLines.forEach((l) => {
        extractImportedSymbols(l).forEach((s) => addedSymbols.add(s));
      });

      const danglingSymbols = Array.from(removedSymbols).filter(
        (s) => !addedSymbols.has(s)
      );

      if (danglingSymbols.length === 0) return false;

      const nonImportPatchLines = allLines.filter(
        (l) => !l.startsWith("-") && !/^\s*\+?\s*(import|from)\s+/i.test(l) && !/require\(/.test(l)
      );

      for (const symbol of danglingSymbols) {
        const symbolRegex = new RegExp(`\\b${symbol}\\b`);
        if (nonImportPatchLines.some((l) => symbolRegex.test(l))) {
          return true;
        }
      }

      return false;
    },
  },

  // ── Removed validation (weight: +30) ──────────────────────────────────────
  {
    signal: "removed_validation",
    reason: "Input validation schema removed or loosened",
    detect: ({ filePath, patch }: ScoringInput): boolean => {
      if (!patch) return false;

      const ext = filePath.split(".").pop()?.toLowerCase();
      if (!ext) return false;

      const validationPattern = LANGUAGE_VALIDATION_PATTERNS[ext];
      if (!validationPattern) return false;

      const removedLines = extractLines(patch, "-");
      const addedLines = extractLines(patch, "+");

      // Check if validation was in removed lines but NOT in added lines
      const hadValidation = removedLines.some((l) =>
        validationPattern.test(l)
      );
      const stillHasValidation = addedLines.some((l) =>
        validationPattern.test(l)
      );

      // Trigger if validation was present before but is now gone/reduced
      return hadValidation && !stillHasValidation;
    },
  },

  // ── Server Action added/changed (weight: +35) ─────────────────────────────
  {
    signal: "server_action_changed",
    reason: "Server Action added or modified ('use server' directive detected)",
    detect: ({ filePath, patch }: ScoringInput): boolean => {
      if (!isTsOrJs(filePath) || !patch) return false;

      const addedLines = extractLines(patch, "+");

      // Detect "use server" directive in added lines (file-level or function-level)
      return addedLines.some(
        (l) => l.trim() === '"use server"' || l.trim() === "'use server'"
      );
    },
  },
];

/**
 * Deep AST analysis using ts-morph.
 * Used for structural checks that patch-level analysis can't catch reliably.
 *
 * Currently: verifies Server Action detection by checking for functions
 * that have "use server" as their first statement (function-level, not file-level).
 *
 * This is called selectively — only when path-level analysis suggests a file
 * might be a Server Action file.
 */
export async function analyzeWithTsMorph(
  filePath: string,
  newFileContent: string
): Promise<{
  hasServerAction: boolean;
  functionNames: string[];
}> {
  // Dynamically import ts-morph to avoid loading it for every request
  const { Project } = await import("ts-morph");

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
      jsx: 2, // JsxEmit.React
    },
  });

  const sourceFile = project.createSourceFile(filePath, newFileContent);

  const serverActionFunctions: string[] = [];

  // Check file-level "use server" (all exports are server actions)
  const firstStatement = sourceFile.getStatements()[0];
  const fileHasUseServer =
    firstStatement?.getKindName() === "ExpressionStatement" &&
    (firstStatement.getText().trim() === '"use server"' ||
      firstStatement.getText().trim() === "'use server'");

  if (fileHasUseServer) {
    // All exported functions in this file are server actions
    sourceFile.getFunctions().forEach((fn) => {
      const name = fn.getName();
      if (name) serverActionFunctions.push(name);
    });
  } else {
    // Check for function-level "use server"
    sourceFile.getFunctions().forEach((fn) => {
      const firstStmt = fn.getStatements()[0];
      if (
        firstStmt?.getKindName() === "ExpressionStatement" &&
        (firstStmt.getText().trim() === '"use server"' ||
          firstStmt.getText().trim() === "'use server'")
      ) {
        const name = fn.getName();
        if (name) serverActionFunctions.push(name);
      }
    });
  }

  return {
    hasServerAction: serverActionFunctions.length > 0 || fileHasUseServer,
    functionNames: serverActionFunctions,
  };
}
