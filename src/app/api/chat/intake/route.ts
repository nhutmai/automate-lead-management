import { NextResponse } from "next/server";
import {
  buildAssistantReply,
  buildChatErrorReply,
  chatIntakeSchema,
  extractLeadInput,
  getMissingLeadFields,
} from "@/lib/chat-intake";
import { createLeadFromInput } from "@/lib/leads";
import { leadInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = chatIntakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid chat intake request.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const extractedLead = extractLeadInput(parsed.data.messages);
    const missingFields = getMissingLeadFields(extractedLead);
    const locale = parsed.data.locale;

    if (missingFields.length > 0) {
      return NextResponse.json({
        reply: buildAssistantReply(missingFields, locale),
        leadCreated: false,
      });
    }

    const leadInput = leadInputSchema.parse(extractedLead);
    const lead = await createLeadFromInput(leadInput);

    return NextResponse.json(
      {
        reply: buildAssistantReply([], locale),
        leadCreated: true,
        lead,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to process chat intake.", error);
    return NextResponse.json(
      {
        error: "Unable to process chat intake.",
        reply: buildChatErrorReply(),
        leadCreated: false,
      },
      { status: 500 },
    );
  }
}
