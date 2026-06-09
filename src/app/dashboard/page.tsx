"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Flame,
  Loader2,
  Snowflake,
  ThermometerSun,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  statusOptions,
  translateStatus,
  useI18n,
} from "@/lib/i18n";

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  aiServiceInterest: string | null;
  leadTemperature: "Hot" | "Warm" | "Cold" | string;
  urgency: "High" | "Medium" | "Low" | string;
  status: "New" | "Contacted" | "Booked" | "Lost" | string;
  intentSummary: string | null;
  intentSummaryVi: string | null;
  recommendedAction: string | null;
  recommendedActionVi: string | null;
  suggestedReply: string | null;
  assignedTeam: string | null;
  createdAt: string;
};

type Metrics = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  booked: number;
};

type LeadsPayload = {
  leads: Lead[];
  metrics: Metrics;
};

// Short TTL keeps the dashboard snappy without hiding new intake activity for long.
const leadsCacheTtlMs = 60_000;
let leadsCache:
  | {
      payload: LeadsPayload;
      savedAt: number;
    }
  | undefined;

function getFreshLeadsCache() {
  if (!leadsCache) return undefined;
  if (Date.now() - leadsCache.savedAt > leadsCacheTtlMs) return undefined;

  return leadsCache.payload;
}

function setLeadsCache(payload: LeadsPayload) {
  leadsCache = {
    payload,
    savedAt: Date.now(),
  };
}

async function fetchLeads(errorMessage: string): Promise<LeadsPayload> {
  const response = await fetch("/api/leads", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || errorMessage);
  }

  return {
    leads: payload.leads,
    metrics: payload.metrics,
  };
}

