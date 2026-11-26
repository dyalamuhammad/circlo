"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

type Props = { userId: string; isGuest: boolean; onClose: () => void };

export default function MePanel({ userId, isGuest, onClose }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<Note | null>(null);
  const [copied, setCopied] = useState(false);

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

      {isGuest ? (
        <p className="text-sm font-medium opacity-75">
          Guest tidak bisa menambah teman. Login dengan Google untuk memakai
          fitur ini.
        </p>
      ) : (
        <div className="space-y-5 text-sm">
          <div>
            <p className="mb-1.5 font-semibold opacity-60">Kode invite kamu</p>
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
        </div>
      )}
    </div>
  );
}
