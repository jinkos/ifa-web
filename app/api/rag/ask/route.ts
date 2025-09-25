import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL!; // e.g. https://api.example.com

export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch(`${FASTAPI_URL}/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
