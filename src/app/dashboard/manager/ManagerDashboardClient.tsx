"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, AlertTriangle, CalendarRange, ArrowRight, CheckCircle2, XCircle, Award, Trophy, Flame } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { useToast } from "@/components/ui/Toast";
import { processApproval } from "./actions";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string; // ACTIVE, ON_LEAVE
  attendances: any[];
  assignedTasks: any[];
  shifts: any[];
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

interface LeaderboardItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  level: number;
  xp: number;
  streak: number;
  department: { name: string } | null;
}

interface DashboardData {
  teamMembers: TeamMember[];
  pendingLeaves: LeaveRequest[];
  teamShifts: any[];
  projects: any[];
  leaderboard: LeaderboardItem[];
}

export default function ManagerDashboardClient({ data }: { data: DashboardData }) {
  console.log("ManagerDashboardClient rendering with data:", data);
  const { toast } = useToast();
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>(data?.pendingLeaves || []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(data?.teamMembers || []);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApproval = async (id: string, status: "APPROVED" | "REJECTED") => {
    setApprovingId(id);
    try {
      await processApproval("LEAVE", id, status);
      
      // Update local state list
      setPendingLeaves((prev) => prev.filter((item) => item.id !== id));

      // Update team member status if approved
      if (status === "APPROVED") {
        const approvedRequest = pendingLeaves.find((item) => item.id === id);
        // Map over team members and set status to ON_LEAVE
        if (approvedRequest) {
          setTeamMembers((prev) =>
            prev.map((m) =>
              m.name === approvedRequest.user.name ? { ...m, status: "ON_LEAVE" } : m
            )
          );
        }
      }

      toast({
        title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
        description: "Employee has been notified.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to process request.",
        type: "error",
      });
    } finally {
      setApprovingId(null);
    }
  };

  // Calculations
  const totalTeam = teamMembers.length;
  
  // Count Clocked in / Late / On Leave today
  let clockedInCount = 0;
  let lateCount = 0;
  let onLeaveCount = 0;

  teamMembers.forEach((m) => {
    if (m.status === "ON_LEAVE") {
      onLeaveCount++;
    } else {
      const todayAtt = m?.attendances?.[0];
      if (todayAtt) {
        if (todayAtt.status === "PRESENT") clockedInCount++;
        if (todayAtt.status === "LATE") {
          clockedInCount++;
          lateCount++;
        }
      }
    }
  });

  const getMemberStatus = (m: TeamMember) => {
    if (m.status === "ON_LEAVE") return { label: "On Leave", color: "bg-cyan-500", text: "text-cyan-400" };
    const todayAtt = m?.attendances?.[0];
    if (!todayAtt) return { label: "Offline", color: "bg-slate-700", text: "text-slate-500" };
    if (todayAtt.status === "PRESENT") return { label: "Clocked In", color: "bg-emerald-500", text: "text-emerald-400" };
    if (todayAtt.status === "LATE") return { label: "Late Today", color: "bg-amber-500", text: "text-amber-400" };
    return { label: "Offline", color: "bg-slate-700", text: "text-slate-500" };
  };

  const getActiveTask = (m: TeamMember) => {
    const active = m?.assignedTasks?.find((t) => t.status !== "DONE");
    return active ? active.title : "No active task";
  };

  const getHoursLogged = (m: TeamMember) => {
    const todayAtt = m?.attendances?.[0];
    if (!todayAtt || !todayAtt.clockIn) return "0.00 hrs";
    const outTime = todayAtt.clockOut ? new Date(todayAtt.clockOut).getTime() : new Date().getTime();
    const diffMs = outTime - new Date(todayAtt.clockIn).getTime();
    return (diffMs / (1000 * 60 * 60)).toFixed(2) + " hrs";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Team Leadership Command</h1>
        <p className="text-slate-400 text-sm">Monitor employee attendance, task delivery, and process approvals.</p>
      </div>

      {/* Summary Widgets Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Team Size</span>
            <span className="text-3xl font-extrabold text-slate-100">{totalTeam}</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Active Now</span>
            <span className="text-3xl font-extrabold text-emerald-400">{clockedInCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Lateness Logs</span>
            <span className="text-3xl font-extrabold text-amber-400">{lateCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">On Leave</span>
            <span className="text-3xl font-extrabold text-cyan-400">{onLeaveCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <CalendarRange className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Team Live Status Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" /> Live Team Status Grid
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {teamMembers.map((member) => {
              const status = getMemberStatus(member);
              return (
                <TiltCard
                  key={member.id}
                  className="relative p-5 border border-slate-800 bg-slate-900/10 hover:border-slate-800/80 cursor-pointer overflow-hidden flex items-start gap-4"
                >
                  {/* Status Indicator Dot */}
                  <span className="absolute top-4 right-4 flex h-3.5 w-3.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color}`} />
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${status.color}`} />
                  </span>

                  <img
                    src={member.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={member.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-800 shrink-0"
                   referrerPolicy="no-referrer" />

                  <div className="flex-1 space-y-1 min-w-0 pr-4">
                    <h3 className="font-bold text-sm text-slate-200 truncate">{member.name}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${status.text}`}>{status.label}</p>
                    
                    {/* Hover Stats Panel */}
                    <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800/50 mt-3 pt-2">
                      <p className="truncate">Active: <span className="text-slate-200 font-semibold">{getActiveTask(member)}</span></p>
                      <p>Hours: <span className="text-slate-200 font-semibold">{getHoursLogged(member)}</span></p>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals peek */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-indigo-400" /> Pending Leaves
            </h2>
            <Link 
              href="/dashboard/manager/approvals" 
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              All Approvals <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pendingLeaves.slice(0, 3).map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`approval-${item.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: 50 }}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-4 relative group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={item.user.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-800"
                     referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{item.user.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {item.type} Leave Request
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Dates: <span className="font-semibold text-slate-300" suppressHydrationWarning>{new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}</span>
                  </p>
                  
                  {item.reason && (
                    <p className="text-xs text-slate-500 italic">"{item.reason}"</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-slate-850 pt-3">
                    <button
                      disabled={approvingId !== null}
                      onClick={() => handleApproval(item.id, "REJECTED")}
                      className="flex-1 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      disabled={approvingId !== null}
                      onClick={() => handleApproval(item.id, "APPROVED")}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {pendingLeaves.length === 0 && (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-900/5">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                <p className="text-xs">No pending leave approvals queue.</p>
              </div>
            )}
          </div>

          {/* Kudos Leaderboard Widget */}
          <div className="pt-4 space-y-4">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-400" /> Kudos Leaderboard
            </h2>
            
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4">
              <div className="divide-y divide-slate-800/50">
                {(data?.leaderboard || []).map((item, index) => {
                  const isTopThree = index < 3;
                  const podiumColors = [
                    "text-amber-400 border-amber-400/20 bg-amber-400/5",   // Gold
                    "text-slate-350 border-slate-300/20 bg-slate-300/5",   // Silver
                    "text-amber-700 border-amber-700/20 bg-amber-700/5",   // Bronze
                  ];
                  
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 group">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div className={`h-6 w-6 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                          isTopThree ? podiumColors[index] : "text-slate-500 border-slate-800 bg-slate-950/40"
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Avatar & Name */}
                        <img
                          src={item.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                          alt={item.name}
                          className="h-8 w-8 rounded-lg object-cover border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                            {item.department?.name || "General"}
                          </p>
                        </div>
                      </div>
                      
                      {/* XP and Level Info */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        {item.streak >= 3 && (
                          <div className="flex items-center gap-0.5 text-orange-400 text-[10px] font-bold" title={`${item.streak}-day active streak`}>
                            <Flame className="h-3.5 w-3.5 fill-current" />
                            <span>{item.streak}</span>
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="text-indigo-400 font-extrabold">Lvl {item.level}</span>
                          <span className="text-slate-500 text-[10px] block font-mono">{item.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(data?.leaderboard?.length || 0) === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No team activity tracked yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
