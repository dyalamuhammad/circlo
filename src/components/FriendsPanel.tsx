"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BellRing,
  Check,
  CircleCheck,
  Copy,
  Info,
  Locate,
  MapPin,
  Trash2,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";

type Row = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};
type Item = Row & { name: string };
type Note = { text: string; ok: boolean; icon?: LucideIcon };

const warn = (text: string): Note => ({ text, ok: false });

const MESSAGES: Record<string, Note> = {
  requested: { text: "Permintaan terkirim", ok: true },
  accepted: { text: "Kalian sekarang berteman", ok: true },
  pending: warn("Permintaan sudah terkirim, menunggu diterima."),
  not_found: warn("Kode tidak ditemukan."),
  self: warn("Itu kode kamu sendiri."),
  target_is_guest: warn("User guest tidak bisa berteman."),
  guest_not_allowed: warn("Guest tidak bisa menambah teman."),
};

const PING_MESSAGES: Record<string, Note> = {
  ok: { text: "Ping terkirim", ok: true, icon: MapPin },
  no_subscription: warn("Teman ini belum mengaktifkan notifikasi."),
  not_friends: warn("Kalian belum berteman."),
  guest_not_allowed: warn("Guest tidak bisa mengirim ping."),
  delivery_failed: warn("Gagal mengirim, coba lagi nanti."),
};

function Notice({ note }: { note: Note }) {
  const Icon = note.icon ?? (note.ok ? CircleCheck : Info);
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-[#1a2e05]">
      <Icon size={14} className="mt-px shrink-0" />
      <span className="opacity-80">{note.text}</span>
    </p>
  );
}

type Props = {
  userId: string;
  isGuest: boolean;
  onClose: () => void;
  onLocate: (id: string) => void;
};

export default function FriendsPanel({
  userId,
  isGuest,
  onClose,
  onLocate,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<Note | null>(null);
  const [live, setLive] = useState<Set<string>>(new Set());
  const [pingMsg, setPingMsg] = useState<Note | null>(null);
  const [pinging, setPinging] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data: me } = await supabase
      .from("circle_profiles")
      .select("invite_code")
      .eq("id", userId)
      .maybeSingle();
    setCode(me?.invite_code ?? "");

    const { data: rows } = await supabase
      .from("circle_friendships")
      .select("id, requester_id, addressee_id, status");
    const list = (rows ?? []) as Row[];
    const otherId = (r: Row) =>
      r.requester_id === userId ? r.addressee_id : r.requester_id;
    const ids = list.map(otherId);

    const profs = ids.length
      ? (
          await supabase
            .from("circle_profiles")
            .select("id, display_name")
            .in("id", ids)
        ).data
      : [];
    const names = new Map(
      (profs ?? []).map((p) => [p.id, p.display_name as string]),
    );
    setItems(
      list.map((r) => ({ ...r, name: names.get(otherId(r)) ?? "User" })),
    );
    const { data: locs } = await supabase
      .from("circle_locations")
      .select("user_id, sharing");
    setLive(
      new Set((locs ?? []).filter((l) => l.sharing).map((l) => l.user_id)),
    );
  }, [supabase, userId]);

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest, load]);

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
    load();
  };

  const accept = async (id: string) => {
    await supabase
      .from("circle_friendships")
      .update({ status: "accepted" })
      .eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("circle_friendships").delete().eq("id", id);
    load();
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const ping = async (fid: string) => {
    setPinging(fid);
    setPingMsg(null);
    try {
      const r = await fetch("/api/push/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: fid }),
      });
      const j = await r.json();
      setPingMsg(
        j.status === "rate_limited"
          ? warn(
              `Tunggu ${Math.ceil((j.retry_in ?? 60) / 60)} menit lagi sebelum ping lagi.`,
            )
          : (PING_MESSAGES[j.status] ?? warn("Gagal mengirim ping.")),
      );
    } catch {
      setPingMsg(warn("Gagal mengirim ping."));
    }
    setPinging(null);
  };

  const incoming = items.filter(
    (i) => i.status === "pending" && i.addressee_id === userId,
  );
  const outgoing = items.filter(
    (i) => i.status === "pending" && i.requester_id === userId,
  );
  const friends = items.filter((i) => i.status === "accepted");

  return (
    <div className="glass-panel absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-[2rem] p-5 text-[#1a2e05] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 sm:rounded-[2rem]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight">Teman</h2>
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
          Guest tidak bisa berteman. Login dengan Google untuk memakai fitur
          ini.
        </p>
      ) : (
        <div className="space-y-5 text-sm">
          {/* Kode invite */}
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

          {/* Tambah teman */}
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

          {/* Permintaan masuk */}
          {incoming.length > 0 && (
            <div>
              <p className="mb-2 font-bold">Permintaan masuk</p>
              <div className="space-y-2">
                {incoming.map((i) => (
                  <div
                    key={i.id}
                    className="glass-row flex items-center justify-between gap-2 rounded-2xl p-2.5 pl-4"
                  >
                    <span className="truncate font-semibold">{i.name}</span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => accept(i.id)}
                        className="btn-solid flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold"
                      >
                        <Check size={14} />
                        Terima
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        className="btn-glass rounded-xl px-3 py-1.5 text-xs font-bold"
                      >
                        Tolak
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menunggu */}
          {outgoing.length > 0 && (
            <div>
              <p className="mb-2 font-bold">Menunggu diterima</p>
              <div className="space-y-2">
                {outgoing.map((i) => (
                  <div
                    key={i.id}
                    className="glass-row flex items-center justify-between gap-2 rounded-2xl p-2.5 pl-4"
                  >
                    <span className="truncate font-semibold">{i.name}</span>
                    <button
                      onClick={() => remove(i.id)}
                      className="btn-glass rounded-xl px-3 py-1.5 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daftar teman */}
          <div>
            <p className="mb-2 font-bold">
              Teman{" "}
              <span className="ml-1 rounded-full bg-[#1a2e05] px-2 py-0.5 text-xs text-[#d9f99d]">
                {friends.length}
              </span>
            </p>
            {pingMsg && <Notice note={pingMsg} />}
            {friends.length === 0 && (
              <p className="font-medium opacity-60">Belum ada teman.</p>
            )}
            <div className="mt-2 space-y-2">
              {friends.map((i) => {
                const fid =
                  i.requester_id === userId ? i.addressee_id : i.requester_id;
                return (
                  <div
                    key={i.id}
                    className="glass-row flex items-center justify-between gap-2 rounded-2xl p-2.5 pl-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {i.name}
                      </span>
                      {!live.has(fid) && (
                        <span className="block text-[11px] font-medium opacity-55">
                          Lokasi tidak tersedia
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {live.has(fid) && (
                        <button
                          onClick={() => onLocate(fid)}
                          className="btn-solid flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold"
                        >
                          <Locate size={14} />
                          Lihat
                        </button>
                      )}
                      <button
                        onClick={() => ping(fid)}
                        disabled={pinging === fid}
                        aria-label="Ping"
                        title="Ping"
                        className="btn-glass flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-50"
                      >
                        <BellRing size={14} />
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        aria-label="Hapus teman"
                        title="Hapus"
                        className="btn-glass flex h-8 w-8 items-center justify-center rounded-xl"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
