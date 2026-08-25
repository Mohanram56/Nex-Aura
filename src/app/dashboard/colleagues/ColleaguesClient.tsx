"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Phone, User, Landmark, Shield, UserSearch, Copy, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Colleague {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  designation: string | null;
  status: string;
  department: { name: string } | null;
  manager: { name: string } | null;
}

export default function ColleaguesClient({ colleagues }: { colleagues: Colleague[] }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColleagueId, setSelectedColleagueId] = useState<string | null>(colleagues[0]?.id || null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `Successfully copied ${field} to clipboard.`,
      type: "success",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredColleagues = colleagues.filter((c) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(query);
    const designMatch = c.designation?.toLowerCase()?.includes(query) || false;
    const emailMatch = c.email.toLowerCase().includes(query);
    return nameMatch || designMatch || emailMatch;
  });

  const selectedColleague = colleagues.find((c) => c.id === selectedColleagueId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Locate Colleagues</h1>
        <p className="text-slate-400 text-sm">Find contact information, designations, and department reporting trees.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Directory Search Panel */}
        <div className="md:col-span-1 p-5 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-4 flex flex-col h-[580px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-550 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
            {filteredColleagues.map((col) => {
              const isSelected = col.id === selectedColleagueId;
              return (
                <div
                  key={col.id}
                  onClick={() => setSelectedColleagueId(col.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-indigo-550 bg-indigo-650/15 text-slate-200 font-semibold"
                      : "border-slate-850 bg-slate-950/20 hover:border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={col.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      className="h-8.5 w-8.5 rounded-xl object-cover border border-slate-800"
                    />
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? "text-indigo-400" : "text-slate-200"}`}>
                        {col.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium block leading-tight mt-0.5">
                        {col.designation || col.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-650" />
                </div>
              );
            })}

            {filteredColleagues.length === 0 && (
              <p className="text-xs text-slate-550 italic text-center py-10">No matches found.</p>
            )}
          </div>
        </div>

        {/* Detailed Profile View Panel */}
        <div className="md:col-span-2">
          {selectedColleague ? (
            <motion.div
              key={selectedColleague.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl space-y-6 flex flex-col h-[580px] justify-between"
            >
              {/* Header profile cards */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4.5 pb-5 border-b border-slate-850 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <img
                      src={selectedColleague.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      className="h-20 w-20 rounded-3xl object-cover border-2 border-slate-800"
                    />
                    <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">{selectedColleague.name}</h2>
                    <p className="text-xs font-bold text-indigo-400 font-mono">
                      {selectedColleague.designation || "Executive Team"}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border border-slate-800 bg-slate-950/40 text-slate-450 mt-1 select-none">
                      {selectedColleague.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Professional Fields details */}
                <div className="grid gap-4.5 sm:grid-cols-2">
                  {/* Department */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/30 border border-slate-850 flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-550 block mb-0.5">Department</span>
                      <span className="text-xs font-bold text-slate-200">
                        {selectedColleague.department?.name || "Operations Center"}
                      </span>
                    </div>
                  </div>

                  {/* Manager */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/30 border border-slate-850 flex items-center gap-3">
                    <User className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-550 block mb-0.5">Reporting Line</span>
                      <span className="text-xs font-bold text-slate-200">
                        {selectedColleague.manager?.name || "Self-Managed / Executive"}
                      </span>
                    </div>
                  </div>

                  {/* Mail */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/30 border border-slate-850 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-550 block mb-0.5">Email Address</span>
                        <a
                          href={`mailto:${selectedColleague.email}`}
                          className="text-xs font-semibold text-slate-200 hover:text-indigo-400 transition-colors block font-mono"
                        >
                          {selectedColleague.email}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedColleague.email, "email")}
                      className="p-1.5 rounded-lg border border-slate-800 hover:text-indigo-400 text-slate-500 transition-colors"
                      title="Copy Email"
                    >
                      {copiedField === "email" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/30 border border-slate-850 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-555 block mb-0.5">Contact Number</span>
                        <a
                          href={selectedColleague.phone ? `tel:${selectedColleague.phone}` : "#"}
                          className="text-xs font-semibold text-slate-200 hover:text-indigo-400 transition-colors block font-mono"
                        >
                          {selectedColleague.phone || "+91 XXXXX XXXXX"}
                        </a>
                      </div>
                    </div>
                    {selectedColleague.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedColleague.phone || "", "phone")}
                        className="p-1.5 rounded-lg border border-slate-800 hover:text-indigo-400 text-slate-500 transition-colors"
                        title="Copy Phone"
                      >
                        {copiedField === "phone" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom operational disclaimer */}
              <div className="p-4.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-450 leading-relaxed">
                This directory contains internal employee profiles for official use only. Please contact HR regarding any inaccuracies or status adjustments.
              </div>
            </motion.div>
          ) : (
            <div className="h-[580px] rounded-3xl border border-slate-800 border-dashed flex flex-col justify-center items-center gap-2 bg-slate-900/5 text-slate-500">
              <UserSearch className="h-8 w-8 text-slate-600 animate-pulse" />
              <p className="text-xs">No colleague selected. Pick a profile to review details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
