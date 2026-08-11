export interface UserSession {
  username: string;
  avatarUrl?: string;
  userRepos: string[]; // e.g. ["aathiLM10/Life_tracker", "SathishPR18/ai-code-risk-monitor"]
}

export interface RiskyHotspot {
  filePath: string;
  scanCount: number;
  maxScore: number;
  highestTier: "high" | "medium" | "low";
}

export interface PRAuditItem {
  prNumber: number;
  prTitle: string;
  repoFullName: string;
  stack: string;
  score: number;
  tier: "high" | "medium" | "low";
  summary: string;
  scannedAt: string;
  reasons: string[];
}

export interface DashboardStatsResult {
  totalPRsScored: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  aiCoveragePercentage: number;
  hotspots: RiskyHotspot[];
  auditLogs: PRAuditItem[];
  availableRepos: string[];
}
