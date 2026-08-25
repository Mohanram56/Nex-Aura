"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    // Slower pacing: 4 seconds to reach 100%
    const duration = 4000; 
    const steps = 100;
    const intervalTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setProgress(current);

      if (current >= 80 && current < 100) {
        setPhase(2);
      } else if (current === 100) {
        clearInterval(timer);
        // Wait 1.5 seconds at 100% so the user can see the fully filled logo
        setTimeout(() => {
          setPhase(3);
          // Trigger the final unmount after the curtain transition finishes
          setTimeout(() => {
            onComplete();
          }, 1200);
        }, 1500);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="splash"
      exit={{ 
        clipPath: "inset(0 0 100% 0)", // Curtain slide up reveal
        opacity: 0,
      }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* 3D Floating Particles Background - matching our Indigo theme */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 3 ? 0 : 0.6 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Center Logo Canvas */}
      <motion.div
        animate={
          phase === 3 ? {
            y: "-42vh",     // Drift up
            x: "-42vw",     // Drift left
            scale: 0.2,     // Shrink
            opacity: 0,     // Fade out into the real header
          } : {}
        }
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex items-center justify-center h-48 w-full max-w-lg"
      >
        <svg width="100%" height="100%" viewBox="0 0 500 150">
           <motion.text
             x="50%" y="50%"
             textAnchor="middle"
             dominantBaseline="middle"
             className="text-7xl tracking-tight"
             style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif", fontStyle: "italic", fontWeight: 800 }}
             initial={{ strokeDasharray: "400", strokeDashoffset: "400", fill: "rgba(255,255,255,0)" }}
             animate={{
                // Phase 1: Draw the stroke
                strokeDashoffset: progress < 80 ? 400 - (400 * (progress / 80)) : 0,
                // Phase 2: Fill the text with crisp white
                fill: progress >= 80 ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
             }}
             transition={{ duration: 0.1, ease: "linear" }}
             stroke="#818cf8" // Indigo-400 stroke to match our theme!
             strokeWidth="1.5"
           >
             Nex Aura
           </motion.text>
        </svg>
      </motion.div>

      {/* Numeric Progress Counter */}
      <motion.div 
        animate={phase === 3 ? { opacity: 0, y: 50 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-16 font-mono text-5xl text-white tracking-widest font-black"
      >
        {progress}%
      </motion.div>
    </motion.div>
  );
}

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {show && <SplashScreen onComplete={() => setShow(false)} />}
      </AnimatePresence>
      {children}
    </>
  );
}
