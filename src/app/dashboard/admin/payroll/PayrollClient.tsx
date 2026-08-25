"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, FileSpreadsheet, Download, RefreshCw, CheckCircle2, ShieldAlert, Settings, Edit, Eye, User, CalendarDays, Printer, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { upsertSalaryStructure, calculateMonthlyPayroll, finalizePayslipPayment } from "../../payroll/actions";

interface SalaryStructure {
  id: string;
  userId: string;
  basic: number;
  hra: number;
  allowance: number;
  pf: number;
  tax: number;
}

interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  workedDays: number;
  unpaidLeaves: number;
  earnings: number;
  deductions: number;
  reimbursements: number;
  netPay: number;
  status: string; // PENDING, PAID
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  salaryStructure: SalaryStructure | null;
  payslips: Payslip[];
}

export default function PayrollClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Salary structure form states
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [basic, setBasic] = useState("30000");
  const [hra, setHra] = useState("15000");
  const [allowance, setAllowance] = useState("5000");
  const [pf, setPf] = useState("1800");
  const [tax, setTax] = useState("200");
  const [savingSalary, setSavingSalary] = useState(false);

  // Batch Pay Run states
  const [isPayrunModalOpen, setIsPayrunModalOpen] = useState(false);
  const [payrunMonth, setPayrunMonth] = useState(new Date().getMonth() + 1);
  const [payrunYear, setPayrunYear] = useState(new Date().getFullYear());
  const [payrunStep, setPayrunStep] = useState(0); // 0: Idle, 1: Running, 2: Done
  const [payrunProgress, setPayrunProgress] = useState("");

  // Preview Payslip states
  const [activePayslip, setActivePayslip] = useState<Payslip | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  // Expanded row state (to view past payslips list)
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  const handleConfigureSalary = (emp: Employee) => {
    setSelectedEmployee(emp);
    if (emp.salaryStructure) {
      setBasic(emp.salaryStructure.basic.toString());
      setHra(emp.salaryStructure.hra.toString());
      setAllowance(emp.salaryStructure.allowance.toString());
      setPf(emp.salaryStructure.pf.toString());
      setTax(emp.salaryStructure.tax.toString());
    } else {
      setBasic("30000");
      setHra("15000");
      setAllowance("5000");
      setPf("1800");
      setTax("200");
    }
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSavingSalary(true);
    try {
      const updated = await upsertSalaryStructure(
        selectedEmployee.id,
        parseFloat(basic),
        parseFloat(hra),
        parseFloat(allowance),
        parseFloat(pf),
        parseFloat(tax)
      );

      toast({
        title: "Salary Structured Saved",
        description: `Successfully configured compensations for ${selectedEmployee.name}`,
        type: "success",
      });

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, salaryStructure: JSON.parse(JSON.stringify(updated)) }
            : emp
        )
      );
      setIsSalaryModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to update salary configuration.",
        type: "error",
      });
    } finally {
      setSavingSalary(false);
    }
  };

  const handleRunBatchPayrun = async () => {
    setPayrunStep(1);
    setPayrunProgress("Initializing monthly payroll batch parameters...");

    // Filter employees with a salary structure defined
    const eligibleEmployees = employees.filter((emp) => emp.salaryStructure !== null);

    if (eligibleEmployees.length === 0) {
      setPayrunStep(0);
      toast({
        title: "Pay Run Aborted",
        description: "No employees have active salary structures configured yet.",
        type: "error",
      });
      return;
    }

    let successCount = 0;
    const updatedEmployees = [...employees];

    for (let i = 0; i < eligibleEmployees.length; i++) {
      const emp = eligibleEmployees[i];
      setPayrunProgress(`[${i + 1}/${eligibleEmployees.length}] Calculating net pay for ${emp.name}...`);
      
      try {
        const payslip = await calculateMonthlyPayroll(emp.id, payrunMonth, payrunYear);
        
        // Find employee in temporary array and append/update payslip
        const empIndex = updatedEmployees.findIndex((u) => u.id === emp.id);
        if (empIndex > -1) {
          const parsedPayslip = JSON.parse(JSON.stringify(payslip));
          const existingSlipIndex = updatedEmployees[empIndex].payslips.findIndex(
            (p) => p.month === payrunMonth && p.year === payrunYear
          );

          if (existingSlipIndex > -1) {
            updatedEmployees[empIndex].payslips[existingSlipIndex] = parsedPayslip;
          } else {
            updatedEmployees[empIndex].payslips = [parsedPayslip, ...updatedEmployees[empIndex].payslips];
          }
        }
        successCount++;
      } catch (err: any) {
        console.error(`Failed payrun calculation for ${emp.name}:`, err);
      }
    }

    setEmployees(updatedEmployees);
    setPayrunStep(2);
    setPayrunProgress(`Batch complete! Successfully processed ${successCount} out of ${eligibleEmployees.length} employees.`);
    
    toast({
      title: "Batch Payrun Completed",
      description: `Generated ${successCount} employee payslips.`,
      type: "success",
    });
  };

  const handleReleasePayment = async (payslipId: string, empId: string) => {
    setReleasingId(payslipId);
    try {
      const updated = await finalizePayslipPayment(payslipId);
      
      toast({
        title: "Payment Released",
        description: "Payslip status marked as PAID.",
        type: "success",
      });

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === empId) {
            return {
              ...emp,
              payslips: emp.payslips.map((p) =>
                p.id === payslipId ? { ...p, status: "PAID" } : p
              ),
            };
          }
          return emp;
        })
      );

      // If active preview is open, update it
      if (activePayslip && activePayslip.id === payslipId) {
        setActivePayslip((prev) => (prev ? { ...prev, status: "PAID" } : null));
      }
    } catch (err: any) {
      toast({
        title: "Authorization Failed",
        description: err.message || "Failed to finalize payment.",
        type: "error",
      });
    } finally {
      setReleasingId(null);
    }
  };

  const openPayslipPreview = (slip: Payslip, emp: Employee) => {
    setActivePayslip(slip);
    setPreviewEmployee(emp);
    setIsPayslipModalOpen(true);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const getMonthName = (num: number) => {
    return new Date(2000, num - 1, 1).toLocaleString("en-US", { month: "long" });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Zoho Payroll Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage employee monthly compensation models and run batch payroll calculators.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPayrunStep(0);
              setIsPayrunModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-900/10"
          >
            <Banknote className="h-4 w-4" />
            <span>Run Monthly Payroll</span>
          </button>
        </div>
      </div>

      {/* Directory Grid Table */}
      <div className="border border-slate-800 bg-slate-900/20 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Salary Structure</th>
                <th className="py-4 px-6">Gross Earnings</th>
                <th className="py-4 px-6">Deductions (PF/Tax)</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-y-slate-800/40 text-xs">
              {employees.map((emp) => {
                const isExpanded = expandedEmployeeId === emp.id;
                const totalEarnings = emp.salaryStructure 
                  ? (emp.salaryStructure.basic + emp.salaryStructure.hra + emp.salaryStructure.allowance)
                  : 0;
                const totalDeductions = emp.salaryStructure
                  ? (emp.salaryStructure.pf + emp.salaryStructure.tax)
                  : 0;

                return (
                  <React.Fragment key={emp.id}>
                    <tr className="hover:bg-slate-950/10 transition-colors">
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                            alt={emp.name}
                            className="h-9 w-9 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-100 block">{emp.name}</span>
                            <span className="text-[10px] text-slate-550 block font-mono">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border border-slate-800 uppercase bg-slate-950/30 text-slate-400">
                          {emp.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        {emp.salaryStructure ? (
                          <div className="text-[11px] text-slate-300 font-mono">
                            Basic: <span className="text-indigo-400 font-bold">${emp.salaryStructure.basic}</span> / mo
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 w-fit select-none font-medium">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Missing Configuration</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-slate-200">
                        {emp.salaryStructure ? `$${totalEarnings.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-slate-400">
                        {emp.salaryStructure ? `$${totalDeductions.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-4.5 px-6 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleConfigureSalary(emp)}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider"
                          title="Configure Salary Settings"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Setup</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                          className="p-2 rounded-lg bg-slate-955 border border-slate-850 text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Payslips ({emp.payslips.length})</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Payslips List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-950/20 px-6 py-4">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-3"
                            >
                              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Historical Payout Records</span>
                                <span className="text-[10px] text-slate-550">Total Payslips: {emp.payslips.length}</span>
                              </div>

                              {emp.payslips.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {emp.payslips.map((slip) => (
                                    <div 
                                      key={slip.id} 
                                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between shadow-sm"
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
                                          Worked: {slip.workedDays} days (Unpaid: {slip.unpaidLeaves} days)
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <span className="text-[10px] text-slate-500 block">Net Payout</span>
                                          <span className="font-bold text-indigo-400 font-mono text-xs">${slip.netPay.toLocaleString()}</span>
                                        </div>

                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => openPayslipPreview(slip, emp)}
                                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                                            title="Preview Payslip Details"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </button>
                                          {slip.status !== "PAID" && (
                                            <button
                                              type="button"
                                              disabled={releasingId === slip.id}
                                              onClick={() => handleReleasePayment(slip.id, emp.id)}
                                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-colors"
                                            >
                                              {releasingId === slip.id ? "..." : "Pay"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic py-2">No payslips have been generated for this employee yet.</p>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Setup Salary Structure Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Configure Salary Compensation Model"
        size="sm"
      >
        {selectedEmployee && (
          <form onSubmit={handleSaveSalarySubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-550 tracking-wider">Employee Profile</span>
              <div className="flex items-center gap-2.5 mt-1 border border-slate-850 p-2.5 rounded-2xl bg-slate-950/20">
                <img
                  src={selectedEmployee.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <div>
                  <span className="font-bold text-slate-200 text-xs block">{selectedEmployee.name}</span>
                  <span className="text-[9px] text-indigo-400 capitalize">{selectedEmployee.role.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Basic Salary ($ / mo)</label>
                <input
                  type="number"
                  required
                  value={basic}
                  onChange={(e) => setBasic(e.target.value)}
                  placeholder="30000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">HRA ($ / mo)</label>
                <input
                  type="number"
                  required
                  value={hra}
                  onChange={(e) => setHra(e.target.value)}
                  placeholder="15000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 placeholder-slate-655 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Allowances ($ / mo)</label>
                <input
                  type="number"
                  required
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 placeholder-slate-655 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Provident Fund (PF) ($)</label>
                <input
                  type="number"
                  required
                  value={pf}
                  onChange={(e) => setPf(e.target.value)}
                  placeholder="1800"
                  className="w-full rounded-xl border border-slate-800 bg-slate-955 py-2 px-3 text-xs text-slate-100 placeholder-slate-655 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Professional Tax Deduction ($)</label>
                <input
                  type="number"
                  required
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="200"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-100 placeholder-slate-655 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSalary}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors mt-2"
            >
              {savingSalary ? "Saving Parameters..." : "Save Salary Model"}
            </button>
          </form>
        )}
      </Modal>

      {/* 2. Run Monthly Payroll Modal */}
      <Modal
        isOpen={isPayrunModalOpen}
        onClose={() => setIsPayrunModalOpen(false)}
        title="Execute Monthly Payroll Calculation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Specify the month and year. The calculation engine will process salary allocations, deduct unpaid leaves, and bundle approved mileage reimbursements.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pay Period Month</label>
              <select
                value={payrunMonth}
                onChange={(e) => setPayrunMonth(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-150 outline-none focus:border-indigo-500 transition-colors"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pay Period Year</label>
              <select
                value={payrunYear}
                onChange={(e) => setPayrunYear(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-150 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {payrunStep > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] font-mono text-indigo-400 space-y-2">
              <div className="flex items-center gap-2">
                {payrunStep === 1 && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {payrunStep === 2 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-450" />}
                <span className="font-bold">{payrunStep === 1 ? "Calculating Net Pays..." : "Calculations Complete!"}</span>
              </div>
              <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{payrunProgress}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPayrunModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-850 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-colors"
            >
              {payrunStep === 2 ? "Close Panel" : "Cancel"}
            </button>
            {payrunStep !== 2 && (
              <button
                type="button"
                disabled={payrunStep === 1}
                onClick={handleRunBatchPayrun}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                {payrunStep === 1 ? "Processing..." : "Process Batch"}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Printable Payslip Preview Modal */}
      <Modal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        title="Payslip Details Viewer"
        size="md"
      >
        {activePayslip && previewEmployee && (
          <div className="space-y-6">
            {/* Printable Payslip Card Box */}
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

              {/* Employee info metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Employee Information</span>
                  <span className="font-bold text-slate-300 block">{previewEmployee.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{previewEmployee.email}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-slate-900 border border-slate-800 text-slate-400 capitalize mt-1.5">{previewEmployee.role.replace("_", " ").toLowerCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Payroll Details</span>
                  <span className="text-slate-350 block">Days in Period: {activePayslip.workedDays + activePayslip.unpaidLeaves}</span>
                  <span className="text-slate-350 block">Worked Days: {activePayslip.workedDays}</span>
                  <span className="text-slate-350 block">Unpaid Leaves: {activePayslip.unpaidLeaves}</span>
                </div>
              </div>

              {/* Calculations tables */}
              <div className="grid grid-cols-2 gap-6 border-t border-b border-slate-800/80 py-4 text-xs">
                {/* Earnings */}
                <div className="space-y-2 border-r border-slate-850 pr-4">
                  <span className="text-[9px] uppercase font-extrabold text-indigo-400 tracking-wider block mb-1">Earnings breakdown</span>
                  <div className="flex justify-between text-slate-350">
                    <span>Basic Salary</span>
                    <span className="font-mono text-slate-200">${previewEmployee.salaryStructure?.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="font-mono text-slate-200">${previewEmployee.salaryStructure?.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>Special Allowance</span>
                    <span className="font-mono text-slate-200">${previewEmployee.salaryStructure?.allowance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 pl-4">
                  <span className="text-[9px] uppercase font-extrabold text-red-400 tracking-wider block mb-1">Deductions breakdown</span>
                  <div className="flex justify-between text-slate-350">
                    <span>Provident Fund (PF)</span>
                    <span className="font-mono text-slate-200">${previewEmployee.salaryStructure?.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-350">
                    <span>Professional Tax</span>
                    <span className="font-mono text-slate-200">${previewEmployee.salaryStructure?.tax.toLocaleString()}</span>
                  </div>
                  {activePayslip.unpaidLeaves > 0 && (
                    <div className="flex justify-between text-amber-500 font-medium">
                      <span>Unpaid Leaves penalty</span>
                      <span className="font-mono">
                        -${Math.round((activePayslip.earnings - activePayslip.deductions + (previewEmployee.salaryStructure?.pf || 0) + (previewEmployee.salaryStructure?.tax || 0) - activePayslip.netPay) * 100) / 100}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reimbursements & Payout summary */}
              <div className="flex flex-col gap-2 border-b border-slate-850 pb-4 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-slate-250">${activePayslip.earnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Deductions</span>
                  <span className="font-mono text-slate-250">-${(activePayslip.deductions).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-450 font-medium">
                  <span>Approved Travel Reimbursements</span>
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
                className="flex-1 py-2.5 rounded-xl border border-slate-850 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handlePrintPayslip}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-4 w-4 text-indigo-400" />
                <span>Print / Save PDF</span>
              </button>
              {activePayslip.status !== "PAID" && (
                <button
                  type="button"
                  disabled={releasingId === activePayslip.id}
                  onClick={() => handleReleasePayment(activePayslip.id, previewEmployee.id)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                >
                  {releasingId === activePayslip.id ? "Finalizing..." : "Release Payment"}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
