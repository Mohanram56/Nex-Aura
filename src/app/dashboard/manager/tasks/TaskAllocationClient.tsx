"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, CalendarDays, Plus, UserCheck, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { assignTask } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  assignedTasks: any[];
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  priority: string;
  assignee: {
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  tasks: ProjectTask[];
}

export default function TaskAllocationClient({
  team,
  projects,
}: {
  team: TeamMember[];
  projects: Project[];
}) {
  const { toast } = useToast();
  const [teamList, setTeamList] = useState<TeamMember[]>(team);
  const [projectList, setProjectList] = useState<Project[]>(projects);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"KANBAN" | "GANTT">("KANBAN");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [geofenceRadius, setGeofenceRadius] = useState("200");
 
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !projectId) {
      toast({
        title: "Field Missing",
        description: "Please select both a team member and a project.",
        type: "error",
      });
      return;
    }
    setLoading(true);

    try {
      const result = await assignTask(
        title,
        description,
        assigneeId,
        projectId,
        priority,
        dueDate,
        siteName || undefined,
        latitude ? parseFloat(latitude) : undefined,
        longitude ? parseFloat(longitude) : undefined,
        geofenceRadius ? parseFloat(geofenceRadius) : undefined
      );
      
      const mappedTask = {
        ...JSON.parse(JSON.stringify(result)),
        assignee: {
          name: team.find((t) => t.id === assigneeId)?.name || "",
          avatarUrl: team.find((t) => t.id === assigneeId)?.avatarUrl || null,
        },
      };

      // Update local projects state
      setProjectList((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, mappedTask] } : p))
      );

      // Update team list count
      setTeamList((prev) =>
        prev.map((m) =>
          m.id === assigneeId ? { ...m, assignedTasks: [...m.assignedTasks, mappedTask] } : m
        )
      );

      toast({
        title: "Task Assigned",
        description: `Successfully allocated task to ${mappedTask.assignee.name}.`,
        type: "success",
      });

      // Reset
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setProjectId("");
      setDueDate("");
      setSiteName("");
      setLatitude("12.9716");
      setLongitude("77.5946");
      setGeofenceRadius("200");
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.message || "Failed to create task.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLoadColor = (count: number) => {
    if (count <= 1) return "bg-emerald-500 shadow-emerald-500/20";
    if (count <= 3) return "bg-amber-500 shadow-amber-500/20";
    return "bg-red-500 shadow-red-500/20";
  };

  const getLoadText = (count: number) => {
    if (count <= 1) return "text-emerald-400 font-bold uppercase tracking-wider";
    if (count <= 3) return "text-amber-400 font-bold uppercase tracking-wider";
    return "text-red-400 font-bold uppercase tracking-wider animate-pulse";
  };

  // Get active tasks per user (not done)
  const getActiveTasksCount = (member: TeamMember) => {
    return member.assignedTasks.filter((t) => t.status !== "DONE").length;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Task Allocation & Sprints</h1>
          <p className="text-slate-400 text-sm">Distribute workloads, balance backlogs, and plan sprint schedules.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode("KANBAN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 select-none ${
                viewMode === "KANBAN" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("GANTT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 select-none ${
                viewMode === "GANTT" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Gantt
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
          >
            <Plus className="h-4 w-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Workload Balancing Chart Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-slate-850 pb-4">
          <UserCheck className="h-5 w-5 text-indigo-400" />
          <h2 className="font-bold text-lg text-slate-100">Workload Balance Index</h2>
        </div>

        <div className="space-y-4 max-w-2xl">
          {teamList.map((member) => {
            const activeCount = getActiveTasksCount(member);
            // Express progress bar percentage based on maximum load of 5 tasks
            const pct = Math.min((activeCount / 5) * 100, 100);
            return (
              <div key={member.id} className="grid grid-cols-12 items-center gap-4 text-xs font-semibold">
                <div className="col-span-3 flex items-center gap-2">
                  <img
                    src={member.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={member.name}
                    className="h-7 w-7 rounded-full object-cover border border-slate-850"
                   referrerPolicy="no-referrer" />
                  <span className="text-slate-200 truncate">{member.name}</span>
                </div>
                
                {/* Horizontal workload bar */}
                <div className="col-span-6 h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-lg ${getLoadColor(activeCount)}`}
                  />
                </div>

                <div className="col-span-3 text-right">
                  <span className="text-slate-400 mr-2">{activeCount} active</span>
                  <span className={`${getLoadText(activeCount)}`}>
                    {activeCount >= 4 ? "Overloaded" : activeCount >= 2 ? "Balanced" : "Optimal"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Boards Section */}
      <AnimatePresence mode="wait">
        {viewMode === "KANBAN" ? (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {projectList.map((project) => (
              <div key={project.id} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/10 space-y-4">
                <h3 className="font-extrabold text-slate-100 text-base">{project.name} Sprint</h3>
                
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => {
                    const statusTasks = project.tasks.filter((t) => t.status === status);
                    return (
                      <div key={status} className="p-3 rounded-2xl bg-slate-950/40 border border-slate-850/60 min-h-[160px] space-y-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-850 pb-1.5 flex justify-between">
                          <span>{status.replace("_", " ")}</span>
                          <span>{statusTasks.length}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {statusTasks.map((t) => (
                            <div key={t.id} className="p-3 rounded-xl border border-slate-850 bg-slate-900/60 text-xs">
                              <h5 className="font-bold text-slate-200 line-clamp-1">{t.title}</h5>
                              <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 border-t border-slate-850 pt-1.5">
                                <span className="truncate">{t.assignee?.name || "Unassigned"}</span>
                                <span>{t.priority}</span>
                              </div>
                            </div>
                          ))}
                          {statusTasks.length === 0 && (
                            <p className="text-[10px] text-slate-600 text-center py-6">Empty</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* Gantt Chart View */
          <motion.div
            key="gantt-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/10 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <CalendarDays className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-lg text-slate-100">Gantt Timeline Chart</h3>
            </div>

            <div className="space-y-4">
              {projectList.map((project) => (
                <div key={project.id} className="space-y-3">
                  <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest">{project.name}</h4>
                  
                  {project.tasks.map((task) => {
                    const startOffset = Math.floor(Math.random() * 4); // Mock offsets for visualization
                    const duration = 2 + Math.floor(Math.random() * 3);
                    return (
                      <div key={task.id} className="grid grid-cols-12 items-center gap-4 text-xs">
                        <span className="col-span-3 text-slate-200 font-semibold truncate">{task.title}</span>
                        <div className="col-span-9 h-6 w-full bg-slate-950 rounded-xl relative overflow-hidden">
                          {/* Gantt Bar */}
                          <div
                            style={{
                              marginLeft: `${(startOffset / 10) * 100}%`,
                              width: `${(duration / 10) * 100}%`,
                            }}
                            className="absolute top-1 h-4 rounded bg-indigo-500/80 shadow border border-indigo-400/20 text-[9px] font-black text-white flex items-center justify-center truncate px-1 shadow-indigo-500/10"
                          >
                            {task.assignee?.name || "Unassigned"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create & Assign New Task"
        size="md"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Database Migrations, Design primitives..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detailed objectives..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Employee...</option>
                  {teamList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Project Sprint</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Project...</option>
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

             <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Geofencing Settings */}
            <div className="space-y-3 pt-3.5 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Geofence Site Coordinates</span>
              
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Location / Site Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Chennai Office, Site A..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-405 font-semibold block mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="12.9716"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-405 font-semibold block mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="77.5946"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-405 font-semibold block mb-0.5">Radius (Meters)</label>
                  <input
                    type="number"
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(e.target.value)}
                    placeholder="200"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-855 pt-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Allocate Task"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
