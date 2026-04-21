export type HistoryRange = "24h" | "7d";
export type DashboardMode = "automatic" | "manual";

export interface HistoryPoint {
  label: string;
  value: number | null;
  time?: string;
  timestamp: number;
}