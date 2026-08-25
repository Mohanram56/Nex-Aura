"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, History, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
  user: {
    name: string;
  };
}

const mockAuditLogs = [
  {
    id: "aud-1",
    action: "Permissions Matrix Updated",
    operator: "Sarah Jenkins (HR Admin)",
    date: "Aug 13, 2026 12:54 PM",
    details: "Modified EMPLOYEE role access settings for scheduling panels.",
    type: "SYSTEM",
  },
  {
    id: "aud-2",
    action: "Monthly Payroll Run Executed",
    operator: "Sarah Jenkins (HR Admin)",
    date: "Aug 13, 2026 11:20 AM",
    details: "Generated 3 payslips for period July 01 - July 31, 2026.",
    type: "PAYROLL",
  },
  {
    id: "aud-3",
    action: "Leave Request Approved",
    operator: "Alex Rivera (Manager)",
    date: "Aug 12, 2026 04:15 PM",
    details: "Approved Marcus Chen's annual leave request (10 days).",
    type: "LEAVE",
  },
  {
    id: "aud-4",
    action: "Roster Shift Modified",
    operator: "Alex Rivera (Manager)",
    date: "Aug 12, 2026 09:30 AM",
    details: "Shift for Marcus Chen modified from 09:00 to 18:00.",
    type: "ROSTER",
  },
];

export default function ComplianceClient({ initialDocuments }: { initialDocuments: Document[] }) {
  const { toast } = useToast();
  const [vaultDocs, setVaultDocs] = useState<Document[]>(initialDocuments);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mock upload logic
  const handleFileUpload = (fileName: string) => {
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete upload, add to vault
          const newDoc: Document = {
            id: `doc-${Math.random().toString(36).substring(2, 9)}`,
            name: fileName,
            type: "CERTIFICATION",
            fileUrl: `/documents/${fileName}`,
            uploadedAt: new Date().toISOString(),
            user: { name: "Sarah Jenkins" },
          };

          setVaultDocs((prevDocs) => [newDoc, ...prevDocs]);
          
          toast({
            title: "Upload Successful",
            description: `File "${fileName}" uploaded to compliance vault.`,
            type: "success",
          });

          setTimeout(() => setUploadProgress(null), 800);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file.name);
    }
  };

  const handleDeleteDoc = (id: string) => {
    setVaultDocs((prev) => prev.filter((d) => d.id !== id));
    toast({
      title: "Document Removed",
      description: "File successfully purged from vault.",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Compliance Vault & Audits</h1>
        <p className="text-slate-400 text-sm">Upload compliance verification documents and inspect operational audit logs.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Compliance Vault Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Secure Vault Dropzone</h2>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => handleFileUpload("ISO_Compliance_Certificate.pdf")}
            className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
              isDragOver
                ? "border-indigo-500 bg-indigo-500/5"
                : "border-slate-800 bg-slate-900/10 hover:border-slate-800/80 hover:bg-slate-900/20"
            }`}
          >
            {uploadProgress === null ? (
              <div className="space-y-4 py-4 select-none">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Drag & Drop Files Here</p>
                  <p className="text-[10px] text-slate-500 mt-1">or click to upload demo file (PDF/CSV)</p>
                </div>
              </div>
            ) : (
              /* Uploading State */
              <div className="space-y-4 py-4">
                <RefreshCwIcon />
                <p className="text-xs font-semibold text-slate-200">Uploading File... {uploadProgress}%</p>
                <div className="h-1.5 w-32 mx-auto bg-slate-950 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vault Document List */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest">Vault Records</h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {vaultDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-200 truncate">{doc.name}</p>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{doc.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {vaultDocs.length === 0 && (
                <p className="text-xs text-slate-600 py-4 text-center">Vault empty.</p>
              )}
            </div>
          </div>
        </div>

        {/* Audit Trail Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
            <History className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Compliance Audit Trail</h2>
          </div>

          {/* Timeline list */}
          <div className="relative border-l border-slate-800 ml-3 pl-8 space-y-8">
            {mockAuditLogs.map((log) => {
              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot Node */}
                  <span className="absolute -left-[45px] top-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-indigo-400 group-hover:border-indigo-500 transition-colors">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </span>

                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/20 hover:border-slate-800 hover:bg-slate-950/80 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <h4 className="font-bold text-sm text-slate-100">{log.action}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{log.details}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mt-3 pt-2 border-t border-slate-900">
                      <span>Operator: {log.operator}</span>
                      <span>{log.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-spin">
      <UploadCloud className="h-6 w-6" />
    </div>
  );
}
