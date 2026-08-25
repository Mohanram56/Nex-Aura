"use client";
import React, { useState } from "react";
import { Calculator, Landmark, ShieldCheck, Banknote } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { submitDeclaration, linkBankAccount } from "./actions";

export default function TaxesClient({ declarations, bankAccount }: { declarations: any[], bankAccount: any }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTaxSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submitDeclaration(
        fd.get("fiscalYear") as string,
        fd.get("regime") as string,
        parseFloat(fd.get("sec80C") as string),
        parseFloat(fd.get("sec80D") as string)
      );
      toast({ title: "Declaration Submitted", description: "HR will verify your tax investments.", type: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await linkBankAccount(
        fd.get("accountName") as string,
        fd.get("accountNumber") as string,
        fd.get("routingNumber") as string,
        fd.get("bankName") as string
      );
      toast({ title: "Bank Linked", description: "Direct Deposit configured successfully.", type: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Taxes & Payouts</h1>
        <p className="text-slate-400 text-sm">Declare your tax regime, investment deductions, and configure Direct Deposit.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tax Declaration Form */}
        <div className="space-y-6">
          <form onSubmit={handleTaxSubmit} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-4">
            <h2 className="font-bold text-slate-200 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" /> Tax Declaration
            </h2>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Fiscal Year</label>
                <select name="fiscalYear" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Regime</label>
                <select name="regime" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                  <option value="NEW">New Tax Regime</option>
                  <option value="OLD">Old Tax Regime</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Section 80C Investments (e.g. EPF, LIC)</label>
              <input type="number" name="sec80C" defaultValue={declarations[0]?.section80C || 0} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Section 80D Investments (e.g. Medical)</label>
              <input type="number" name="sec80D" defaultValue={declarations[0]?.section80D || 0} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all">
              Save Tax Declaration
            </button>
            {declarations.length > 0 && (
               <div className="pt-2 text-xs text-slate-500 flex justify-between">
                 <span>Status: {declarations[0].status}</span>
                 <span>Last updated: {new Date(declarations[0].updatedAt).toLocaleDateString()}</span>
               </div>
            )}
          </form>
        </div>

        {/* Bank Integrations Form */}
        <div className="space-y-6">
          <form onSubmit={handleBankSubmit} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur space-y-4">
            <h2 className="font-bold text-slate-200 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-indigo-400" /> Direct Deposit Configuration
            </h2>
            {bankAccount ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Bank Account Linked</h4>
                  <p className="text-xs text-emerald-500 font-mono mt-0.5">**** {bankAccount.accountNumber.slice(-4)} | {bankAccount.bankName}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 text-xs font-bold">
                No bank account linked. You must link an account to receive automated payouts.
              </div>
            )}
            
            <div>
              <label className="text-xs font-bold text-slate-400">Account Holder Name</label>
              <input type="text" name="accountName" defaultValue={bankAccount?.accountName} required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Bank Name</label>
              <input type="text" name="bankName" defaultValue={bankAccount?.bankName} required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Account Number</label>
                <input type="password" name="accountNumber" defaultValue={bankAccount?.accountNumber} required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
              <div className="w-1/2">
                <label className="text-xs font-bold text-slate-400">Routing / IFSC Code</label>
                <input type="text" name="routingNumber" defaultValue={bankAccount?.routingNumber} required className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono uppercase" />
              </div>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-2 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
              <Banknote className="h-4 w-4" /> Link Bank Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}