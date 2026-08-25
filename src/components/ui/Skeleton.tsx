"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
  height?: string | number;
  width?: string | number;
}

export function Skeleton({ className = "", variant = "rect", height, width }: SkeletonProps) {
  const shapeClass =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
      ? "rounded-md h-4 my-1.5"
      : "rounded-xl";

  return (
    <div
      style={{ width, height }}
      className={`relative overflow-hidden bg-slate-900 border border-slate-800/60 ${shapeClass} ${className}`}
    >
      {/* Animated shimmer gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rect" className="h-24 w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/10 space-y-2.5 p-4">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-slate-800/80">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              variant="rect"
              className="h-4 flex-1"
              width={c === 0 ? "80%" : "100%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
