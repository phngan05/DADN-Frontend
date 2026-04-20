"use client";

import { useState, useEffect, useRef } from "react";
import {
  Thermometer,
  Droplet,
  Sun,
  Lightbulb,
  Fan,
  TrendingUp,
} from "lucide-react";
import SwitchMode from "@/src/components/switch-mode";
import { useDeviceControl } from "@/src/hooks/useDeviceControl";
import { useFeeds } from "@/src/hooks/useFeeds";
import apiClient from "@/src/services/api";
import Cookies from "js-cookie";

/* ───── Simple SVG Line Chart ───── */
function MiniChart({
  data,
  color,
  height = 120,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  if (!data.length) return null;

  const width = 280;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");

  const areaD = `${pathD} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`;

  const times = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full mt-2">
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={padding}
          y1={padding + (chartHeight / 3) * i}
          x2={padding + chartWidth}
          y2={padding + (chartHeight / 3) * i}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}
      <path d={areaD} fill={`${color}15`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      ))}
      {times.map((t, i) => (
        <text
          key={i}
          x={padding + (i / (times.length - 1)) * chartWidth}
          y={height + 14}
          textAnchor="middle"
          fontSize="9"
          fill="#94a3b8"
        >
          {t}
        </text>
      ))}
    </svg>
  );
}

/* ───── Status helpers ───── */
function getTempStatus(temp: number) {
  if (temp <= 25) return { label: "COOL", color: "text-blue-500 bg-blue-50" };
  if (temp <= 35) return { label: "OPTIMAL", color: "text-green-500 bg-green-50" };
  return { label: "HOT", color: "text-red-500 bg-red-50" };
}

function getHumidityStatus(hum: number) {
  if (hum < 40) return { label: "LOW", color: "text-yellow-500 bg-yellow-50" };
  if (hum <= 70) return { label: "MODERATE", color: "text-blue-500 bg-blue-50" };
  return { label: "HIGH", color: "text-red-500 bg-red-50" };
}

function getLightStatus(lux: number) {
  if (lux < 200) return { label: "DIM", color: "text-slate-500 bg-slate-50" };
  if (lux <= 500) return { label: "BRIGHT", color: "text-amber-500 bg-amber-50" };
  return { label: "INTENSE", color: "text-red-500 bg-red-50" };
}

