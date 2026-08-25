"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, FolderGit, Cpu, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Department {
  id: string;
  name: string;
  users: any[];
}

const initialPermissions = [
  { id: "p1", name: "View Schedule", desc: "Allows viewing shifts", employee: true, manager: true, admin: true },
  { id: "p2", name: "Apply Leave", desc: "Allows leave submissions", employee: true, manager: true, admin: true },
  { id: "p3", name: "Edit Team Roster", desc: "Allows shift scheduling", employee: false, manager: true, admin: true },
  { id: "p4", name: "Process Approvals", desc: "Allows leave approvals", employee: false, manager: true, admin: true },
  { id: "p5", name: "Execute Payroll", desc: "Allows running payroll", employee: false, manager: false, admin: true },
];

export default function SettingsClient({ departments }: { departments: Department[] }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState(initialPermissions);

  // Integrations state
  const [slackConnected, setSlackConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const togglePermission = (id: string, role: "employee" | "manager" | "admin") => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newVal = !p[role];
          toast({
            title: "Permissions Configured",
            description: `${p.name} updated for ${role.toUpperCase()}`,
            type: "info",
          });
          return { ...p, [role]: newVal };
        }
        return p;
      })
    );
  };

  const handleConnectSlack = () => {
    if (slackConnected) {
      setSlackConnected(false);
      toast({ title: "Integration Purged", description: "Slack channel disconnected.", type: "info" });
    } else {
      setSlackLoading(true);
      setTimeout(() => {
        setSlackConnected(true);
        setSlackLoading(false);
        toast({ title: "Integration Success", description: "Slack webhooks verified & linked.", type: "success" });
      }, 1500);
    }
  };

  const handleConnectCalendar = () => {
    if (calendarConnected) {
      setCalendarConnected(false);
      toast({ title: "Integration Purged", description: "Google Calendar disconnected.", type: "info" });
    } else {
      setCalendarLoading(true);
      setTimeout(() => {
        setCalendarConnected(true);
        setCalendarLoading(false);
        toast({ title: "Integration Success", description: "Google Calendar linked successfully.", type: "success" });
      }, 1500);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Global System Settings</h1>
        <p className="text-slate-400 text-sm">Configure organization permissions, manage department lists, and link third-party integrations.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Permissions matrix (large) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">RBAC Permissions Matrix</h2>
          </div>

          <div className="space-y-4">
            <div className="hidden sm:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-900">
              <span className="col-span-6">System Privilege</span>
              <span className="col-span-2 text-center">Staff</span>
              <span className="col-span-2 text-center">Manager</span>
              <span className="col-span-2 text-center">Admin</span>
            </div>

            {permissions.map((p) => (
              <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-0 border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                <div className="col-span-6">
                  <h4 className="font-bold text-sm text-slate-200">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </div>
                
                {/* Switches */}
                <div className="col-span-2 flex justify-center items-center">
                  <span className="sm:hidden text-xs text-slate-400 mr-2">Staff:</span>
                  <Switch
                    checked={p.employee}
                    onChange={() => togglePermission(p.id, "employee")}
                  />
                </div>
                <div className="col-span-2 flex justify-center items-center">
                  <span className="sm:hidden text-xs text-slate-400 mr-2">Manager:</span>
                  <Switch
                    checked={p.manager}
                    onChange={() => togglePermission(p.id, "manager")}
                  />
                </div>
                <div className="col-span-2 flex justify-center items-center">
                  <span className="sm:hidden text-xs text-slate-400 mr-2">Admin:</span>
                  <Switch
                    checked={p.admin}
                    onChange={() => togglePermission(p.id, "admin")}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Departments and integrations panel */}
        <div className="md:col-span-1 space-y-8">
          
          {/* Departments list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <FolderGit className="h-5 w-5 text-indigo-400" />
              <h2 className="font-bold text-lg text-white">Active Divisions</h2>
            </div>
            
            <div className="divide-y divide-slate-850">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                  <span className="font-semibold text-xs text-slate-200">{d.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-500">
                    {d.users.length} Staff
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <h2 className="font-bold text-lg text-white">Integrations</h2>
            </div>

            <div className="space-y-4">
              {/* Slack */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Slack Webhooks</h4>
                  <p className="text-[10px] text-slate-500">Notify channels on leave logs</p>
                </div>
                <button
                  disabled={slackLoading}
                  onClick={handleConnectSlack}
                  className={`py-1.5 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                    slackConnected
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-850 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {slackLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : slackConnected ? (
                    <>
                      <Check className="h-3 w-3" /> Linked
                    </>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>

              {/* Google Calendar */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Google Calendar</h4>
                  <p className="text-[10px] text-slate-500">Sync rosters with personal calendars</p>
                </div>
                <button
                  disabled={calendarLoading}
                  onClick={handleConnectCalendar}
                  className={`py-1.5 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                    calendarConnected
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-850 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {calendarLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : calendarConnected ? (
                    <>
                      <Check className="h-3 w-3" /> Linked
                    </>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Custom Switch Toggle Component
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className={`h-5 w-9 rounded-full cursor-pointer p-0.5 transition-colors duration-250 ${
        checked ? "bg-indigo-600" : "bg-slate-950 border border-slate-850"
      }`}
    >
      <motion.div
        layout
        className={`h-3.5 w-3.5 rounded-full bg-white transition-all`}
        animate={{ x: checked ? 14 : 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
      />
    </div>
  );
}
