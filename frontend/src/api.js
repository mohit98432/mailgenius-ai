const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("mg_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (e) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: data, auth: false }),
  login: (data) => request("/auth/login", { method: "POST", body: data, auth: false }),
  me: () => request("/auth/me"),

  generate: (data) => request("/emails/generate", { method: "POST", body: data }),
  rewrite: (data) => request("/emails/rewrite", { method: "POST", body: data }),
  subjects: (data) => request("/emails/subjects", { method: "POST", body: data }),
  sendNow: (data) => request("/emails/send-now", { method: "POST", body: data }),
  listEmails: () => request("/emails"),

  schedule: (data) => request("/schedule", { method: "POST", body: data }),
  listScheduled: () => request("/schedule"),
  cancelScheduled: (id) => request(`/schedule/${id}`, { method: "DELETE" }),

  getSmtp: () => request("/smtp"),
  saveSmtp: (data) => request("/smtp", { method: "PUT", body: data }),
};

export { API_URL };
