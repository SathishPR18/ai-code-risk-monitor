export type Stack =
  | "nextjs"
  | "node_express"
  | "python"
  | "java"
  | "go"
  | "php"
  | "generic";

/**
 * Determine the stack from the list of changed files in the PR.
 * Supports Next.js, Node/Express, Python, Java, Go, PHP, or defaults to "generic".
 */
export function detectStackFromPaths(filePaths: string[]): Stack {
  const isNextJs = filePaths.some((p) =>
    /^(src\/)?(app|pages)\/|next\.config\.(js|ts|mjs|cjs)|middleware\.(ts|js)/.test(p)
  );
  if (isNextJs) return "nextjs";

  const isNodeExpress = filePaths.some((p) =>
    /package\.json|server\.(js|ts)|app\.(js|ts)|routes\/|controllers\/|prisma\/|drizzle\//.test(p)
  );
  if (isNodeExpress) return "node_express";

  const isPython = filePaths.some((p) =>
    /requirements\.txt|pyproject\.toml|Pipfile|\.py$/.test(p)
  );
  if (isPython) return "python";

  const isJava = filePaths.some((p) =>
    /pom\.xml|build\.gradle|\.java$/.test(p)
  );
  if (isJava) return "java";

  const isGo = filePaths.some((p) =>
    /go\.mod|go\.sum|\.go$/.test(p)
  );
  if (isGo) return "go";

  const isPhp = filePaths.some((p) =>
    /composer\.json|\.php$/.test(p)
  );
  if (isPhp) return "php";

  return "generic";
}

/**
 * Determine the stack by inspecting package.json content.
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
    if ("express" in allDeps || "fastify" in allDeps || "koa" in allDeps) return "node_express";
  } catch {
    // Invalid JSON
  }

  return "generic";
}
