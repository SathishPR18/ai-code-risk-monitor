import type { RiskConfig } from "../scoring/signals.js";

export const DEFAULT_IGNORE_PATHS: string[] = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "composer.lock",
  "go.sum",
  "dist/**",
  "build/**",
  ".next/**",
  "vendor/**",
  "*.min.js",
  "*.min.css",
  "*.map",
];

/**
 * Built-in default risk config for Next.js / TypeScript repos.
 */
export const DEFAULT_NEXTJS_CONFIG: RiskConfig = {
  stack: "nextjs",
  weights: {
    auth_config_changed: 40,
    middleware_changed: 35,
    server_action_changed: 35,
    api_route_changed: 30,
    removed_validation: 30,
    dangling_import_reference: 40,
    cross_file_broken_reference: 45,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20,
  },
  sensitivePaths: [
    "auth.config.ts",
    "auth.config.js",
    "next-auth.config.ts",
    ".env",
    ".env.local",
    ".env.production",
  ],
  disabledSignals: [],
  ignorePaths: DEFAULT_IGNORE_PATHS,
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};

export const DEFAULT_PYTHON_CONFIG: RiskConfig = {
  stack: "python",
  weights: {
    auth_config_changed: 40,
    api_route_changed: 30,
    removed_validation: 30,
    dangling_import_reference: 40,
    cross_file_broken_reference: 45,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20,
  },
  sensitivePaths: ["settings.py", "config.py", "auth.py", "models.py", ".env"],
  disabledSignals: [],
  ignorePaths: [...DEFAULT_IGNORE_PATHS, "*.pyc", "__pycache__/**", ".venv/**"],
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};

export const DEFAULT_GO_CONFIG: RiskConfig = {
  stack: "go",
  weights: {
    auth_config_changed: 40,
    api_route_changed: 30,
    removed_validation: 30,
    dangling_import_reference: 40,
    cross_file_broken_reference: 45,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20,
  },
  sensitivePaths: ["config.go", "auth.go", "main.go", ".env"],
  disabledSignals: [],
  ignorePaths: DEFAULT_IGNORE_PATHS,
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};

export const DEFAULT_JAVA_CONFIG: RiskConfig = {
  stack: "java",
  weights: {
    auth_config_changed: 40,
    api_route_changed: 30,
    removed_validation: 30,
    dangling_import_reference: 40,
    cross_file_broken_reference: 45,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20,
  },
  sensitivePaths: ["SecurityConfig.java", "application.properties", "application.yml"],
  disabledSignals: [],
  ignorePaths: [...DEFAULT_IGNORE_PATHS, "target/**", "*.class"],
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};

export const DEFAULT_PHP_CONFIG: RiskConfig = {
  stack: "php",
  weights: {
    auth_config_changed: 40,
    api_route_changed: 30,
    removed_validation: 30,
    dangling_import_reference: 40,
    cross_file_broken_reference: 45,
    data_fetching_changed: 20,
    new_env_var_no_example: 15,
    no_test_changed: 15,
    pure_addition: -20,
  },
  sensitivePaths: ["config/auth.php", "config/app.php", ".env"],
  disabledSignals: [],
  ignorePaths: DEFAULT_IGNORE_PATHS,
  tiers: {
    low: { min: 0, max: 29 },
    medium: { min: 30, max: 59 },
    high: { min: 60, max: 100 },
  },
};
