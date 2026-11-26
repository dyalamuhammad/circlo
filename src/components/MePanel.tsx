"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, LogOut, MapPin, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reverseGeocode } from "@/lib/placeLabel";
import NotifButton from "@/components/NotifButton";
import { Notice, warn, type Note } from "@/components/FriendsPanel";

const MESSAGES: Record<string, Note> = {
  requested: { text: "Permintaan terkirim", ok: true },
  accepted: { text: "Kalian sekarang berteman", ok: true },
  pending: warn("Permintaan sudah terkirim, menunggu diterima."),
  not_found: warn("Kode tidak ditemukan."),
  self: warn("Itu kode kamu sendiri."),
  target_is_guest: warn("User guest tidak bisa berteman."),
  guest_not_allowed: warn("Guest tidak bisa menambah teman."),
};

type Props = {
  userId: string;
  isGuest: boolean;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  sharing: boolean;
  onToggleSharing: () => void;
  myLoc: { lat: number; lng: number } | null;
  onLogout: () => void;
  onClose: () => void;
};

export default function MePanel({
  userId,
  isGuest,
  name,
  email,
  avatarUrl,
  sharing,
  onToggleSharing,
  myLoc,
  onLogout,
  onClose,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<Note | null>(null);
  const [copied, setCopied] = useState(false);
  const [place, setPlace] = useState("");

  const lat = myLoc?.lat;
  const lng = myLoc?.lng;

  useEffect(() => {
    if (lat == null || lng == null) return;
    reverseGeocode(lat, lng).then(setPlace);
  }, [lat, lng]);

  useEffect(() => {
    if (isGuest) return;
    supabase
      .from("circle_profiles")
      .select("invite_code")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setCode(data?.invite_code ?? ""));
  }, [supabase, userId, isGuest]);

  const addFriend = async () => {
    if (!input.trim()) return;
    const { data, error } = await supabase.rpc("circle_add_friend_by_code", {
      p_code: input,
    });
    setMsg(
      error
        ? warn(error.message)
        : (MESSAGES[data as string] ?? warn(String(data))),
    );
    setInput("");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const placeText = !myLoc
    ? "Lokasi belum terdeteksi"
    : place || "Lokasi terdeteksi";

  return (
    <div className="glass-panel absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 mx-auto max-h-[65dvh] max-w-md overflow-y-auto rounded-[2rem] p-5 text-[#1a2e05]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight">Saya</h2>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="btn-glass flex h-9 w-9 items-center justify-center rounded-full"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 text-sm">
        {/* Profil + lokasi */}
        <div className="glass-row flex items-center gap-3 rounded-2xl p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#d9f99d]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-[#365314]">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold">{name}</p>
            <p className="truncate text-xs font-medium opacity-60">
              {email ?? "Akun tamu"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold opacity-75">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{placeText}</span>
            </p>
          </div>
        </div>

        {/* Pengaturan */}
        {!isGuest && (
          <div className="glass-row divide-y divide-[#1a2e05]/10 rounded-2xl px-4">
            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-bold">Bagikan lokasi</p>
                <p className="text-xs font-medium opacity-60">
                  {sharing
                    ? "Teman bisa melihatmu"
                    : "Disembunyikan dari teman"}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={sharing}
                aria-label="Bagikan lokasi"
                onClick={onToggleSharing}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  sharing ? "bg-[#1a2e05]" : "bg-[#1a2e05]/25"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full shadow transition-all ${
                    sharing ? "left-[22px] bg-[#d9f99d]" : "left-0.5 bg-white"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <p className="font-bold">Notifikasi</p>
              <div className="flex items-center gap-2">
                <NotifButton />
              </div>
            </div>
          </div>
        )}

        {/* Kode invite + tambah teman */}
        {isGuest ? (
          <p className="font-medium opacity-75">
            Guest tidak bisa menambah teman. Login dengan Google untuk memakai
            fitur ini.
          </p>
        ) : (
          <>
            <div>
              <p className="mb-1.5 font-semibold opacity-60">
                Kode invite kamu
              </p>
              <div className="glass-row flex items-center justify-between rounded-2xl py-2 pr-2 pl-4">
                <span className="font-mono text-xl font-bold tracking-widest">
                  {code}
                </span>
                <button
                  onClick={copyCode}
                  className="btn-glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>

            <div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFriend()}
                  placeholder="Kode teman"
                  className="glass-field w-full min-w-0 rounded-2xl px-4 py-3 font-semibold uppercase"
                />
                <button
                  onClick={addFriend}
                  className="btn-solid flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-3 font-bold"
                >
                  <UserPlus size={16} />
                  Tambah
                </button>
              </div>
              {msg && <Notice note={msg} />}
            </div>
          </>
        )}

        <button
          onClick={onLogout}
          className="btn-glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );
}
