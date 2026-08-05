import { describe, it, expect } from "vitest";
import { scoreFile, scorePR } from "../../src/scoring/engine.js";
import { DEFAULT_NEXTJS_CONFIG } from "../../src/detector/default-config.js";
import type { ScoringInput } from "../../src/scoring/signals.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<ScoringInput>): ScoringInput {
  return {
    filePath: "some/file.ts",
    patch: "",
    status: "modified",
    allChangedPaths: ["some/file.ts"],
    config: DEFAULT_NEXTJS_CONFIG,
    ...overrides,
  };
}

// ─── scoreFile ────────────────────────────────────────────────────────────────

describe("scoreFile — auth config", () => {
  it("scores HIGH when auth.config.ts is changed", () => {
    const result = scoreFile(
      makeInput({
        filePath: "auth.config.ts",
        // Include a removal line so pure_addition(-20) does NOT fire
        patch: `-  secret: process.env.OLD_SECRET\n+  secret: process.env.AUTH_SECRET`,
        allChangedPaths: ["auth.config.ts"],
      })
    );

    // auth_config_changed(+40) + no_test(+15) = 55 → MEDIUM (not high alone)
    // With new env var signal too: +40 +15 +15 = 70 → HIGH
    expect(result.tier).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(
      result.reasons.some((r) => r.includes("Auth config changed"))
    ).toBe(true);
  });

  it("scores HIGH when next-auth.config.ts is changed with env var", () => {
    const result = scoreFile(
      makeInput({
        filePath: "next-auth.config.ts",
        patch: `-  old: "x"\n+  secret: process.env.NEXTAUTH_SECRET`,
        allChangedPaths: ["next-auth.config.ts"],
      })
    );
    // auth(+40) + new_env_no_example(+15) + no_test(+15) = 70 → HIGH
    expect(result.tier).toBe("high");
  });
});

describe("scoreFile — middleware", () => {
  it("scores MEDIUM when middleware.ts is changed alone", () => {
    const result = scoreFile(
      makeInput({
        filePath: "middleware.ts",
        // Include a removal so pure_addition(-20) does NOT fire
        patch: `-  // old check\n+  if (!session) redirect('/login')`,
        allChangedPaths: ["middleware.ts"],
      })
    );

    // middleware(+35) + no_test(+15) = 50 → MEDIUM
    expect(result.tier).toBe("medium");
    expect(result.score).toBe(50);
    expect(
      result.reasons.some((r) => r.includes("Middleware changed"))
    ).toBe(true);
  });

  it("scores HIGH when middleware.ts removes validation", () => {
    const result = scoreFile(
      makeInput({
        filePath: "middleware.ts",
        patch: `-  z.string().parse(token)\n+  const token = req.headers.token`,
        allChangedPaths: ["middleware.ts"],
      })
    );

    // middleware(+35) + removed_validation(+30) + no_test(+15) = 80 → HIGH
    expect(result.tier).toBe("high");
  });
});

describe("scoreFile — API route", () => {
  it("scores MEDIUM for an API route change without tests", () => {
    const result = scoreFile(
      makeInput({
        filePath: "app/api/users/route.ts",
        // Include a removal to prevent pure_addition(-20) from firing
        patch: `-  return NextResponse.json({ old })\n+  return NextResponse.json({ users })`,
        allChangedPaths: ["app/api/users/route.ts"],
      })
    );

    // api_route(+30) + no_test(+15) = 45 → MEDIUM
    expect(result.tier).toBe("medium");
    expect(result.score).toBe(45);
  });

  it("scores correctly for an API route change when tests are also changed", () => {
    const result = scoreFile(
      makeInput({
        filePath: "app/api/users/route.ts",
        patch: `-  return NextResponse.json({ old })\n+  return NextResponse.json({ users })`,
        allChangedPaths: [
          "app/api/users/route.ts",
          "tests/api/users.test.ts",
        ],
      })
    );

    // api_route(+30) only = 30 → MEDIUM (no_test doesn't fire)
    expect(result.score).toBe(30);
    expect(result.tier).toBe("medium");
  });
});

describe("scoreFile — pure CSS / styling (low risk)", () => {
  it("scores LOW for a pure CSS file addition", () => {
    const result = scoreFile(
      makeInput({
        filePath: "styles/button.css",
        patch: `+.btn { color: red; }`,
        status: "added",
        allChangedPaths: ["styles/button.css"],
      })
    );

    // pure_addition(-20) + no_test(+15) = -5 → clamped to 0 → LOW
    expect(result.tier).toBe("low");
    expect(result.score).toBe(0);
  });

  it("scores LOW for a README update", () => {
    const result = scoreFile(
      makeInput({
        filePath: "README.md",
        patch: `+## New section`,
        status: "modified",
        allChangedPaths: ["README.md"],
      })
    );

    expect(result.tier).toBe("low");
  });
});

