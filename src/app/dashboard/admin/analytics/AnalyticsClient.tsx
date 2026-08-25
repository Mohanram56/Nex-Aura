"use client";

import React from "react";
import { motion } from "framer-motion";
import { AreaChart, FileDown, LineChart as LineIcon, PieChart as PieIcon, BarChart2, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useToast } from "@/components/ui/Toast";

const headcountData = [
  { name: "Q1-25", headcount: 120 },
  { name: "Q2-25", headcount: 135 },
  { name: "Q3-25", headcount: 150 },
  { name: "Q4-25", headcount: 158 },
  { name: "Q1-26", headcount: 165 },
  { name: "Q2-26", headcount: 172 },
  { name: "Q3-26", headcount: 180 },
];

const attritionData = [
  { name: "Jan", rate: 1.2 },
  { name: "Feb", rate: 0.8 },
  { name: "Mar", rate: 1.5 },
  { name: "Apr", rate: 0.5 },
  { name: "May", rate: 1.1 },
  { name: "Jun", rate: 2.1 },
  { name: "Jul", rate: 1.0 },
];

const costCenterData = [
  { name: "Engineering", value: 345000, color: "#6366f1" },
  { name: "HR", value: 72000, color: "#10b981" },
  { name: "Marketing", value: 98000, color: "#f59e0b" },
  { name: "Operations", value: 110000, color: "#06b6d4" },
];

export default function AnalyticsClient() {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    toast({
      title: "Generating Analytics Report",
      description: `Compiling charts in ${format} format...`,
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Executive Analytics</h1>
          <p className="text-slate-400 text-sm">Review headcount growths, operational attrition margins, and budget allocations.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExport("PDF")}
            className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="h-4 w-4" /> PDF Report
          </button>
          
          <button
            onClick={() => handleExport("EXCEL")}
            className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="h-4 w-4" /> Excel Sheet
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Headcount Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <LineIcon className="h-4 w-4 text-indigo-400" /> Headcount Growth Trend
          </h3>
          <div className="h-60 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={headcountData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line type="monotone" dataKey="headcount" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attrition Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" /> Monthly Turnover/Attrition (%)
          </h3>
          <div className="h-60 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attritionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cost-Center Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4 md:col-span-2 max-w-xl mx-auto w-full"
        >
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-indigo-400" /> Department Cost-Center Distribution
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="h-48 w-48 text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costCenterData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {costCenterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 text-xs font-semibold">
              {costCenterData.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-400 w-24">{d.name}:</span>
                  <span className="text-slate-200 font-bold">${d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
