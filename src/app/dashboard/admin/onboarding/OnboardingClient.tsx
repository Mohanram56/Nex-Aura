"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, ShieldAlert, Sparkles, ClipboardList, CheckSquare, Square, Check, UserPlus, Printer, FileText, CalendarDays, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  status: string;
}

const defaultChecklist = [
  { id: "chk-1", text: "Signed Employment Agreement & Offer Letter", completed: true },
  { id: "chk-2", text: "Background Check Verified", completed: true },
  { id: "chk-3", text: "Banking & Tax Details Submitted", completed: false },
  { id: "chk-4", text: "IT Credentials & Laptop Issued", completed: false },
  { id: "chk-5", text: "Compliance & Security Training Completed", completed: false },
];

export default function OnboardingClient({ users }: { users: User[] }) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");
  const [checklist, setChecklist] = useState(defaultChecklist);

  // Offer Letter configuration states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerDate, setOfferDate] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [salaryAnnual, setSalaryAnnual] = useState("600,000 INR");
  const [isLetterPreviewOpen, setIsLetterPreviewOpen] = useState(false);

  const activeUser = users.find((u) => u.id === selectedUserId);

  const toggleCheck = (id: string) => {
    const item = checklist.find((c) => c.id === id);
    if (!item) return;

    const newStatus = !item.completed;

    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: newStatus } : c))
    );

    toast({
      title: newStatus ? "Checklist Item Checked" : "Checklist Item Unchecked",
      description: item.text,
      type: "info",
    });
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPct = (completedCount / checklist.length) * 100;

  const getStageLabel = () => {
    if (completedCount === 5) return "Fully Onboarded";
    if (completedCount >= 3) return "IT & Account Provisioning";
    return "Basic Documentation";
  };

  const handleOpenOfferConfig = () => {
    if (!activeUser) return;
    setOfferDate(new Date().toISOString().split("T")[0]);
    setJoinDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setJobTitle(activeUser.role === "MANAGER" ? "Service Operations Manager" : "Field Service Engineer");
    setSalaryAnnual("600,000 INR");
    setIsOfferModalOpen(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Onboarding Pipelines</h1>
        <p className="text-slate-400 text-sm">Track employee document checklists, IT setups, and training completions.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Selection side panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Select Employee</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold block mb-1">Select Employee Pipeline</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setChecklist(defaultChecklist);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          {activeUser && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-3 mt-4 text-center">
              <img
                src={activeUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt={activeUser.name}
                className="h-16 w-16 rounded-full object-cover border border-slate-800 mx-auto"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-bold text-sm text-white">{activeUser.name}</h4>
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold block mt-0.5">{activeUser.role.replace("_", " ")}</span>
              </div>

              {/* Offer Letter trigger */}
              <button
                type="button"
                onClick={handleOpenOfferConfig}
                className="w-full mt-4 py-2 px-3 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Offer Letter</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Workflow Checklist */}
        {activeUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-6"
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base">Onboarding Checklist</h3>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mt-0.5">
                    Stage: {getStageLabel()}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-white sm:text-right shrink-0">
                  {completedCount} / 5 Checked ({Math.round(progressPct)}%)
                </span>
              </div>

              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 flex items-center gap-3 ${
                    item.completed
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                  }`}
                >
                  <span className="shrink-0">
                    {item.completed ? (
                      <motion.span
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        className="h-5 w-5 rounded bg-emerald-500 text-white flex items-center justify-center border border-emerald-400"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.span>
                    ) : (
                      <Square className="h-5 w-5 text-slate-600" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* MODAL 1: Offer Letter Configuration */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title="Configure Employment Offer Letter"
        size="sm"
      >
        {activeUser && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify candidates offer parameters before generating the official printed offer contract layout.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Designation / Role Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Field Service Engineer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Offer Date</label>
                  <input
                    type="date"
                    required
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Annual Salary Package (Gross CTC)</label>
                <input
                  type="text"
                  required
                  value={salaryAnnual}
                  onChange={(e) => setSalaryAnnual(e.target.value)}
                  placeholder="600,000 INR"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-850 text-xs text-slate-400 hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setIsLetterPreviewOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
              >
                Preview Offer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Printable Offer Letter Contract */}
      <Modal
        isOpen={isLetterPreviewOpen}
        onClose={() => setIsLetterPreviewOpen(false)}
        title="Official Employment Offer Letter"
        size="md"
      >
        {activeUser && (
          <div className="space-y-6">
            {/* Offer Letter Box - Styled for Web Print */}
            <div id="print-area" className="p-8 border border-slate-800 bg-slate-950 rounded-2xl text-slate-300 select-none space-y-6 font-serif">
              
              {/* Logo & Company Name */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800/80 pb-6 gap-4">
                <div>
                  <img src="/nex-aura-logo.png" alt="Nex Aura Logo" className="h-12 object-contain mb-1.5" />
                  <span className="text-[9px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Nex Aura Workforce Solution Pvt. Ltd.</span>
                </div>
                <div className="text-right font-sans text-xs">
                  <p className="font-bold text-slate-200">Date: {new Date(offerDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  <p className="text-slate-500 mt-1">Onboarding Ref: NA-OL-{activeUser.id.substring(0, 5).toUpperCase()}</p>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-1 font-sans text-xs text-slate-350">
                <span className="text-[9px] uppercase font-bold text-slate-550 block mb-0.5">To Candidate:</span>
                <p className="font-bold text-slate-200">{activeUser.name}</p>
                <p className="font-mono">{activeUser.email}</p>
              </div>

              {/* Letter Title */}
              <div className="text-center py-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-850 pb-1.5 w-fit mx-auto">
                  Subject: Letter of Employment Offer
                </h2>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <p>Dear <strong>{activeUser.name}</strong>,</p>
                
                <p>
                  On behalf of <strong>Nex Aura Workforce Solution</strong>, we are pleased to offer you employment for the position of <strong>{jobTitle}</strong>. We are confident that your skillsets and qualifications will contribute significantly to our operational hubs.
                </p>

                <p>
                  Your effective date of joining will be <strong>{new Date(joinDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>. In this role, you will report to Narmatha (Service Manager) and your primary work deployment base will be designated at Chennai Head Operations Hub.
                </p>

                <p>
                  <strong>Compensation Structure:</strong> Your gross annual compensation package is agreed at <strong>{salaryAnnual}</strong>, inclusive of basic salary, house rent allowances, special allowances, and statutory deductions including Provident Fund (PF) and Professional Tax. Detailed components will be managed inside the payroll portal.
                </p>

                <p>
                  <strong>Onboarding & Verification:</strong> This offer is conditional upon the successful completion of basic document checking, background checks, and verification of banking detail credentials through your Nex Aura employee self-service account.
                </p>

                <p>
                  Please sign and return a duplicate copy of this letter within 3 business days to signify your acceptance of this offer. We look forward to having you on board.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 font-sans text-xs">
                <div>
                  <p className="text-slate-500">For Nex Aura Workforce Solution,</p>
                  <div className="h-10"></div> {/* Space for signature */}
                  <p className="font-bold text-slate-200">Mohanram M</p>
                  <p className="text-[10px] text-slate-500">HR Administrator / Super Admin</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-550">Accepted By Candidate,</p>
                  <div className="h-10"></div> {/* Space for signature */}
                  <p className="font-bold text-slate-200">________________________</p>
                  <p className="text-[10px] text-slate-550">Signature & Date</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLetterPreviewOpen(false);
                  setIsOfferModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-850 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-colors"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-4 w-4 text-indigo-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
