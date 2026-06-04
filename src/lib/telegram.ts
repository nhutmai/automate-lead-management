import type { Lead } from "@prisma/client";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendLeadNotification(lead: Lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram env variables are missing. Skipping notification.");
    return;
  }

  const text = `NEW ${lead.leadTemperature} LEAD

Name: ${lead.name}
Phone: ${lead.phone}
Source: ${lead.source}
Service: ${lead.aiServiceInterest || lead.originalServiceInterest || "Not specified"}
Urgency: ${lead.urgency}
Action: ${lead.recommendedAction || "Review lead"}`;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: escapeHtml(text),
        parse_mode: "HTML",
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram notification failed: ${response.status} ${details}`);
  }
}
