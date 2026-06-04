"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "./useWebsocket";
import Cookies from "js-cookie"

type LastEvent = {
  feed?: string;
  value?: string | number;
};


export function useDashboard() {
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
    const buildWsUrl = () => {
        const userId = Cookies.get("userId");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!userId || !baseUrl) return "";

        const normalized = baseUrl.replace(/\/$/, "");
        const noApi = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
        return `${noApi.replace(/^http/, "ws")}/ws/${userId}`;
    }
  const handleMessage = useCallback((data: unknown) => {
    if (data && typeof data === "object") {
      setLastEvent(data as LastEvent);
      return;
    }
    setLastEvent(null);
  }, []);

  const { connected, send } = useWebSocket(
    buildWsUrl(),
    handleMessage
  );

  return {
    connected,
    lastEvent,
    send,
  };
}