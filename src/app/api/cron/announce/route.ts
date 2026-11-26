import { NextResponse } from "next/server";
import webpush from "web-push";
import { Receiver } from "@upstash/qstash";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.text();
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });
  const valid = await receiver
    .verify({ signature: req.headers.get("upstash-signature") ?? "", body })
    .catch(() => false);
  if (!valid)
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let msg: { title?: string; body?: string; url?: string };
  try {
    msg = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!msg.body)
    return NextResponse.json({ error: "body kosong" }, { status: 400 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject)
    return NextResponse.json(
      { error: "VAPID env belum lengkap" },
      { status: 500 },
    );
  webpush.setVapidDetails(subject, pub, priv);

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("circle_push_subscriptions")
    .select("id, endpoint, p256dh, auth_key");

  const payload = JSON.stringify({
    title: msg.title || "Circlo",
    body: msg.body,
    tag: "update",
    url: msg.url?.startsWith("/") ? msg.url : "/",
  });

  const expired: string[] = [];
  const results = await Promise.allSettled(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth_key },
          },
          payload,
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) expired.push(s.id);
        throw e;
      }
    }),
  );

  if (expired.length)
    await admin.from("circle_push_subscriptions").delete().in("id", expired);
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({
    sent,
    total: subs?.length ?? 0,
    expired: expired.length,
  });
}
