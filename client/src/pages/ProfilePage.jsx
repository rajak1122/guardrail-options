import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfile, updateUserProfile } from "../api/profileApi";

import {
  FiUser,
  FiBriefcase,
  FiEdit3,
  FiSave,
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const INITIAL_PROFILE = {
  displayName: "",
  email: "",
  phoneNumber: "",
  country: "",
  tradingProfile: {
    experienceLevel: "",
    tradingStyle: "",
    primaryInstrument: "",
  },
};

const INPUT_CLASS =
  "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition disabled:opacity-70 disabled:cursor-not-allowed";

const EXPERIENCE_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERIENCED", label: "Experienced" },
];

const STYLE_OPTIONS = [
  { value: "SCALPING", label: "Scalping" },
  { value: "INTRADAY", label: "Intraday" },
  { value: "SWING", label: "Swing Trading" },
];

const normalizeProfile = (profile) => ({
  ...INITIAL_PROFILE,
  ...profile,
  tradingProfile: {
    ...INITIAL_PROFILE.tradingProfile,
    ...(profile?.tradingProfile || {}),
  },
});

function FormField({ label, icon: Icon, children, description }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>

      {children}

      {description && (
        <p className="text-[10px] text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [savedProfile, setSavedProfile] = useState(INITIAL_PROFILE);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchUserProfile(user.uid);
        const normalized = normalizeProfile(data.profile);

        if (!cancelled) {
          setProfile(normalized);
          setSavedProfile(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateField = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateTradingField = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      tradingProfile: {
        ...previous.tradingProfile,
        [field]: value,
      },
    }));
  };

  const handleEdit = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!profile.displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        displayName: profile.displayName.trim(),
        phoneNumber: profile.phoneNumber.trim(),
        country: profile.country.trim(),
        tradingProfile: {
          experienceLevel: profile.tradingProfile.experienceLevel || null,
          tradingStyle: profile.tradingProfile.tradingStyle || null,
          primaryInstrument: profile.tradingProfile.primaryInstrument || null,
        },
      };

      const data = await updateUserProfile(user.uid, payload);
      const normalized = normalizeProfile(data.profile);

      setProfile(normalized);
      setSavedProfile(normalized);
      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const experienceLabel =
    EXPERIENCE_OPTIONS.find(
      (item) => item.value === profile.tradingProfile.experienceLevel,
    )?.label || "Not selected";

  const styleLabel =
    STYLE_OPTIONS.find(
      (item) => item.value === profile.tradingProfile.tradingStyle,
    )?.label || "Not selected";

  const instrument = profile.tradingProfile.primaryInstrument;

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <FiRefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading your profile...</p>
      </main>
    );
  }

  if (error && !profile.email) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <FiAlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-rose-400">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-7">
      {/* Header */}
      <section>
        <p className="text-[10px] font-mono tracking-widest text-emerald-500">
          GUARDRAIL WORKSPACE
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              My Profile
            </h1>

            <p className="text-sm text-slate-400 mt-2">
              Manage your personal information and trading identity.
            </p>
          </div>

          {!editing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition"
            >
              <FiEdit3 />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-sm px-4 py-2.5 rounded-xl transition"
              >
                <FiX />
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
          <FiAlertCircle />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs">
          <FiCheckCircle />
          {success}
        </div>
      )}

      {/* Personal Information */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FiUser className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Personal Information
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Your basic account information
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Display Name" icon={FiUser}>
            <input
              type="text"
              maxLength={50}
              value={profile.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              disabled={!editing}
              placeholder="Enter your display name"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField
            label="Email Address"
            icon={FiMail}
            description="Your email is linked to your authentication account."
          >
            <input
              type="email"
              value={profile.email}
              readOnly
              className={`${INPUT_CLASS} opacity-70`}
            />
          </FormField>

          <FormField
            label="Phone Number"
            icon={FiPhone}
            description="Optional contact information."
          >
            <input
              type="tel"
              value={profile.phoneNumber}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
              disabled={!editing}
              placeholder="Enter your phone number"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Country" icon={FiMapPin}>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => updateField("country", e.target.value)}
              disabled={!editing}
              placeholder="Enter your country"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
      </section>

      {/* Trading Profile */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FiBriefcase className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Trading Profile
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Tell us about your trading approach
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Experience Level">
              <select
                value={profile.tradingProfile.experienceLevel}
                onChange={(e) =>
                  updateTradingField("experienceLevel", e.target.value)
                }
                disabled={!editing}
                className={INPUT_CLASS}
              >
                <option value="">Select experience</option>

                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {!editing && (
                <p className="text-[10px] text-slate-500">{experienceLabel}</p>
              )}
            </FormField>

            <FormField label="Trading Style">
              <select
                value={profile.tradingProfile.tradingStyle}
                onChange={(e) =>
                  updateTradingField("tradingStyle", e.target.value)
                }
                disabled={!editing}
                className={INPUT_CLASS}
              >
                <option value="">Select trading style</option>

                {STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {!editing && (
                <p className="text-[10px] text-slate-500">{styleLabel}</p>
              )}
            </FormField>
          </div>

          {/* Primary Instrument */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">
                Primary Trading Instrument
              </label>

              <p className="text-[10px] text-slate-500 mt-1">
                Choose the instrument you primarily prefer to trade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["NIFTY", "BANKNIFTY"].map((item) => {
                const selected = instrument === item;

                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!editing}
                    onClick={() =>
                      updateTradingField("primaryInstrument", item)
                    }
                    className={`p-5 rounded-xl border text-left transition ${
                      selected
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    } disabled:cursor-default`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-mono font-bold text-slate-100">
                          {item}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-1">
                          {item === "NIFTY"
                            ? "NIFTY 50 Index"
                            : "NIFTY Bank Index"}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selected
                            ? "border-emerald-400 bg-emerald-500"
                            : "border-slate-600"
                        }`}
                      >
                        {selected && (
                          <FiCheckCircle className="w-3 h-3 text-slate-950" />
                        )}
                      </div>
                    </div>

                    {selected && (
                      <p className="text-[10px] text-emerald-400 mt-4">
                        Primary preference selected
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!editing && (
            <p className="text-[10px] text-slate-500">
              Your primary instrument is a preference only. It does not restrict
              access to other supported instruments.
            </p>
          )}
        </div>
      </section>

      {/* Bottom Save Actions */}
      {editing && (
        <div className="flex justify-end gap-3 pb-4">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-sm hover:text-slate-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition disabled:opacity-50"
          >
            <FiSave />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </main>
  );
}
