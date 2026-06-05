"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { sourceOptions, useI18n } from "@/lib/i18n";

type FormState = {
  name: string;
  phone: string;
  email: string;
  source: string;
  serviceInterest: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  source: "Website",
  serviceInterest: "",
  message: "",
};

export default function Home() {
  const { locale, setLocale, t } = useI18n();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => form.name.trim() && form.phone.trim() && form.source && form.message.trim(),
    [form],
  );

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback("");
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) nextErrors.name = t("requiredName");
    if (!form.phone.trim()) nextErrors.phone = t("requiredPhone");
    if (!form.source.trim()) nextErrors.source = t("requiredSource");
    if (!form.message.trim()) nextErrors.message = t("requiredMessage");

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload.issues) {
          setErrors(
            Object.fromEntries(
              Object.entries(payload.issues).map(([key, value]) => [
                key,
                Array.isArray(value) ? value[0] : t("invalidValue"),
              ]),
            ) as Partial<Record<keyof FormState, string>>,
          );
        }
        throw new Error(payload.error || t("submitFailed"));
      }

      setForm(initialForm);
      setFeedback(t("successLead"));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-[#111827]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-8 md:grid-cols-[0.85fr_1.15fr] md:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-10 rounded-none py-4 md:py-10">
          <div>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <BrandMark name={t("brandName")} tagline={t("brandTagline")} />
              <LanguageToggle locale={locale} setLocale={setLocale} t={t} />
            </div>
            <h1 className="max-w-xl font-display text-4xl font-normal tracking-normal text-[#111827] sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              {t("heroBody")}
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {t("openDashboard")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[t("valueAi"), t("valueTelegram"), t("valueStatus")].map((item) => (
              <div
                key={item}
                className="border-l-4 border-violet-500 bg-white px-4 py-3 font-label text-xs font-semibold uppercase text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={submitLead}
          className="self-center rounded-lg border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/70 sm:p-7"
        >
          <div className="mb-6">
            <h2 className="font-display text-2xl font-normal text-[#111827]">
              {t("newLead")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("formHelp")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name")} error={errors.name} required>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="input"
                placeholder={t("namePlaceholder")}
              />
            </Field>
            <Field label={t("phone")} error={errors.phone} required>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="input"
                placeholder={t("phonePlaceholder")}
              />
            </Field>
            <Field label={t("email")} error={errors.email}>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="input"
                placeholder={t("emailPlaceholder")}
                type="email"
              />
            </Field>
            <Field label={t("source")} error={errors.source} required>
              <select
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
                className="input"
              >
                {sourceOptions.map((source) => (
                  <option key={source.value} value={source.value}>
                    {t(source.labelKey)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("serviceInterest")} error={errors.serviceInterest}>
            <input
              value={form.serviceInterest}
              onChange={(event) =>
                updateField("serviceInterest", event.target.value)
              }
              className="input"
              placeholder={t("servicePlaceholder")}
            />
          </Field>

          <Field label={t("message")} error={errors.message} required>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              className="input min-h-36 resize-y"
              placeholder={t("messagePlaceholder")}
            />
          </Field>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? t("submitting") : t("submitLead")}
            </button>

            {feedback ? (
              <p
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                  feedback === t("successLead")
                    ? "text-green-700"
                    : "text-rose-700"
                }`}
              >
                {feedback === t("successLead") ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : null}
                {feedback}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block font-label text-xs font-semibold uppercase text-slate-700">
      <span>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
