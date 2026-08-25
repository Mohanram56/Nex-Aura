"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldAlert, Sparkles, User, CalendarDays, Timer, MapPin, AlertCircle, Receipt } from "lucide-react";
import { processApproval, processBypassRequest } from "../actions";
import { processExpenseClaim } from "../../payroll/actions";
import { useToast } from "@/components/ui/Toast";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

export default function ApprovalsClient({ 
  pendingLeaves,
  pendingBypasses = [],
  pendingExpenses = []
}: { 
  pendingLeaves: LeaveRequest[];
  pendingBypasses?: any[];
  pendingExpenses?: any[];
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"LEAVE" | "BYPASS" | "EXPENSE">("LEAVE");
  const [queue, setQueue] = useState<LeaveRequest[]>(pendingLeaves);
  const [bypassQueue, setBypassQueue] = useState<any[]>(pendingBypasses);
  const [expenseQueue, setExpenseQueue] = useState<any[]>(pendingExpenses);
  
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bypassLoadingId, setBypassLoadingId] = useState<string | null>(null);
  const [expenseLoadingId, setExpenseLoadingId] = useState<string | null>(null);

  // Tracks the swipe exit animation direction
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(id);
    setExitDirection(status === "APPROVED" ? "right" : "left");

    try {
      await processApproval("LEAVE", id, status);

      setTimeout(() => {
        setQueue((prev) => prev.filter((item) => item.id !== id));
        setLoadingId(null);
      }, 250);

      toast({
        title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
        description: "Status successfully updated in DB.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to resolve request.",
        type: "error",
      });
      setLoadingId(null);
    }
  };

  const handleBypassAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setBypassLoadingId(id);
    try {
      await processBypassRequest(id, status);
      setBypassQueue((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: status === "APPROVED" ? "Bypass Approved" : "Bypass Rejected",
        description: `Bypass request has been ${status.toLowerCase()} successfully.`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Bypass Action Failed",
        description: err.message || "Failed to process bypass request.",
        type: "error",
      });
    } finally {
      setBypassLoadingId(null);
    }
  };

  const handleExpenseAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setExpenseLoadingId(id);
    try {
      await processExpenseClaim(id, status);
      setExpenseQueue((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: status === "APPROVED" ? "Expense Approved" : "Expense Rejected",
        description: `Reimbursement claim has been ${status.toLowerCase()} successfully.`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Expense Action Failed",
        description: err.message || "Failed to process expense claim.",
        type: "error",
      });
    } finally {
      setExpenseLoadingId(null);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? "1 day" : `${days} days`;
  };

  const activeCard = queue[0];

  return (
    <div className="space-y-8 max-w-lg mx-auto min-h-[500px] flex flex-col">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Approvals Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Review team leave requests, bypass locations, and expenses.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-950 border border-slate-850 rounded-2xl select-none">
        <button
          type="button"
          onClick={() => setActiveTab("LEAVE")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "LEAVE" ? "bg-indigo-600 text-white font-extrabold" : "text-slate-450 hover:text-slate-200"
          }`}
        >
          Leaves ({queue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("BYPASS")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "BYPASS" ? "bg-indigo-600 text-white font-extrabold" : "text-slate-450 hover:text-slate-200"
          }`}
        >
          GPS Bypasses ({bypassQueue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("EXPENSE")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "EXPENSE" ? "bg-indigo-600 text-white font-extrabold" : "text-slate-450 hover:text-slate-200"
          }`}
        >
          Expenses ({expenseQueue.length})
        </button>
      </div>

      {/* 1. LEAVE TAB CONTENT */}
      {activeTab === "LEAVE" && (
        <div className="flex-1 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {activeCard ? (
              <motion.div
                key={activeCard.id}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={
                  exitDirection === "right"
                    ? { x: 300, opacity: 0, rotate: 10, transition: { duration: 0.25 } }
                    : { x: -300, opacity: 0, rotate: -10, transition: { duration: 0.25 } }
                }
                className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md space-y-6"
              >
                {/* Header Profile */}
                <div className="flex items-center gap-3">
                  <img
                    src={activeCard.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={activeCard.user.name}
                    className="h-12 w-12 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-100">{activeCard.user.name}</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Leave Request Queue</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-400 text-[11px] uppercase tracking-wider block">Duration</span>
                      <span>
                        {new Date(activeCard.startDate).toLocaleDateString()} to {new Date(activeCard.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-400 text-[11px] uppercase tracking-wider block">Leave Type</span>
                      <span className="capitalize">{activeCard.type.toLowerCase()} ({calculateDays(activeCard.startDate, activeCard.endDate)})</span>
                    </div>
                  </div>

                  {activeCard.reason && (
                    <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850">
                      <span className="font-medium text-slate-450 text-[10px] uppercase tracking-widest block mb-1">Reason Description</span>
                      <p className="italic text-slate-300">"{activeCard.reason}"</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={loadingId === activeCard.id}
                    onClick={() => handleAction(activeCard.id, "REJECTED")}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === activeCard.id}
                    onClick={() => handleAction(activeCard.id, "APPROVED")}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-200">Leaves Cleared</h3>
                  <p className="text-xs text-slate-500 mt-1">No pending leave requests left in your inbox.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. BYPASS TAB CONTENT */}
      {activeTab === "BYPASS" && (
        <div className="flex-1 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {bypassQueue.length > 0 ? (
              <div className="w-full space-y-4">
                {bypassQueue.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.assignee.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-200 text-xs block">{item.assignee.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{item.project.name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-bold uppercase tracking-wider">
                        Bypass Requested
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-350">
                        <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>Task Site: <strong>{item.title}</strong></span>
                      </div>
                      {item.bypassReason && (
                        <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Mismatch Explanation</span>
                          <p className="text-slate-300 italic">"{item.bypassReason}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={bypassLoadingId === item.id}
                        onClick={() => handleBypassAction(item.id, "REJECTED")}
                        className="flex-1 py-2 px-3 rounded-lg border border-slate-800 hover:text-red-400 text-[11px] font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={bypassLoadingId === item.id}
                        onClick={() => handleBypassAction(item.id, "APPROVED")}
                        className="flex-1 py-2 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all"
                      >
                        Approve Bypass
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-200">GPS Bypasses Cleaned</h3>
                  <p className="text-xs text-slate-500 mt-1">No pending location geofence bypass requests.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. EXPENSE TAB CONTENT */}
      {activeTab === "EXPENSE" && (
        <div className="flex-1 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {expenseQueue.length > 0 ? (
              <div className="w-full space-y-4">
                {expenseQueue.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-200 text-xs block">{item.user.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Submitted claim</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-indigo-400 font-extrabold font-mono border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 rounded-lg select-none">
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-350">
                        <Receipt className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>Claim: <strong>{item.title}</strong></span>
                      </div>
                      {item.description && (
                        <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-0.5">Description notes</span>
                          <p className="text-slate-300 italic">"{item.description}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={expenseLoadingId === item.id}
                        onClick={() => handleExpenseAction(item.id, "REJECTED")}
                        className="flex-1 py-2 px-3 rounded-lg border border-slate-800 hover:text-red-400 text-[11px] font-bold transition-all"
                      >
                        Reject Claim
                      </button>
                      <button
                        type="button"
                        disabled={expenseLoadingId === item.id}
                        onClick={() => handleExpenseAction(item.id, "APPROVED")}
                        className="flex-1 py-2 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all"
                      >
                        Approve Reimbursement
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-200">Reimbursements Cleared</h3>
                  <p className="text-xs text-slate-500 mt-1">No pending expense claims require manager signature.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
