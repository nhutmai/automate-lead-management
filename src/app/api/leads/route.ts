import { NextResponse } from "next/server";
import { classifyLead } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { sendLeadNotification } from "@/lib/telegram";
import { leadInputSchema } from "@/lib/validation";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const metrics = leads.reduce(
      (summary, lead) => {
        summary.total += 1;
        if (lead.leadTemperature === "Hot") summary.hot += 1;
        if (lead.leadTemperature === "Warm") summary.warm += 1;
        if (lead.leadTemperature === "Cold") summary.cold += 1;
        if (lead.status === "Booked") summary.booked += 1;
        return summary;
      },
      { total: 0, hot: 0, warm: 0, cold: 0, booked: 0 },
    );

    return NextResponse.json({ leads, metrics });
  } catch (error) {
    console.error("Failed to fetch leads.", error);
    return NextResponse.json(
      { error: "Unable to fetch leads." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid lead submission.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const classification = await classifyLead(data);

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        source: data.source,
        originalServiceInterest: data.serviceInterest || null,
        message: data.message,
        aiServiceInterest: classification.serviceInterest || data.serviceInterest || null,
        leadTemperature: classification.leadTemperature,
        urgency: classification.urgency,
        intentSummary: classification.intentSummary,
        recommendedAction: classification.recommendedAction,
        suggestedReply: classification.suggestedReply || null,
        assignedTeam: classification.assignedTeam || null,
      },
    });

    sendLeadNotification(lead).catch((error) => {
      console.error("Telegram notification failed after lead creation.", error);
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead.", error);
    return NextResponse.json(
      { error: "Unable to create lead." },
      { status: 500 },
    );
  }
}
