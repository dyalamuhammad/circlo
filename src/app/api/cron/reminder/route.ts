import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { Receiver } from "@upstash/qstash";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(req: Request) {
  // 1. Pastikan request benar-benar dari QStash
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

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject)
    return NextResponse.json(
      { error: "VAPID env belum lengkap" },
      { status: 500 },
    );
  webpush.setVapidDetails(subject, pub, priv);

  // 2. Pilih target
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("circle_push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth_key");
  if (!subs?.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const userIds = [...new Set(subs.map((s) => s.user_id))];
  const { data: locs } = await admin
    .from("circle_locations")
    .select("user_id, sharing, updated_at")
    .in("user_id", userIds);
  const locMap = new Map((locs ?? []).map((l) => [l.user_id, l]));

  const staleMs = Number(process.env.REMINDER_STALE_HOURS ?? 6) * 3600000;
  const now = Date.now();
  const targets = subs.filter((s) => {
    const l = locMap.get(s.user_id);
    if (!l) return true;
    if (!l.sharing) return false;
    return now - new Date(l.updated_at).getTime() >= staleMs;
  });

  // 3. Kirim
  const expired: string[] = [];
  const results = await Promise.allSettled(
    targets.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth_key },
          },
          JSON.stringify({
            title: "Circlo",
            body: "Sudah buka Circlo hari ini? 📍 Buka sebentar biar lokasimu ter-update.",
            tag: "reminder",
            url: "/",
          }),
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
    skipped: subs.length - targets.length,
    expired: expired.length,
  });
}
