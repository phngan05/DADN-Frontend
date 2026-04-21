import React from "react";
import { ReactNode } from "react";
import SectionCard from "./section-card";

function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-8 w-16 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? "left-9" : "left-1"}`}
      />
    </button>
  );
}

export default function DeviceCard({
  title,
  value,
  checked,
  icon,
  label,
  onToggle,
  onSliderChange,
  onSliderCommit,
}: {
  title: string;
  value: number;
  checked: boolean;
  icon: ReactNode;
  label: string;
  onToggle: () => void;
  onSliderChange: (value: number) => void;
  onSliderCommit: (value: number) => void;
}) {
  return (
    <SectionCard className="min-h-[170px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.8)]">
            {icon}
          </div>
          <h3 className="text-[28px] font-bold leading-none text-slate-900 md:text-[22px]">{title}</h3>
        </div>
        <ToggleSwitch checked={checked} onClick={onToggle} />
      </div>

      <div className="mt-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">
        <span>{label}</span>
        <span className="text-slate-400">{Math.round(value)}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onSliderChange(Number(event.target.value))}
        onMouseUp={(event) => onSliderCommit(Number((event.currentTarget as HTMLInputElement).value))}
        onTouchEnd={(event) => onSliderCommit(Number((event.currentTarget as HTMLInputElement).value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
      />
    </SectionCard>
  );
}