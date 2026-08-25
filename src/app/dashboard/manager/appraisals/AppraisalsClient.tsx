"use client";
import React, { useState } from "react";
import { Award, Star } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { submitAppraisal } from "./actions";

export default function AppraisalsClient({ team, appraisals }: { team: any[], appraisals: any[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submitAppraisal(
        fd.get("userId") as string,
        fd.get("quarter") as string,
        parseInt(fd.get("year") as string),
        parseInt(fd.get("rating") as string),
        fd.get("feedback") as string
      );
      toast({ title: "Success", description: "Appraisal submitted", type: "success" });
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
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Team Appraisals</h1>
        <p className="text-slate-400 text-sm">Submit quarterly performance reviews for your team members.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-4">
            <h2 className="font-bold text-slate-200">New Review</h2>
            <div>
              <label className="text-xs font-bold text-slate-400">Employee</label>
              <select name="userId" required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Quarter</label>
                <select name="quarter" required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Year</label>
                <input type="number" name="year" defaultValue={new Date().getFullYear()} required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Rating (1-5)</label>
              <input type="number" min="1" max="5" name="rating" required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Feedback</label>
              <textarea name="feedback" required rows={4} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"></textarea>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold">
              Publish Appraisal
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur divide-y divide-slate-800">
            {appraisals.length === 0 && <p className="text-sm text-slate-500 pb-4">No appraisals submitted yet.</p>}
            {appraisals.map(a => (
              <div key={a.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-200 text-sm truncate">{a.user.name}</h3>
                    <div className="flex items-center gap-1 text-amber-400 ml-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-extrabold text-sm">{a.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{a.feedback}</p>
                  <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold text-slate-500">
                    <span>{a.quarter} {a.year}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
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