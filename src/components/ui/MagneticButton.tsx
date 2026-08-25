"use client";

import React, { useRef, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  range?: number; // Distance in px where the magnetic effect starts
  strength?: number; // Strength of pull (0 to 1)
}

export function MagneticButton({
  children,
  className = "",
  range = 40,
  strength = 0.35,
  ...props
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const distanceX = event.clientX - btnCenterX;
    const distanceY = event.clientY - btnCenterY;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance < range) {
      // Pull button toward cursor
      setPosition({
        x: distanceX * strength,
        y: distanceY * strength,
      });
    } else {
      // Outside range, snap back to center
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:scale-95 ${className}`}
      {...props}
    >
      {/* Background ripple highlight */}
      <span className="absolute inset-0 z-0 bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
