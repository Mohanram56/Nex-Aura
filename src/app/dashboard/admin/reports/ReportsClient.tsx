"use client";
import React from "react";
import { PieChart, Download, DollarSign, Users, Briefcase, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ReportsClient({ metrics }: { metrics: any }) {
  const { toast } = useToast();

  const handleExport = () => {
    toast({ title: "Export Started", description: "Generating Payroll CSV Report...", type: "success" });
    // In production, this would trigger a window.open to an /api/export route
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">HR Analytics & Reports</h1>
          <p className="text-slate-400 text-sm">Monitor enterprise headcount, payroll liabilities, and tax distributions.</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 w-fit">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Payroll Liability</p>
              <h3 className="text-2xl font-black text-white mt-1">${(metrics.grossMonthlyLiability).toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Per Month</p>
            </div>
          </div>
        </div>
        
        {/* Metric 2 */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total TDS & PF Collected</p>
              <h3 className="text-2xl font-black text-white mt-1">${(metrics.totalMonthlyTDS + metrics.totalMonthlyPF).toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Ready for Govt Remittance</p>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Headcount</p>
              <h3 className="text-2xl font-black text-white mt-1">{metrics.headcount}</h3>
              <p className="text-[10px] text-slate-500 mt-1">{metrics.bankLinkedCount} with Direct Deposit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur flex flex-col items-center justify-center py-20 text-center">
        <PieChart className="h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-300">Advanced Analytics Dashboard</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">Connect your PowerBI or Tableau integration to view deep-dive demographic charts and departmental budget variances.</p>
      </div>
    </div>
  );
}