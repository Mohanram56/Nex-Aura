"use client";
import React, { useState } from "react";
import { Clock, Plus, Briefcase, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { logHours } from "./actions";

export default function TimesheetsClient({ timesheets, projects }: { timesheets: any[], projects: any[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await logHours(
        fd.get("date") as string,
        parseFloat(fd.get("hours") as string),
        fd.get("projectId") as string,
        fd.get("description") as string
      );
      toast({ title: "Success", description: "Hours logged successfully", type: "success" });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Timesheets</h1>
        <p className="text-slate-400 text-sm">Log your billable hours against specific projects.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-4">
            <h2 className="font-bold text-slate-200">Log New Hours</h2>
            <div>
              <label className="text-xs font-bold text-slate-400">Date</label>
              <input type="date" name="date" required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Hours</label>
              <input type="number" step="0.5" name="hours" required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Project</label>
              <select name="projectId" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                <option value="">General (No Project)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Description</label>
              <textarea name="description" required rows={3} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"></textarea>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold">
              Submit Timesheet
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur divide-y divide-slate-800">
            {timesheets.length === 0 && <p className="text-sm text-slate-500 pb-4">No hours logged yet.</p>}
            {timesheets.map(t => (
              <div key={t.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-200 text-sm truncate">{t.description}</h3>
                    <span className="text-indigo-400 font-extrabold text-sm shrink-0 ml-2">{t.hours} hrs</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.date).toLocaleDateString()}</span>
                    {t.project && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {t.project.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}