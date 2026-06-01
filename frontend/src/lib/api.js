const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  listAgents: () => req("/api/agents"),
  chat: (agentId, messages) =>
    req(`/api/agents/${agentId}/chat`, {
      method: "POST",
      body: JSON.stringify({ messages, use_memory: true }),
    }),
  listMemories: (type) => req(`/api/memories${type ? `?type=${type}` : ""}`),
  addMemory: (mem) =>
    req("/api/memories", { method: "POST", body: JSON.stringify(mem) }),
  deleteMemory: (id) => req(`/api/memories/${id}`, { method: "DELETE" }),
  morningBriefing: () => req("/api/briefing/morning", { method: "POST" }),
  nightReview: () => req("/api/briefing/night", { method: "POST" }),
};
