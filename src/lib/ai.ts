import type { LeadInput } from "./validation";

export type LeadClassification = {
  serviceInterest: string;
  leadTemperature: "Hot" | "Warm" | "Cold";
  urgency: "High" | "Medium" | "Low";
  intentSummary: string;
  recommendedAction: string;
  suggestedReply: string;
  assignedTeam: string;
};

function getFallbackClassification(lead?: LeadInput): LeadClassification {
  return {
    serviceInterest: lead?.serviceInterest || "Manual review required",
    leadTemperature: "Warm",
    urgency: "Medium",
    intentSummary: "AI classification failed. Manual review required.",
    recommendedAction: "Review and contact customer manually.",
    suggestedReply:
      "Thank you for contacting us. Our clinic team will review your request and follow up shortly.",
    assignedTeam: "Front Desk",
  };
}

export const fallbackClassification: LeadClassification = {
  serviceInterest: "Manual review required",
  leadTemperature: "Warm",
  urgency: "Medium",
  intentSummary: "AI classification failed. Manual review required.",
  recommendedAction: "Review and contact customer manually.",
  suggestedReply:
    "Thank you for contacting us. Our clinic team will review your request and follow up shortly.",
  assignedTeam: "Front Desk",
};

const temperatures = new Set(["Hot", "Warm", "Cold"]);
const urgencies = new Set(["High", "Medium", "Low"]);

function buildPrompt(lead: LeadInput) {
  return `You are an AI assistant that classifies leads for a clinic or healthcare service.

Classification criteria:
- Hot: the customer has a clear need, wants to book an appointment, wants consultation soon, or shows high purchase intent.
- Warm: the customer is interested but is still asking about pricing, comparing options, or has not decided yet.
- Cold: the customer asks general questions and does not show a clear need yet.

Based on the lead information, return valid JSON only. Do not use markdown. Do not add any explanation.

Return exactly this JSON structure with all keys present:
{
  "serviceInterest": "string",
  "leadTemperature": "Hot | Warm | Cold",
  "urgency": "High | Medium | Low",
  "intentSummary": "string",
  "recommendedAction": "string",
  "suggestedReply": "string",
  "assignedTeam": "string"
}

Lead information:
Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email || ""}
Source: ${lead.source}
Service Interest: ${lead.serviceInterest || ""}
Message: ${lead.message}

If uncertain, choose Warm.`;
}

function extractJson(content: string) {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error("Groq response did not contain a JSON object");
  }

  return JSON.parse(content.slice(firstBrace, lastBrace + 1));
}

function getRequiredString(data: Record<string, unknown>, key: string) {
  const value = data[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Groq response missed required string field: ${key}`);
  }

  return value.trim();
}

function normalizeClassification(value: unknown): LeadClassification {
  if (!value || typeof value !== "object") {
    throw new Error("Groq response was not an object");
  }

  const data = value as Record<string, unknown>;
  const leadTemperature =
    typeof data.leadTemperature === "string" &&
      temperatures.has(data.leadTemperature)
      ? data.leadTemperature
      : undefined;
  const urgency =
    typeof data.urgency === "string" && urgencies.has(data.urgency)
      ? data.urgency
      : undefined;

  if (!leadTemperature || !urgency) {
    throw new Error("Groq response missed required classification fields");
  }

  return {
    serviceInterest: getRequiredString(data, "serviceInterest"),
    leadTemperature: leadTemperature as LeadClassification["leadTemperature"],
    urgency: urgency as LeadClassification["urgency"],
    intentSummary: getRequiredString(data, "intentSummary"),
    recommendedAction: getRequiredString(data, "recommendedAction"),
    suggestedReply: getRequiredString(data, "suggestedReply"),
    assignedTeam: getRequiredString(data, "assignedTeam"),
  };
}

export async function classifyLead(
  lead: LeadInput,
): Promise<LeadClassification> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("GROQ_API_KEY is missing. Using fallback lead classification.");
    return getFallbackClassification(lead);
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: [{ role: "user", content: buildPrompt(lead) }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${details}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("Groq response content was empty");
    }

    return normalizeClassification(extractJson(content));
  } catch (error) {
    console.error("Lead classification failed. Using fallback.", error);
    return getFallbackClassification(lead);
  }
}
