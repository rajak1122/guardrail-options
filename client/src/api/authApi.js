const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function syncUserWithBackend({ idToken, email, displayName }) {
  const res = await fetch(`${API_BASE}/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ email, displayName }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to sync user");
  }
  return data;
}
