"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { changeInitialPassword } from "../app/dashboard/actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CheckSquare,
  BarChart3,
  FileText,
  Users,
  Clock,
  ClipboardCheck,
  ListTodo,
  LineChart,
  UserPlus,
  Banknote,
  ShieldCheck,
  AreaChart,
  Settings,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search, Building2, BookOpen, PieChart, FolderOpen, Award, Trophy,
} from "lucide-react";
import { getUserNotifications, dismissNotification, dismissAllNotifications } from "../app/dashboard/employee/actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const employeeNav: NavItem[] = [
  { name: "My Dashboard", href: "/dashboard/employee", icon: LayoutDashboard },
  { name: "Attendance", href: "/dashboard/employee/attendance", icon: Calendar },
  { name: "Leave Requests", href: "/dashboard/employee/leave", icon: CalendarDays },
  { name: "My Tasks", href: "/dashboard/employee/tasks", icon: CheckSquare },
  { name: "Performance", href: "/dashboard/employee/performance", icon: BarChart3 },
  { name: "Documents", href: "/dashboard/employee/documents", icon: FileText },
  { name: "Locate Colleagues", href: "/dashboard/colleagues", icon: Search },
];

const managerNav: NavItem[] = [
  { name: "Team Overview", href: "/dashboard/manager", icon: Users },
  { name: "Scheduling", href: "/dashboard/manager/scheduling", icon: Clock },
  { name: "Approvals Queue", href: "/dashboard/manager/approvals", icon: ClipboardCheck },
  { name: "Task Allocation", href: "/dashboard/manager/tasks", icon: ListTodo },
  { name: "Team Performance", href: "/dashboard/manager/performance", icon: LineChart },
  { name: "Locate Colleagues", href: "/dashboard/colleagues", icon: Search },
  { name: "Self-Service", href: "/dashboard/employee", icon: LayoutDashboard },
];

const adminNav: NavItem[] = [
  { name: "Directory", href: "/dashboard/admin", icon: Users },
  { name: "On/Offboarding", href: "/dashboard/admin/onboarding", icon: UserPlus },
  { name: "Payroll Export", href: "/dashboard/admin/payroll", icon: Banknote },
  { name: "Compliance Vault", href: "/dashboard/admin/compliance", icon: ShieldCheck },
  { name: "Org Analytics", href: "/dashboard/admin/analytics", icon: AreaChart },
  { name: "System Settings", href: "/dashboard/admin/settings", icon: Settings },
  { name: "Locate Colleagues", href: "/dashboard/colleagues", icon: Search },
  { name: "Self-Service", href: "/dashboard/employee", icon: LayoutDashboard },
];

