import { z } from "zod";
import type { LeadInput } from "@/lib/validation";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export const chatIntakeSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  locale: z.enum(["en", "vi"]).optional().default("en"),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatLocale = z.infer<typeof chatIntakeSchema>["locale"];

const serviceKeywords = [
  "appointment",
  "botox",
  "checkup",
  "consultation",
  "dental",
  "dermatology",
  "filler",
  "implant",
  "laser",
  "skin",
  "teeth",
  "tooth",
  "whitening",
  "x-ray",
  "khám",
  "nha khoa",
  "da liễu",
  "tư vấn",
];

function getUserText(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);
}

export function extractPhone(text: string) {
  const match = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  return match?.[0].replace(/[^\d+]/g, "") || "";
}

export function extractName(text: string) {
  const patterns = [
    /\b(?:my name is|i am|i'm|this is|name is)\s+([a-z][a-z\s.'-]{1,50})/i,
    /\b(?:tên tôi là|mình là|tôi là|em là|anh là|chị là)\s+([\p{L}\s.'-]{2,50})/iu,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1]
      ?.replace(/\b(?:and|phone|number|sdt|số|want|need)\b.*$/i, "")
      .trim();

    if (name) return toTitleCase(name);
  }

  return "";
}

export function extractServiceInterest(text: string) {
  const sentences = text
    .split(/[.!?\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const match = sentences.find((sentence) =>
    serviceKeywords.some((keyword) =>
      sentence.toLowerCase().includes(keyword.toLowerCase()),
    ),
  );

  return match || "";
}

export function buildConversationSummary(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const speaker =
        message.role === "user" ? "Customer" : "Clinic AI Assistant";
      return `${speaker}: ${message.content.trim()}`;
    })
    .join("\n");
}

export function extractLeadInput(messages: ChatMessage[]): Partial<LeadInput> {
  const userText = getUserText(messages).join("\n");
  const contextual = extractFromPromptedReplies(messages);

  return {
    name: extractName(userText) || contextual.name,
    phone: extractPhone(userText),
    source: "Website Chat",
    serviceInterest: extractServiceInterest(userText) || contextual.serviceInterest,
    message: buildConversationSummary(messages),
  };
}

export function getMissingLeadFields(lead: Partial<LeadInput>) {
  return [
    !lead.serviceInterest ? "serviceInterest" : "",
    !lead.name ? "name" : "",
    !lead.phone ? "phone" : "",
  ].filter(Boolean);
}

export function buildAssistantReply(
  missingFields: string[],
  locale: ChatLocale = "en",
) {
  const nextMissingField = missingFields[0];
  const copy = assistantReplies[locale];

  if (nextMissingField === "serviceInterest") {
    return copy.serviceInterest;
  }

  if (nextMissingField === "name") {
    return copy.name;
  }

  if (nextMissingField === "phone") {
    return copy.phone;
  }

  return copy.complete;
}

export function buildChatErrorReply(locale: ChatLocale = "en") {
  return assistantReplies[locale].error;
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractFromPromptedReplies(messages: ChatMessage[]) {
  const result = {
    name: "",
    serviceInterest: "",
  };

  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;

    const nextMessage = messages[index + 1];
    if (!nextMessage || nextMessage.role !== "user") return;

    const prompt = message.content.toLowerCase();
    const reply = nextMessage.content.trim();

    if (
      !result.name &&
      (prompt.includes("your name") || prompt.includes("tên của"))
    ) {
      result.name = toTitleCase(reply);
    }

    if (
      !result.serviceInterest &&
      (prompt.includes("what clinic service") ||
        prompt.includes("dịch vụ") ||
        prompt.includes("nhu cầu"))
    ) {
      result.serviceInterest = reply;
    }
  });

  return result;
}

const assistantReplies = {
  en: {
    serviceInterest:
      "Thanks for reaching out. What clinic service are you interested in, and what would you like help with?",
    name: "I can help pass this to the clinic team. May I have your name?",
    phone: "Thanks. What phone number should the clinic team use to follow up?",
    complete:
      "Thanks, I have enough information to send this to the clinic team. They will review your request and follow up shortly.",
    error:
      "Sorry, I could not save this conversation right now. Please try again in a moment.",
  },
  vi: {
    serviceInterest:
      "Cảm ơn bạn đã liên hệ. Bạn đang quan tâm dịch vụ nào của phòng khám, và mình có thể hỗ trợ nhu cầu gì?",
    name: "Mình có thể chuyển thông tin này cho đội ngũ phòng khám. Cho mình xin tên của bạn nhé?",
    phone:
      "Cảm ơn bạn. Cho mình xin số điện thoại để đội ngũ phòng khám liên hệ lại nhé?",
    complete:
      "Cảm ơn bạn, mình đã có đủ thông tin để gửi cho đội ngũ phòng khám. Phòng khám sẽ xem yêu cầu và liên hệ lại sớm.",
    error:
      "Xin lỗi, hiện tại mình chưa lưu được cuộc trò chuyện này. Bạn vui lòng thử lại sau ít phút nhé.",
  },
} satisfies Record<
  "en" | "vi",
  Record<"serviceInterest" | "name" | "phone" | "complete" | "error", string>
>;
