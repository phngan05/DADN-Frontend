"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Thermometer,
  Fan,
  Lightbulb,
  SunMedium,
} from "lucide-react";

// Import hooks
import { useFeeds } from "@/src/hooks/useFeeds";
import { useDashboard } from "@/src/hooks/useDashboard";
import { useDashboardControl } from "@/src/hooks/useDashboardControl";
import { useHistoryData } from "@/src/hooks/useHistoryData";
// Import Types
import { FeedCategory } from "@/src/types/feed";
import { Feed } from "@/src/types/feed";

// Import components
import DeviceCard from "@/src/components/device-card";
import MetricCard from "@/src/components/metric-card";
import HistoryChartCard from "@/src/components/history-chart-card";
import metricStatus from "@/src/components/metric-status";
import SwitchMode from "@/src/components/switch-mode";


export default function DashboardPage() {
  const { lastEvent } = useDashboard();
  const { feedsData } = useFeeds();
  const { toNumber } = useHistoryData();
  
  const [latestValues, setLatestValues] = useState<Record<string, string | number>>({});
  
  const {
    mode,
    historyRange,
    setHistoryRange,
    historyMap,
    lightDraft,
    setLightDraft,
    fanDraft,
    setFanDraft,
    loadFeeds,
    loadSnapshot,
    loadHistory,
    handleLightToggle,
    handleLightCommit,
    handleFanToggle,
    handleFanCommit,
    handleModeChange,
    getDeviceValues,
  } = useDashboardControl(feedsData, latestValues, setLatestValues, lastEvent);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        const feedList = await loadFeeds();
        await Promise.all([loadSnapshot(), loadHistory(feedList, historyRange)]);
      } catch (error) {
        console.error("Dashboard init failed:", error);
      }
    };

    void init();
  }, [historyRange, loadFeeds, loadHistory, loadSnapshot]);

  // Feed by category
  const feedByCategory = useMemo(() => {
    const map = {} as Partial<Record<FeedCategory, Feed>>;
    for (const feed of feedsData ?? []) {
      map[feed.category] = feed;
    }
    return map;
  }, [feedsData]);

  // Get device values
  const values = getDeviceValues();
  const temperature = toNumber(feedByCategory.Temperature ? latestValues[feedByCategory.Temperature.feed_key] : null);
  const humidity = toNumber(feedByCategory.Humidity ? latestValues[feedByCategory.Humidity.feed_key] : null);
  const illuminance = toNumber(feedByCategory.Illuminance ? latestValues[feedByCategory.Illuminance.feed_key] : null);

  return (
    <div className="min-h-full bg-slate-50 px-6 py-6 lg:px-7">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">ComHome Dashboard</h2>
            <p className="text-slate-500 text-sm">Real-time environment monitoring and device management</p>
          </div>

          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.26)]">
            <SwitchMode currentMode={mode} onModeChange={handleModeChange}/>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <MetricCard
            title="Average Temperature"
            value={temperature}
            unit="°C"
            icon={<BarChart3 size={18} />}
            status={metricStatus("Temperature", temperature)}
          />
          <MetricCard
            title="Relative Humidity"
            value={humidity}
            unit="%"
            icon={<Thermometer size={18} />}
            status={metricStatus("Humidity", humidity)}
          />
          <MetricCard
            title="Light Intensity"
            value={illuminance}
            unit="lux"
            icon={<SunMedium size={18} />}
            status={metricStatus("Illuminance", illuminance)}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <DeviceCard
            title="Main Living Light"
            icon={<Lightbulb size={18} />}
            checked={values.lightOn}
            value={lightDraft}
            label="Brightness Intensity"
            onToggle={handleLightToggle}
            onSliderChange={setLightDraft}
            onSliderCommit={handleLightCommit}
          />

          <DeviceCard
            title="Circulation Fan"
            icon={<Fan size={18} />}
            checked={values.fanOn}
            value={fanDraft}
            label="Airflow Speed"
            onToggle={handleFanToggle}
            onSliderChange={setFanDraft}
            onSliderCommit={handleFanCommit}
          />
        </div>

        <div className="mt-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="text-blue-600" size={20} />
            <h2 className="text-[34px] font-black tracking-tight text-slate-900">Analytical History</h2>
          </div>

          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.26)]">
            <button
              type="button"
              onClick={() => setHistoryRange("24h")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                historyRange === "24h" ? "bg-slate-100 text-slate-900" : "text-slate-400"
              }`}
            >
              Last 24 Hours
            </button>
            <button
              type="button"
              onClick={() => setHistoryRange("7d")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                historyRange === "7d" ? "bg-slate-100 text-slate-900" : "text-slate-400"
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-3">
          <HistoryChartCard
            title="Temperature History"
            subtitle={historyRange === "24h" ? "Hourly temperature across the last 24 hours" : "Daily temperature across the last 7 days"}
            icon={<ArrowUpRight size={16} className="text-blue-500" />}
            color="#2563eb"
            data={historyMap.Temperature}
            range={historyRange}
          />
          <HistoryChartCard
            title="Humidity History"
            subtitle={historyRange === "24h" ? "Hourly humidity across the last 24 hours" : "Daily humidity across the last 7 days"}
            icon={<ArrowUpRight size={16} className="text-cyan-500" />}
            color="#06b6d4"
            data={historyMap.Humidity}
            range={historyRange}
          />
          <HistoryChartCard
            title="Light Intensity History"
            subtitle={historyRange === "24h" ? "Hourly lux level across the last 24 hours" : "Daily lux level across the last 7 days"}
            icon={<SunMedium size={16} className="text-orange-500" />}
            color="#f59e0b"
            data={historyMap.Illuminance}
            range={historyRange}
          />
        </div>
      </div>
    </div>
  );
}
