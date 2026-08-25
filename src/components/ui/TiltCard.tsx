"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from "framer-motion";

interface TiltCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  tiltMax?: number; // Maximum rotation in degrees
}

export function TiltCard({ children, className = "", tiltMax = 10, ...props }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values to track absolute position relative to center of card
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Interpolate rotation angles (Y-axis controls tilt left/right, X-axis controls tilt up/down)
  const rotateX = useTransform(y, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-tiltMax, tiltMax]);

  // Spring physics settings for high-premium responsiveness
  const springSettings = { stiffness: 150, damping: 20, mass: 0.5 };
  const springX = useSpring(rotateX, springSettings);
  const springY = useSpring(rotateY, springSettings);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card element bounds
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Express as percentages from -0.5 to 0.5
    const pctX = mouseX / width - 0.5;
    const pctY = mouseY / height - 0.5;

    x.set(pctX);
    y.set(pctY);
  };

  const handleMouseLeave = () => {
    // Return to center smoothly
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-colors duration-300 hover:border-indigo-500/50 ${className}`}
      {...props}
    >
      {/* Dynamic ambient hover glow mesh */}
      <div 
        style={{ transform: "translateZ(50px)" }} 
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-transparent to-violet-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" 
      />
      
      {/* Content wrapper with perspective translation */}
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
