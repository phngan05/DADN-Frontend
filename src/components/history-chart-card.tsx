import React from "react";
import MiniLineChart from "./mini-line-chart";
import { ReactNode } from "react";
import { HistoryPoint, HistoryRange } from "../types/dashboard";
import SectionCard from "./section-card";
export default function HistoryChartCard({
  title,
  subtitle,
  icon,
  color,
  data,
  range,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
  data: HistoryPoint[];
  range: HistoryRange;
}) {
  return (
    <SectionCard className="border border-slate-100 shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-300">{subtitle}</p>
        </div>
        <div className="text-slate-300">{icon}</div>
      </div>
      <MiniLineChart data={data} color={color} range={range} />
    </SectionCard>
  );
}