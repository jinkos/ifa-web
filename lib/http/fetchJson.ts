export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error || res.statusText);
    } catch {
      throw new Error(res.statusText);
    }
  }
  return res.json();
}
