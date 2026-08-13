"use client";

import { useMemo, useId } from "react";
import { MetricHistoryItem } from "../lib/analytics-client";

interface SparklineProps {
  data: MetricHistoryItem[];
  width?: number;
  height?: number;
}

export default function Sparkline({ 
  data, 
  width = 120, 
  height = 24 
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return "";
    
    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;
    
    const max = Math.max(...data.map(d => d.count), 1);
    // If there is only one data point, just draw a straight line
    if (data.length === 1) {
      return `M ${padding},${height - padding} L ${width - padding},${height - padding}`;
    }
    
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * w;
      const y = padding + h - (d.count / max) * h;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="animate-pulse bg-brand-10/5 rounded" />;
  }

  const gradientId = `sparkline-grad-${useId().replace(/:/g, "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-30)" stopOpacity="1" />
          <stop offset="70%" stopColor="var(--color-brand-30)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-brand-30)" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path 
        d={pathData} 
        fill="none" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