export default function Dashboard() {
  const { locale, setLocale, t } = useI18n();
  const initialCachedPayload = getFreshLeadsCache();
  const [leads, setLeads] = useState<Lead[]>(
    () => initialCachedPayload?.leads ?? [],
  );
  const [metrics, setMetrics] = useState<Metrics>(
    () =>
      initialCachedPayload?.metrics ?? {
        total: 0,
        hot: 0,
        warm: 0,
        cold: 0,
        booked: 0,
      },
  );
  const [isLoading, setIsLoading] = useState(() => !initialCachedPayload);
  const [isRefreshing, setIsRefreshing] = useState(
    () => Boolean(initialCachedPayload),
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(() =>
    initialCachedPayload ? new Date() : null,
  );
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  function applyLeadsPayload(payload: LeadsPayload) {
    setLeads(payload.leads);
    setMetrics(payload.metrics);
    setLastUpdatedAt(new Date());
  }

  async function loadLeads(showLoading = true, options = { silentError: false }) {
    if (showLoading && !leadsCache) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError("");

    try {
      const payload = await fetchLeads(t("loadFailed"));
      setLeadsCache(payload);
      applyLeadsPayload(payload);
    } catch (loadError) {
      if (!options.silentError) {
        setError(
          loadError instanceof Error ? loadError.message : t("loadFailed"),
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const cachedPayload = getFreshLeadsCache();

    fetchLeads(t("loadFailed"))
      .then((payload) => {
        setLeadsCache(payload);

        if (isMounted) {
          applyLeadsPayload(payload);
          setError("");
        }
      })
      .catch((loadError) => {
        if (isMounted && !cachedPayload) {
          setError(
            loadError instanceof Error ? loadError.message : t("loadFailed"),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const cards = useMemo(
    () => [
      { label: t("totalLeads"), value: metrics.total, icon: Users },
      { label: t("hotLeads"), value: metrics.hot, icon: Flame },
      { label: t("warmLeads"), value: metrics.warm, icon: ThermometerSun },
      { label: t("coldLeads"), value: metrics.cold, icon: Snowflake },
      { label: t("bookedLeads"), value: metrics.booked, icon: CalendarCheck },
    ],
    [metrics, t],
  );

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || t("updateFailed"));
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? payload.lead : lead)),
      );
      await loadLeads(false);
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : t("updateFailed"),
      );
    } finally {
      setUpdatingId("");
    }
  }

  function formatCreatedAt(value: string) {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatUpdatedAt(value: Date) {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(value);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark name={t("brandName")} tagline={t("brandTagline")} />
          <LanguageToggle locale={locale} setLocale={setLocale} t={t} />
        </div>

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToForm")}
            </Link>
            <h1 className="font-display text-4xl font-normal tracking-normal">
              {t("dashboardTitle")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("dashboardBody")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              onClick={() => loadLeads()}
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              {t("refresh")}
            </button>
            <p className="min-h-5 text-xs font-medium text-slate-500">
              {isRefreshing ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("refreshing")}
                </span>
              ) : lastUpdatedAt ? (
                `${t("updated")} ${formatUpdatedAt(lastUpdatedAt)}`
              ) : null}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-label text-xs font-semibold uppercase text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 font-display text-3xl font-normal">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-display text-2xl font-normal">{t("leadQueue")}</h2>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loadingLeads")}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
              {t("noLeads")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1540px] w-full border-collapse text-left text-sm">
                <thead className="bg-blue-50 font-label text-xs uppercase text-slate-600">
                  <tr>
                    <th className="w-36 px-4 py-3 font-semibold">
                      {t("created")}
                    </th>
                    <th className="w-44 px-4 py-3 font-semibold">
                      {t("name")}
                    </th>
                    <th className="w-36 px-4 py-3 font-semibold">
                      {t("phone")}
                    </th>
                    <th className="w-36 px-4 py-3 font-semibold">
                      {t("source")}
                    </th>
                    <th className="w-28 px-4 py-3 font-semibold">
                      {t("temp")}
                    </th>
                    <th className="w-28 px-4 py-3 font-semibold">
                      {t("urgency")}
                    </th>
                    <th className="w-40 px-4 py-3 font-semibold">
                      {t("status")}
                    </th>
                    <th className="w-44 px-4 py-3 font-semibold">
                      {t("assignedTeam")}
                    </th>
                    <th className="w-72 px-4 py-3 font-semibold">
                      {t("intentSummary")}
                    </th>
                    <th className="w-72 px-4 py-3 font-semibold">
                      {t("recommendedAction")}
                    </th>
                    <th className="w-80 px-4 py-3 font-semibold">
                      {t("suggestedReply")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatCreatedAt(lead.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {lead.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {lead.phone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {lead.source}
                      </td>
                      <td className="px-4 py-4">
                        <Badge value={lead.leadTemperature} />
                      </td>
                      <td className="px-4 py-4">
                        <Badge value={lead.urgency} />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(event) =>
                            updateStatus(lead.id, event.target.value)
                          }
                          className="h-9 rounded-md border border-blue-200 bg-white px-2 text-sm font-medium text-slate-800 disabled:opacity-60"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {translateStatus(
                                status,
                                t,
                              )}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {lead.assignedTeam || t("notSpecified")}
                      </td>
                      <td className="max-w-72 px-4 py-4 leading-6 text-slate-600">
                        {locale === "vi"
                          ? lead.intentSummaryVi || lead.intentSummary || t("manualReview")
                          : lead.intentSummary || t("manualReview")}
                      </td>
                      <td className="max-w-72 px-4 py-4 leading-6 text-slate-600">
                        {locale === "vi"
                          ? lead.recommendedActionVi ||
                          lead.recommendedAction ||
                          t("contactLead")
                          : lead.recommendedAction || t("contactLead")}
                      </td>
                      <td className="max-w-80 px-4 py-4 leading-6 text-slate-600">
                        {lead.suggestedReply || t("notSpecified")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Badge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Hot: "bg-red-50 text-red-700 border-red-200",
    Warm: "bg-amber-50 text-amber-700 border-amber-200",
    Cold: "bg-sky-50 text-sky-700 border-sky-200",
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[value] || "border-slate-200 bg-slate-50 text-slate-700"
        }`}
    >
      {value}
    </span>
  );
}
