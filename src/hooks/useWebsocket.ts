"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string, onMessage?: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!url) {
      setConnected(false);
      return;
    }
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch {
        console.error("Invalid message");
      }
    };

    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, [url]);

  const send = (data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  };

  return { connected, send };
}