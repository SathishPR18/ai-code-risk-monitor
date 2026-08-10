/**
 * Notification & Alerting Service for High Risk PRs.
 * Sends webhook alerts to Slack and/or Discord if configured.
 */

export interface HighRiskAlertInput {
  prTitle: string;
  prNumber: number;
  repoFullName: string;
  score: number;
  highRiskFileCount: number;
  detailsUrl?: string;
}

export async function sendHighRiskAlert(input: HighRiskAlertInput): Promise<void> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!slackUrl && !discordUrl) {
    return; // No webhooks configured
  }

  const tasks: Promise<void>[] = [];

  if (slackUrl) {
    tasks.push(sendSlackAlert(slackUrl, input));
  }

  if (discordUrl) {
    tasks.push(sendDiscordAlert(discordUrl, input));
  }

  await Promise.allSettled(tasks);
}

async function sendSlackAlert(url: string, input: HighRiskAlertInput): Promise<void> {
  try {
    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔴 High Risk Pull Request Detected",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Repo:* \`${input.repoFullName}\`\n*PR #${input.prNumber}:* ${input.prTitle}\n*High Risk Files:* ${input.highRiskFileCount}`,
          },
        },
      ],
    };

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[Alert Service] Failed to send Slack notification:", err);
  }
}

async function sendDiscordAlert(url: string, input: HighRiskAlertInput): Promise<void> {
  try {
    const payload = {
      embeds: [
        {
          title: "🔴 High Risk Pull Request Detected",
          description: `**Repo:** \`${input.repoFullName}\`\n**PR #${input.prNumber}:** ${input.prTitle}\n**High Risk Files:** ${input.highRiskFileCount}`,
          color: 15158332, // Red color
        },
      ],
    };

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[Alert Service] Failed to send Discord notification:", err);
  }
}
