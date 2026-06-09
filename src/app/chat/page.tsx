"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatLocale = "en" | "vi";

const chatCopy = {
  en: {
    brandTagline: "Clinic lead management",
    leadForm: "Lead form",
    dashboard: "Dashboard",
    title: "AI Chat Intake",
    subtitle:
      "Simulate how clinic customers can chat with an AI assistant and be converted into CRM leads.",
    assistantName: "Clinic AI Assistant",
    demoLabel: "Website Chat intake demo",
    leadSaved: "Lead saved",
    loading: "Clinic AI Assistant is replying...",
    savedPlaceholder: "Lead has been saved to the CRM",
    inputPlaceholder: "Type a clinic service inquiry...",
    sendLabel: "Send message",
    intakeDetails: "Intake details",
    channel: "Channel",
    channelValue: "Website Chat",
    purpose: "Purpose",
    purposeValue: "Lead intake and triage",
    nextStep: "Next step",
    nextStepValue: "Save to CRM and notify team",
    customerMessages: "Customer messages",
    startNewChat: "Start new chat",
    customer: "Customer",
    assistant: "Clinic AI Assistant",
    genericError: "Unable to process chat message.",
    initialMessage:
      "Hello, I am the clinic AI assistant. Tell me what service you are interested in, and I can collect the details for our team.",
  },
  vi: {
    brandTagline: "Quản lý lead phòng khám",
    leadForm: "Form lead",
    dashboard: "Dashboard",
    title: "AI Chat Intake",
    subtitle:
      "Mô phỏng cách khách hàng phòng khám trò chuyện với trợ lý AI và được chuyển thành lead trong CRM.",
    assistantName: "Trợ lý AI phòng khám",
    demoLabel: "Demo thu thập lead qua Website Chat",
    leadSaved: "Đã lưu lead",
    loading: "Trợ lý AI phòng khám đang trả lời...",
    savedPlaceholder: "Lead đã được lưu vào CRM",
    inputPlaceholder: "Nhập nhu cầu dịch vụ phòng khám...",
    sendLabel: "Gửi tin nhắn",
    intakeDetails: "Thông tin intake",
    channel: "Kênh",
    channelValue: "Website Chat",
    purpose: "Mục đích",
    purposeValue: "Thu thập lead và sàng lọc nhu cầu",
    nextStep: "Bước tiếp theo",
    nextStepValue: "Lưu vào CRM và thông báo đội ngũ",
    customerMessages: "Tin nhắn khách hàng",
    startNewChat: "Bắt đầu chat mới",
    customer: "Khách hàng",
    assistant: "Trợ lý AI phòng khám",
    genericError: "Không thể xử lý tin nhắn chat.",
    initialMessage:
      "Xin chào, mình là trợ lý AI của phòng khám. Bạn cho mình biết dịch vụ đang quan tâm, mình sẽ thu thập thông tin để đội ngũ hỗ trợ nhé.",
  },
} satisfies Record<ChatLocale, Record<string, string>>;

function getInitialMessages(locale: ChatLocale): ChatMessage[] {
  return [
    {
      role: "assistant",
      content: chatCopy[locale].initialMessage,
    },
  ];
}

export default function ChatIntakePage() {
  const [locale, setLocale] = useState<ChatLocale>("en");
  const copy = chatCopy[locale];
  const [messages, setMessages] = useState<ChatMessage[]>(
    getInitialMessages(locale),
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadCreated, setLeadCreated] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const userMessages = useMemo(
    () => messages.filter((message) => message.role === "user"),
    [messages],
  );

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();

    if (!content || isLoading || leadCreated) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, locale }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || copy.genericError);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.reply },
      ]);
      setLeadCreated(Boolean(payload.leadCreated));
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : copy.genericError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetChat() {
    setMessages(getInitialMessages(locale));
    setInput("");
    setError("");
    setLeadCreated(false);
  }

  function changeLocale(nextLocale: ChatLocale) {
    setLocale(nextLocale);
    setMessages(getInitialMessages(nextLocale));
    setInput("");
    setError("");
    setLeadCreated(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark name="PulseLead AI" tagline={copy.brandTagline} />
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex h-10 overflow-hidden rounded-md border border-blue-200 bg-white shadow-sm">
              {(["en", "vi"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeLocale(option)}
                  className={`px-3 text-sm font-semibold transition ${
                    locale === option
                      ? "bg-blue-600 text-white"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.leadForm}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {copy.dashboard}
            </Link>
          </div>
        </div>

        <header>
          <h1 className="font-display text-4xl font-normal tracking-normal">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.subtitle}
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl shadow-blue-100/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-normal">
                    {copy.assistantName}
                  </h2>
                  <p className="text-xs font-medium text-green-700">
                    {copy.demoLabel}
                  </p>
                </div>
              </div>
              {leadCreated ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {copy.leadSaved}
                </span>
              ) : null}
            </div>

            <div className="h-[360px] overflow-y-auto bg-slate-100 px-4 py-5">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}`}
                    copy={copy}
                    message={message}
                  />
                ))}
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.loading}
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            {error ? (
              <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <form
              onSubmit={sendMessage}
              className="flex gap-3 border-t border-slate-200 bg-white p-4"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isLoading || leadCreated}
                className="input h-11"
                placeholder={
                  leadCreated
                    ? copy.savedPlaceholder
                    : copy.inputPlaceholder
                }
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || leadCreated}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label={copy.sendLabel}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>

          <aside className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-normal">
              {copy.intakeDetails}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <PanelRow label={copy.channel} value={copy.channelValue} />
              <PanelRow label={copy.purpose} value={copy.purposeValue} />
              <PanelRow
                label={copy.nextStep}
                value={copy.nextStepValue}
              />
              <PanelRow
                label={copy.customerMessages}
                value={String(userMessages.length)}
              />
            </dl>
            <button
              onClick={resetChat}
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {copy.startNewChat}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MessageBubble({
  copy,
  message,
}: {
  copy: (typeof chatCopy)[ChatLocale];
  message: ChatMessage;
}) {
  const isUser = message.role === "user";
  const Icon = isUser ? UserRound : Bot;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div
        className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${isUser
          ? "bg-blue-600 text-white"
          : "border border-slate-200 bg-white text-slate-800"
          }`}
      >
        <p className="mb-1 text-xs font-semibold opacity-80">
          {isUser ? copy.customer : copy.assistant}
        </p>
        <p>{message.content}</p>
      </div>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-700 text-white">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-label text-xs font-semibold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  );
}
