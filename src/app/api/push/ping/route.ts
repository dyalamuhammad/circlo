import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

type Sub = { endpoint: string; p256dh: string; auth_key: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const friendId = body?.friendId;
  if (typeof friendId !== "string")
    return NextResponse.json({ status: "bad_request" }, { status: 400 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject)
    return NextResponse.json({ status: "error" }, { status: 500 });

  const { data, error } = await supabase.rpc("circle_prepare_ping", {
    p_friend: friendId,
  });
  if (error)
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 400 },
    );
  if (data.status !== "ok") return NextResponse.json(data);

  webpush.setVapidDetails(subject, pub, priv);

  let sent = 0;
  const PING_TEXTS = [
    "Hi, kamu di mana? Aku lagi online 📍",
    "Lagi di mana nih? Buka Circlo yuk, aku udah online 👀",
    "Psst, posisimu di mana sekarang? Aku lagi online 📍",
  ];
  for (const s of data.subs as Sub[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        JSON.stringify({
          title: data.sender_name,
          body: PING_TEXTS[Math.floor(Math.random() * PING_TEXTS.length)],
          tag: `ping-${user.id}`,
          url: "/",
        }),
      );
      sent++;
    } catch {
      // langganan kedaluwarsa dibiarkan, dibersihkan saat pemiliknya membuka app
    }
  }

  return NextResponse.json({
    status: sent > 0 ? "ok" : "delivery_failed",
    sent,
  });
}
