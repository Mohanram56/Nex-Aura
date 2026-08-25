"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, BarChart3, TrendingUp, CheckSquare, AwardIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  goals: any[];
}

const mockTrendData = [
  { name: "Wk 31", completed: 4, assigned: 6 },
  { name: "Wk 32", completed: 8, assigned: 9 },
  { name: "Wk 33", completed: 5, assigned: 5 },
  { name: "Wk 34", completed: 11, assigned: 12 },
  { name: "Wk 35", completed: 9, assigned: 10 },
];

const stepperStages = [
  { id: 1, name: "Self Evaluation", desc: "Employees submit self reviews", status: "COMPLETED" },
  { id: 2, name: "Manager Review", desc: "Managers input feedback & rating", status: "ACTIVE" },
  { id: 3, name: "Calibration Meetings", desc: "Leadership review alignments", status: "UPCOMING" },
  { id: 4, name: "Sign-off & Letters", desc: "Finalize cycle declarations", status: "UPCOMING" },
];

export default function TeamPerformanceClient({ team }: { team: TeamMember[] }) {
  const [currentStep, setCurrentStep] = useState(2); // Step 2 (Manager Review) is active

  // Calculate average goal progress per employee
  const chartData = team.map((member) => {
    const totalProgress = member.goals.reduce((acc, g) => acc + g.progress, 0);
    const average = member.goals.length > 0 ? totalProgress / member.goals.length : 0;
    return {
      name: member.name.split(" ")[0],
      progress: Math.round(average),
    };
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Team Performance Analytics</h1>
        <p className="text-slate-400 text-sm">Review aggregate OKR progress, track deliverables, and manage appraisal cycles.</p>
      </div>

      {/* Review Cycle Tracker Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur space-y-6"
      >
        <h2 className="font-bold text-base text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400" /> Q3 Appraisal Cycle Pipeline
        </h2>

        {/* Stepper Progress Bar Row */}
        <div className="grid gap-6 sm:grid-cols-4 relative">
          {stepperStages.map((stage) => {
            const isCompleted = stage.status === "COMPLETED";
            const isActive = stage.status === "ACTIVE";
            return (
              <div key={stage.id} className="space-y-3 relative group">
                <div className="flex items-center gap-2.5">
                  {/* Step Bubble */}
                  <span
                    className={`h-8 w-8 rounded-full border font-bold text-xs flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                        : isActive
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? "✓" : stage.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{stage.name}</h4>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? "text-emerald-400"
                          : isActive
                          ? "text-indigo-400 animate-pulse"
                          : "text-slate-500"
                      }`}
                    >
                      {stage.status.toLowerCase()}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed pr-2">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recharts KPI Panel */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Goal Progress Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" /> Team OKR Completion Index (%)
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="progress" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task delivery trend line chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" /> Weekly Sprint Delivery Rate
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="assigned" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
