"use client";

import { useCallback } from "react";
import { HistoryRange } from "@/src/types/dashboard";
import { HistoryPoint } from "@/src/types/dashboard";

/**
 * Convert a value to number, returning null for invalid values
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Format history label based on date and range
 */
export function formatHistoryLabel(date: Date, range: HistoryRange = "24h"): string {
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

/**
 * Normalize history data from API response
 */
export function normalizeHistory(payload: unknown, range: HistoryRange): HistoryPoint[] {
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

/**
 * Custom hook for history data management
 */
export function useHistoryData() {
  const getEmptyHistory = useCallback(
    (range: HistoryRange) => normalizeHistory([], range),
    []
  );

  return {
    toNumber,
    formatHistoryLabel,
    normalizeHistory,
    getEmptyHistory,
  };
}