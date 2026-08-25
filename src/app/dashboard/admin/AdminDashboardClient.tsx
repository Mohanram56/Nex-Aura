"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, UserPlus, GitFork, ChevronDown, ChevronUp, Briefcase, Mail, Shield, Check } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { onboardEmployee, updateEmployee } from "./actions";

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  status: string;
  department: Department | null;
  manager: { name: string } | null;
  managerId: string | null;
}

interface DashboardData {
  allUsers: User[];
  departments: Department[];
  allDocuments: any[];
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(data.allUsers);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Tab state (Directory Grid vs Org Chart Tree)
  const [viewTab, setViewTab] = useState<"GRID" | "TREE">("GRID");

  // Onboard Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Edit Employee Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("EMPLOYEE");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Org Chart Node Expansion States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    manager: true,
  });

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onboardEmployee(
        name,
        email,
        role,
        departmentId,
        managerId || null,
        avatarUrl || null
      );

      const mappedUser = {
        ...JSON.parse(JSON.stringify(result)),
        department: data.departments.find((d) => d.id === departmentId) || null,
        manager: users.find((u) => u.id === managerId) || null,
      };

      setUsers((prev) => [...prev, mappedUser]);
      toast({
        title: "Employee Onboarded",
        description: `${name} has been added. Default password: password123`,
        type: "success",
      });

      setIsModalOpen(false);
      setName("");
      setEmail("");
      setRole("EMPLOYEE");
      setDepartmentId("");
      setManagerId("");
      setAvatarUrl("");
    } catch (err: any) {
      toast({
        title: "Onboarding Failed",
        description: err.message || "Failed to onboard employee.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDepartmentId(user.department?.id || "");
    setEditManagerId(user.managerId || "");
    setEditAvatarUrl(user.avatarUrl || "");
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    try {
      const result = await updateEmployee(
        selectedUser.id,
        editName,
        editEmail,
        editRole,
        editDepartmentId,
        editManagerId || null,
        editAvatarUrl || null
      );

      const mappedUser = {
        ...JSON.parse(JSON.stringify(result)),
        department: data.departments.find((d) => d.id === editDepartmentId) || null,
        manager: users.find((u) => u.id === editManagerId) || null,
      };

      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? mappedUser : u)));
      toast({
        title: "Profile Updated",
        description: `${editName}'s profile has been updated successfully.`,
        type: "success",
      });

      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (node: string) => {
    setExpandedNodes((prev) => ({ ...prev, [node]: !prev[node] }));
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = deptFilter === "ALL" || u.department?.id === deptFilter;
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  // Org Chart Node structures
  // Top: HR Admin (Sarah Jenkins)
  // Middle: Manager (Alex Rivera)
  // Bottom: Employee (Marcus Chen)
  const rootAdmin = users.find((u) => u.role === "HR_ADMIN");
  const managerUser = users.find((u) => u.role === "MANAGER");
  const reportees = users.filter((u) => u.managerId === managerUser?.id);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Employee Directory</h1>
          <p className="text-slate-400 text-sm">Access employee directories, department hierarchies, and org tree maps.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
            <button
              onClick={() => setViewTab("GRID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 select-none ${
                viewTab === "GRID" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setViewTab("TREE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 select-none ${
                viewTab === "TREE" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Org Map
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
          >
            <UserPlus className="h-4 w-4" /> Onboard Employee
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewTab === "GRID" ? (
          /* Directory Grid View */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search and filter row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ALL">All Departments</option>
                  {data.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ALL">All Roles</option>
                  <option value="EMPLOYEE">Employees</option>
                  <option value="MANAGER">Managers</option>
                  <option value="HR_ADMIN">HR / Admins</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {filteredUsers.map((member) => (
                <TiltCard
                  key={member.id}
                  onClick={() => openEditModal(member)}
                  className="p-5 border border-slate-800 bg-slate-900/10 hover:border-slate-800/80 cursor-pointer overflow-hidden flex items-start gap-4"
                >
                  <img
                    src={member.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={member.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-800 shrink-0"
                   referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-sm text-slate-200 truncate">{member.name}</h3>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest truncate">{member.role.replace("_", " ")}</p>
                    <div className="text-xs text-slate-500 space-y-1 mt-3 border-t border-slate-850 pt-2">
                      <p className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {member.department?.name || "General"}</p>
                      <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 truncate" /> {member.email}</p>
                      <p className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Mgr: {member.manager?.name || "None"}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Org Chart Tree Map View */
          <motion.div
            key="tree-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-8 rounded-3xl border border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center overflow-x-auto min-h-[480px] shadow-xl"
          >
            <div className="flex items-center gap-2 mb-8 border-b border-slate-850 pb-2 w-full max-w-sm justify-center">
              <GitFork className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-lg text-white">Interactive Reporting Hierarchy</h3>
            </div>

            {/* Tree Layout Structure */}
            <div className="flex flex-col items-center space-y-8 select-none">
              
              {/* Root Admin node */}
              {rootAdmin && (
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => toggleNode("root")}
                    className="p-4 rounded-2xl border border-indigo-500/20 bg-slate-950/60 shadow-lg cursor-pointer hover:border-indigo-500/50 transition-colors flex items-center gap-3 w-52"
                  >
                    <img src={rootAdmin.avatarUrl || ""} className="h-8 w-8 rounded-full border border-indigo-500 object-cover"  referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <h4 className="font-bold text-xs text-white truncate">{rootAdmin.name}</h4>
                      <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider">HR Admin (CEO)</span>
                    </div>
                    {expandedNodes.root ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-500" />}
                  </div>

                  {/* Connecting Line */}
                  {expandedNodes.root && managerUser && (
                    <div className="h-8 w-0.5 bg-slate-800 relative">
                      <div className="absolute top-full -left-1.5 h-1.5 w-3 rounded-full bg-slate-800" />
                    </div>
                  )}
                </div>
              )}

              {/* Manager level */}
              <AnimatePresence>
                {expandedNodes.root && managerUser && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      onClick={() => toggleNode("manager")}
                      className="p-4 rounded-2xl border border-slate-850 bg-slate-950/60 shadow-lg cursor-pointer hover:border-indigo-500/30 transition-colors flex items-center gap-3 w-52"
                    >
                      <img src={managerUser.avatarUrl || ""} className="h-8 w-8 rounded-full border border-slate-850 object-cover"  referrerPolicy="no-referrer" />
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-white truncate">{managerUser.name}</h4>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Engineering Lead</span>
                      </div>
                      {expandedNodes.manager ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-500" />}
                    </div>

                    {/* Connecting Branching lines */}
                    {expandedNodes.manager && reportees.length > 0 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="h-6 w-0.5 bg-slate-800" />
                        <div className="flex justify-center items-start gap-12 border-t border-slate-800 pt-6 px-6">
                          {reportees.map((emp) => (
                            <motion.div
                              key={emp.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="p-4 rounded-2xl border border-slate-850 bg-slate-950/60 shadow-lg flex items-center gap-3 w-48 text-left relative"
                            >
                              {/* Short connector hook */}
                              <div className="absolute -top-6 left-1/2 -ml-0.5 h-6 w-0.5 bg-slate-800" />
                              
                              <img src={emp.avatarUrl || ""} className="h-8 w-8 rounded-full border border-slate-850 object-cover"  referrerPolicy="no-referrer" />
                              <div>
                                <h4 className="font-bold text-xs text-white truncate">{emp.name}</h4>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{emp.role}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboard Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Employee Account"
        size="md"
      >
        <form onSubmit={handleOnboard} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Employee Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Chen, Sarah Jenkins..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@company.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Profile Picture (Upload or Paste Link)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Or paste URL: https://images..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                />
                <label className="cursor-pointer py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-xs font-semibold text-slate-350 flex items-center justify-center transition-colors shrink-0 select-none">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatarUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Preview:</span>
                  <img src={avatarUrl} className="h-10 w-10 rounded-full border border-slate-800 object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Role Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_ADMIN">HR / Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select...</option>
                  {data.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select...</option>
                  {users
                    .filter((u) => u.role === "MANAGER" || u.role === "HR_ADMIN")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-850 pt-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Onboard Account"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         title="Edit Employee Profile"
         size="md"
      >
         <form onSubmit={handleEdit} className="space-y-4">
           <div className="space-y-3">
             <div>
               <label className="text-xs text-slate-400 font-semibold block mb-1">Employee Full Name</label>
               <input
                 type="text"
                 required
                 value={editName}
                 onChange={(e) => setEditName(e.target.value)}
                 placeholder="Marcus Chen, Sarah Jenkins..."
                 className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
               />
             </div>

             <div>
               <label className="text-xs text-slate-400 font-semibold block mb-1">Work Email</label>
               <input
                 type="email"
                 required
                 value={editEmail}
                 onChange={(e) => setEditEmail(e.target.value)}
                 placeholder="username@company.com"
                 className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
               />
             </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Profile Picture (Upload or Paste Link)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Or paste URL: https://images..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                  />
                  <label className="cursor-pointer py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-xs font-semibold text-slate-350 flex items-center justify-center transition-colors shrink-0 select-none">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditAvatarUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editAvatarUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Preview:</span>
                    <img src={editAvatarUrl} className="h-10 w-10 rounded-full border border-slate-800 object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl("")}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

             <div className="grid grid-cols-3 gap-3">
               <div>
                 <label className="text-xs text-slate-400 font-semibold block mb-1">Role Type</label>
                 <select
                   value={editRole}
                   onChange={(e) => setEditRole(e.target.value)}
                   className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                 >
                   <option value="EMPLOYEE">Employee</option>
                   <option value="MANAGER">Manager</option>
                   <option value="HR_ADMIN">HR / Admin</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs text-slate-400 font-semibold block mb-1">Department</label>
                 <select
                   value={editDepartmentId}
                   onChange={(e) => setEditDepartmentId(e.target.value)}
                   className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                 >
                   <option value="">Select...</option>
                   {data.departments.map((d) => (
                     <option key={d.id} value={d.id}>
                       {d.name}
                     </option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="text-xs text-slate-400 font-semibold block mb-1">Manager</label>
                 <select
                   value={editManagerId}
                   onChange={(e) => setEditManagerId(e.target.value)}
                   className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                 >
                   <option value="">Select...</option>
                   {users
                     .filter((u) => (u.role === "MANAGER" || u.role === "HR_ADMIN") && u.id !== selectedUser?.id)
                     .map((m) => (
                       <option key={m.id} value={m.id}>
                         {m.name}
                       </option>
                     ))}
                 </select>
               </div>
             </div>
           </div>

           <div className="flex gap-2 border-t border-slate-850 pt-4 mt-6">
             <button
               type="submit"
               disabled={loading}
               className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
             >
               {loading ? (
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
               ) : (
                 "Save Profile Details"
               )}
             </button>
           </div>
         </form>
       </Modal>
     </div>
   );
 }