export function DashboardLayout({
  children,
  requiresPasswordChange = false,
}: {
  children: React.ReactNode;
  requiresPasswordChange?: boolean;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Password change form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changeInitialPassword(newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const role = session?.user?.role || "EMPLOYEE";
  const user = session?.user;

  if (requiresPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
        {/* Glassmorphic password change card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-3xl border border-card-border bg-card-bg/60 backdrop-blur-lg shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 animate-pulse">
            <ShieldCheck className="h-6 w-6" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Set Your Password</h2>
            <p className="text-xs text-text-muted">
              For security, you must change your initial password before accessing your Workforce Management account.
            </p>
          </div>

          {passwordError && (
            <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-left">
              {passwordError}
            </div>
          )}

          {passwordSuccess ? (
            <div className="p-4 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold animate-pulse">
              Password updated successfully! Loading your dashboard...
            </div>
          ) : (
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-card-border bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-card-border bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-650 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors mt-2"
              >
                {passwordLoading ? "Updating..." : "Update & Log In"}
              </button>
            </form>
          )}

          <div className="border-t border-card-border pt-4">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-text-muted hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogOut className="h-3.5 w-3.5" /> Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fetch real notifications on mount
  useEffect(() => {
    if (user) {
      getUserNotifications()
        .then(setNotifications)
        .catch(console.error);
    }
  }, [user]);

  // Determine nav items based on page pathname
  let navItems = employeeNav;
  let layoutTitle = "Employee Self-Service";

  if (pathname.startsWith("/dashboard/admin")) {
    navItems = adminNav;
    layoutTitle = "HR / Admin Dashboard";
  } else if (pathname.startsWith("/dashboard/manager")) {
    navItems = managerNav;
    layoutTitle = "Manager Command Center";
  }

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
  };

  const handleDismissOne = async (id: string) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissAll = async () => {
    try {
      await dismissAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-card-border bg-card-bg sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/nex-aura-logo.png" alt="Nex Aura Logo" className="h-10 w-auto object-contain" />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-card-border text-text-muted hover:text-foreground"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-card-border text-text-muted hover:text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar: Desktop Sticky + Mobile sliding panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-card-border transform transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-64"} bg-sidebar-bg text-text-muted backdrop-blur-lg`}
      >
        {/* Collapse Button absolute on right border line */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-6.5 z-55 h-6 w-6 rounded-full border border-card-border bg-card-bg text-text-muted hover:text-indigo-500 items-center justify-center shadow-md cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Sidebar Header */}
        <div className={`hidden md:flex items-center ${collapsed ? "justify-center" : "justify-between"} px-6 py-5 border-b border-card-border h-24`}>
          <div className="flex items-center justify-center gap-3 w-full">
            {!collapsed ? (
              <img src="/nex-aura-logo.png" alt="Nex Aura Logo" className="h-16 w-auto object-contain scale-110" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 select-none">
                NA
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                <div
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-text-muted hover:text-foreground hover:bg-card-bg"
                  }`}
                >
                  {/* Active highlight pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "group-hover:text-indigo-400"}`} />
                  </span>

                  {/* Nav label */}
                  {(!collapsed || mobileOpen) && (
                    <span className="relative z-10">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User profile / Log out footer */}
        <div className="p-4 border-t border-card-border">
          {user && (
            <div className={`flex items-center ${collapsed && !mobileOpen ? "justify-center" : "gap-3"} mb-4`}>
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={user.name || "User"}
                className="h-10 w-10 rounded-full border border-indigo-500/30 object-cover"
               referrerPolicy="no-referrer" />
              {(!collapsed || mobileOpen) && (
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate">{user.name}</h4>
                  <p className="text-xs text-indigo-400 capitalize">{user.role?.replace("_", " ")}</p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            {(!collapsed || mobileOpen) && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile close overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content Area - Window Level Scroll */}
      <main className="flex-1 flex flex-col">
        
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-card-border bg-card-bg/25">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{layoutTitle}</h1>
            <p className="text-xs text-text-muted">
              {pathname}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick dashboard shortcuts */}
            <div className="flex items-center gap-1.5 rounded-xl p-1 bg-card-bg border border-card-border">
              <Link 
                href="/dashboard/employee" 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pathname.startsWith("/dashboard/employee") ? "bg-indigo-600 text-white" : "text-text-muted hover:text-foreground"}`}
              >
                Self-Service
              </Link>
              {role !== "EMPLOYEE" && (
                <Link 
                  href="/dashboard/manager" 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pathname.startsWith("/dashboard/manager") ? "bg-indigo-600 text-white" : "text-text-muted hover:text-foreground"}`}
                >
                  Manager
                </Link>
              )}
              {role === "HR_ADMIN" && (
                <Link 
                  href="/dashboard/admin" 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pathname.startsWith("/dashboard/admin") ? "bg-indigo-600 text-white" : "text-text-muted hover:text-foreground"}`}
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-card-border text-text-muted hover:text-foreground hover:bg-card-bg transition-all"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl border border-card-border text-text-muted hover:text-foreground hover:bg-card-bg transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-card-border bg-sidebar-bg text-foreground shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-card-border font-semibold text-sm flex items-center justify-between">
                        <span>Notifications</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400">
                            {notifications.length} Active
                          </span>
                          {notifications.length > 0 && (
                            <button
                              onClick={handleDismissAll}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-card-border/50">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-indigo-500/5 transition-colors flex items-start justify-between gap-3 group">
                            <div className="min-w-0">
                              <p className="text-xs text-foreground font-medium">{n.message}</p>
                              <span className="text-[9px] text-text-muted block mt-1">
                                {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDismissOne(n.id)}
                              className="text-[9px] font-bold text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              Dismiss
                            </button>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <p className="text-xs text-text-muted text-center py-8 select-none">All caught up!</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Main Scroll Container (Window Level Natural Flow) */}
        <div className="p-6 md:p-8 pb-36 md:pb-48 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
