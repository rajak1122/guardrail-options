const API_BASE = "http://localhost:5000/api";

export async function fetchUserProfile(firebaseUid) {
  const res = await fetch(`${API_BASE}/profile/${firebaseUid}`);

  if (!res.ok) {
    throw new Error("Failed to fetch profile.");
  }

  return res.json();
}

export async function updateUserProfile(firebaseUid, profileData) {
  const res = await fetch(`${API_BASE}/profile/${firebaseUid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update profile.");
  }

  return data;
}
