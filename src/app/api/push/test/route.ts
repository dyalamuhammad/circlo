import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject)
    return NextResponse.json(
      { error: "VAPID env belum lengkap" },
      { status: 500 },
    );
  webpush.setVapidDetails(subject, pub, priv);

  // RLS: hanya langganan milik user ini
  const { data: subs } = await supabase
    .from("circle_push_subscriptions")
    .select("id, endpoint, p256dh, auth_key");

  let sent = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        JSON.stringify({
          title: "Circlo",
          body: "Notifikasi tes berhasil 🎉",
          url: "/",
        }),
      );
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410)
        await supabase
          .from("circle_push_subscriptions")
          .delete()
          .eq("id", s.id);
    }
  }
  return NextResponse.json({ sent });
}
