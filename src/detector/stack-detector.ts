export type Stack = "nextjs" | "unknown";

/**
 * Determine the stack from the list of changed files in the PR.
 *
 * Strategy:
 * 1. Fast path: check if any changed file path is a Next.js config file.
 * 2. If no config file changed, look for characteristic Next.js file patterns
 *    in the changed paths (app/ or pages/ directories, next.config.*, etc.)
 *
 * For a more thorough detection (e.g. when none of the above match),
 * the orchestrator can fetch package.json content and check dependencies.
 */
export function detectStackFromPaths(filePaths: string[]): Stack {
  const nextjsIndicators = [
    // Config files
    /^next\.config\.(js|ts|mjs|cjs)$/,
    // App router files
    /^(src\/)?app\/.+\.(tsx?|jsx?)$/,
    // Pages router files
    /^(src\/)?pages\/.+\.(tsx?|jsx?)$/,
    // Next.js API routes
    /^(src\/)?(app|pages)\/api\/.+/,
    // Next.js special files
    /^(src\/)?app\/(layout|page|loading|error|not-found)\.(tsx?|jsx?)$/,
    // Middleware
    /^middleware\.(ts|js)$/,
  ];

  return filePaths.some((path) =>
    nextjsIndicators.some((pattern) => pattern.test(path))
  )
    ? "nextjs"
    : "unknown";
}

/**
 * Determine the stack by inspecting package.json content.
 * Used as a fallback when no Next.js files appear in the PR diff.
 */
export function detectStackFromPackageJson(
  packageJsonContent: string
): Stack {
  try {
    const pkg = JSON.parse(packageJsonContent) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if ("next" in allDeps) return "nextjs";
  } catch {
    // Invalid JSON — treat as unknown
  }

  return "unknown";
}
