"use client";

import {
  useState,
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import apiClient from "@/src/services/api";
import { useHistoryData } from "./useHistoryData";
import { useDeviceControl } from "./useDeviceControl";
import { Feed, FeedCategory } from "@/src/types/feed";
import {
  HistoryRange,
  HistoryPoint,
  DashboardMode,
} from "@/src/types/dashboard";
import {notify} from '@/src/utils/notify';


interface LastEvent {
  feed?: string;
  value?: string | number;
}

export function useDashboardControl(
  feedsData: Feed[] | null,
  latestValues: Record<string, string | number>,
  setLatestValues: Dispatch<SetStateAction<Record<string, string | number>>>,
  lastEvent: LastEvent | null,
) {
  const { toNumber, normalizeHistory } = useHistoryData();

  // Không lấy mode từ localStorage nữa.
  // Giá trị này sẽ được đồng bộ lại từ backend bằng loadMode().
  const [mode, setMode] = useState<DashboardMode>("manual");
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

  // Load backend mode. Đây là source-of-truth, không dùng localStorage.
  const loadMode = useCallback(async () => {
    const response = await apiClient.get("/record/auto/status");

    const syncedMode: DashboardMode = response.data?.auto_mode
      ? "automatic"
      : "manual";

    setMode(syncedMode);
    return syncedMode;
  }, []);

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
      const ok = await updateStatus(feedKey, value);

      if (!ok) {
        throw new Error("Backend rejected device update");
      }

      setLatestValues((prev) => ({ ...prev, [feedKey]: value }));
    },
    [updateStatus, setLatestValues],
  );

  // Change mode through backend, then sync UI from backend response.
  const setBackendMode = useCallback(
    async (newMode: DashboardMode) => {
      const response = await apiClient.put(
        newMode === "automatic"
          ? "/record/auto?enabled=true"
          : "/record/auto?enabled=false",
      );

      const autoMode =
        typeof response.data?.auto_mode === "boolean"
          ? response.data.auto_mode
          : newMode === "automatic";

      const syncedMode: DashboardMode = autoMode ? "automatic" : "manual";
      setMode(syncedMode);

      const result = response.data?.result;
      const fanFeed = result?.fan;
      const ledFeed = result?.led;

      setLatestValues((prev) => ({
        ...prev,
        ...(fanFeed?.feed ? { [fanFeed.feed]: fanFeed.value } : {}),
        ...(ledFeed?.feed ? { [ledFeed.feed]: ledFeed.value } : {}),
      }));

      await loadSnapshot();
      return syncedMode;
    },
    [loadSnapshot, setLatestValues],
  );

  // Request manual mode.
  // Nếu backend đang Auto thì hỏi popup.
  // Người dùng đồng ý thì mới gọi backend tắt Auto.
  const requestManualMode = useCallback(async () => {
    const latestMode = await loadMode();

    if (latestMode === "manual") return true;

    const accepted = window.confirm(
      "Hệ thống đang ở chế độ Automatic. Bạn có muốn chuyển sang Manual để tiếp tục điều khiển không?",
    );

    if (!accepted) return false;

    const syncedMode = await setBackendMode("manual");
    return syncedMode === "manual";
  }, [loadMode, setBackendMode]);

  // Light toggle: LED Intensity = 0 means OFF, LED Intensity > 0 means ON
  const handleLightToggle = useCallback(async () => {
    const feeds = feedByCategory();
    const values = getDeviceValues();
    const intensityFeed = feeds["LED Intensity"];

    if (!intensityFeed) return;
    if (!(await requestManualMode())) return;

    try {
      const nextValue = values.lightOn
        ? 0
        : Math.max(25, values.lightIntensity || 75);
      await sendCommand(intensityFeed.feed_key, nextValue);
    } catch (error) {
      console.error("Light toggle failed:", error);
      notify.error("Không thể gửi lệnh điều khiển đèn.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Light commit
  const handleLightCommit = useCallback(
    async (value: number) => {
      const feeds = feedByCategory();
      const values = getDeviceValues();
      const intensityFeed = feeds["LED Intensity"];

      if (!intensityFeed) return;
      if (!(await requestManualMode())) {
        setLightDraft(values.lightIntensity);
        return;
      }

      try {
        await sendCommand(intensityFeed.feed_key, value);
      } catch (error) {
        console.error("Light slider failed:", error);
        setLightDraft(values.lightIntensity);
        notify.error("Không thể cập nhật độ sáng đèn.");
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
    if (!(await requestManualMode())) return;

    try {
      await sendCommand(
        fanFeed.feed_key,
        values.fanOn ? 0 : Math.max(30, values.fanSpeed || 60),
      );
    } catch (error) {
      console.error("Fan toggle failed:", error);
      notify.error("Không thể gửi lệnh điều khiển quạt.");
    }
  }, [feedByCategory, getDeviceValues, requestManualMode, sendCommand]);

  // Fan commit
  const handleFanCommit = useCallback(
    async (value: number) => {
      const feeds = feedByCategory();
      const values = getDeviceValues();
      const fanFeed = feeds["Fan Speed"];

      if (!fanFeed) return;
      if (!(await requestManualMode())) {
        setFanDraft(values.fanSpeed);
        return;
      }

      try {
        await sendCommand(fanFeed.feed_key, value);
      } catch (error) {
        console.error("Fan slider failed:", error);
        setFanDraft(values.fanSpeed);
        notify.error("Không thể cập nhật tốc độ quạt.");
      }
    },
    [feedByCategory, getDeviceValues, requestManualMode, sendCommand],
  );

  // Mode change
  const handleModeChange = useCallback(
    async (newMode: "automatic" | "manual") => {
      try {
        await setBackendMode(newMode);
      } catch (error) {
        console.error("Mode change error:", error);
        await loadMode().catch(() => undefined);
        window.alert("Không thể đổi chế độ. Vui lòng thử lại.");
      }
    },
    [setBackendMode, loadMode],
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
    loadMode,
    loadHistory,
    handleLightToggle,
    handleLightCommit,
    handleFanToggle,
    handleFanCommit,
    handleModeChange,
    getDeviceValues,
  };
}

