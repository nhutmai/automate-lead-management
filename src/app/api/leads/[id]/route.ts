import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/leads/[id]">,
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = leadStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status. Use New, Contacted, Booked, or Lost." },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error(`Failed to update lead ${id}.`, error);
    return NextResponse.json(
      { error: "Unable to update lead status." },
      { status: 500 },
    );
  }
}
