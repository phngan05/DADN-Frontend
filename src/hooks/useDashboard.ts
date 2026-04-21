"use client";

import { useState, useMemo, useCallback } from "react";
import { useWebSocket } from "./useWebsocket";
import Cookies from "js-cookie"



export function useDashboard() {
    const [feedsData, setFeedsData] = useState<any[]>([]);
    const [lastEvent, setLastEvent] = useState<any>(null);
    const buildWsUrl = () => {
        const userId = Cookies.get("userId");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!userId || !baseUrl) return "";

        const normalized = baseUrl.replace(/\/$/, "");
        const noApi = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
        return `${noApi.replace(/^http/, "ws")}/ws/${userId}`;
    }
  const handleMessage = useCallback((data: any) => {
    setLastEvent(data);
  }, []);

  const { connected, send } = useWebSocket(
    buildWsUrl(),
    handleMessage
  );

  const feedByCategory = useMemo(() => {
    const map: Record<string, any> = {};

    for (const feed of feedsData ?? []) {
      map[feed.category] = feed;
    }

    return map;
  }, [feedsData]);

  return {
    connected,
    feedsData,
    feedByCategory,
    lastEvent,
    send,
  };
}