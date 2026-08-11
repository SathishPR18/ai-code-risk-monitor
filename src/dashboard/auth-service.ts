import jwt from "jsonwebtoken";
import type { UserSession } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET || "ai-code-risk-monitor-super-secret-key-2026";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";

export function getGitHubOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "read:user repo",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string | null> {
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[Auth Service] OAuth token exchange failed:", err);
    return null;
  }
}

export async function fetchGitHubUserProfile(accessToken: string): Promise<{ username: string; avatarUrl: string; orgs: string[] } | null> {
  try {
    // 1. Fetch user identity
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "AI-Code-Risk-Monitor",
      },
    });

    if (!userRes.ok) return null;
    const userData = (await userRes.json()) as { login: string; avatar_url: string };

    // 2. Fetch user's org memberships
    const orgsRes = await fetch("https://api.github.com/user/orgs", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "AI-Code-Risk-Monitor",
      },
    });

    const orgsData = orgsRes.ok ? ((await orgsRes.json()) as { login: string }[]) : [];
    const orgs = [userData.login, ...orgsData.map((o) => o.login)];

    return {
      username: userData.login,
      avatarUrl: userData.avatar_url,
      orgs,
    };
  } catch (err) {
    console.error("[Auth Service] Fetch GitHub profile failed:", err);
    return null;
  }
}

export function determineUserRole(username: string): "super_admin" | "org_user" {
  const superAdmins = (process.env.SUPER_ADMIN_USERNAMES || "SathishPR18")
    .split(",")
    .map((s) => s.trim().toLowerCase());
  return superAdmins.includes(username.toLowerCase()) ? "super_admin" : "org_user";
}

export function createSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}
