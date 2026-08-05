CREATE TABLE IF NOT EXISTS "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"risk_score_id" integer NOT NULL,
	"outcome_type" varchar(32) NOT NULL,
	"notes" text,
	"noted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repos" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"github_repo_full_name" varchar(512) NOT NULL,
	"stack" varchar(64) DEFAULT 'nextjs' NOT NULL,
	"config_path" varchar(512) DEFAULT '.riskcheck/config.yml',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repos_github_repo_full_name_unique" UNIQUE("github_repo_full_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"repo_id" integer NOT NULL,
	"pr_number" integer NOT NULL,
	"pr_title" varchar(512),
	"file_path" varchar(1024) NOT NULL,
	"score" integer NOT NULL,
	"risk_tier" varchar(16) NOT NULL,
	"reasons" jsonb NOT NULL,
	"stack" varchar(64) NOT NULL,
	"head_sha" varchar(40),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_risk_score_id_risk_scores_id_fk" FOREIGN KEY ("risk_score_id") REFERENCES "public"."risk_scores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repos" ADD CONSTRAINT "repos_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcomes_risk_score_id_idx" ON "outcomes" USING btree ("risk_score_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "repos_org_id_idx" ON "repos" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_scores_org_pr_idx" ON "risk_scores" USING btree ("org_id","pr_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_scores_repo_pr_idx" ON "risk_scores" USING btree ("repo_id","pr_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_scores_created_at_idx" ON "risk_scores" USING btree ("created_at");