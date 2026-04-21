import React from "react";
import { HistoryPoint } from "../types/dashboard";

export default function MiniLineChart({ data, color, range }: { data: HistoryPoint[]; color: string; range: HistoryRange }) {
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