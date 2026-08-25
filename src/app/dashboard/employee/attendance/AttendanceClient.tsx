"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Clock, Info, CheckCircle2, AlertCircle } from "lucide-react";

interface AttendanceLog {
  id: string;
  userId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: string;
}

export default function AttendanceClient({ attendances }: { attendances: AttendanceLog[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Generate date list for heatmap (last 16 weeks / 112 days)
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 111; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      // Match with attendance records
      const record = attendances.find((a) => a.date === dateStr);
      days.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
        record,
      });
    }
    return days;
  }, [attendances]);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "LATE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "HALF_DAY":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
  };

  const getHeatmapColor = (status: string | undefined) => {
    if (!status) return "bg-slate-900 border-slate-800/80 hover:bg-slate-800";
    switch (status) {
      case "PRESENT":
        return "bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-500/30";
      case "LATE":
        return "bg-amber-500 hover:bg-amber-400 border-amber-400 shadow-sm shadow-amber-500/30";
      default:
        return "bg-cyan-500 hover:bg-cyan-400 border-cyan-400";
    }
  };

  const calculateHours = (inStr: string, outStr: string | null) => {
    if (!outStr) return "--";
    const diffMs = new Date(outStr).getTime() - new Date(inStr).getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2) + " hrs";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Attendance History</h1>
        <p className="text-slate-400 text-sm">Visualize your logged hours and clock-in health metrics.</p>
      </div>

      {/* Heatmap Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur"
      >
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h2 className="font-bold text-lg text-slate-100">Attendance Activity Heatmap</h2>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {heatmapDays.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.003, type: "spring", stiffness: 150 }}
              className={`h-5 w-5 rounded-md border flex shrink-0 cursor-help transition-all duration-200 ${getHeatmapColor(
                day.record?.status
              )}`}
              title={`${day.dayLabel}: ${day.record ? day.record.status : "No log (Rest/Absent)"}`}
            />
          ))}
        </div>

        {/* Map Legend */}
        <div className="flex justify-end gap-4 mt-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded bg-slate-900 border border-slate-800" />
            <span>Rest/Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded bg-amber-500" />
            <span>Late</span>
          </div>
        </div>
      </motion.div>

      {/* Accordion Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20"
      >
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-indigo-400" />
          <h2 className="font-bold text-lg text-slate-100">Timesheet Log</h2>
        </div>

        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden md:flex px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
            <div className="w-1/4">Date</div>
            <div className="w-1/4">Clock In</div>
            <div className="w-1/4">Clock Out</div>
            <div className="w-1/6">Duration</div>
            <div className="w-1/6 text-right">Status</div>
          </div>

          {/* Table Body Accordion */}
          {attendances.map((log) => {
            const isExpanded = expandedRow === log.id;
            return (
              <div 
                key={log.id} 
                className={`border rounded-2xl transition-all duration-300 ${
                  isExpanded ? "border-slate-700 bg-slate-900/50" : "border-slate-800/60 bg-slate-950/20 hover:border-slate-800"
                }`}
              >
                {/* Accordion Trigger Header */}
                <div
                  onClick={() => toggleRow(log.id)}
                  className="flex flex-col md:flex-row md:items-center px-6 py-4 cursor-pointer gap-2 select-none"
                >
                  <div className="w-full md:w-1/4 font-semibold text-sm">
                    {new Date(log.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  
                  <div className="flex justify-between md:contents">
                    <div className="w-auto md:w-1/4 text-xs md:text-sm text-slate-300 flex items-center gap-1.5">
                      <span className="md:hidden text-slate-500 font-medium">In:</span>
                      {new Date(log.clockIn).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div className="w-auto md:w-1/4 text-xs md:text-sm text-slate-300 flex items-center gap-1.5">
                      <span className="md:hidden text-slate-500 font-medium">Out:</span>
                      {log.clockOut 
                        ? new Date(log.clockOut).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) 
                        : "Active"}
                    </div>
                    
                    <div className="w-auto md:w-1/6 text-xs md:text-sm text-slate-400 flex items-center gap-1.5">
                      <span className="md:hidden text-slate-500 font-medium">Worked:</span>
                      {calculateHours(log.clockIn, log.clockOut)}
                    </div>
                    
                    <div className="w-auto md:w-1/6 text-right flex md:justify-end items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusColor(log.status)}`}>
                        {log.status.toLowerCase().replace("_", " ")}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 border-t border-slate-800/80 text-xs text-slate-400 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-200 flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 text-indigo-400" /> Attendance Audit Information
                          </h4>
                          <p>Record ID: <span className="font-mono text-slate-300">{log.id}</span></p>
                          <p>Database Date: <span className="text-slate-300">{log.date}</span></p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-200 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Shift Verification
                          </h4>
                          <p>Full Clock-in: <span className="text-slate-300">{new Date(log.clockIn).toString()}</span></p>
                          {log.clockOut && (
                            <p>Full Clock-out: <span className="text-slate-300">{new Date(log.clockOut).toString()}</span></p>
                          )}
                          {!log.clockOut && (
                            <p className="text-indigo-400 font-semibold animate-pulse">Session active. Remember to clock out at shift end.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {attendances.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No attendance logs found in database.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
