"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useMonitorStore } from "@/store/use-monitor-store";
import { Sun, Moon, Bell, Menu, ShieldCheck, Building, User, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { getAuth, signOut } from "firebase/auth";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { profile, sidebarOpen, toggleSidebar, organizations, licenses } = useMonitorStore();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Sign out failure:", e);
    }
  };

  const activeLicensesCount = licenses.filter((l) => l.status === "active").length;

  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            aria-label="Expand navigation sidebar"
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 leading-tight">
            AMPNM Licensing Portal
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            portal.itsupport.com.bd
          </p>
        </div>
      </div>

      {/* SaaS Metrics Summary */}
      <div className="hidden md:flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Building size={14} className="text-blue-500" />
          <span>
            Clients:{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">
              {organizations.length}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>
            Active Licenses:{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">
              {activeLicensesCount}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark/light theme"
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {mounted && (theme === "dark" || theme === "system") ? (
            <Sun size={18} className="text-amber-500" />
          ) : (
            <Moon size={18} className="text-blue-600" />
          )}
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            aria-label="View system notifications"
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Bell size={18} />
          </button>
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
              {profile?.name
                ? profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {profile?.name || "User profile"}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                {profile?.role ? profile.role.toUpperCase() : "MEMBER"}
              </span>
            </div>
            <ChevronDown size={14} className="text-zinc-400 transition-transform duration-200 dark:text-zinc-500" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {/* User profile dropdown menu */}
          {profileMenuOpen && (
            <>
              {/* Click outside backdrop */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-40 py-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header/Info section */}
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3 mb-2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Logged In As</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">{profile?.name || "Administrator"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-medium">{profile?.email || "mail@arifmahmud.com"}</p>
                </div>

                {/* Profile options */}
                <div className="space-y-0.5">
                  <div className="px-2">
                    <div className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs font-semibold text-zinc-500 select-none uppercase tracking-wider">
                      Workspace Details
                    </div>
                    <div className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                      <Building size={14} className="text-blue-500" />
                      <span className="truncate">Org ID: {profile?.orgId || "org-default"}</span>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