describe("scoreFile — removed Zod validation", () => {
  it("scores HIGH when Zod schema is removed from an API route", () => {
    const patch = [
      "-  const schema = z.object({ email: z.string().email() });",
      "-  schema.parse(body);",
      "+  const { email } = body;",
    ].join("\n");

    const result = scoreFile(
      makeInput({
        filePath: "app/api/register/route.ts",
        patch,
        allChangedPaths: ["app/api/register/route.ts"],
      })
    );

    // api_route(+30) + removed_validation(+30) + no_test(+15) = 75 → HIGH
    expect(result.tier).toBe("high");
    expect(result.score).toBe(75);
    expect(
      result.reasons.some((r) => r.includes("validation schema removed"))
    ).toBe(true);
  });
});

describe("scoreFile — new env var without .env.example update", () => {
  it("flags new process.env usage when .env.example is not updated", () => {
    const result = scoreFile(
      makeInput({
        filePath: "lib/payment.ts",
        patch: `+  const key = process.env.STRIPE_SECRET_KEY`,
        allChangedPaths: ["lib/payment.ts"],
      })
    );

    expect(
      result.reasons.some((r) => r.includes("env var"))
    ).toBe(true);
  });

  it("does NOT flag env var usage when .env.example is also updated", () => {
    const result = scoreFile(
      makeInput({
        filePath: "lib/payment.ts",
        patch: `+  const key = process.env.STRIPE_SECRET_KEY`,
        allChangedPaths: ["lib/payment.ts", ".env.example"],
      })
    );

    expect(
      result.reasons.some((r) => r.includes("env var"))
    ).toBe(false);
  });
});

describe("scoreFile — Server Actions", () => {
  it("detects 'use server' directive in added lines", () => {
    const patch = ['+  "use server"', "+  export async function createUser()"].join(
      "\n"
    );

    const result = scoreFile(
      makeInput({
        filePath: "app/actions/user.ts",
        patch,
        allChangedPaths: ["app/actions/user.ts"],
      })
    );

    expect(
      result.reasons.some((r) => r.includes("Server Action"))
    ).toBe(true);
    expect(result.tier).not.toBe("low"); // at least medium
  });
});

// ─── scorePR — worst-case rollup ──────────────────────────────────────────────

describe("scorePR — PR-level rollup", () => {
  it("returns HIGH tier if any single file is high risk", () => {
    const result = scorePR(
      [
        { filePath: "styles/button.css", patch: "+.btn{}", status: "added" },
        {
          filePath: "auth.config.ts",
          // Removal line prevents pure_addition; env var fires new_env signal
          patch: `-  secret: "old"\n+  secret: process.env.AUTH_SECRET`,
          status: "modified",
        },
        { filePath: "README.md", patch: "+ new section", status: "modified" },
      ],
      ["styles/button.css", "auth.config.ts", "README.md"],
      DEFAULT_NEXTJS_CONFIG
    );

    expect(result.prTier).toBe("high");
    expect(result.highRiskFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("returns LOW when all files are low risk", () => {
    const result = scorePR(
      [
        {
          filePath: "styles/button.css",
          patch: "+.btn { color: red; }",
          status: "added",
        },
        {
          filePath: "styles/header.css",
          patch: "+.header { padding: 0; }",
          status: "added",
        },
      ],
      [
        "styles/button.css",
        "styles/header.css",
        "tests/styles.test.ts",
      ],
      DEFAULT_NEXTJS_CONFIG
    );

    expect(result.prTier).toBe("low");
  });

  it("counts files correctly by tier", () => {
    const result = scorePR(
      [
        {
          filePath: "auth.config.ts",
          patch: `-  secret: "old"\n+  secret: process.env.AUTH_SECRET`,
          status: "modified",
        },
        {
          filePath: "middleware.ts",
          patch: `-  // old\n+  if (!session) redirect('/login')`,
          status: "modified",
        },
        { filePath: "styles/app.css", patch: "+.a{}", status: "added" },
      ],
      ["auth.config.ts", "middleware.ts", "styles/app.css"],
      DEFAULT_NEXTJS_CONFIG
    );

    expect(result.totalFilesScored).toBe(3);
    expect(result.highRiskFiles.length).toBeGreaterThanOrEqual(1);
  });
});
