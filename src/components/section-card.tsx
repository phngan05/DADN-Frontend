import React from "react";
import { ReactNode } from "react";
export default function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[26px] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.28)] ${className}`}
    >
      {children}
    </section>
  );
}