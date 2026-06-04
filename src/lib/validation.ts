import { z } from "zod";

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  source: z.string().trim().min(1, "Source is required"),
  serviceInterest: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required"),
});

export const leadStatusSchema = z.object({
  status: z.enum(["New", "Contacted", "Booked", "Lost"]),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadStatus = z.infer<typeof leadStatusSchema>["status"];
