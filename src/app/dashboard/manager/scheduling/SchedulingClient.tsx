"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Plus, Trash2, ShieldAlert, ArrowLeft, ArrowRight, User } from "lucide-react";
import { createOrUpdateShift, deleteShift } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  user: TeamMember;
}

export default function SchedulingClient({
  team,
  shifts: initialShifts,
}: {
  team: TeamMember[];
  shifts: Shift[];
}) {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selected state for editing/adding
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  
  // Conflict state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Week selection (current week by default)
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    // Start from Monday of the current week (+offset)
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push({
        dateStr: day.toISOString().split("T")[0],
        label: day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleCellClick = (userId: string, dateStr: string) => {
    // Check if shift already exists
    const existing = shifts.find((s) => s.userId === userId && s.date === dateStr);
    
    setSelectedUserId(userId);
    setSelectedDate(dateStr);
    setConflictWarning(null);

    if (existing) {
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setEditingShiftId(existing.id);
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
      setEditingShiftId(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConflictWarning(null);

    // Client-side conflict pre-check
    const existsConflict = shifts.find(
      (s) => s.userId === selectedUserId && s.date === selectedDate && s.id !== editingShiftId
    );

    if (existsConflict) {
      setConflictWarning(`Overlap Alert: Employee already scheduled for a shift on this day.`);
      setLoading(false);
      return;
    }

    try {
      const result = await createOrUpdateShift(editingShiftId, selectedUserId, selectedDate, startTime, endTime);
      
      // Update local shifts state
      const mappedResult = {
        ...JSON.parse(JSON.stringify(result)),
        user: team.find((t) => t.id === selectedUserId)!,
      };

      if (editingShiftId) {
        setShifts((prev) => prev.map((s) => (s.id === editingShiftId ? mappedResult : s)));
      } else {
        setShifts((prev) => [...prev, mappedResult]);
      }

      toast({
        title: "Shift Saved Successfully",
        description: `Scheduled shift on ${selectedDate} for ${startTime} - ${endTime}`,
        type: "success",
      });
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Roster Conflict",
        description: err.message || "Failed to schedule shift.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!editingShiftId) return;
    setLoading(true);

    try {
      await deleteShift(editingShiftId);
      setShifts((prev) => prev.filter((s) => s.id !== editingShiftId));
      toast({
        title: "Shift Deleted",
        description: "Roster slot successfully removed.",
        type: "success",
      });
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to remove shift.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Shift Builder & Scheduling</h1>
          <p className="text-slate-400 text-sm">Organize weekly employee rosters and resolve schedule clashes.</p>
        </div>

        {/* Week switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold px-3 select-none">
            {weekOffset === 0 ? "Current Week" : `Week Offset: ${weekOffset}`}
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Roster Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-slate-800 rounded-3xl bg-slate-900/10 overflow-hidden shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest min-w-[150px]">Team Member</th>
                {weekDays.map((day) => (
                  <th key={day.dateStr} className="p-4 text-xs font-bold text-slate-400 border-l border-slate-800/60 min-w-[120px] text-center">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-slate-900/10 transition-colors">
                  {/* Member Name */}
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={member.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={member.name}
                      className="h-8 w-8 rounded-lg object-cover border border-slate-800"
                     referrerPolicy="no-referrer" />
                    <span className="font-semibold text-xs text-slate-200">{member.name}</span>
                  </td>

                  {/* Day Slots */}
                  {weekDays.map((day) => {
                    const shift = shifts.find((s) => s.userId === member.id && s.date === day.dateStr);
                    return (
                      <td
                        key={day.dateStr}
                        onClick={() => handleCellClick(member.id, day.dateStr)}
                        className="p-3 border-l border-slate-850 cursor-pointer text-center relative"
                      >
                        {shift ? (
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-2 rounded-xl text-[10px] font-bold text-indigo-400 flex flex-col justify-center gap-0.5"
                          >
                            <span className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider">
                              {shift.status}
                            </span>
                          </motion.div>
                        ) : (
                          <div className="py-3 text-[10px] text-slate-600 font-bold hover:text-slate-400 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                            <Plus className="h-3.5 w-3.5" /> Roster
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Roster Config Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShiftId ? "Edit Scheduled Shift" : "Schedule New Shift"}
        size="sm"
      >
        <form onSubmit={handleSaveShift} className="space-y-5">
          {/* Conflict Warning Animation */}
          <AnimatePresence>
            {conflictWarning && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400 animate-pulse"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-950 p-3 border border-slate-850 rounded-xl">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Roster For</span>
                <span className="text-sm font-semibold text-white">
                  {team.find((t) => t.id === selectedUserId)?.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Shift Start</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Shift End</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-850 pt-4 mt-6">
            {editingShiftId && (
              <button
                type="button"
                onClick={handleDeleteShift}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Save Shift Schedule"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
