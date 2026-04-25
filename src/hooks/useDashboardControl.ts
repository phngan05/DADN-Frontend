"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import apiClient from "@/src/services/api";
import { useHistoryData } from "./useHistoryData";
import { useDeviceControl } from "./useDeviceControl";
import { Feed, FeedCategory } from "@/src/types/feed";
import { HistoryRange, HistoryPoint, DashboardMode } from "@/src/types/dashboard";

const MODE_STORAGE_KEY = "comhome-dashboard-mode";

interface LastEvent {
  feed?: string;
  value?: string | number;
}

export function useDashboardControl(feedsData: Feed[] | null, latestValues: Record<string, string | number>, setLatestValues: React.Dispatch<React.SetStateAction<Record<string, string | number>>>, lastEvent: LastEvent | null) {
  const { toNumber, normalizeHistory } = useHistoryData();
  const [mode, setMode] = useState<DashboardMode>(() => {
    // Initialize mode synchronously from localStorage
    if (typeof window !== "undefined") {
      const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === "automatic" || savedMode === "manual") {
        return savedMode;
      }
    }
    return "automatic";
  });
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24h");
  const [historyMap, setHistoryMap] = useState<Record<FeedCategory, HistoryPoint[]>>({
    Temperature: normalizeHistory([], "24h"),
    Humidity: normalizeHistory([], "24h"),
    Illuminance: normalizeHistory([], "24h"),
    "LED Intensity": [],
    "Fan Speed": [],
    "LED Status": [],
    "Servo": []
  });
  const [lightDraft, setLightDraft] = useState(0);
  const [fanDraft, setFanDraft] = useState(0);
  const { updateStatus } = useDeviceControl();

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
    const lightIntensity = toNumber(feeds["LED Intensity"] ? latestValues[feeds["LED Intensity"].feed_key] : null) ?? 0;
    const fanSpeed = toNumber(feeds["Fan Speed"] ? latestValues[feeds["Fan Speed"].feed_key] : null) ?? 0;
    const lightStatus = toNumber(feeds["LED Status"] ? latestValues[feeds["LED Status"].feed_key] : null) ?? (lightIntensity > 0 ? 1 : 0);
    
    return {
      lightIntensity,
      fanSpeed,
      lightStatus,
      lightOn: lightStatus > 0,
      fanOn: fanSpeed > 0,
    };
  }, [feedByCategory, latestValues, toNumber]);

  // Initialize draft values from latestValues
  useEffect(() => {
    const values = getDeviceValues();
    setLightDraft(values.lightIntensity);
    setFanDraft(values.fanSpeed);
  }, [getDeviceValues]);

  // Use useMemo to compute drafts
  const lightDraftValue = useMemo(() => {
    const values = getDeviceValues();
    return values.lightIntensity;
  }, [getDeviceValues]);

  const fanDraftValue = useMemo(() => {
    const values = getDeviceValues();
    return values.fanSpeed;
  }, [getDeviceValues]);

  // Load feeds
  const loadFeeds = useCallback(async () => {
    const response = await apiClient.get("/feed");
    return response.data as Feed[];
  }, []);

  // Load snapshot
  const loadSnapshot = useCallback(async () => {
    const response = await apiClient.get("/record/all");
    const data = response.data && typeof response.data === "object" ? response.data : {};
    setLatestValues((prev) => ({ ...prev, ...(data as Record<string, string | number>) }));
  }, [setLatestValues]);

  // Load history
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
  }, [normalizeHistory]);

  // Send command
  const sendCommand = useCallback(async (feedKey: string, value: number) => {
    await updateStatus(feedKey, value);
    setLatestValues((prev) => ({ ...prev, [feedKey]: value }));
  }, [updateStatus, setLatestValues]);

  // Request manual mode
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

  // Light toggle
  const handleLightToggle = useCallback(async () => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const intensityFeed = feeds["LED Intensity"];
    const statusFeed = feeds["LED Status"];
    
    if (!intensityFeed && !statusFeed) return;
    if (!requestManualMode()) return;

    try {
      const nextOn = !values.lightOn;
      if (statusFeed) await sendCommand(statusFeed.feed_key, nextOn ? 1 : 0);
      if (intensityFeed) await sendCommand(intensityFeed.feed_key, nextOn ? Math.max(25, values.lightIntensity || 75) : 0);
    } catch (error) {
      console.error("Light toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển đèn.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Light commit
  const handleLightCommit = useCallback(async (value: number) => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const intensityFeed = feeds["LED Intensity"];
    const statusFeed = feeds["LED Status"];
    
    if (!intensityFeed && !statusFeed) return;
    if (!requestManualMode()) {
      setLightDraft(values.lightIntensity);
      return;
    }

    try {
      if (intensityFeed) await sendCommand(intensityFeed.feed_key, value);
      if (statusFeed) await sendCommand(statusFeed.feed_key, value > 0 ? 1 : 0);
    } catch (error) {
      console.error("Light slider failed:", error);
      setLightDraft(values.lightIntensity);
      window.alert("Không thể cập nhật độ sáng đèn.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Fan toggle
  const handleFanToggle = useCallback(async () => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const fanFeed = feeds["Fan Speed"];
    
    if (!fanFeed) return;
    if (!requestManualMode()) return;

    try {
      await sendCommand(fanFeed.feed_key, values.fanOn ? 0 : Math.max(30, values.fanSpeed || 60));
    } catch (error) {
      console.error("Fan toggle failed:", error);
      window.alert("Không thể gửi lệnh điều khiển quạt.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Fan commit
  const handleFanCommit = useCallback(async (value: number) => {
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
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Mode change
  const handleModeChange = useCallback(async (newMode: "automatic" | "manual") => {
    setMode(newMode);
    if (newMode === "automatic") {
      try {
        await apiClient.put("record/auto");
      } catch (error) {
        console.error("Auto mode error:", error);
      }
    }
  }, []);

  return {
    mode,
    historyRange,
    setHistoryRange,
    historyMap,
    lightDraft: lightDraftValue,
    setLightDraft,
    fanDraft: fanDraftValue,
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