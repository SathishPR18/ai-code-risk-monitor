# AI Code Risk Monitor

A GitHub App that automatically scores every PR on a Next.js/TypeScript repo for risk, posting a **comment** and **status check** directly on the PR.

---

## How It Works

1. Install the GitHub App on your repo
2. Open or update any PR
3. Risk scores appear automatically — no configuration required

```
Developer opens PR → GitHub sends webhook → App scores each changed file
→ Posts risk comment + 🟢/🟡/🔴 status check on the PR
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) Postgres project (free tier)
- A [GitHub App](https://github.com/settings/apps) registered on your account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-code-risk-monitor
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in the values — see .env.example for documentation
```

### 3. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4. Set up smee.io tunnel (for local webhook testing)

```bash
# Create a channel at https://smee.io — copy your URL
npx smee-client --url https://smee.io/YOUR_CHANNEL_ID --target http://localhost:3000/webhook
```

Set your GitHub App's Webhook URL to your smee.io channel URL.

### 5. Start the dev server

```bash
npm run dev
```

### 6. Test it

Open a PR on a Next.js repo where the app is installed. You'll see risk scores appear automatically.

---

## Stack

| Layer | Choice |
|---|---|
| Web framework | Fastify |
| ORM | Drizzle |
| Database | Neon Postgres |
| AST analysis | ts-morph |
| GitHub integration | GitHub App + @octokit |
| Local tunneling | smee.io |

---

## Running Tests

```bash
npm test
```

Tests cover all scoring signals and the PR-level worst-case rollup.

---

## Optional Configuration

Add `.riskcheck/config.yml` to your repo to customize rules:

```yaml
sensitivePaths:
  - src/lib/admin.ts

weights:
  no_test_changed: 25

disabledSignals:
  - no_test_changed
```

See `.riskcheck/config.yml` in this repo for all available options.

---

## Deployment

Deploy to [Render](https://render.com) or [Railway](https://railway.app) (free tier):

1. Connect your GitHub repo
2. Set environment variables (`DATABASE_URL`, `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`)
3. Update your GitHub App's Webhook URL to your deployed URL: `https://yourapp.onrender.com/webhook`
