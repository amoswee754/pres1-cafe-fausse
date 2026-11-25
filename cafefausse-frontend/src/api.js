function apiUrl(path) {
  const configured = String(import.meta.env.VITE_API_URL ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\/+$/, "");
  return `${configured}${path}`;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function postJson(path, body) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(response);
  return { ok: response.ok, status: response.status, data };
}

export function getAvailability(timeSlot) {
  const params = new URLSearchParams({ time_slot: timeSlot });
  return fetch(apiUrl(`/api/availability?${params}`)).then(async (response) => {
    const data = await readJson(response);
    return { ok: response.ok, status: response.status, data };
  });
}
