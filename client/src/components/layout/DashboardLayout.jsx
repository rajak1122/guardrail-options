import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

import { FiArrowRight, FiMenu } from "react-icons/fi";

import Sidebar, { dashboardNavItems } from "./Sidebar";
import ThemeToggle from "../themes/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

const SIDEBAR_STORAGE_KEY = "guardrail-sidebar-collapsed";

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist desktop sidebar preference.
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch (error) {
      console.warn("Unable to save sidebar preference:", error);
    }
  }, [collapsed]);

  // Close mobile drawer whenever navigation changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activePage =
    dashboardNavItems.find((item) => item.path === location.pathname) ||
    dashboardNavItems[0];

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 transition-[padding] duration-200 ${
        collapsed ? "lg:pl-[72px]" : "lg:pl-60"
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-w-0">
        {/* Shared Topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="dashboard-sidebar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400 lg:hidden"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-mono tracking-widest text-slate-500">
                  GUARDRAIL / WORKSPACE
                </p>

                <h1 className="mt-1 truncate text-base font-semibold text-slate-100">
                  {activePage.label}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <ThemeToggle />

              <Link
                to="/terminal"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                <span className="hidden sm:inline">Open Terminal</span>
                <span className="sm:hidden">Terminal</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pb-24 lg:pb-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
