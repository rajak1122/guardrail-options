const API_BASE = "http://localhost:5000/api";

export async function fetchJournalAnalytics(firebaseUid) {
  const res = await fetch(`${API_BASE}/journal/analytics/${firebaseUid}`);
  if (!res.ok) throw new Error("Failed to fetch journal analytics");
  return res.json();
}

export async function fetchTradeHistory(firebaseUid) {
  const res = await fetch(`${API_BASE}/orders/history/${firebaseUid}`);
  if (!res.ok) throw new Error("Failed to fetch trade history");
  return res.json();
}

export async function submitJournalEntry(journalData) {
  const res = await fetch(`${API_BASE}/journal/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(journalData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to submit journal");
  }
  return res.json();
}
