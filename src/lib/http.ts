export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include", // <- leva o cookie de sessão
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
