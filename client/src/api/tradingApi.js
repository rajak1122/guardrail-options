const API_BASE = "http://localhost:5000/api";

export async function fetchAccountDetails(firebaseUid) {
  const res = await fetch(`${API_BASE}/accounts/${firebaseUid}`);
  if (!res.ok) throw new Error("Account not found");
  return res.json();
}

export async function initializeAccount(accountData) {
  const res = await fetch(`${API_BASE}/accounts/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accountData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to initialize account");
  }
  return res.json();
}

export async function placeOrder(orderPayload) {
  const res = await fetch(`${API_BASE}/orders/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to place order");
  }
  return res.json();
}

export async function fetchAccountActivities(firebaseUid, limit = 10) {
  const res = await fetch(
    `${API_BASE}/accounts/activities/${encodeURIComponent(firebaseUid)}?limit=${limit}`,
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch account activities");
  }

  return res.json();
}

export async function fetchEquityCurve(firebaseUid, range = "1D") {
  const res = await fetch(
    `${API_BASE}/accounts/equity-curve/${encodeURIComponent(firebaseUid)}?range=${range}`,
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch equity curve");
  }

  return res.json();
}
