"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/src/services/api";
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
import { useDeviceControl } from "@/src/hooks/useDeviceControl";
import { useDashboard } from "@/src/hooks/useDashboard";
// Import Types
import { HistoryRange } from "@/src/types/dashboard";
import { FeedCategory } from "@/src/types/feed";
import { DashboardMode } from "@/src/types/dashboard";
import { Feed } from "@/src/types/feed";
import { HistoryPoint } from "@/src/types/dashboard";

// Import components
import DeviceCard from "@/src/components/device-card";
import MetricCard from "@/src/components/metric-card";
import HistoryChartCard from "@/src/components/history-chart-card";
import metricStatus from "@/src/components/metric-status";
import SwitchMode from "@/src/components/switch-mode";


const MODE_STORAGE_KEY = "comhome-dashboard-mode";

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatHistoryLabel(date: Date, range: HistoryRange = "24h") {
  if (range === "24h") {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function normalizeHistory(payload: unknown, range: HistoryRange): HistoryPoint[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { history?: unknown[] }).history)
      ? (payload as { history: unknown[] }).history
      : [];

  const parsed = list
    .map((item) => {
      const row = item as {
        value?: unknown;
        time?: string;
        created_at?: string;
      };

      const value = toNumber(row.value);
      const rawTime = row.time ?? row.created_at;
      if (value === null || !rawTime) return null;

      const date = new Date(rawTime);
      if (Number.isNaN(date.getTime())) return null;

      return {
        value,
        time: rawTime,
        timestamp: date.getTime(),
      };
    })
    .filter(
      (
        item,
      ): item is {
        value: number;
        time: string;
        timestamp: number;
      } => Boolean(item),
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const now = new Date();

if (range === "24h") {
  const end = new Date(now);
  end.setMinutes(0, 0, 0);

  const start = new Date(end);
  start.setHours(start.getHours() - 23);

  return Array.from({ length: 24 }, (_, index) => {
    const slotStart = new Date(start);
    slotStart.setHours(start.getHours() + index);

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 1);

    const itemsInSlot = parsed.filter(
      (item) =>
        item.timestamp >= slotStart.getTime() &&
        item.timestamp < slotEnd.getTime()
    );

    const averageValue = itemsInSlot.length
      ? itemsInSlot.reduce((sum, item) => sum + item.value, 0) / itemsInSlot.length
      : null;

    return {
      label: formatHistoryLabel(slotStart, "24h"),
      value: averageValue,
      time: undefined,
      timestamp: slotStart.getTime(),
    };
  });
}

const end = new Date(now);
end.setHours(0, 0, 0, 0);

const start = new Date(end);
start.setDate(start.getDate() - 6);

return Array.from({ length: 7 }, (_, index) => {
  const slotStart = new Date(start);
  slotStart.setDate(start.getDate() + index);

  const slotEnd = new Date(slotStart);
  slotEnd.setDate(slotStart.getDate() + 1);

  const itemsInSlot = parsed.filter(
    (item) =>
      item.timestamp >= slotStart.getTime() &&
      item.timestamp < slotEnd.getTime()
  );

  const averageValue = itemsInSlot.length
    ? itemsInSlot.reduce((sum, item) => sum + item.value, 0) / itemsInSlot.length
    : null;

  return {
    label: formatHistoryLabel(slotStart, "7d"),
    value: averageValue,
    time: undefined,
    timestamp: slotStart.getTime(),
  };
});
}


