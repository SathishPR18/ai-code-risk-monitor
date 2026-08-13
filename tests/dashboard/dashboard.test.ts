import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
} from "../../src/dashboard/auth-service.js";
import { renderLoginView, renderDashboardView } from "../../src/dashboard/views.js";

describe("Dashboard Auth & Views", () => {
  it("signs and verifies JWT session token correctly", () => {
    const sessionPayload = {
      username: "SathishPR18",
      userRepos: ["SathishPR18/ai-code-risk-monitor"],
    };

    const token = createSessionToken(sessionPayload);
    expect(typeof token).toBe("string");

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.username).toBe("SathishPR18");
    expect(decoded?.userRepos).toContain("SathishPR18/ai-code-risk-monitor");
  });

  it("renders login HTML view with GitHub OAuth button", () => {
    const html = renderLoginView();
    expect(html).toContain("Continue with GitHub");
    expect(html).toContain("/auth/github");
  });

  it("renders dashboard HTML view with user session info", () => {
    const html = renderDashboardView({
      username: "SathishPR18",
      userRepos: ["SathishPR18/ai-code-risk-monitor"],
    });

    expect(html).toContain("🛡️ AI Code Risk Monitor");
    expect(html).toContain("SathishPR18");
    expect(html).toContain("PR Risk Audit Ledger");
    expect(html).toContain("exportCSV()");
  });
});
