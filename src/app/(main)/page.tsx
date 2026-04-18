"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import apiClient from "@/src/services/api";
import {
  ArrowUpRight,
  BarChart3,
  Thermometer,
  Fan,
  Lightbulb,
  SunMedium,
} from "lucide-react";

type DashboardMode = "automatic" | "manual";
type HistoryRange = "24h" | "7d";
type FeedCategory =
  | "Temperature"
  | "Humidity"
  | "Illuminance"
  | "LED Intensity"
  | "Fan Speed"
  | "LED Status";

interface FeedItem {
  feed_id: string;
  feed_key: string;
  category: FeedCategory;
}

interface HistoryPoint {
  label: string;
  value: number | null;
  time?: string;
  timestamp: number;
}

const MODE_STORAGE_KEY = "comhome-dashboard-mode";

function buildWsUrl(baseUrl: string, userId: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  const noApi = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
  return `${noApi.replace(/^http/, "ws")}/ws/${userId}`;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metricStatus(category: FeedCategory, value: number | null) {
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

function formatMetricValue(value: number | null) {
  if (value === null) return "--";
  return `${Math.round(value)}`;
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

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[26px] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.28)] ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({
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

function DeviceCard({
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

function MiniLineChart({ data, color, range }: { data: HistoryPoint[]; color: string; range: HistoryRange }) {
  const width = range === "24h" ? 560 : 320;
  const height = 150;
  const paddingLeft = 16;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 34;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const numericValues = data.map((item) => item.value).filter((value): value is number => value !== null);
  const min = numericValues.length ? Math.min(...numericValues) : 0;
  const max = numericValues.length ? Math.max(...numericValues) : 100;
  const extra = numericValues.length && max !== min ? (max - min) * 0.15 : 5;
  const yMin = min - extra;
  const yMax = max + extra;
  const valueRange = yMax - yMin || 1;

  const points = data.map((item, index) => {
    const x = paddingLeft + (index * innerWidth) / Math.max(1, data.length - 1);
    const y =
      item.value === null
        ? null
        : height - paddingBottom - ((item.value - yMin) / valueRange) * innerHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const segments: string[] = [];
  let currentSegment = "";

  for (const point of points) {
    if (point.y === null) {
      if (currentSegment) {
        segments.push(currentSegment.trim());
        currentSegment = "";
      }
      continue;
    }

    currentSegment += currentSegment ? ` L ${point.x} ${point.y}` : `M ${point.x} ${point.y}`;
  }

  if (currentSegment) {
    segments.push(currentSegment.trim());
  }

  const gridRows = 3;
  const yGuides = Array.from({ length: gridRows }, (_, index) => {
    const ratio = gridRows === 1 ? 0 : index / (gridRows - 1);
    return paddingTop + ratio * innerHeight;
  });

  const labelStep = range === "24h" ? 4 : 1;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`h-36 w-full ${range === "24h" ? "min-w-[560px]" : "min-w-[320px]"}`}
        preserveAspectRatio="none"
      >
        {yGuides.map((y, index) => (
          <line
            key={index}
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeDasharray="4 4"
          />
        ))}

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={height - paddingBottom}
          y2={height - paddingBottom}
          stroke="#CBD5E1"
        />

        {points.map((point, index) => (
          <line
            key={`tick-${index}`}
            x1={point.x}
            x2={point.x}
            y1={height - paddingBottom}
            y2={height - paddingBottom + 6}
            stroke="#CBD5E1"
          />
        ))}

        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {points.map((point, index) =>
          point.y !== null ? <circle key={index} cx={point.x} cy={point.y} r="3.5" fill={color} /> : null,
        )}

        {points.map((point, index) => {
          const shouldShow = index % labelStep === 0 || index === points.length - 1;
          if (!shouldShow) return null;

          return (
            <text
              key={`label-${index}`}
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94A3B8"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function HistoryChartCard({
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

export default function DashboardPage() {
  const [mode, setMode] = useState<DashboardMode>("automatic");
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
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

  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY) as DashboardMode | null;
    if (savedMode === "automatic" || savedMode === "manual") {
      setMode(savedMode);
    }
  }, []);

  const feedByCategory = useMemo(() => {
    const map = {} as Partial<Record<FeedCategory, FeedItem>>;
    for (const feed of feeds) {
      map[feed.category] = feed;
    }
    return map;
  }, [feeds]);

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

  const loadFeeds = useCallback(async () => {
    const response = await apiClient.get("/feed");
    const list = Array.isArray(response.data) ? (response.data as FeedItem[]) : [];
    setFeeds(list);
    return list;
  }, []);

  const loadSnapshot = useCallback(async () => {
    const response = await apiClient.get("/record/all");
    const data = response.data && typeof response.data === "object" ? response.data : {};
    setLatestValues((prev) => ({ ...prev, ...(data as Record<string, string | number>) }));
  }, []);

  const loadHistory = useCallback(async (feedList: FeedItem[], range: HistoryRange) => {
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

  const connectWebSocket = useCallback(() => {
    const userId = Cookies.get("userId");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!userId || !baseUrl) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket(buildWsUrl(baseUrl, userId));
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send("hello");
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send("ping");
        }
      }, 20000);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { feed?: string; value?: string | number };
        if (!payload.feed) return;
        setLatestValues((prev) => ({ ...prev, [payload.feed]: payload.value ?? "" }));
      } catch (error) {
        console.error("WebSocket message parse failed:", error);
      }
    };

    socket.onclose = () => {
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => connectWebSocket(), 3500);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [connectWebSocket]);

  const sendCommand = useCallback(async (feedKey: string, value: number) => {
    await apiClient.put("/record", {
      feed_key: feedKey,
      value,
    });
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

  const handleModeChange = useCallback(
    (nextMode: DashboardMode) => {
      if (nextMode === mode) return;
      const accepted = window.confirm(
        nextMode === "automatic"
          ? "Bạn có đồng ý chuyển sang chế độ Automatic không?"
          : "Bạn có đồng ý chuyển sang chế độ Manual không?",
      );
      if (!accepted) return;
      setMode(nextMode);
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    },
    [mode],
  );

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

  return (
    <div className="min-h-full bg-slate-50 px-6 py-6 lg:px-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[40px] font-black tracking-tight text-slate-900">ComHome Dashboard</h1>
            <p className="mt-2 text-base text-slate-300">Real-time environment monitoring and device management</p>
          </div>

          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.26)]">
            <button
              type="button"
              onClick={() => handleModeChange("automatic")}
              className={`rounded-xl px-8 py-3 text-sm font-bold transition ${
                mode === "automatic" ? "bg-blue-600 text-white" : "text-slate-500"
              }`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("manual")}
              className={`rounded-xl px-8 py-3 text-sm font-bold transition ${
                mode === "manual" ? "bg-blue-600 text-white" : "text-slate-500"
              }`}
            >
              Manual
            </button>
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
