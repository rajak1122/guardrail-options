import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  FiGrid,
  FiBriefcase,
  FiBookOpen,
  FiBarChart2,
  FiUser,
  FiMessageSquare,
  FiLogOut,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

export const dashboardNavItems = [
  { label: "Overview", path: "/dashboard", icon: FiGrid },
  { label: "Accounts", path: "/accounts", icon: FiBriefcase },
  { label: "Journals", path: "/journals", icon: FiBookOpen },
  { label: "Analytics", path: "/analytics", icon: FiBarChart2 },
  { label: "Profile", path: "/profile", icon: FiUser },
  { label: "Feedback & Support", path: "/support", icon: FiMessageSquare },
];

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { logout, user } = useAuth();

  const getNavClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl border py-3 text-sm font-medium transition ${
      collapsed ? "lg:justify-center lg:px-0" : "px-3"
    } ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900 transition-[width,transform] duration-200 ease-in-out lg:z-40 ${
          collapsed ? "lg:w-[72px]" : "lg:w-60"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-5 ${
            collapsed
              ? "lg:h-24 lg:flex-col lg:justify-center lg:gap-2 lg:px-2"
              : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <FiShield className="h-5 w-5" />
            </div>

            <div className={collapsed ? "lg:hidden" : ""}>
              <h1 className="font-bold text-slate-100">Guardrail</h1>

              <p className="text-[10px] tracking-widest text-slate-500">
                TRADING WORKSPACE
              </p>
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400 lg:flex"
          >
            {collapsed ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className={`px-4 pt-7 ${collapsed ? "lg:px-2" : ""}`}>
          <p
            className={`mb-3 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            WORKSPACE
          </p>

          <nav className="space-y-1">
            {dashboardNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                title={label}
                onClick={onCloseMobile}
                className={getNavClass}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />

                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div
          className={`mt-auto border-t border-slate-800 p-4 ${
            collapsed ? "lg:px-2" : ""
          }`}
        >
          <div
            className={`mb-3 truncate px-2 text-xs text-slate-500 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            {user?.email}
          </div>

          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <FiLogOut className="h-[17px] w-[17px] shrink-0" />

            <span className={collapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
