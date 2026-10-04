const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("access");
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    localStorage.removeItem("access");
    location.href = "/login";
  }
  if (!res.ok) throw new Error(data ? Object.values(data).flat().join(" ") : res.statusText);
  return data;
}
