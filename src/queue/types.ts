// ─── Job Payload Types ─────────────────────────────────────────────────────────
// Defines the shape of data stored in the Redis queue for each PR scan job.

export interface PRScanJobData {
  installationId: number;
  owner: string;
  repo: string;
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  prDescription: string;
  headSha: string;
  orgName: string;
  deliveryId?: string;
}
