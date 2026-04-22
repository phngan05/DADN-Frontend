import React from "react";
import { ReactNode } from "react";
import SectionCard from "./section-card";

export default function MetricCard({
  title,
  value,
  unit,
  icon,
  status,
}: {
  title: string;
  value: number | null;
  unit: string;
  icon: ReactNode;
  status: { text: string; className: string };
}) {

function formatMetricValue(value: number | null) {
  if (value === null) return "--";
  return `${value}`;
}
  return (
    <SectionCard className="min-h-[150px]">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          {icon}
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.18em] ${status.className}`}>
          {status.text}
        </span>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">{title}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-[52px] font-black leading-none tracking-tight text-slate-900">
          {formatMetricValue(value)}
        </span>
        <span className="mb-2 text-2xl font-bold text-slate-300">{unit}</span>
      </div>
    </SectionCard>
  );
}