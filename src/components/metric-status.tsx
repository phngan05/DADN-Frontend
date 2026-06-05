import { FeedCategory } from "../types/feed";

export default function metricStatus(category: FeedCategory, value: number | null) {
  if (value === null) {
    return { text: "--", className: "bg-slate-100 text-slate-400" };
  }

  if (category === "Temperature") {
    if (value < 24) return { text: "COOL", className: "bg-cyan-50 text-cyan-600" };
    if (value <= 30) return { text: "OPTIMAL", className: "bg-emerald-50 text-emerald-600" };
    return { text: "HOT", className: "bg-rose-50 text-rose-600" };
  }

  if (category === "Humidity") {
    if (value < 45) return { text: "LOW", className: "bg-amber-50 text-amber-600" };
    if (value <= 70) return { text: "MODERATE", className: "bg-blue-50 text-blue-600" };
    return { text: "HIGH", className: "bg-indigo-50 text-indigo-600" };
  }

  if (category === "Illuminance") {
    if (value < 200) return { text: "DIM", className: "bg-slate-100 text-slate-500" };
    if (value <= 500) return { text: "BRIGHT", className: "bg-orange-50 text-orange-600" };
    return { text: "VERY BRIGHT", className: "bg-orange-100 text-orange-700" };
  }

  return { text: "ACTIVE", className: "bg-blue-50 text-blue-600" };
}