import { classifyLead } from "@/lib/ai";
import { appendLeadToGoogleSheet } from "@/lib/google-sheets";
import { prisma } from "@/lib/prisma";
import { sendLeadNotification } from "@/lib/telegram";
import type { LeadInput } from "@/lib/validation";

export async function createLeadFromInput(data: LeadInput) {
  const classification = await classifyLead(data);

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      source: data.source,
      originalServiceInterest: data.serviceInterest || null,
      message: data.message,
      aiServiceInterest:
        classification.serviceInterest || data.serviceInterest || null,
      leadTemperature: classification.leadTemperature,
      urgency: classification.urgency,
      intentSummary: classification.intentSummary,
      intentSummaryVi: classification.intentSummaryVi,
      recommendedAction: classification.recommendedAction,
      recommendedActionVi: classification.recommendedActionVi,
      suggestedReply: classification.suggestedReply || null,
      assignedTeam: classification.assignedTeam || null,
    },
  });

  sendLeadNotification(lead).catch((error) => {
    console.error("Telegram notification failed after lead creation.", error);
  });

  appendLeadToGoogleSheet(lead).catch((error) => {
    console.error("Google Sheets sync failed after lead creation.", error);
  });

  return lead;
}
