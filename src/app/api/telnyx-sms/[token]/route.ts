import { NextResponse } from "next/server";
import { insertSmsMessage } from "@/lib/db";
import { logFailure } from "@/lib/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Telnyx inbound SMS webhook. Configure this URL on the Telnyx Messaging Profile:
 *   https://<host>/api/telnyx-sms/<TELNYX_SMS_TOKEN>
 * The token comes from the TELNYX_SMS_TOKEN env var; without it every POST 404s.
 * Telnyx requires a 2xx response within 2 seconds (API v2), so the handler only
 * parses, stores, and replies — no slow work. Retries dedupe on payload.id.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const expected = process.env.TELNYX_SMS_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const data = (body as Record<string, unknown> | null)?.data as Record<string, unknown> | undefined;
    if (data?.event_type !== "message.received") {
      return NextResponse.json({ ok: true, ignored: true });
    }
    const payload = (data.payload ?? {}) as Record<string, unknown>;
    const from = (payload.from as Record<string, unknown> | undefined)?.phone_number ?? "";
    const toList = Array.isArray(payload.to) ? payload.to : [];
    const to = (toList[0] as Record<string, unknown> | undefined)?.phone_number ?? "";
    const text = typeof payload.text === "string" ? payload.text : "";
    const receivedAt =
      Date.parse(String(payload.received_at ?? data.occurred_at ?? "")) || Date.now();
    insertSmsMessage({
      messageId: String(
        payload.id ?? data.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ),
      eventId: typeof data.id === "string" ? data.id : null,
      fromNumber: String(from),
      toNumber: String(to),
      body: text,
      type: String(payload.type ?? "SMS"),
      receivedAt,
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logFailure("telnyx_sms_failed", error);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}
