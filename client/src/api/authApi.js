const API_BASE = "http://localhost:5000/api";

export async function syncUserWithBackend(userData) {
  const res = await fetch(`${API_BASE}/auth/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to sync user");
  }
  return res.json();
}
