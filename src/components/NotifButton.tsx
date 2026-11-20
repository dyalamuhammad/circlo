"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  getPushState,
  enablePush,
  disablePush,
  type PushState,
} from "@/lib/push";

export default function NotifButton() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  if (!state || state === "unsupported" || state === "ios-install") return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (state === "on") await disablePush();
      else await enablePush();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal");
    }
    setState(await getPushState());
    setBusy(false);
  };

  const test = async () => {
    const r = await fetch("/api/push/test", { method: "POST" });
    const j = await r.json();
    alert(r.ok ? `Terkirim ke ${j.sent} perangkat` : (j.error ?? "Gagal"));
  };

  return (
    <>
      <button
        onClick={toggle}
        disabled={busy || state === "denied"}
        aria-label="Notifikasi"
        title={
          state === "denied"
            ? "Notifikasi diblokir di pengaturan browser"
            : "Notifikasi"
        }
        className="btn-glass flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-50"
      >
        {state === "on" ? <Bell size={16} /> : <BellOff size={16} />}
      </button>
    </>
  );
}
