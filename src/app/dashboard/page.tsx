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
  recommendedAction: string | null;
  createdAt: string;
};

type Metrics = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  booked: number;
};

const statuses = ["New", "Contacted", "Booked", "Lost"];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    booked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadLeads(showLoading = true) {
    if (showLoading) {
      setIsLoading(true);
      setError("");
    }

    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load leads.");
      }

      setLeads(payload.leads);
      setMetrics(payload.metrics);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load leads.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    fetch("/api/leads", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load leads.");
        }

        if (isMounted) {
          setLeads(payload.leads);
          setMetrics(payload.metrics);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load leads.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total leads", value: metrics.total, icon: Users },
      { label: "Hot leads", value: metrics.hot, icon: Flame },
      { label: "Warm leads", value: metrics.warm, icon: ThermometerSun },
      { label: "Cold leads", value: metrics.cold, icon: Snowflake },
      { label: "Booked leads", value: metrics.booked, icon: CalendarCheck },
    ],
    [metrics],
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
        throw new Error(payload.error || "Unable to update status.");
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? payload.lead : lead)),
      );
      await loadLeads();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              New lead form
            </Link>
            <h1 className="font-display text-4xl font-normal tracking-normal">
              Lead dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Latest 100 clinic inquiries, AI classification, and team status.
            </p>
          </div>
          <button
            onClick={() => loadLeads()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            Refresh
          </button>
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
            <h2 className="font-display text-2xl font-normal">Lead queue</h2>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading leads
            </div>
          ) : leads.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
              No leads captured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead className="bg-blue-50 font-label text-xs uppercase text-slate-600">
                  <tr>
                    {[
                      "Created",
                      "Name",
                      "Phone",
                      "Source",
                      "AI service",
                      "Temp",
                      "Urgency",
                      "Status",
                      "Intent summary",
                      "Recommended action",
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(lead.createdAt))}
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
                      <td className="px-4 py-4 text-slate-700">
                        {lead.aiServiceInterest || "Not specified"}
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
                          {statuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="max-w-72 px-4 py-4 leading-6 text-slate-600">
                        {lead.intentSummary || "Manual review needed."}
                      </td>
                      <td className="max-w-72 px-4 py-4 leading-6 text-slate-600">
                        {lead.recommendedAction || "Contact the lead."}
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
      className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {value}
    </span>
  );
}
