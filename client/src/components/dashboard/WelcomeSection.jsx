import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiSun,
  FiMoon,
  FiSunrise,
  FiClock,
  FiArrowUpRight,
  FiShield,
} from "react-icons/fi";
import { fetchUserProfile } from "../../api/profileApi";

const getIndiaTime = (date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return {
    weekday: values.weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const getMarketContext = (date) => {
  const { weekday, hour, minute } = getIndiaTime(date);
  const currentMinutes = hour * 60 + minute;

  if (weekday === "Sat" || weekday === "Sun") {
    return {
      label: "WEEKEND REVIEW",
      message:
        "Markets are resting. Take time to review your trading performance and prepare for the next session.",
      Icon: FiMoon,
    };
  }

  if (currentMinutes < 9 * 60) {
    return {
      label: "PRE-MARKET PREPARATION",
      message:
        "A new session is approaching. Review your watchlist and define your risk before trading.",
      Icon: FiSunrise,
    };
  }

  if (currentMinutes < 9 * 60 + 15) {
    return {
      label: "PRE-MARKET WINDOW",
      message:
        "Prepare your setups and stay patient. Let the market show its direction.",
      Icon: FiSunrise,
    };
  }

  if (currentMinutes < 15 * 60 + 30) {
    return {
      label: "REGULAR SESSION WINDOW",
      message:
        "Stay selective, follow your trading plan and protect your capital.",
      Icon: FiSun,
    };
  }

  return {
    label: "POST-MARKET REVIEW",
    message:
      "The regular session window has ended. Review your executions and complete your pending journals.",
    Icon: FiClock,
  };
};

const getGreeting = (date) => {
  const { hour } = getIndiaTime(date);

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function WelcomeSection({ user, account }) {
  const [now, setNow] = useState(() => new Date());
  const [profileDisplayName, setProfileDisplayName] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    const loadProfileName = async () => {
      try {
        const data = await fetchUserProfile(user.uid);

        if (!cancelled) {
          setProfileDisplayName(data.profile?.displayName || "");
        }
      } catch (error) {
        console.error("Failed to load profile name:", error);
      }
    };

    loadProfileName();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now);
  const market = getMarketContext(now);
  const MarketIcon = market.Icon;

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const isActive = account?.status === "ACTIVE";
  const isLocked = account?.hasUnjournaledTrade;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-emerald-400">
              YOUR TRADING WORKSPACE
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-600" />

            <span className="text-xs text-slate-500">{formattedDate}</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
            {greeting}, {profileDisplayName || user?.displayName || "Trader"}!
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Stay focused. Protect your capital. Trade with discipline.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <MarketIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-wider text-emerald-400">
                {market.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                {market.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
            <FiShield className="h-4 w-4 text-emerald-400" />

            <span className="text-xs font-medium text-slate-300">
              {!account
                ? "No Active Account"
                : isLocked
                  ? "Journal Required"
                  : isActive
                    ? "Account Active"
                    : "Account Breached"}
            </span>

            <span
              className={`h-2 w-2 rounded-full ${
                isLocked || account?.status === "BREACHED"
                  ? "bg-rose-400"
                  : isActive
                    ? "bg-emerald-400"
                    : "bg-slate-500"
              }`}
            />
          </div>

          {isActive && (
            <Link
              to="/terminal"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400"
            >
              Open Terminal
              <FiArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
