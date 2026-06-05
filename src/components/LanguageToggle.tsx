"use client";

import type { Locale, TranslationKey } from "@/lib/i18n";

type LanguageToggleProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

export function LanguageToggle({ locale, setLocale, t }: LanguageToggleProps) {
  return (
    <div
      aria-label={t("languageLabel")}
      className="inline-flex rounded-md border border-blue-200 bg-white p-1 shadow-sm"
      role="group"
    >
      {(["en", "vi"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={`h-8 rounded px-3 text-xs font-semibold transition ${
            locale === option
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          {option === "en" ? t("english") : t("vietnamese")}
        </button>
      ))}
    </div>
  );
}
