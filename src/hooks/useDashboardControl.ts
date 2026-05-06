"use client";

import { useState, useCallback, useEffect } from "react";
import apiClient from "@/src/services/api";
import { useHistoryData } from "./useHistoryData";
import { useDeviceControl } from "./useDeviceControl";
import { Feed, FeedCategory } from "@/src/types/feed";
import {
  HistoryRange,
  HistoryPoint,
  DashboardMode,
} from "@/src/types/dashboard";

interface LastEvent {
  feed?: string;
  value?: string | number;
}

const DASHBOARD_MODE_STORAGE_KEY = "dashboard-mode";

const getInitialMode = (): DashboardMode => {
  if (typeof window === "undefined") return "manual";

  const storedMode = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return storedMode === "automatic" || storedMode === "manual"
    ? storedMode
    : "manual";
};

export function useDashboardControl(
  feedsData: Feed[] | null,
  latestValues: Record<string, string | number>,
  setLatestValues: React.Dispatch<
    React.SetStateAction<Record<string, string | number>>
  >,
  lastEvent: LastEvent | null,
) {
  const { toNumber, normalizeHistory } = useHistoryData();
  const [mode, setMode] = useState<DashboardMode>(getInitialMode);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24h");
  const [historyMap, setHistoryMap] = useState<
    Record<FeedCategory, HistoryPoint[]>
  >({
    Temperature: normalizeHistory([], "24h"),
    Humidity: normalizeHistory([], "24h"),
    Illuminance: normalizeHistory([], "24h"),
    "LED Intensity": [],
    "Fan Speed": [],
    Servo: [],
  });
  const [lightDraft, setLightDraft] = useState(0);
  const [fanDraft, setFanDraft] = useState(0);
  const { updateStatus } = useDeviceControl();

  // Sync mode so Sidebar / Voice Control can know whether dashboard is in Automatic mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, mode);
    window.dispatchEvent(
      new CustomEvent("dashboard-mode-change", {
        detail: mode,
      }),
    );
  }, [mode]);

  // Update latest values from websocket
  useEffect(() => {
    if (lastEvent && lastEvent.feed) {
      const feedKey = lastEvent.feed as string;
      const value = lastEvent.value;
      if (value !== undefined) {
        setLatestValues((prev) => ({
          ...prev,
          [feedKey]: value,
        }));
      }
    }
  }, [lastEvent, setLatestValues]);

  // Feed by category mapping
  const feedByCategory = useCallback(() => {
    const map = {} as Partial<Record<FeedCategory, Feed>>;
    for (const feed of feedsData ?? []) {
      map[feed.category] = feed;
    }
    return map;
  }, [feedsData]);

  // Get device values
  const getDeviceValues = useCallback(() => {
    const feeds = feedByCategory();
    const lightIntensity =
      toNumber(
        feeds["LED Intensity"]
          ? latestValues[feeds["LED Intensity"].feed_key]
          : null,
      ) ?? 0;
    const fanSpeed =
      toNumber(
        feeds["Fan Speed"] ? latestValues[feeds["Fan Speed"].feed_key] : null,
      ) ?? 0;

    return {
      lightIntensity,
      fanSpeed,
      lightOn: lightIntensity > 0,
      fanOn: fanSpeed > 0,
    };
  }, [feedByCategory, latestValues, toNumber]);

  // Initialize draft values from latestValues
  useEffect(() => {
    const values = getDeviceValues();
    setLightDraft(values.lightIntensity);
    setFanDraft(values.fanSpeed);
  }, [getDeviceValues]);

  // Load feeds
  const loadFeeds = useCallback(async () => {
    const response = await apiClient.get("/feed");
    return response.data as Feed[];
  }, []);

  // Load snapshot
  const loadSnapshot = useCallback(async () => {
    const response = await apiClient.get("/record/all");
    const data =
      response.data && typeof response.data === "object" ? response.data : {};
    setLatestValues((prev) => ({
      ...prev,
      ...(data as Record<string, string | number>),
    }));
  }, [setLatestValues]);

  // Load history
  const loadHistory = useCallback(
    async (feedList: Feed[], range: HistoryRange) => {
      const targets = feedList.filter((item) =>
        ["Temperature", "Humidity", "Illuminance"].includes(item.category),
      );
      const emptySeries = normalizeHistory([], range);

      const results = await Promise.all(
        targets.map(async (item) => {
          try {
            const response = await apiClient.get(
              `/record/history/${item.feed_key}`,
            );
            return [
              item.category,
              normalizeHistory(response.data, range),
            ] as const;
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
    },
    [normalizeHistory],
  );

  // Send command
  const sendCommand = useCallback(
    async (feedKey: string, value: number) => {
      await updateStatus(feedKey, value);
      setLatestValues((prev) => ({ ...prev, [feedKey]: value }));
    },
    [updateStatus, setLatestValues],
  );

  // Request manual mode
  const requestManualMode = useCallback(() => {
    if (mode === "manual") return true;
    const accepted = window.confirm(
      "Hệ thống đang ở chế độ Automatic. Bạn có muốn chuyển sang Manual để tiếp tục điều khiển không?",
    );
    if (!accepted) return false;
    setMode("manual");
    return true;
  }, [mode]);

  // Light toggle: LED Intensity = 0 means OFF, LED Intensity > 0 means ON
  const handleLightToggle = useCallback(async () => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const intensityFeed = feeds["LED Intensity"];

    if (!intensityFeed) return;
    if (!requestManualMode()) return;

    try {
      const nextValue = values.lightOn
        ? 0
        : Math.max(25, values.lightIntensity || 75);
      await sendCommand(intensityFeed.feed_key, nextValue);
    } catch (error) {
      console.error("Light toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển đèn.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Light commit
  const handleLightCommit = useCallback(
    async (value: number) => {
      const feeds = feedByCategory();
      const values = getDeviceValues();
      const intensityFeed = feeds["LED Intensity"];

      if (!intensityFeed) return;
      if (!requestManualMode()) {
        setLightDraft(values.lightIntensity);
        return;
      }

      try {
        await sendCommand(intensityFeed.feed_key, value);
      } catch (error) {
        console.error("Light slider failed:", error);
        setLightDraft(values.lightIntensity);
        window.alert("Không thể cập nhật độ sáng đèn.");
      }
    },
    [feedByCategory, getDeviceValues, requestManualMode, sendCommand],
  );

  // Fan toggle
  const handleFanToggle = useCallback(async () => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const fanFeed = feeds["Fan Speed"];

    if (!fanFeed) return;
    if (!requestManualMode()) return;

    try {
      await sendCommand(
        fanFeed.feed_key,
        values.fanOn ? 0 : Math.max(30, values.fanSpeed || 60),
      );
    } catch (error) {
      console.error("Fan toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển quạt.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Fan commit
  const handleFanCommit = useCallback(
    async (value: number) => {
      const feeds = feedByCategory();
      const values = getDeviceValues();
      const fanFeed = feeds["Fan Speed"];

      if (!fanFeed) return;
      if (!requestManualMode()) {
        setFanDraft(values.fanSpeed);
        return;
      }

      try {
        await sendCommand(fanFeed.feed_key, value);
      } catch (error) {
        console.error("Fan slider failed:", error);
        setFanDraft(values.fanSpeed);
        window.alert("Không thể cập nhật tốc độ quạt.");
      }
    },
    [feedByCategory, getDeviceValues, requestManualMode, sendCommand],
  );

  // Mode change
  const handleModeChange = useCallback(
    async (newMode: "automatic" | "manual") => {
      setMode(newMode);
      try {
        const response = await apiClient.put(
          newMode === "automatic"
            ? "record/auto?enabled=true"
            : "record/auto?enabled=false",
        );

        const result = response.data?.result;
        const fanFeed = result?.fan;
        const ledFeed = result?.led;

        setLatestValues((prev) => ({
          ...prev,
          ...(fanFeed?.feed ? { [fanFeed.feed]: fanFeed.value } : {}),
          ...(ledFeed?.feed ? { [ledFeed.feed]: ledFeed.value } : {}),
        }));

        await loadSnapshot();
      } catch (error) {
        console.error("Mode change error:", error);
      }
    },
    [loadSnapshot, setLatestValues],
  );

  return {
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
  };
}
