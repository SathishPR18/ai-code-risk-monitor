import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/detector/config-loader.js";
import { DEFAULT_IGNORE_PATHS } from "../../src/detector/default-config.js";

describe("ignorePaths & Multi-Stack Configs", () => {
  it("includes default lockfiles and dist patterns in DEFAULT_IGNORE_PATHS", () => {
    expect(DEFAULT_IGNORE_PATHS).toContain("package-lock.json");
    expect(DEFAULT_IGNORE_PATHS).toContain("dist/**");
    expect(DEFAULT_IGNORE_PATHS).toContain("yarn.lock");
  });

  it("loads python default config with python ignore paths", async () => {
    const config = await loadConfig(null, "python");
    expect(config.stack).toBe("python");
    expect(config.ignorePaths).toContain("*.pyc");
    expect(config.ignorePaths).toContain("__pycache__/**");
  });

  it("merges user-defined ignorePaths from yaml", async () => {
    const yamlContent = `
ignorePaths:
  - "custom-output/**"
  - "generated.ts"
`;
    const config = await loadConfig(yamlContent, "nextjs");
    expect(config.ignorePaths).toContain("custom-output/**");
    expect(config.ignorePaths).toContain("generated.ts");
    expect(config.ignorePaths).toContain("package-lock.json");
  });
});