/* ───── Dashboard ───── */
export default function Home() {
  const [mode, setMode] = useState<"automatic" | "manual">("automatic");
  const [sensorData, setSensorData] = useState({
    temperature: 30,
    humidity: 65,
    light: 420,
  });
  const [lightOn, setLightOn] = useState(true);
  const [fanOn, setFanOn] = useState(false);
  const [brightness, setBrightness] = useState(75);
  const [fanSpeed, setFanSpeed] = useState(30);
  const [timeRange, setTimeRange] = useState<"24h" | "7d">("24h");

  const { updateStatus } = useDeviceControl();
  const { feedsData } = useFeeds();
  const socketRef = useRef<WebSocket | null>(null);

  const ledStatusFeed = feedsData?.find((f) => f.category === "LED Status");
  const fanSpeedFeed = feedsData?.find((f) => f.category === "Fan Speed");
  const ledIntensityFeed = feedsData?.find((f) => f.category === "LED Intensity");

  /* WebSocket for real-time sensor data */
  useEffect(() => {
    const userId = Cookies.get("userId");
    if (!userId) return;
    try {
      const baseURL = apiClient.defaults.baseURL;
      if (!baseURL) return;
      const wsURL = baseURL.replace("http", "ws").replace("/api", "/ws");
      const socket = new WebSocket(`${wsURL}/${userId}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setSensorData((prev) => ({
          ...prev,
          ...(data.feed?.includes("temperature") && { temperature: Number(data.value) }),
          ...(data.feed?.includes("humidity") && { humidity: Number(data.value) }),
          ...(data.feed?.includes("light") && { light: Number(data.value) }),
        }));
      };

      socket.onopen = () => console.log("Dashboard WebSocket connected");
      socket.onerror = (err) => console.error("WebSocket error:", err);
    } catch {
      console.error("WebSocket setup failed");
    }

    return () => {
      socketRef.current?.close();
    };
  }, []);

  /* Mode change */
  const handleModeChange = async (newMode: "automatic" | "manual") => {
    setMode(newMode);
    if (newMode === "automatic") {
      try {
        const tempFeed = feedsData?.find((f) => f.category === "Temperature");
        const humFeed = feedsData?.find((f) => f.category === "Humidity");
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

  /* Device controls */
  const handleLightToggle = async () => {
    const next = !lightOn;
    setLightOn(next);
    if (ledStatusFeed) await updateStatus(ledStatusFeed.feed_key, next ? 1 : 0);
  };

  const handleFanToggle = async () => {
    const next = !fanOn;
    setFanOn(next);
    if (fanSpeedFeed) await updateStatus(fanSpeedFeed.feed_key, next ? fanSpeed : 0);
  };

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    if (ledIntensityFeed) await updateStatus(ledIntensityFeed.feed_key, value);
  };

  const handleFanSpeedChange = async (value: number) => {
    setFanSpeed(value);
    if (fanSpeedFeed && fanOn) await updateStatus(fanSpeedFeed.feed_key, value);
  };

  const tempStatus = getTempStatus(sensorData.temperature);
  const humStatus = getHumidityStatus(sensorData.humidity);
  const lightStatus = getLightStatus(sensorData.light);

  /* Sample chart data */
  const tempChartData = [28, 29, 31, 30, 32, 30, 29, 31, 30];
  const humChartData = [60, 62, 65, 63, 67, 64, 62, 65, 63];
  const lightChartData = [350, 380, 420, 400, 450, 430, 410, 440, 420];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Title + Mode Switch */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              ComHome Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time environment monitoring and device management
            </p>
          </div>
          <SwitchMode currentMode={mode} onModeChange={handleModeChange} />
        </div>

        {/* ── Sensor Cards ── */}
        <div className="grid grid-cols-3 gap-5 mb-6">
          {/* Temperature */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Thermometer size={20} className="text-slate-400" />
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tempStatus.color}`}
              >
                {tempStatus.label}
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Average Temperature
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800">
                {sensorData.temperature}
              </span>
              <span className="text-lg text-slate-400">°C</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Droplet size={20} className="text-slate-400" />
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${humStatus.color}`}
              >
                {humStatus.label}
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Relative Humidity
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800">
                {sensorData.humidity}
              </span>
              <span className="text-lg text-slate-400">%</span>
            </div>
          </div>

          {/* Light Intensity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Sun size={20} className="text-slate-400" />
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lightStatus.color}`}
              >
                {lightStatus.label}
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Light Intensity
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800">
                {sensorData.light}
              </span>
              <span className="text-lg text-slate-400">lux</span>
            </div>
          </div>
        </div>

        {/* ── Device Controls ── */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Light Control */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Lightbulb size={20} className="text-blue-500" />
                </div>
                <span className="font-semibold text-slate-800">
                  Main Living Light
                </span>
              </div>
              <button
                onClick={handleLightToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  lightOn ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    lightOn ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Brightness Intensity
                </span>
                <span className="text-sm font-bold text-slate-600">
                  {brightness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Fan Control */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <Fan size={20} className="text-slate-400" />
                </div>
                <span className="font-semibold text-slate-800">
                  Circulation Fan
                </span>
              </div>
              <button
                onClick={handleFanToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  fanOn ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    fanOn ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Airflow Speed
                </span>
                <span className="text-sm font-bold text-slate-600">
                  {fanSpeed}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fanSpeed}
                onChange={(e) => handleFanSpeedChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* ── Analytical History ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-700" />
              <h2 className="text-lg font-bold text-slate-800">
                Analytical History
              </h2>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setTimeRange("24h")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeRange === "24h"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Last 24 Hours
              </button>
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeRange === "7d"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Last 7 Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Temperature Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Temperature History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Daily temperature fluctuations
                  </p>
                </div>
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <MiniChart data={tempChartData} color="#3b82f6" />
            </div>

            {/* Humidity Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Humidity History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Moisture percentage tracking
                  </p>
                </div>
                <TrendingUp size={16} className="text-teal-500" />
              </div>
              <MiniChart data={humChartData} color="#14b8a6" />
            </div>

            {/* Light Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Light Intensity History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ambient lux level variations
                  </p>
                </div>
                <Sun size={16} className="text-amber-500" />
              </div>
              <MiniChart data={lightChartData} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
