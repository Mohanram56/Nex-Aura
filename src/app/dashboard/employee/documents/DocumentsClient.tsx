"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, FileDigit, Download, Eye, Award, Sparkles, Filter } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface DocumentLog {
  id: string;
  userId: string;
  type: string; // PAYSLIP, CONTRACT, CERTIFICATION
  name: string;
  fileUrl: string;
  uploadedAt: string;
}

export default function DocumentsClient({ documents }: { documents: DocumentLog[] }) {
  const { toast } = useToast();
  const [localDocs, setLocalDocs] = useState<DocumentLog[]>(documents);
  const [filter, setFilter] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState<DocumentLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const filteredDocs = localDocs.filter((doc) => {
    if (filter === "ALL") return true;
    return doc.type === filter;
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case "CONTRACT":
        return FileText;
      case "PAYSLIP":
        return FileSpreadsheet;
      default:
        return Award;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case "CONTRACT":
        return "text-indigo-400 border-indigo-500/20 bg-indigo-500/5";
      case "PAYSLIP":
        return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
      default:
        return "text-cyan-400 border-cyan-500/20 bg-cyan-500/5";
    }
  };

  const handleDownload = (name: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${name}...`,
      type: "success",
    });
  };

  const openPreview = (doc: DocumentLog) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Documents</h1>
          <p className="text-slate-400 text-sm">Access your payslips, contracts, and company credentials.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit hidden md:flex">
            {["ALL", "PAYSLIP", "CONTRACT", "CERTIFICATION"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 select-none ${
                  filter === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.split("_")[0]}s
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4 rotate-180" /> Upload
          </button>
        </div>
      </div>

      {/* Grid container */}
      <motion.div
        layout
        className="grid gap-6 sm:grid-cols-2 md:grid-cols-3"
      >
        {filteredDocs.map((doc) => {
          const Icon = getDocIcon(doc.type);
          const colors = getDocColor(doc.type);
          return (
            <TiltCard
              key={doc.id}
              className="flex flex-col justify-between min-h-[190px] border border-slate-800 bg-slate-900/10 hover:border-slate-800/80 cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl border ${colors}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {doc.name.replace(".pdf", "").replace(/_/g, " ")}
                </h3>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-1">
                  {doc.type}
                </span>
              </div>

              <div className="flex gap-2 border-t border-slate-800/40 pt-4 mt-4">
                <button
                  onClick={() => openPreview(doc)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => handleDownload(doc.name)}
                  className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </TiltCard>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="sm:col-span-2 md:col-span-3 p-12 text-center text-slate-500 border border-dashed border-slate-850 rounded-3xl bg-slate-900/5">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-500" />
            <p className="text-sm">No documents found matching this filter.</p>
          </div>
        )}
      </motion.div>

      {/* PDF Mock Previewer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Document Preview Panel"
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <div>
                <h2 className="text-lg font-bold text-slate-100 leading-tight">
                  {selectedDoc.name.replace(".pdf", "").replace(/_/g, " ")}
                </h2>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-0.5">
                  {selectedDoc.type} DOCUMENT
                </span>
              </div>
              <button
                onClick={() => handleDownload(selectedDoc.name)}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>

            {/* Styled Mock Document Content Sheet */}
            <div className="bg-white text-slate-800 rounded-2xl border border-slate-300 p-8 shadow-inner font-sans min-h-[480px] max-w-2xl mx-auto text-xs space-y-8 select-none">
              
              {/* Document Header Logo */}
              <div className="flex justify-between border-b border-slate-300 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold tracking-widest text-indigo-900">APOLLO CORP</h3>
                  <p className="text-[9px] text-slate-500">100 Tech Parkway, Suite 500, San Francisco, CA</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">{selectedDoc.type}</h3>
                  <p className="text-[9px] text-slate-500">Doc ID: {selectedDoc.id}</p>
                </div>
              </div>

              {/* Conditional rendering for Contract vs Payslip layout */}
              {selectedDoc.type === "PAYSLIP" ? (
                <div className="space-y-6">
                  {/* Employee Meta */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-500">EMPLOYEE DETAILS</p>
                      <p className="font-bold text-slate-900 text-[10px] mt-0.5">Marcus Chen</p>
                      <p className="text-slate-500">Role: Software Engineer</p>
                      <p className="text-slate-500">Dept: Engineering</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">PAY DETAILS</p>
                      <p className="text-slate-500">Pay Period: July 01 - July 31, 2026</p>
                      <p className="text-slate-500">Payment Date: July 31, 2026</p>
                      <p className="text-slate-500">Payment Mode: Direct Deposit</p>
                    </div>
                  </div>

                  {/* Calculations breakdown table */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1 text-slate-900">
                      <span>EARNINGS DESCRIPTION</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Basic Software Engineering Payout</span>
                        <span>$6,800.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On-call Overtime Bonus (12.5 hrs)</span>
                        <span>$450.00</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1 font-semibold text-slate-800">
                        <span>Gross Earnings</span>
                        <span>$7,250.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1 text-slate-900">
                      <span>TAXES & DEDUCTIONS</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Federal Income Tax (15%)</span>
                        <span>$1,087.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State Retirement Contribution</span>
                        <span>$150.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Healthcare Insurance Premia</span>
                        <span>$220.00</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1 font-semibold text-slate-800">
                        <span>Total Deductions</span>
                        <span>$1,457.50</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Net Block */}
                  <div className="bg-indigo-900 text-white rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Net Pay Transferred</span>
                      <p className="text-[9px] opacity-70">Direct deposited to registered routing account</p>
                    </div>
                    <span className="text-2xl font-black">$5,792.50</span>
                  </div>
                </div>
              ) : (
                // Contract Layout Mock
                <div className="space-y-6 text-slate-700 leading-relaxed pr-1 max-h-[350px] overflow-y-auto">
                  <h4 className="font-extrabold text-slate-900 text-sm text-center">OFFER LETTER & EMPLOYMENT COVENANT</h4>
                  
                  <p>
                    This Employment Covenant (the "Agreement") is dated and effective as of Marcus Chen's commencement, between <strong>Apollo Corp</strong> (the "Company") and the signatory (the "Employee").
                  </p>
                  
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900 uppercase">1. Duties and Services</h5>
                    <p>
                      The Employee shall serve in the capacity of <strong>Software Engineer</strong>, reporting directly to their designated Engineering Lead. The Employee agrees to perform all duties reasonably assigned to them in good faith.
                    </p>
                    
                    <h5 className="font-bold text-slate-900 uppercase">2. Compensation and Remuneration</h5>
                    <p>
                      As compensation for services rendered, the Company shall pay the Employee a base salary of <strong>$81,600.00 per annum</strong>, paid in semi-monthly installments, subject to standard withholdings.
                    </p>

                    <h5 className="font-bold text-slate-900 uppercase">3. Intellectual Property Covenant</h5>
                    <p>
                      All software products, repositories, architectural configurations, designs, and materials created by the Employee during their tenure are the sole proprietary property of Apollo Corp.
                    </p>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-8 mt-8">
                    <div className="w-1/3">
                      <p className="border-b border-slate-400 pb-4"></p>
                      <p className="text-[10px] font-bold text-slate-900 mt-1">Apollo Corp HR</p>
                      <p className="text-[8px] text-slate-500">Representative Signature</p>
                    </div>
                    <div className="w-1/3">
                      <p className="border-b border-slate-400 pb-4"></p>
                      <p className="text-[10px] font-bold text-slate-900 mt-1">Marcus Chen</p>
                      <p className="text-[8px] text-slate-500">Employee Signature</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document">
        <form 
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              if (!res.ok) throw new Error("Upload failed");
              const data = await res.json();
              setLocalDocs((prev) => [data.document, ...prev]);
              setIsUploadOpen(false);
              toast({ title: "Success", description: "Document uploaded successfully", type: "success" });
            } catch (err) {
              toast({ title: "Error", description: "Failed to upload document", type: "error" });
            }
          }}
        >
          <div>
            <label className="text-xs font-bold text-slate-400">Document Type</label>
            <select name="type" className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="ID_PROOF">ID Proof</option>
              <option value="CERTIFICATION">Certification</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400">File</label>
            <input type="file" name="file" required className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all mt-4">
            Secure Upload
          </button>
        </form>
      </Modal>
    </div>
  );
}
