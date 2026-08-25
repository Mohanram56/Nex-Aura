"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, CheckCircle2, Play, Hourglass, ClipboardList, Calendar, Flag, Eye, Sparkles, MapPin, Navigation, Compass, Crosshair, Timer, Clock, AlertCircle, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { updateTaskStatus, punchInToTask, punchOutOfTask, calibrateTaskLocation, requestBypass } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string; // TODO, IN_PROGRESS, REVIEW, DONE
  dueDate: string | null;
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  project: {
    id: string;
    name: string;
  } | null;
  
  // Geofencing details
  siteName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadius?: number | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  clockInLat?: number | null;
  clockInLng?: number | null;
  clockOutLat?: number | null;
  clockOutLng?: number | null;
  actualDuration?: number | null;

  // Bypass & Signature details
  bypassRequested?: boolean;
  bypassReason?: string | null;
  bypassApproved?: boolean;
  customerSignature?: string | null;
}

const columns = [
  { id: "TODO", title: "To Do", icon: ListTodo, color: "text-slate-400 bg-slate-900/50" },
  { id: "IN_PROGRESS", title: "In Progress", icon: Play, color: "text-indigo-400 bg-indigo-500/5" },
  { id: "REVIEW", title: "Review", icon: Hourglass, color: "text-amber-400 bg-amber-500/5" },
  { id: "DONE", title: "Completed", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/5" },
];

export default function TasksClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [xpAwardedTaskId, setXpAwardedTaskId] = useState<string | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Drawing Canvas & Bypass Forms
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showBypassForm, setShowBypassForm] = useState(false);
  const [bypassReasonText, setBypassReasonText] = useState("");
  const [bypassSending, setBypassSending] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);

  // Tick elapsed minutes for the currently active task if in-progress
  useEffect(() => {
    if (!activeTask || activeTask.status !== "IN_PROGRESS" || !activeTask.clockInTime) {
      setElapsedMinutes(0);
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(activeTask.clockInTime!).getTime();
      const now = new Date().getTime();
      setElapsedMinutes(Math.max(0, Math.floor((now - start) / 60000)));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [activeTask]);

  // Signature Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#38bdf8"; // nice sky blue line
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePunchIn = async (taskId: string) => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const result = await punchInToTask(taskId, latitude, longitude, accuracy);

          if (result.success && result.task) {
            toast({
              title: "Checked In & Started Work",
              description: `Successfully clocked in. Distance verified!`,
              type: "success",
            });

            const parsedTask = JSON.parse(JSON.stringify(result.task)) as Task;
            setTasks((prev) => prev.map((t) => (t.id === taskId ? parsedTask : t)));
            setActiveTask(parsedTask);
          } else {
            setGpsError(result.error || "Failed to check in.");
            toast({
              title: "Punch In Blocked",
              description: result.error || "Not on-site",
              type: "error",
            });
          }
        } catch (err: any) {
          setGpsError(err.message || "Failed to connect to database.");
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        setGpsError(`GPS Access Error: ${error.message}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRequestBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !bypassReasonText.trim()) return;

    setBypassSending(true);
    try {
      const result = await requestBypass(activeTask.id, bypassReasonText);
      if (result.success && result.task) {
        toast({
          title: "Bypass Requested",
          description: "Location bypass request sent to manager.",
          type: "success",
        });

        const parsedTask = JSON.parse(JSON.stringify(result.task)) as Task;
        setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? parsedTask : t)));
        setActiveTask(parsedTask);
        setShowBypassForm(false);
        setBypassReasonText("");
      }
    } catch (err: any) {
      toast({
        title: "Bypass Request Failed",
        description: err.message || "Failed to submit bypass.",
        type: "error",
      });
    } finally {
      setBypassSending(false);
    }
  };

  const handlePunchOut = async (taskId: string) => {
    // Open the digital signature pad first
    setShowSignaturePad(true);
  };

  const handleSignatureSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTask) return;

    // Capture canvas base64 image URL
    const signatureDataUrl = canvas.toDataURL("image/png");

    setSignatureLoading(true);
    setGpsLoading(true);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setSignatureLoading(false);
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const result = await punchOutOfTask(activeTask.id, latitude, longitude, accuracy, signatureDataUrl);

          if (result.success && result.task) {
            toast({
              title: "Task Completed & Signed",
              description: `Checkout successful. Work verified!`,
              type: "success",
            });

            setXpAwardedTaskId(activeTask.id);
            setTimeout(() => {
              setXpAwardedTaskId(null);
            }, 1500);

            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#10b981", "#34d399", "#6366f1"],
            });

            const parsedTask = JSON.parse(JSON.stringify(result.task)) as Task;
            setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? parsedTask : t)));
            setActiveTask(parsedTask);
            setShowSignaturePad(false);
          } else {
            setGpsError(result.error || "Failed to check out.");
            toast({
              title: "Punch Out Blocked",
              description: result.error || "Not on-site",
              type: "error",
            });
          }
        } catch (err: any) {
          setGpsError(err.message || "Failed to connect to database.");
        } finally {
          setSignatureLoading(false);
          setGpsLoading(false);
        }
      },
      (error) => {
        setSignatureLoading(false);
        setGpsLoading(false);
        setGpsError(`GPS Access Error: ${error.message}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCalibrate = async (taskId: string) => {
    setCalibratingId(taskId);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setCalibratingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await calibrateTaskLocation(taskId, latitude, longitude);

          if (result.success && result.task) {
            toast({
              title: "Location Calibrated",
              description: `Task coordinates set to: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              type: "success",
            });

            const parsedTask = JSON.parse(JSON.stringify(result.task)) as Task;
            setTasks((prev) => prev.map((t) => (t.id === taskId ? parsedTask : t)));
            setActiveTask(parsedTask);
          }
        } catch (err: any) {
          toast({
            title: "Calibration Failed",
            description: err.message || "Unable to update task coordinates.",
            type: "error",
          });
        } finally {
          setCalibratingId(null);
        }
      },
      (error) => {
        setCalibratingId(null);
        setGpsError(`GPS Access Error: ${error.message}.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setLoadingId(taskId);
    try {
      const updated = await updateTaskStatus(taskId, newStatus);
      
      // Update local task state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t))
      );

      // If moved to DONE, trigger celebration confetti & floating XP animation!
      if (newStatus === "DONE") {
        setXpAwardedTaskId(taskId);
        setTimeout(() => {
          setXpAwardedTaskId(null);
        }, 1500);

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6366f1"],
        });
      }

      toast({
        title: "Task Updated",
        description: `Status changed to ${newStatus.replace("_", " ")}`,
        type: "success",
      });

      // Update active modal task if open
      if (activeTask && activeTask.id === taskId) {
        setActiveTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update task.",
        type: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "MEDIUM":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const openDetailModal = (task: Task) => {
    setActiveTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Task Board</h1>
          <p className="text-slate-400 text-sm">Organize and manage your project deliverables on the Kanban board.</p>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid gap-6 md:grid-cols-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`rounded-3xl border border-slate-800/80 p-4 min-w-[250px] space-y-4 flex flex-col min-h-[500px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40 shrink-0">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <col.icon className="h-4.5 w-4.5" />
                  <span>{col.title}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-850 text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layoutId={`task-card-${task.id}`}
                      layout
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileDrag={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg cursor-pointer hover:border-indigo-500/30 transition-colors duration-300 relative group"
                      onClick={() => openDetailModal(task)}
                    >
                      {/* Priority Tag */}
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider mb-2.5 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      
                      {/* Title */}
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">{task.title}</h4>
                      
                      {/* Description snippet */}
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      {/* Geofence Site Indicator */}
                      {task.siteName && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-400 font-medium bg-indigo-500/5 px-2 py-0.5 rounded-lg border border-indigo-500/10 w-fit select-none">
                          <MapPin className="h-3 w-3 fill-indigo-400/20 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{task.siteName}</span>
                        </div>
                      )}

                      {/* Project and Date Footer */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/50 mt-3 pt-2">
                        <span>{task.project?.name || "No Project"}</span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      {/* Loader overlay */}
                      {loadingId === task.id && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-2xl flex items-center justify-center z-10">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        </div>
                      )}

                      {/* Floating XP Award Spark */}
                      <AnimatePresence>
                        {xpAwardedTaskId === task.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: -45, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] shadow-lg border border-amber-400 z-30 select-none pointer-events-none flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3 fill-current text-amber-250" />
                            <span>+100 XP</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="h-full flex items-center justify-center py-12 text-center text-xs text-slate-500 border-2 border-dashed border-slate-900 rounded-2xl">
                    No tasks in this column.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Detail Slide-up Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Task Detailed Specifications"
        size="md"
      >
        {activeTask && (
          <div className="space-y-6">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider mb-2 ${getPriorityColor(activeTask.priority)}`}>
                {activeTask.priority} Priority
              </span>
              <h2 className="text-xl font-bold text-slate-100 leading-tight">{activeTask.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Project: <span className="font-semibold text-slate-300">{activeTask.project?.name || "General"}</span></p>
            </div>

            {activeTask.description && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Description</span>
                <p className="text-sm text-slate-300 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
                  {activeTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 p-4 border border-slate-800/60 rounded-2xl">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Due Date</span>
                <span className="text-slate-200 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }) : "No deadline"}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Current Status</span>
                <span className="text-indigo-400 font-bold capitalize">{activeTask.status.toLowerCase().replace("_", " ")}</span>
              </div>
            </div>

            {/* Geofence & Punch Work Session Actions */}
            <div className="space-y-4 border-t border-slate-850 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Site Verification</span>
                {activeTask.siteName && (
                  <span className="text-[10px] text-slate-400 font-mono">Radius: {activeTask.geofenceRadius ?? 200}m</span>
                )}
              </div>

              {activeTask.siteName ? (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{activeTask.siteName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Target Coordinates: {activeTask.latitude?.toFixed(6) ?? 0.0}, {activeTask.longitude?.toFixed(6) ?? 0.0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific site assigned to this task.</p>
              )}

              {gpsError && !activeTask.bypassRequested && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Verification Error</span>
                      <span className="leading-relaxed text-[11px] block mt-0.5">{gpsError}</span>
                    </div>
                  </div>
                  {activeTask.status !== "DONE" && !showBypassForm && (
                    <button
                      type="button"
                      onClick={() => setShowBypassForm(true)}
                      className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-[10px] font-bold text-white transition-colors w-fit shadow-md shadow-amber-900/10"
                    >
                      Request Location Bypass from Manager
                    </button>
                  )}
                </div>
              )}

              {/* Bypass Form Panel */}
              {showBypassForm && (
                <form onSubmit={handleRequestBypassSubmit} className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3.5">
                  <span className="text-xs font-bold text-amber-400 block border-b border-amber-500/10 pb-1.5">Submit Location Bypass Request</span>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Reason for Bypass</label>
                    <textarea
                      required
                      value={bypassReasonText}
                      onChange={(e) => setBypassReasonText(e.target.value)}
                      placeholder="e.g. Weak indoor GPS lock, incorrect address pin coordinates on file..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowBypassForm(false)}
                      className="py-1.5 px-3 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-450 hover:bg-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bypassSending}
                      className="py-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-colors"
                    >
                      {bypassSending ? "Submitting..." : "Send Request"}
                    </button>
                  </div>
                </form>
              )}

              {/* Bypass Pending Notice */}
              {activeTask.bypassRequested && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                  <Timer className="h-5 w-5 text-amber-400 animate-pulse shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-400 block">Bypass Approval Pending</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                      Reason: "{activeTask.bypassReason}"
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1.5">
                      Your manager Narmatha has been notified. This task can be started once approved.
                    </span>
                  </div>
                </div>
              )}

              {/* Active Session details */}
              {activeTask.status === "IN_PROGRESS" && activeTask.clockInTime && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
                      <Timer className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Active Work Session</span>
                      <span className="text-xs text-slate-350 block">Punched In: {new Date(activeTask.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {activeTask.bypassApproved && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-450 uppercase mt-1">Location Bypassed</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Elapsed Time</span>
                    <span className="text-sm font-extrabold text-indigo-400 font-mono">{elapsedMinutes} mins</span>
                  </div>
                </div>
              )}

              {/* Complete Log for Done tasks */}
              {activeTask.status === "DONE" && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Work Verified On-Site</span>
                      <span className="text-xs text-slate-355 block">Completed in {activeTask.actualDuration ?? 0} mins</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-500 border-t border-slate-800/40 pt-3">
                    <div>
                      <span className="font-semibold text-slate-450 uppercase block text-[9px] mb-0.5">Punch-In GPS</span>
                      {activeTask.clockInLat?.toFixed(6) ?? "N/A"}, {activeTask.clockInLng?.toFixed(6) ?? "N/A"}
                      <span className="text-[9px] text-slate-650 block mt-0.5">
                        {activeTask.clockInTime ? new Date(activeTask.clockInTime).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-455 uppercase block text-[9px] mb-0.5">Punch-Out GPS</span>
                      {activeTask.clockOutLat?.toFixed(6) ?? "N/A"}, {activeTask.clockOutLng?.toFixed(6) ?? "N/A"}
                      <span className="text-[9px] text-slate-655 block mt-0.5">
                        {activeTask.clockOutTime ? new Date(activeTask.clockOutTime).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  </div>

                  {activeTask.customerSignature && (
                    <div className="border-t border-slate-800/40 pt-3 space-y-1">
                      <span className="font-semibold text-slate-450 uppercase block text-[9px]">Customer Signature</span>
                      <div className="bg-slate-950 p-2 border border-slate-800 rounded-2xl inline-block">
                        <img 
                          src={activeTask.customerSignature} 
                          alt="Customer Signature" 
                          className="max-h-16 object-contain py-1 px-4 max-w-[200px] select-none pointer-events-none" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Button Trigger Section */}
              <div className="flex flex-col gap-2">
                {activeTask.status !== "DONE" && !activeTask.bypassRequested && (
                  <button
                    disabled={gpsLoading}
                    onClick={() => activeTask.status === "IN_PROGRESS" ? handlePunchOut(activeTask.id) : handlePunchIn(activeTask.id)}
                    className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all duration-300 ${
                      activeTask.status === "IN_PROGRESS"
                        ? "bg-red-600 hover:bg-red-500 shadow-red-500/10 text-white"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/15 text-white"
                    }`}
                  >
                    {gpsLoading ? (
                      <>
                        <Crosshair className="h-4 w-4 animate-spin" />
                        <span>Verifying GPS Location...</span>
                      </>
                    ) : activeTask.status === "IN_PROGRESS" ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Punch Out & Complete Work</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4" />
                        <span>Punch In & Start Work</span>
                      </>
                    )}
                  </button>
                )}

                {/* Developer Calibration Tool */}
                {activeTask.status !== "DONE" && !activeTask.bypassRequested && (
                  <button
                    type="button"
                    disabled={calibratingId !== null}
                    onClick={() => handleCalibrate(activeTask.id)}
                    className="w-full py-2.5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 hover:text-slate-300 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all mt-1"
                  >
                    <Compass className={`h-3.5 w-3.5 ${calibratingId === activeTask.id ? "animate-spin" : ""}`} />
                    <span>
                      {calibratingId === activeTask.id ? "Calibrating..." : "Calibrate Site to My Current Location (Testing Helper)"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Signature Pad Modal */}
      <Modal
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        title="Customer Signature Verification"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Please ask the customer to sign on the pad below to verify completion of this field service repair.
          </p>
          
          <div className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={350}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full bg-slate-950 cursor-crosshair block touch-none"
            />
            <div className="absolute top-2 right-3 text-[9px] text-slate-600 font-mono select-none pointer-events-none uppercase">
              Customer Touch Screen Signature
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-colors"
            >
              Clear Pad
            </button>
            <button
              type="button"
              disabled={signatureLoading}
              onClick={handleSignatureSubmit}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white transition-colors"
            >
              {signatureLoading ? "Submitting..." : "Confirm & Complete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
