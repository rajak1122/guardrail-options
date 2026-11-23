import React, { useEffect, useState } from "react";
import {
  FiClock,
  FiPlusCircle,
  FiRefreshCw,
  FiAlertTriangle,
  FiFileText,
  FiActivity,
} from "react-icons/fi";

import { fetchAccountActivities } from "../../api/tradingApi";

const EVENT_CONFIG = {
  ACCOUNT_CREATED: {
    icon: FiPlusCircle,
    color: "text-emerald-500",
    background: "bg-emerald-500/10",
    label: "Account Created",
  },
  ACCOUNT_RESET: {
    icon: FiRefreshCw,
    color: "text-blue-500",
    background: "bg-blue-500/10",
    label: "Account Reset",
  },
  ACCOUNT_BREACHED: {
    icon: FiAlertTriangle,
    color: "text-rose-500",
    background: "bg-rose-500/10",
    label: "Account Breached",
  },
  JOURNAL_SUBMITTED: {
    icon: FiFileText,
    color: "text-purple-500",
    background: "bg-purple-500/10",
    label: "Journal Submitted",
  },
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function RecentActivities({ userId, limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadActivities = async () => {
      try {
        const data = await fetchAccountActivities(userId, limit);

        if (!cancelled) {
          setActivities(Array.isArray(data.activities) ? data.activities : []);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load recent activities:", err);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadActivities();

    const intervalId = setInterval(loadActivities, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [userId, limit]);

  return (
    <section className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center border-b p-1.5 justify-between mb-5">
        <div className="flex items-center gap-2">
          <FiClock className="w-4 h-4 text-blue-400" />

          <h2 className="text-sm font-bold text-slate-200">
            Recent Activities
          </h2>
        </div>

        <span className="text-xs font-mono text-slate-500">
          {activities.length} Events
        </span>
      </div>

      {loading ? (
        <div className="min-h-[220px] flex items-center justify-center text-sm text-slate-500 animate-pulse">
          Loading activities...
        </div>
      ) : error ? (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
          <FiAlertTriangle className="w-7 h-7 text-rose-400 mb-3" />

          <p className="text-sm text-slate-300">Unable to load activities</p>

          <p className="text-xs text-slate-500 mt-1">
            Please try again shortly.
          </p>
        </div>
      ) : activities.length === 0 ? (
        <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
          <FiActivity className="w-8 h-8 text-slate-500 mb-3" />

          <p className="text-sm font-medium text-slate-300">
            No activities yet
          </p>

          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Your account events and journal submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const config = EVENT_CONFIG[activity.eventType] || {
              icon: FiActivity,
              color: "text-slate-400",
              background: "bg-slate-500/10",
              label: "Activity",
            };

            const Icon = config.icon;

            return (
              <div key={activity._id} className="flex gap-3 items-start">
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${config.background}`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-200">
                      {activity.title}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-5 break-words">
                    {activity.description || config.label}
                  </p>

                  <p className="text-[10px] text-slate-500 font-mono mt-2">
                    {formatDate(activity.occurredAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
