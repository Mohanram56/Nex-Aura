"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, AlertCircle, FileText, ArrowRight, ArrowLeft, Send, Check } from "lucide-react";
import { submitLeaveRequest } from "../actions";
import { useToast } from "@/components/ui/Toast";

interface LeaveRequest {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string | null;
  createdAt: string;
}

// Simple Count-up hook
function useCountUp(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export default function LeaveClient({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>(leaveRequests);
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [type, setType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const annualLeft = useCountUp(12);
  const sickLeft = useCountUp(6);
  const casualLeft = useCountUp(3);

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!startDate || !endDate) {
        toast({
          title: "Dates Required",
          description: "Please select start and end dates before continuing.",
          type: "error",
        });
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        toast({
          title: "Invalid Range",
          description: "Start date cannot be after end date.",
          type: "error",
        });
        return;
      }
    }
    setWizardStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => prev - 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitLeaveRequest(type, startDate, endDate, reason);
      
      // Update local state list
      setRequests((prev) => [JSON.parse(JSON.stringify(result)), ...prev]);

      toast({
        title: "Leave Request Submitted",
        description: "Your request is now pending manager approval.",
        type: "success",
      });

      // Reset form
      setWizardStep(1);
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit request.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? "1 day" : `${days} days`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Leave Management</h1>
        <p className="text-slate-400 text-sm">Submit time-off requests and track your remaining leave balances.</p>
      </div>

      {/* Leave Balance Counters */}
      <div className="grid gap-6 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur text-center"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Annual Leaves</span>
          <span className="text-5xl font-extrabold text-indigo-400 tracking-tight">{annualLeft}</span>
          <span className="text-xs text-slate-400 block mt-2">Available out of 15 days</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur text-center"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Sick Leaves</span>
          <span className="text-5xl font-extrabold text-emerald-400 tracking-tight">{sickLeft}</span>
          <span className="text-xs text-slate-400 block mt-2">Available out of 8 days</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur text-center"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Casual Leaves</span>
          <span className="text-5xl font-extrabold text-cyan-400 tracking-tight">{casualLeft}</span>
          <span className="text-xs text-slate-400 block mt-2">Available out of 5 days</span>
        </motion.div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Leave Request Wizard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur flex flex-col justify-between min-h-[380px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-5 w-5 text-indigo-400" />
              <h2 className="font-bold text-lg text-slate-100">Apply for Leave</h2>
            </div>
            
            {/* Step Indicators / Progress bar */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex items-center gap-1.5">
                  <div
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      wizardStep >= step ? "bg-indigo-500" : "bg-slate-800"
                    }`}
                  />
                  {step < 3 && <span className="text-[10px] text-slate-600 font-bold">&gt;</span>}
                </div>
              ))}
            </div>

            {/* Form Steps container */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {wizardStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Leave Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="ANNUAL">Annual Leave</option>
                        <option value="SICK">Sick Leave</option>
                        <option value="CASUAL">Casual Leave</option>
                        <option value="UNPAID">Unpaid Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Start Date</label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">End Date</label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {wizardStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Reason for Leave</label>
                      <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Provide details about your request..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {wizardStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3 text-sm border border-slate-800/80 rounded-2xl p-4 bg-slate-950/40"
                  >
                    <h4 className="font-semibold text-slate-200 border-b border-slate-800/60 pb-2 mb-2">Request Summary</h4>
                    <p className="text-xs text-slate-400">Type: <span className="font-bold text-indigo-400 uppercase ml-1">{type}</span></p>
                    <p className="text-xs text-slate-400">Dates: <span className="font-semibold text-slate-200 ml-1">{startDate} to {endDate}</span></p>
                    <p className="text-xs text-slate-400">Duration: <span className="font-semibold text-slate-200 ml-1">{calculateDays(startDate, endDate)}</span></p>
                    <p className="text-xs text-slate-400 mt-2">Reason: <br /><span className="text-slate-300 italic block mt-1">"{reason}"</span></p>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Wizard Navigation Controls */}
          <div className="flex gap-3 border-t border-slate-800/60 pt-4 mt-6">
            {wizardStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            
            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors ml-auto"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleFormSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Submit <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Leave Requests History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-slate-100">Leave History</h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/30 flex justify-between items-start gap-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200 capitalize">{req.type.toLowerCase()} Leave</span>
                    <span className="text-[10px] text-slate-500">
                      Sub: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Range: <span className="font-semibold text-slate-300">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</span> ({calculateDays(req.startDate, req.endDate)})
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-500 italic mt-1">"{req.reason}"</p>
                  )}
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize shrink-0 ${getStatusColor(req.status)}`}>
                  {req.status.toLowerCase()}
                </span>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No leave requests found in database.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
