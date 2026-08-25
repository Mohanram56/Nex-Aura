"use client";
import React, { useState } from "react";
import { BookOpen, PlayCircle, CheckCircle, Award } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { enrollCourse, updateProgress } from "./actions";

export default function LearningClient({ courses, enrollments }: { courses: any[], enrollments: any[] }) {
  const { toast } = useToast();
  const [activeVideo, setActiveVideo] = useState<any>(null);

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollCourse(courseId);
      toast({ title: "Enrolled!", description: "You have successfully enrolled.", type: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  const simulateProgress = async (enrollmentId: string, currentProgress: number) => {
    try {
      const newProgress = Math.min(currentProgress + 25, 100);
      await updateProgress(enrollmentId, newProgress);
      if (newProgress === 100) {
        toast({ title: "Course Completed!", description: "You earned a badge!", type: "success" });
      } else {
        toast({ title: "Progress Saved", description: `${newProgress}% completed.`, type: "success" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  const unenrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Learning Management</h1>
        <p className="text-slate-400 text-sm">Enroll in compliance training and professional development courses.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" /> My Enrollments
          </h2>
          {enrollments.length === 0 && <p className="text-sm text-slate-500">You are not enrolled in any courses.</p>}
          <div className="grid gap-4">
            {enrollments.map(e => (
              <div key={e.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-200">{e.course.title}</h3>
                  {e.status === "COMPLETED" ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><Award className="h-3 w-3" /> COMPLETED</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">{e.progress}%</span>
                  )}
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${e.progress}%` }}></div>
                </div>

                {e.status !== "COMPLETED" && (
                  <button 
                    onClick={() => simulateProgress(e.id, e.progress)}
                    className="mt-2 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="h-4 w-4" /> Watch Lesson
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" /> Course Catalog
          </h2>
          {unenrolledCourses.length === 0 && <p className="text-sm text-slate-500">No new courses available.</p>}
          <div className="grid gap-4">
            {unenrolledCourses.map(c => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur">
                <h3 className="font-bold text-slate-200">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">{c.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">{c.credits} Credits</span>
                  <button 
                    onClick={() => handleEnroll(c.id)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}