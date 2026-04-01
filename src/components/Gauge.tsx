import React from 'react';
import { cn } from '../lib/utils';

interface GaugeProps {
  value: number; // 0-1
  isDarkMode: boolean;
  className?: string;
}

export default function Gauge({ value, isDarkMode, className }: GaugeProps) {
  const percentage = Math.round(value * 100);
  const strokeWidth = 10;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value * circumference);

  const getColor = (v: number) => {
    if (v < 0.3) return 'stroke-emerald-500';
    if (v < 0.6) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const getBgColor = (v: number) => {
    if (v < 0.3) return 'text-emerald-500/20';
    if (v < 0.6) return 'text-amber-500/20';
    return 'text-rose-500/20';
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg className="w-32 h-32 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className={cn("transition-colors duration-500", isDarkMode ? "text-white/5" : "text-gray-200")}
        />
        {/* Progress Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className={cn("transition-all duration-1000 ease-out", getColor(value))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", getColor(value).replace('stroke-', 'text-'))}>
          {percentage}%
        </span>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider opacity-50", isDarkMode ? "text-white" : "text-gray-900")}>
          Risk Level
        </span>
      </div>
    </div>
  );
}
