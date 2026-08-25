"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, Award, Star, Compass, AlertCircle, Quote } from "lucide-react";

interface Goal {
  id: string;
  userId: string;
  title: string;
  progress: number;
  cycleId: string;
}

const mockTimeline = [
  {
    id: "rev-1",
    title: "Q2 Mid-Year Review Discussion",
    date: "July 15, 2026",
    manager: "Alex Rivera",
    rating: "Exceeds Expectations",
    comment: "Marcus has demonstrated great ownership of the WFM App frontend. His implementation of the dynamic design system was highly praised by stakeholders. Keep focus on unit coverage next quarter.",
    icon: Award,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "rev-2",
    title: "Q2 Goal Setting & Alignment",
    date: "April 05, 2026",
    manager: "Alex Rivera",
    rating: "Aligned",
    comment: "Setup goals for building WFM components and securing code test coverage above 90%. Aligned on expectations and deliverables.",
    icon: Compass,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    id: "rev-3",
    title: "Q1 Performance Evaluation",
    date: "Jan 10, 2026",
    manager: "Alex Rivera",
    rating: "Meets Expectations",
    comment: "Solid contribution to codebase maintenance. Good teamwork and timely deliverables. Encouraged to explore frontend animations to add value.",
    icon: Star,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
];

export default function PerformanceClient({ goals }: { goals: Goal[] }) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Performance & OKRs</h1>
        <p className="text-slate-400 text-sm">Monitor your current goals and review historical evaluations.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Goals & OKRs Card List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
            <Target className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Active Goals</h2>
          </div>

          <div className="space-y-5">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <h4 className="font-semibold text-slate-200 line-clamp-2 pr-2">{goal.title}</h4>
                  <span className="shrink-0 font-mono font-bold text-indigo-400">{Math.round(goal.progress)}%</span>
                </div>
                {/* Progress bar container */}
                <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{goal.cycleId}</span>
              </div>
            ))}

            {goals.length === 0 && (
              <div className="p-4 text-center text-slate-500">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No active goals defined for this cycle.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Scroll-Reveal Review Timeline */}
        <div className="md:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur">
          <div className="flex items-center gap-2 mb-8">
            <Award className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Review Timeline</h2>
          </div>

          {/* Vertical Timeline Wrapper */}
          <div className="relative border-l border-slate-800 ml-3 pl-8 space-y-10">
            {mockTimeline.map((item, index) => {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="relative group"
                >
                  {/* Timeline Dot Node */}
                  <span className="absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-indigo-400 group-hover:scale-110 group-hover:border-indigo-500 transition-all duration-300">
                    <item.icon className="h-4 w-4" />
                  </span>

                  {/* Timeline Item Content Card */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-slate-800 hover:bg-slate-950/80 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-slate-500">Evaluated by: {item.manager}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize sm:text-right shrink-0 w-fit ${item.color}`}>
                        {item.rating}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed pl-3 border-l-2 border-slate-800 relative">
                      <Quote className="absolute -left-1 -top-1 h-3 w-3 opacity-20 text-indigo-400" />
                      <p>{item.comment}</p>
                    </div>

                    <span className="text-[9px] text-slate-600 block mt-3 font-semibold text-right">
                      {item.date}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