export default function DashboardPage() {
  const { connected, lastEvent } = useDashboard();
  const [mode, setMode] = useState<DashboardMode>("automatic");
  const { feedsData, setFeedsData} = useFeeds();
  const [latestValues, setLatestValues] = useState<Record<string, string | number>>({});
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24h");
  const [historyMap, setHistoryMap] = useState<Record<FeedCategory, HistoryPoint[]>>({
    Temperature: normalizeHistory([], "24h"),
    Humidity: normalizeHistory([], "24h"),
    Illuminance: normalizeHistory([], "24h"),
    "LED Intensity": [],
    "Fan Speed": [],
    "LED Status": [],
  });
  const [lightDraft, setLightDraft] = useState(0);
  const [fanDraft, setFanDraft] = useState(0);
  const { updateStatus, loading } = useDeviceControl();

  
  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY) as DashboardMode | null;
    if (savedMode === "automatic" || savedMode === "manual") {
      setMode(savedMode);
    }
  }, []);
  
  useEffect(() => {
  if (lastEvent && lastEvent.feed) {
    setLatestValues((prev) => ({
      ...prev,
      [lastEvent.feed]: lastEvent.value,
    }));
  }
}, [lastEvent]);
  const feedByCategory = useMemo(() => {
    const map = {} as Partial<Record<FeedCategory, Feed>>;
    for (const feed of feedsData ?? []) {
      map[feed.category] = feed;
    }
    return map;
  }, [feedsData]);

  const temperature = toNumber(feedByCategory.Temperature ? latestValues[feedByCategory.Temperature.feed_key] : null);
  const humidity = toNumber(feedByCategory.Humidity ? latestValues[feedByCategory.Humidity.feed_key] : null);
  const illuminance = toNumber(feedByCategory.Illuminance ? latestValues[feedByCategory.Illuminance.feed_key] : null);
  
  const lightIntensity =
    toNumber(feedByCategory["LED Intensity"] ? latestValues[feedByCategory["LED Intensity"].feed_key] : null) ?? 0;
  const fanSpeed = toNumber(feedByCategory["Fan Speed"] ? latestValues[feedByCategory["Fan Speed"].feed_key] : null) ?? 0;
  const lightStatus =
    toNumber(feedByCategory["LED Status"] ? latestValues[feedByCategory["LED Status"].feed_key] : null) ??
    (lightIntensity > 0 ? 1 : 0);

  const lightOn = lightStatus > 0;
  const fanOn = fanSpeed > 0;

  useEffect(() => {
    setLightDraft(lightIntensity);
  }, [lightIntensity]);

  useEffect(() => {
    setFanDraft(fanSpeed);
  }, [fanSpeed]);


  useEffect(() => {
    setLightDraft(lightIntensity);
    setFanDraft(fanSpeed);
  }, [fanSpeed, lightIntensity, feedsData]);
  
  const loadFeeds = useCallback(async () => {
    const response = await apiClient.get("/feed");
    const list = Array.isArray(response.data) ? (response.data as Feed[]) : [];
    setFeedsData(list);
    return list;
  }, []);

  const loadSnapshot = useCallback(async () => {
    const response = await apiClient.get("/record/all");
    const data = response.data && typeof response.data === "object" ? response.data : {};
    setLatestValues((prev) => ({ ...prev, ...(data as Record<string, string | number>) }));
  }, []);

  const loadHistory = useCallback(async (feedList: Feed[], range: HistoryRange) => {
    const targets = feedList.filter((item) => ["Temperature", "Humidity", "Illuminance"].includes(item.category));
    const emptySeries = normalizeHistory([], range);

    const results = await Promise.all(
      targets.map(async (item) => {
        try {
          const response = await apiClient.get(`/record/history/${item.feed_key}`);
          return [item.category, normalizeHistory(response.data, range)] as const;
        } catch {
          return [item.category, emptySeries] as const;
        }
      }),
    );

    setHistoryMap((prev) => ({
      ...prev,
      Temperature: emptySeries,
      Humidity: emptySeries,
      Illuminance: emptySeries,
      ...Object.fromEntries(results),
    }));
  }, []);

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

  const sendCommand = useCallback(async (feedKey: string, value: number) => {
    await updateStatus(feedKey, value)
    setLatestValues((prev) => ({ ...prev, [feedKey]: value }));
  }, []);

  const requestManualMode = useCallback(() => {
    if (mode === "manual") return true;
    const accepted = window.confirm(
      "Hệ thống đang ở chế độ Automatic. Bạn có muốn chuyển sang Manual để tiếp tục điều khiển không?",
    );
    if (!accepted) return false;
    setMode("manual");
    window.localStorage.setItem(MODE_STORAGE_KEY, "manual");
    return true;
  }, [mode]);


  const handleLightToggle = useCallback(async () => {
    const intensityFeed = feedByCategory["LED Intensity"];
    const statusFeed = feedByCategory["LED Status"];
    if (!intensityFeed && !statusFeed) return;
    if (!requestManualMode()) return;

    try {
      const nextOn = !lightOn;
      if (statusFeed) await sendCommand(statusFeed.feed_key, nextOn ? 1 : 0);
      if (intensityFeed) await sendCommand(intensityFeed.feed_key, nextOn ? Math.max(25, lightIntensity || 75) : 0);
    } catch (error) {
      console.error("Light toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển đèn.");
    }
  }, [feedByCategory, lightIntensity, lightOn, requestManualMode, sendCommand]);

  const handleLightCommit = useCallback(
    async (value: number) => {
      const intensityFeed = feedByCategory["LED Intensity"];
      const statusFeed = feedByCategory["LED Status"];
      if (!intensityFeed && !statusFeed) return;
      if (!requestManualMode()) {
        setLightDraft(lightIntensity);
        return;
      }

      try {
        if (intensityFeed) await sendCommand(intensityFeed.feed_key, value);
        if (statusFeed) await sendCommand(statusFeed.feed_key, value > 0 ? 1 : 0);
      } catch (error) {
        console.error("Light slider failed:", error);
        setLightDraft(lightIntensity);
        window.alert("Không thể cập nhật độ sáng đèn.");
      }
    },
    [feedByCategory, lightIntensity, requestManualMode, sendCommand],
  );

  const handleFanToggle = useCallback(async () => {
    const fanFeed = feedByCategory["Fan Speed"];
    if (!fanFeed) return;
    if (!requestManualMode()) return;

    try {
      await sendCommand(fanFeed.feed_key, fanOn ? 0 : Math.max(30, fanSpeed || 60));
    } catch (error) {
      console.error("Fan toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển quạt.");
    }
  }, [fanOn, fanSpeed, feedByCategory, requestManualMode, sendCommand]);

  const handleFanCommit = useCallback(
    async (value: number) => {
      const fanFeed = feedByCategory["Fan Speed"];
      if (!fanFeed) return;
      if (!requestManualMode()) {
        setFanDraft(fanSpeed);
        return;
      }

      try {
        await sendCommand(fanFeed.feed_key, value);
      } catch (error) {
        console.error("Fan slider failed:", error);
        setFanDraft(fanSpeed);
        window.alert("Không thể cập nhật tốc độ quạt.");
      }
    },
    [fanSpeed, feedByCategory, requestManualMode, sendCommand],
  );

  const handleModeChange = async (newMode: "automatic" | "manual") => {
    setMode(newMode);
    if (newMode === "automatic") {
      try {
        const tempFeed = feedsData?.find((f) => f.category === "Temperature");
        const humFeed = feedsData?.find((f) => f.category === "Humidity");
        const fanSpeedFeed = feedsData?.find((f) => f.category === "Fan Speed");

        await apiClient.put("record/auto", {
          temperature_feed: tempFeed?.feed_key || "temperature",
          humidity_feed: humFeed?.feed_key || "humidity",
          fan_feed: fanSpeedFeed?.feed_key || "fan-speed",
        });
      } catch (error) {
        console.error("Auto mode error:", error);
      }
    }
  };
  return (
    <div className="min-h-full bg-slate-50 px-6 py-6 lg:px-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[40px] font-black tracking-tight text-slate-900">ComHome Dashboard</h1>
            <p className="mt-2 text-base text-slate-300">Real-time environment monitoring and device management</p>
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
            checked={lightOn}
            value={lightDraft}
            label="Brightness Intensity"
            onToggle={handleLightToggle}
            onSliderChange={setLightDraft}
            onSliderCommit={handleLightCommit}
          />

          <DeviceCard
            title="Circulation Fan"
            icon={<Fan size={18} />}
            checked={fanOn}
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
