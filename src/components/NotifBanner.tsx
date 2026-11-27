"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { getPushState, enablePush, type PushState } from "@/lib/push";

export default function NotifBanner() {
  const [state, setState] = useState<PushState | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => getPushState().then(setState);
    refresh();
    window.addEventListener("circlo-push-change", refresh);
    return () => window.removeEventListener("circlo-push-change", refresh);
  }, []);

  // hanya tampil jika didukung, belum aktif, dan belum diblokir
  if (state !== "off" || hidden) return null;

  const enable = async () => {
    setBusy(true);
    try {
      await enablePush();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengaktifkan notifikasi");
    }
    setBusy(false);
  };

  return (
    <div className="glass-bar absolute bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-10 rounded-2xl p-4 text-sm text-[#1a2e05] sm:right-auto sm:max-w-sm">
      <button
        onClick={() => setHidden(true)}
        aria-label="Tutup"
        className="absolute right-3 top-3 opacity-60"
      >
        <X size={16} />
      </button>
      <p className="flex items-center gap-2 pr-6 font-bold">
        <Bell size={16} /> Aktifkan notifikasi
      </p>
      <p className="mt-1 text-[#1a2e05]/70">
        Dapat pengingat untuk membuka Circlo, dan terima ping dari teman saat
        mereka mencarimu.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={enable}
          disabled={busy}
          className="btn-solid flex-1 rounded-xl py-2 font-bold disabled:opacity-60"
        >
          Aktifkan
        </button>
        <button
          onClick={() => setHidden(true)}
          className="btn-glass rounded-xl px-4 py-2 font-semibold"
        >
          Nanti
        </button>
      </div>
    </div>
  );
}
