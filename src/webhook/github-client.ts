import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PRFile {
  filename: string;
  status: string; // "added" | "modified" | "removed" | "renamed"
  patch?: string; // unified diff — may be absent for binary files
  additions: number;
  deletions: number;
}

export interface CommentPayload {
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
}

export interface StatusPayload {
  owner: string;
  repo: string;
  sha: string;
  state: "success" | "failure" | "pending" | "error";
  description: string;
  context: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAppAuth() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error(
      "GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be set in environment variables"
    );
  }

  // Replace escaped newlines in private key (common when storing in env vars)
  const normalizedKey = privateKey.replace(/\\n/g, "\n");

  return createAppAuth({
    appId: parseInt(appId, 10),
    privateKey: normalizedKey,
  });
}

async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const auth = getAppAuth();
  const { token } = await auth({
    type: "installation",
    installationId,
  });

  return new Octokit({ auth: token });
}

// ─── GitHub API Calls ─────────────────────────────────────────────────────────

/**
 * Fetch all changed files + their diffs for a PR.
 */
export async function getPRFiles(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRFile[]> {
  const octokit = await getInstallationOctokit(installationId);

  const files: PRFile[] = [];
  let page = 1;

  while (true) {
    const response = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
      page,
    });

    files.push(
      ...response.data.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch,
        additions: f.additions,
        deletions: f.deletions,
      }))
    );

    if (response.data.length < 100) break;
    page++;
  }

  return files;
}

/**
 * Post a comment on the PR's conversation tab.
 * If a previous risk-check comment exists, update it instead of duplicating.
 */
export async function postOrUpdateComment(
  installationId: number,
  payload: CommentPayload
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  const COMMENT_MARKER = "<!-- ai-code-risk-monitor -->";

  // Find existing risk-check comment
  const comments = await octokit.issues.listComments({
    owner: payload.owner,
    repo: payload.repo,
    issue_number: payload.prNumber,
    per_page: 100,
  });

  const existing = comments.data.find((c) =>
    c.body?.includes(COMMENT_MARKER)
  );

  const body = `${COMMENT_MARKER}\n${payload.body}`;

  if (existing) {
    await octokit.issues.updateComment({
      owner: payload.owner,
      repo: payload.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await octokit.issues.createComment({
      owner: payload.owner,
      repo: payload.repo,
      issue_number: payload.prNumber,
      body,
    });
  }
}

/**
 * Post a commit status check (the red/amber/green badge on the PR).
 */
export async function postStatusCheck(
  installationId: number,
  payload: StatusPayload
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);

  await octokit.repos.createCommitStatus({
    owner: payload.owner,
    repo: payload.repo,
    sha: payload.sha,
    state: payload.state,
    description: payload.description,
    context: payload.context,
    target_url: undefined,
  });
}

/**
 * Fetch a single file's content from the repo (used to read package.json, etc.)
 */
export async function getFileContent(
  installationId: number,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const octokit = await getInstallationOctokit(installationId);

  try {
    const response = await octokit.repos.getContent({ owner, repo, path });
    const data = response.data;

    if ("content" in data && typeof data.content === "string") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch (err: unknown) {
    // 404 = file doesn't exist — not an error for optional files
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}
