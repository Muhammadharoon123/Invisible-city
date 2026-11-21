"use client";

import { Activity, Medal, TrendingUp, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import CityMap from "@/components/CityMap";
import { Card, CategoryIcon, PageHeader, SectionTitle, healthColor } from "@/components/ui";
import { api } from "@/lib/client";
import type { Contributor, NeighborhoodStat, PredictiveInsight } from "@/lib/insights";
import { CATEGORY_META, Category } from "@/lib/types";

interface Stats {
  neighborhoods: NeighborhoodStat[];
  predictive: PredictiveInsight[];
  leaderboard: Contributor[];
  overview: { byCategory: { category: Category; open: number; resolved: number }[] };
}

export default function InsightsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>("/api/stats").then(setS).catch(() => {});
  }, []);
  if (!s) return <div className="text-muted">Loading…</div>;
  const hoods = s.neighborhoods.filter((n) => n.total > 0);
  const neglected = hoods.filter((n) => n.neglected);
  const maxCat = Math.max(1, ...s.overview.byCategory.map((c) => c.open + c.resolved));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="City intelligence"
        title="Where Islamabad is breaking, and who's being left behind"
        sub="Individual complaints add up to a city-wide picture: infrastructure health by sector, areas that keep getting ignored, and the problems likely to come back."
      />

      <section>
        <SectionTitle
          title="City Health Score by sector"
          sub="Open problems, weighted by severity and how long they've been ignored, combined with the share of complaints that actually get fixed."
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden">
            <CityMap neighborhoods={s.neighborhoods} layer="health" className="h-[520px]" />
          </Card>
          <Card className="overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  <tr className="border-b border-line">
                    <th className="px-5 py-3">Sector</th>
                    <th className="py-3">Health</th>
                    <th className="py-3">Fixed</th>
                    <th className="py-3 pr-5 text-right">Avg. fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {hoods.map((n) => (
                    <tr key={n.name} className={n.neglected ? "bg-red-50/60" : ""}>
                      <td className="px-5 py-3">
                        <div className="font-bold">{n.name}</div>
                        {n.neglected && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-red-700">
                            <TriangleAlert size={11} /> Neglected
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full" style={{ width: `${n.healthScore}%`, background: healthColor(n.healthScore) }} />
                          </div>
                          <span className="w-6 font-bold tabular-nums">{n.healthScore}</span>
                        </div>
                      </td>
                      <td className="py-3 tabular-nums text-ink-2">
                        {n.resolved}/{n.total} <span className="text-muted">· {Math.round(n.resolutionRate * 100)}%</span>
                      </td>
                      <td className="py-3 pr-5 text-right tabular-nums text-ink-2">{n.avgResolutionDays !== null ? `${n.avgResolutionDays} d` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <InsightCard icon={TriangleAlert} tint="bg-red-50 text-red-700" title="Neglected Neighbourhood Detector" sub="Finds sectors whose complaints rarely get fixed, compared with the city average. It doesn't just rank by how many complaints there are.">
          {neglected.length === 0 ? (
            <p className="text-sm text-muted">No sector is currently flagged.</p>
          ) : (
            neglected.map((n) => (
              <div key={n.name} className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">{n.name}</span>
                  <span className="text-lg font-extrabold text-red-700 tabular-nums">{Math.round(n.resolutionRate * 100)}%</span>
                </div>
                <div className="text-xs text-ink-2">{n.neglectReason}</div>
              </div>
            ))
          )}
        </InsightCard>

        <InsightCard icon={TrendingUp} tint="bg-violet-50 text-violet-700" title="Predictive maintenance" sub="Clusters of the same problem that point to a root cause, not a one-off fault.">
          {s.predictive.length === 0 && <p className="text-sm text-muted">Not enough history yet.</p>}
          {s.predictive.map((p) => (
            <div key={p.neighborhood + p.category} className="flex gap-3 rounded-xl border border-line p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <CategoryIcon category={p.category} size={16} />
              </div>
              <div className="text-sm leading-snug text-ink-2">{p.message}</div>
            </div>
          ))}
        </InsightCard>

        <InsightCard icon={Medal} tint="bg-accent-50 text-amber-700" title="Citizen Impact leaderboard" sub="10 pts per report · +15 for first to report · +5 if others back it up · +20 when it gets fixed">
          <ol className="divide-y divide-line">
            {s.leaderboard.map((c, i) => (
              <li key={c.reporter_id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-accent text-ink" : i < 3 ? "bg-ink text-white" : "bg-sunken text-ink-2"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold">{c.name}</span>
                <span className="text-xs text-muted">{c.reports} reports</span>
                <span className="w-10 text-right font-extrabold tabular-nums">{c.score}</span>
              </li>
            ))}
          </ol>
        </InsightCard>
      </section>

      <section>
        <SectionTitle title="Problems by category" sub="Open compared with fixed, across the whole city." />
        <Card className="space-y-4 p-6">
          {s.overview.byCategory
            .filter((c) => c.open + c.resolved > 0)
            .sort((a, b) => b.open + b.resolved - (a.open + a.resolved))
            .map((c) => (
              <div key={c.category} className="grid grid-cols-[minmax(140px,200px)_1fr_auto] items-center gap-4 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <CategoryIcon category={c.category} size={16} className="text-muted" />
                  {CATEGORY_META[c.category].label}
                </span>
                <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-sunken">
                  <div className="rounded-full bg-orange-500" style={{ width: `${(c.open / maxCat) * 100}%` }} title={`${c.open} open`} />
                  <div className="rounded-full bg-brand" style={{ width: `${(c.resolved / maxCat) * 100}%` }} title={`${c.resolved} resolved`} />
                </div>
                <span className="w-28 text-right text-xs tabular-nums text-muted">
                  <b className="text-orange-600">{c.open}</b> open · <b className="text-brand">{c.resolved}</b> fixed
                </span>
              </div>
            ))}
          <div className="flex gap-5 border-t border-line pt-4 text-xs font-medium text-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              Fixed
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-muted">
              <Activity size={13} /> Live from citizen reports
            </span>
          </div>
        </Card>
      </section>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  tint,
  title,
  sub,
  children,
}: {
  icon: React.ComponentType<{ size?: number }>;
  tint: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={20} />
      </div>
      <h3 className="mt-4 font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>
      <div className="mt-4 space-y-2">{children}</div>
    </Card>
  );
}
