import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// ─── organizations ────────────────────────────────────────────────────────────
// One row per GitHub org (or personal account). Every other table references this.
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── repos ────────────────────────────────────────────────────────────────────
// One row per GitHub repository where the app is installed.
export const repos = pgTable(
  "repos",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizations.id),
    githubRepoFullName: varchar("github_repo_full_name", { length: 512 })
      .notNull()
      .unique(), // e.g. "myorg/my-nextjs-app"
    stack: varchar("stack", { length: 64 }).notNull().default("nextjs"), // future: "python", "rails"
    configPath: varchar("config_path", { length: 512 }).default(
      ".riskcheck/config.yml"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("repos_org_id_idx").on(table.orgId),
  })
);

// ─── risk_scores ──────────────────────────────────────────────────────────────
// One row per FILE per PR. This is the core audit log — append-only.
export const riskScores = pgTable(
  "risk_scores",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizations.id),
    repoId: integer("repo_id")
      .notNull()
      .references(() => repos.id),
    prNumber: integer("pr_number").notNull(),
    prTitle: varchar("pr_title", { length: 512 }),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    score: integer("score").notNull(), // 0–100
    riskTier: varchar("risk_tier", { length: 16 }).notNull(), // "low" | "medium" | "high"
    // Array of human-readable reason strings, e.g. ["Auth config changed (+40)"]
    reasons: jsonb("reasons").notNull().$type<string[]>(),
    businessLogicAnalysis: jsonb("business_logic_analysis"),
    aiSummary: text("ai_summary"),
    stack: varchar("stack", { length: 64 }).notNull(),
    headSha: varchar("head_sha", { length: 40 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgPrIdx: index("risk_scores_org_pr_idx").on(table.orgId, table.prNumber),
    repoPrIdx: index("risk_scores_repo_pr_idx").on(table.repoId, table.prNumber),
    createdAtIdx: index("risk_scores_created_at_idx").on(table.createdAt),
  })
);

// ─── outcomes ─────────────────────────────────────────────────────────────────
// Populated later (not Phase 1 core flow). Tracks whether a flagged file
// was subsequently hotfixed/reverted — feeds the future trust ledger.
export const outcomes = pgTable(
  "outcomes",
  {
    id: serial("id").primaryKey(),
    riskScoreId: integer("risk_score_id")
      .notNull()
      .references(() => riskScores.id),
    // "hotfix" | "revert" | "none"
    outcomeType: varchar("outcome_type", { length: 32 }).notNull(),
    notes: text("notes"),
    notedAt: timestamp("noted_at").defaultNow().notNull(),
  },
  (table) => ({
    riskScoreIdIdx: index("outcomes_risk_score_id_idx").on(table.riskScoreId),
  })
);

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Repo = typeof repos.$inferSelect;
export type NewRepo = typeof repos.$inferInsert;

export type RiskScore = typeof riskScores.$inferSelect;
export type NewRiskScore = typeof riskScores.$inferInsert;

export type Outcome = typeof outcomes.$inferSelect;
export type NewOutcome = typeof outcomes.$inferInsert;
