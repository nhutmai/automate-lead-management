"use client";

import { useCallback, useEffect, useState } from "react";

export type Locale = "en" | "vi";

const localeKey = "pulselead-locale";

export const sourceOptions = [
  { value: "Facebook Ads", labelKey: "sourceFacebook" },
  { value: "TikTok", labelKey: "sourceTiktok" },
  { value: "Website", labelKey: "sourceWebsite" },
  { value: "Referral", labelKey: "sourceReferral" },
  { value: "Other", labelKey: "sourceOther" },
] as const;

export const statusOptions = ["New", "Contacted", "Booked", "Lost"] as const;

export const translations = {
  en: {
    brandName: "PulseLead AI",
    brandTagline: "Clinic lead automation",
    languageLabel: "Language",
    english: "EN",
    vietnamese: "VI",
    heroTitle: "Capture patient inquiries and classify intent instantly.",
    heroBody:
      "Submit a new clinic lead, classify urgency with AI, notify the team, and track every follow-up from the dashboard.",
    openDashboard: "Open dashboard",
    valueAi: "AI triage",
    valueTelegram: "Telegram alert",
    valueStatus: "Status tracking",
    newLead: "New lead",
    formHelp: "Required fields are checked before the request reaches the API.",
    name: "Name",
    phone: "Phone",
    email: "Email",
    source: "Source",
    serviceInterest: "Service interest",
    message: "Message",
    namePlaceholder: "Mai Nguyen",
    phonePlaceholder: "+84 901 234 567",
    emailPlaceholder: "patient@example.com",
    servicePlaceholder: "Dental implant consultation",
    messagePlaceholder:
      "I want to book an appointment this week and need pricing details.",
    submitLead: "Submit lead",
    submitting: "Submitting",
    successLead: "Lead captured and routed for follow-up.",
    requiredName: "Name is required.",
    requiredPhone: "Phone is required.",
    requiredSource: "Source is required.",
    requiredMessage: "Message is required.",
    invalidValue: "Invalid value.",
    submitFailed: "Lead submission failed.",
    genericError: "Something went wrong.",
    backToForm: "New lead form",
    dashboardTitle: "Lead dashboard",
    dashboardBody:
      "Latest 100 clinic inquiries, AI classification, and team status.",
    refresh: "Refresh",
    refreshing: "Refreshing leads",
    updated: "Updated",
    openGoogleSheet: "Google Sheet",
    totalLeads: "Total leads",
    hotLeads: "Hot leads",
    warmLeads: "Warm leads",
    coldLeads: "Cold leads",
    bookedLeads: "Booked leads",
    leadQueue: "Lead queue",
    loadingLeads: "Loading leads",
    noLeads: "No leads captured yet.",
    loadFailed: "Unable to load leads.",
    updateFailed: "Unable to update status.",
    created: "Created",
    aiService: "AI service",
    temp: "Temp",
    urgency: "Urgency",
    status: "Status",
    assignedTeam: "Assigned team",
    intentSummary: "Intent summary",
    recommendedAction: "Recommended action",
    suggestedReply: "Suggested reply",
    notSpecified: "Not specified",
    manualReview: "Manual review needed.",
    contactLead: "Contact the lead.",
    sourceFacebook: "Facebook Ads",
    sourceTiktok: "TikTok",
    sourceWebsite: "Website",
    sourceReferral: "Referral",
    sourceOther: "Other",
    statusNew: "New",
    statusContacted: "Contacted",
    statusBooked: "Booked",
    statusLost: "Lost",
  },
  vi: {
    brandName: "PulseLead AI",
    brandTagline: "Tự động hóa lead phòng khám",
    languageLabel: "Ngôn ngữ",
    english: "EN",
    vietnamese: "VI",
    heroTitle: "Ghi nhận khách hàng và phân loại nhu cầu tức thì.",
    heroBody:
      "Gửi lead mới, để AI đánh giá mức độ ưu tiên, thông báo cho đội ngũ và theo dõi toàn bộ quy trình chăm sóc.",
    openDashboard: "Mở dashboard",
    valueAi: "AI phân loại",
    valueTelegram: "Báo Telegram",
    valueStatus: "Theo dõi trạng thái",
    newLead: "Lead mới",
    formHelp: "Các trường bắt buộc được kiểm tra trước khi gửi đến API.",
    name: "Họ tên",
    phone: "Số điện thoại",
    email: "Email",
    source: "Nguồn",
    serviceInterest: "Dịch vụ quan tâm",
    message: "Nội dung",
    namePlaceholder: "Mai Nguyen",
    phonePlaceholder: "+84 901 234 567",
    emailPlaceholder: "patient@example.com",
    servicePlaceholder: "Tư vấn cấy ghép implant",
    messagePlaceholder:
      "Tôi muốn đặt lịch trong tuần này và cần biết thêm về chi phí.",
    submitLead: "Gửi lead",
    submitting: "Đang gửi",
    successLead: "Lead đã được ghi nhận và chuyển để chăm sóc.",
    requiredName: "Vui lòng nhập họ tên.",
    requiredPhone: "Vui lòng nhập số điện thoại.",
    requiredSource: "Vui lòng chọn nguồn.",
    requiredMessage: "Vui lòng nhập nội dung.",
    invalidValue: "Giá trị không hợp lệ.",
    submitFailed: "Gửi lead thất bại.",
    genericError: "Đã có lỗi xảy ra.",
    backToForm: "Form lead mới",
    dashboardTitle: "Dashboard lead",
    dashboardBody:
      "100 lead phòng khám mới nhất, phân loại bởi AI và trạng thái xử lý của đội ngũ.",
    refresh: "Làm mới",
    refreshing: "Đang cập nhật lead",
    updated: "Đã cập nhật",
    openGoogleSheet: "Google Sheet",
    totalLeads: "Tổng khách quan tâm",
    hotLeads: "Cần ưu tiên",
    warmLeads: "Đang cân nhắc",
    coldLeads: "Mới tham khảo",
    bookedLeads: "Đã hẹn lịch",
    leadQueue: "Danh sách lead",
    loadingLeads: "Đang tải lead",
    noLeads: "Chưa có lead nào.",
    loadFailed: "Không thể tải lead.",
    updateFailed: "Không thể cập nhật trạng thái.",
    created: "Thời gian",
    aiService: "Dịch vụ AI",
    temp: "Mức độ",
    urgency: "Ưu tiên",
    status: "Trạng thái",
    assignedTeam: "Assigned team",
    intentSummary: "Tóm tắt nhu cầu",
    recommendedAction: "Hành động đề xuất",
    suggestedReply: "Trả lời đề xuất",
    notSpecified: "Chưa xác định",
    manualReview: "Cần kiểm tra thủ công.",
    contactLead: "Liên hệ lead.",
    sourceFacebook: "Facebook Ads",
    sourceTiktok: "TikTok",
    sourceWebsite: "Website",
    sourceReferral: "Giới thiệu",
    sourceOther: "Khác",
    statusNew: "Mới",
    statusContacted: "Đã liên hệ",
    statusBooked: "Đã đặt lịch",
    statusLost: "Thất bại",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";

    const storedLocale = window.localStorage.getItem(localeKey);
    return storedLocale === "en" || storedLocale === "vi" ? storedLocale : "en";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(localeKey, nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[locale][key];
  }, [locale]);

  return { locale, setLocale, t };
}

export function translateStatus(status: string, t: (key: TranslationKey) => string) {
  const statusKey = `status${status}` as TranslationKey;
  return statusKey in translations.en ? t(statusKey) : status;
}
