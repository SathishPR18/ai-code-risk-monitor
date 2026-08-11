import { describe, it, expect } from "vitest";
import {
  determineUserRole,
  createSessionToken,
  verifySessionToken,
} from "../../src/dashboard/auth-service.js";
import { renderLoginView, renderDashboardView } from "../../src/dashboard/views.js";

describe("Dashboard Auth & Views", () => {
  it("determines super_admin role for SathishPR18", () => {
    const role = determineUserRole("SathishPR18");
    expect(role).toBe("super_admin");
  });

  it("determines org_user role for other GitHub users", () => {
    const role = determineUserRole("random-dev-123");
    expect(role).toBe("org_user");
  });

  it("signs and verifies JWT session token correctly", () => {
    const sessionPayload = {
      username: "SathishPR18",
      role: "super_admin" as const,
      userOrgs: ["SathishPR18"],
    };

    const token = createSessionToken(sessionPayload);
    expect(typeof token).toBe("string");

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.username).toBe("SathishPR18");
    expect(decoded?.role).toBe("super_admin");
  });

  it("renders login HTML view with GitHub OAuth button", () => {
    const html = renderLoginView();
    expect(html).toContain("Continue with GitHub");
    expect(html).toContain("/auth/github");
  });

  it("renders dashboard HTML view with user session info", () => {
    const html = renderDashboardView({
      username: "SathishPR18",
      role: "super_admin",
      userOrgs: ["SathishPR18"],
    });

    expect(html).toContain("🛡️ AI Code Risk Monitor");
    expect(html).toContain("SathishPR18 (Super Admin)");
    expect(html).toContain("PR Risk Audit Logs");
  });
});
