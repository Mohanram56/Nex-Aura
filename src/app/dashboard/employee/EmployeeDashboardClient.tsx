"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Sun, Moon, Clock, Calendar, CheckSquare, Sparkles, ArrowRight, Check, Timer, MapPin, Receipt, Plus, Minus, DollarSign, Printer, ShieldAlert, Award, Zap, Flame, Trophy, Eye } from "lucide-react";
import confetti from "canvas-confetti";
import { clockInOrOut } from "./actions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { submitExpenseClaim, updateKRAProgress } from "../payroll/actions";

interface DashboardData {
  attendance: any;
  shifts: any[];
  leaveRequests: any[];
  tasks: any[];
  goals: any[];
  documents: any[];
  notifications: any[];
  userProfile?: any;
  salaryStructure: any;
  payslips: any[];
  expenseClaims: any[];
  kras: any[];
}

const BadgeIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "Zap":
      return <Zap className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Award":
      return <Award className={className} />;
    default:
      return <Trophy className={className} />;
  }
};

export default function EmployeeDashboardClient({
  data,
  user,
}: {
  data: DashboardData;
  user: any;
}) {
  const { toast } = useToast();
  const [activeDashboardTab, setActiveDashboardTab] = useState<"OVERVIEW" | "PAYROLL" | "GOALS">("OVERVIEW");
  const [attendance, setAttendance] = useState(data.attendance);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");

  // Expense Claims states
  const [expenseClaims, setExpenseClaims] = useState<any[]>(data.expenseClaims);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // KRA states
  const [kras, setKras] = useState<any[]>(data.kras);
  const [updatingKraId, setUpdatingKraId] = useState<string | null>(null);

  // Payslip preview states
  const [activePayslip, setActivePayslip] = useState<any | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Celebrate Level Up dynamically using local storage
  const currentLevel = data.userProfile?.level ?? 1;
  useEffect(() => {
    const lastLevel = localStorage.getItem("last_level");
    if (lastLevel && parseInt(lastLevel) < currentLevel) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b"],
      });
      toast({
        title: "🎉 LEVEL UP!",
        description: `Congratulations! You reached Level ${currentLevel}!`,
        type: "success",
      });
    }
    localStorage.setItem("last_level", currentLevel.toString());
  }, [currentLevel, toast]);

  // Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  const isDaytime = () => {
    const hr = new Date().getHours();
    return hr >= 6 && hr < 18;
  };

  const handleClockToggle = async () => {
    setLoading(true);
    try {
      const result = await clockInOrOut();
      setAttendance(result.attendance);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#6366f1", "#8b5cf6", "#10b981"],
      });

      toast({
        title: result.type === "CLOCK_IN" ? "Clocked In Successfully" : "Clocked Out Successfully",
        description: result.type === "CLOCK_IN" 
          ? `Status marked as ${result.attendance.status}` 
          : "Have a great evening!",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Clock Action Failed",
        description: err.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount.trim()) return;

    setSubmittingExpense(true);
    try {
      const claim = await submitExpenseClaim(expenseTitle, parseFloat(expenseAmount), expenseDesc);
      
      toast({
        title: "Claim Submitted",
        description: "Your travel reimbursement request has been routed to your manager.",
        type: "success",
      });

      setExpenseClaims((prev) => [JSON.parse(JSON.stringify(claim)), ...prev]);
      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseDesc("");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Unable to submit claim.",
        type: "error",
      });
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleKRAIncrement = async (kraId: string, currentProgress: number, target: number, increment: number) => {
    const newProgress = Math.min(target, Math.max(0, currentProgress + increment));
    if (newProgress === currentProgress) return;

    setUpdatingKraId(kraId);
    try {
      const updated = await updateKRAProgress(kraId, newProgress);
      
      // Update local state
      setKras((prev) =>
        prev.map((k) => (k.id === kraId ? { ...k, progress: updated.progress } : k))
      );

      if (newProgress === target) {
        confetti({
          particleCount: 50,
          spread: 40,
          colors: ["#10b981", "#34d399", "#6366f1"],
        });
        toast({
          title: "Goal Completed! 🎉",
          description: "Outstanding work achieving this KRA target!",
          type: "success",
        });
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to save KRA progress.",
        type: "error",
      });
    } finally {
      setUpdatingKraId(null);
    }
  };

  const openPayslipPreview = (slip: any) => {
    setActivePayslip(slip);
    setIsPayslipModalOpen(true);
  };

  const getMonthName = (num: number) => {
    return new Date(2000, num - 1, 1).toLocaleString("en-US", { month: "long" });
  };

  const completedTasks = data.tasks.filter(t => t.status === "DONE").length;
  const pendingTasks = data.tasks.filter(t => t.status !== "DONE").length;
  const totalTasks = data.tasks.length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Animation layout configs
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      
      {/* Tab Switcher & Greeting Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: isDaytime() ? [0, 360] : 0 }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className={`p-3 rounded-2xl ${isDaytime() ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"} border border-current/10 shrink-0`}
          >
            {isDaytime() ? <Sun className="h-7 w-7" /> : <Moon className="h-7 w-7" />}
          </motion.div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Today is {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-2xl select-none shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setActiveDashboardTab("OVERVIEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDashboardTab === "OVERVIEW" ? "bg-indigo-600 text-white" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveDashboardTab("PAYROLL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDashboardTab === "PAYROLL" ? "bg-indigo-600 text-white" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Payroll & Expenses
          </button>
          <button
            type="button"
            onClick={() => setActiveDashboardTab("GOALS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDashboardTab === "GOALS" ? "bg-indigo-600 text-white" : "text-slate-455 hover:text-slate-200"
            }`}
          >
            KRA Goals ({kras.length})
          </button>
        </div>
      </motion.div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: OVERVIEW */}
        {activeDashboardTab === "OVERVIEW" && (
          <motion.div
            key="overview-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Announcements */}
            <div className="w-full bg-indigo-500/5 border border-indigo-500/10 rounded-2xl py-3 px-4 overflow-hidden flex items-center gap-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider shrink-0 select-none">
                Notice
              </span>
              <div className="w-full overflow-hidden relative h-5">
                <div className="absolute whitespace-nowrap animate-marquee flex gap-10 text-xs text-slate-350">
                  <span>🚀 Annual Performance cycles are opening next week. Fill out your OKRs!</span>
                  <span>📅 Company Team Outing scheduled for August 28th. RSVP in email.</span>
                  <span>💻 System upgrades completed. Report any issues to IT desk.</span>
                </div>
              </div>
            </div>

            {/* Dashboard grid widgets */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              
              {/* Time recorder */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur flex flex-col items-center justify-between text-center min-h-[280px]">
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-100 mb-0.5">Time Recorder</h3>
                  <p className="text-[10px] text-slate-500">Record your working hours for today</p>
                </div>

                <div className="my-4">
                  <button
                    onClick={handleClockToggle}
                    disabled={loading || (attendance?.clockIn && attendance?.clockOut)}
                    className={`h-28 w-28 rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-350 ${
                      !attendance?.clockIn
                        ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 border-indigo-400 shadow-indigo-500/10 text-white"
                        : !attendance.clockOut
                        ? "bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-emerald-400 shadow-emerald-500/10 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-600"
                    }`}
                  >
                    {loading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : !attendance?.clockIn ? (
                      <>
                        <Clock className="h-8 w-8 mb-0.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Clock In</span>
                      </>
                    ) : !attendance.clockOut ? (
                      <>
                        <Check className="h-8 w-8 mb-0.5 animate-bounce" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Clock Out</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-8 w-8 mb-0.5 text-slate-700" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-0.5 text-[10px] text-slate-400">
                  {attendance?.clockIn && (
                    <p>In: <span className="font-semibold text-slate-200">{new Date(attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> ({attendance.status})</p>
                  )}
                  {attendance?.clockOut && (
                    <p>Out: <span className="font-semibold text-slate-200">{new Date(attendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                  )}
                  {!attendance?.clockIn && <p>You are not clocked in yet.</p>}
                </div>
              </div>

              {/* Rewards */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-base tracking-tight text-slate-100">My Rewards</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-extrabold select-none">
                      <Flame className="h-3 w-3 fill-current" />
                      <span>{data.userProfile?.streak ?? 0} Day Streak</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">Track your levels, XP and badges</p>
                </div>

                <div className="my-2 space-y-2.5">
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[8px] uppercase font-bold text-slate-500">Level</span>
                      <span className="text-2xl font-extrabold text-indigo-400">{data.userProfile?.level ?? 1}</span>
                    </div>
                    <span className="text-[9px] text-slate-450 font-semibold">
                      {data.userProfile?.xp ?? 0} / {(data.userProfile?.level ?? 1) * 500} XP
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-850 overflow-hidden relative border border-slate-800/85">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((data.userProfile?.xp ?? 0) / ((data.userProfile?.level ?? 1) * 500)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-550 block">Badges</span>
                    <div className="flex flex-wrap gap-1">
                      {data.userProfile?.badges?.map((badge: any) => (
                        <div 
                          key={badge.id}
                          className="group relative h-7.5 w-7.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-violet-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/20 transition-all cursor-help"
                        >
                          <BadgeIcon name={badge.icon} className="h-3.5 w-3.5" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block bg-slate-950 text-[9px] text-slate-350 p-2 rounded-lg border border-slate-800 shadow-xl pointer-events-none z-30 leading-normal">
                            <p className="font-bold text-violet-450 text-center">{badge.name}</p>
                            <p className="leading-tight mt-0.5 text-center text-slate-400">{badge.description}</p>
                          </div>
                        </div>
                      ))}
                      {(data.userProfile?.badges?.length ?? 0) === 0 && (
                        <p className="text-[9px] text-slate-600 italic">No badges yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] border-t border-slate-800/60 pt-3">
                  <span className="text-slate-500 font-medium">Rank #1 Marcus Chen</span>
                  <span className="text-indigo-400 font-bold uppercase tracking-wider">
                    {((data.userProfile?.level ?? 1) * 500) - (data.userProfile?.xp ?? 0)} XP Left
                  </span>
                </div>
              </div>

              {/* Leave radial progress */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-100 mb-0.5">Leave Balance</h3>
                  <p className="text-[10px] text-slate-500">Annual Paid Leaves overview</p>
                </div>

                <div className="flex justify-center items-center my-3 relative h-28">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="38" className="stroke-slate-850 fill-none" strokeWidth="6" />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-indigo-500 fill-none"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 38}
                      initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - 15 / 20) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-100">15</span>
                    <span className="text-[8px] text-slate-500 uppercase font-semibold">Days Left</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-slate-800/60 pt-3">
                  <span className="text-slate-400">Total: 20 Days</span>
                  <Link href="/dashboard/employee/leave" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                    Request Leave <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Task progress */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-100 mb-0.5">My Tasks</h3>
                  <p className="text-[10px] text-slate-500">Overview of assigned activities</p>
                </div>

                <div className="space-y-3.5 my-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-extrabold text-slate-100">{completedTasks}/{totalTasks}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{Math.round(taskProgress)}% Completed</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${taskProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {pendingTasks} tasks in progress.
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-slate-800/60 pt-3">
                  <span className="text-slate-400">Apollo Project Sprint</span>
                  <Link href="/dashboard/employee/tasks" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                    Go to Board <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Shifts & Updates */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20">
                <h3 className="font-bold text-sm text-slate-100 mb-3 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Upcoming Shifts
                </h3>
                <div className="divide-y divide-slate-800/60">
                  {data.shifts.map((shift) => (
                    <div key={shift.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <h4 className="font-semibold text-xs text-slate-200">{new Date(shift.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{shift.startTime} - {shift.endTime}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {shift.status}
                      </span>
                    </div>
                  ))}
                  {data.shifts.length === 0 && (
                    <p className="text-xs text-slate-500 py-6 text-center italic">No upcoming shifts scheduled.</p>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20">
                <h3 className="font-bold text-sm text-slate-100 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> Recent Updates
                </h3>
                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                  {data.notifications.map((notif) => (
                    <div key={notif.id} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-850 text-[11px] text-slate-350">
                      <p className="leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-slate-600 block mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {data.notifications.length === 0 && (
                    <p className="text-xs text-slate-550 py-8 text-center italic">All caught up!</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PAYROLL & EXPENSES */}
        {activeDashboardTab === "PAYROLL" && (
          <motion.div
            key="payroll-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Left Column: Salary Structure & Expenses Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Salary Structure Info */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5 text-indigo-400" /> Salary Structure
                </h3>
                {data.salaryStructure ? (
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-400">Basic Monthly Pay</span>
                      <span className="font-bold font-mono text-slate-100">${data.salaryStructure.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-400">House Rent Allowance (HRA)</span>
                      <span className="font-bold font-mono text-slate-100">${data.salaryStructure.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-400">Special Allowances</span>
                      <span className="font-bold font-mono text-slate-100">${data.salaryStructure.allowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-1.5 text-red-400">
                      <span>Provident Fund (PF)</span>
                      <span className="font-bold font-mono">-${data.salaryStructure.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-450">
                      <span>Professional Tax</span>
                      <span className="font-bold font-mono">-${data.salaryStructure.tax.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 italic flex flex-col items-center gap-2 bg-slate-950/20 rounded-2xl border border-slate-900">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    <span>No Salary Structure defined yet.</span>
                  </div>
                )}
              </div>

              {/* Submit Expense Claim */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Receipt className="h-4.5 w-4.5 text-indigo-400" /> Submit Expense Claim
                </h3>
                <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Claim Title</label>
                    <input
                      type="text"
                      required
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="e.g. Fuel - Chennai Customer Site visit"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Reimbursement Amount ($)</label>
                    <input
                      type="number"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="120"
                      className="w-full rounded-xl border border-slate-800 bg-slate-955 py-2 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Description / Notes</label>
                    <textarea
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Attach travel justification or receipt details..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingExpense}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/10"
                  >
                    {submittingExpense ? "Submitting..." : "Request Reimbursement"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Columns: Payslips history & Expense log list */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payslip History List */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Printer className="h-4.5 w-4.5 text-indigo-400" /> Historical Payslips
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {data.payslips.map((slip) => (
                    <div 
                      key={slip.id} 
                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/20 flex items-center justify-between shadow-sm hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">
                            {getMonthName(slip.month)} {slip.year}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            slip.status === "PAID"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-450"
                          }`}>
                            {slip.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          Net Pay: <span className="text-indigo-400 font-bold font-mono">${slip.netPay.toLocaleString()}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPayslipPreview(slip)}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-450 hover:text-slate-200 transition-colors"
                        title="View Detailed Payslip"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {data.payslips.length === 0 && (
                    <p className="col-span-2 text-xs text-slate-550 py-8 text-center italic">No monthly payslips processed yet.</p>
                  )}
                </div>
              </div>

              {/* Expense Claims history */}
              <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Receipt className="h-4.5 w-4.5 text-indigo-400" /> Expense Claims Directory
                </h3>
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {expenseClaims.map((claim) => (
                    <div 
                      key={claim.id} 
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <span className="font-bold text-slate-200 block">{claim.title}</span>
                        {claim.description && (
                          <p className="text-[10px] text-slate-500 italic line-clamp-1">"{claim.description}"</p>
                        )}
                        <span className="text-[9px] text-slate-600 block">Submitted: {new Date(claim.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="text-right space-y-1.5 shrink-0">
                        <span className="font-mono font-bold text-slate-150 block">${claim.amount.toLocaleString()}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                          claim.status === "APPROVED"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                            : claim.status === "REJECTED"
                            ? "bg-red-500/10 border-red-500/20 text-red-450"
                            : "bg-slate-900 border-slate-800 text-slate-500"
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {expenseClaims.length === 0 && (
                    <p className="text-xs text-slate-550 py-8 text-center italic">No expense claims submitted.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: KRA GOALS */}
        {activeDashboardTab === "GOALS" && (
          <motion.div
            key="goals-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {kras.map((kra) => {
              const progressPct = kra.target > 0 ? (kra.progress / kra.target) * 100 : 0;
              const isFinished = kra.progress >= kra.target;

              return (
                <div 
                  key={kra.id}
                  className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between min-h-[170px] relative overflow-hidden transition-all duration-300 ${
                    isFinished 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-slate-900/40 border-slate-800"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-bold text-sm text-slate-200 leading-tight">{kra.title}</h4>
                      {isFinished && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 shrink-0 select-none">
                          Completed
                        </span>
                      )}
                    </div>
                    {kra.dueDate && (
                      <span className="text-[9px] text-slate-500 font-mono block">
                        Target Date: {new Date(kra.dueDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-end text-xs font-mono">
                      <span className="font-bold text-slate-400">
                        {kra.progress} / {kra.target} completed
                      </span>
                      <span className={`font-extrabold ${isFinished ? "text-emerald-450" : "text-indigo-400"}`}>
                        {Math.round(progressPct)}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden relative">
                      <motion.div 
                        className={`h-full rounded-full ${
                          isFinished 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                            : "bg-gradient-to-r from-indigo-500 to-violet-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>

                    {/* Progress Adjuster Tools */}
                    {!isFinished && (
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          disabled={updatingKraId === kra.id || kra.progress <= 0}
                          onClick={() => handleKRAIncrement(kra.id, kra.progress, kra.target, -1)}
                          className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={updatingKraId === kra.id}
                          onClick={() => handleKRAIncrement(kra.id, kra.progress, kra.target, 1)}
                          className="h-7 w-7 rounded-lg bg-indigo-650 hover:bg-indigo-650 flex items-center justify-center text-white transition-colors shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {kras.length === 0 && (
              <div className="col-span-2 py-16 text-center text-xs text-slate-550 border border-dashed border-slate-800 rounded-3xl bg-slate-900/5">
                <h3 className="font-bold text-slate-250 mb-0.5">No Goals Active</h3>
                <p className="text-[10px] text-slate-500">Your manager has not set any KRA performance goals for you.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Printable Payslip Preview Modal */}
      <Modal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        title="Compensation Payslip Preview"
        size="md"
      >
        {activePayslip && (
          <div className="space-y-6">
            <div id="print-area" className="p-6 border border-slate-800 bg-slate-950 rounded-2xl space-y-6 text-slate-350 select-none">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <img src="/nex-aura-logo.png" alt="Nex Aura Logo" className="h-8.5 object-contain mb-1.5" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">Workforce Compensation Sheet</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">PAYSLIP FOR {getMonthName(activePayslip.month).toUpperCase()} {activePayslip.year}</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Ref ID: {activePayslip.id.substring(0, 8)}...</span>
                </div>
              </div>

              {/* Employee metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Employee Information</span>
                  <span className="font-bold text-slate-300 block">{data.userProfile?.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{data.userProfile?.email}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-slate-900 border border-slate-800 text-slate-400 capitalize mt-1.5">{data.userProfile?.role.replace("_", " ").toLowerCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Payroll Details</span>
                  <span className="text-slate-350 block">Worked Days: {activePayslip.workedDays}</span>
                  <span className="text-slate-350 block">Unpaid Leaves: {activePayslip.unpaidLeaves}</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border mt-1.5 ${
                    activePayslip.status === "PAID"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-450"
                  }`}>
                    {activePayslip.status}
                  </span>
                </div>
              </div>

              {/* Calculations tables */}
              <div className="grid grid-cols-2 gap-6 border-t border-b border-slate-800/80 py-4 text-xs">
                {/* Earnings */}
                <div className="space-y-2 border-r border-slate-850 pr-4">
                  <span className="text-[9px] uppercase font-extrabold text-indigo-400 tracking-wider block mb-1">Earnings breakdown</span>
                  <div className="flex justify-between text-slate-350">
                    <span>Basic Salary</span>
                    <span className="font-mono text-slate-200">${data.salaryStructure?.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="font-mono text-slate-200">${data.salaryStructure?.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>Special Allowance</span>
                    <span className="font-mono text-slate-200">${data.salaryStructure?.allowance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 pl-4">
                  <span className="text-[9px] uppercase font-extrabold text-red-400 tracking-wider block mb-1">Deductions breakdown</span>
                  <div className="flex justify-between text-slate-350">
                    <span>Provident Fund (PF)</span>
                    <span className="font-mono text-slate-200">${data.salaryStructure?.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>Professional Tax</span>
                    <span className="font-mono text-slate-200">${data.salaryStructure?.tax.toLocaleString()}</span>
                  </div>
                  {activePayslip.unpaidLeaves > 0 && (
                    <div className="flex justify-between text-amber-500 font-medium">
                      <span>Unpaid Leaves penalty</span>
                      <span className="font-mono">
                        -${Math.round((activePayslip.earnings - activePayslip.deductions + (data.salaryStructure?.pf || 0) + (data.salaryStructure?.tax || 0) - activePayslip.netPay) * 100) / 100}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reimbursements */}
              <div className="flex flex-col gap-2 border-b border-slate-855 pb-4 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-slate-250">${activePayslip.earnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Deductions</span>
                  <span className="font-mono text-slate-250">-${(activePayslip.deductions).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-450 font-medium">
                  <span>Approved Expense Reimbursements</span>
                  <span className="font-mono">+${activePayslip.reimbursements.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Payout */}
              <div className="flex justify-between items-center p-3.5 bg-slate-900 rounded-2xl">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Net Payout</span>
                  <span className="text-[8px] text-slate-550 block font-mono">Credited to Employee account</span>
                </div>
                <span className="text-lg font-extrabold text-indigo-400 font-mono">${activePayslip.netPay.toLocaleString()}</span>
              </div>
            </div>

            {/* Print action controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPayslipModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-850 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-4 w-4 text-indigo-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
