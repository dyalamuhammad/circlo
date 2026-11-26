"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { agoLabel, reverseGeocode } from "@/lib/placeLabel";
import {
  BellRing,
  Check,
  CircleCheck,
  Info,
  MapPin,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { distanceM, formatDistance } from "@/lib/distance";

type Row = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};
type Item = Row & { name: string; avatarUrl: string | null };
export type Note = { text: string; ok: boolean; icon?: LucideIcon };

export const warn = (text: string): Note => ({ text, ok: false });

const PING_MESSAGES: Record<string, Note> = {
  ok: { text: "Ping terkirim", ok: true, icon: MapPin },
  no_subscription: warn("Teman ini belum mengaktifkan notifikasi."),
  not_friends: warn("Kalian belum berteman."),
  guest_not_allowed: warn("Guest tidak bisa mengirim ping."),
  delivery_failed: warn("Gagal mengirim, coba lagi nanti."),
};

export function Notice({ note }: { note: Note }) {
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
  myLoc: { lat: number; lng: number } | null;
};

export default function FriendsPanel({
  userId,
  isGuest,
  onClose,
  onLocate,
  myLoc,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [live, setLive] = useState<Set<string>>(new Set());
  const [info, setInfo] = useState<
    Record<string, { lat: number; lng: number; at: string }>
  >({});
  const [places, setPlaces] = useState<Record<string, string>>({});
  const [pingMsg, setPingMsg] = useState<Note | null>(null);
  const [pinging, setPinging] = useState<string | null>(null);

  const load = useCallback(async () => {
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
            .select("id, display_name, avatar_url")
            .in("id", ids)
        ).data
      : [];

    const profiles = new Map(
      (profs ?? []).map((p) => [
        p.id,
        {
          name: p.display_name as string,
          avatarUrl: (p.avatar_url as string | null) ?? null,
        },
      ]),
    );

    setItems(
      list.map((r) => {
        const profile = profiles.get(otherId(r));

        return {
          ...r,
          name: profile?.name ?? "User",
          avatarUrl: profile?.avatarUrl ?? null,
        };
      }),
    );

    const { data: locs } = await supabase
      .from("circle_locations")
      .select("user_id, lat, lng, sharing, updated_at");
    const on = (locs ?? []).filter((l) => l.sharing);
    setLive(new Set(on.map((l) => l.user_id)));
    setInfo(
      Object.fromEntries(
        on.map((l) => [
          l.user_id,
          { lat: l.lat, lng: l.lng, at: l.updated_at },
        ]),
      ),
    );
  }, [supabase, userId]);

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest, load]);

  useEffect(() => {
    Object.entries(info).forEach(([id, p]) => {
      if (id === userId) return;
      reverseGeocode(p.lat, p.lng).then((name) =>
        setPlaces((prev) =>
          prev[id] === name ? prev : { ...prev, [id]: name },
        ),
      );
    });
  }, [info, userId]);

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
    <div className="glass-panel absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 mx-auto max-h-[65dvh] max-w-md overflow-y-auto rounded-[2rem] p-5 text-[#1a2e05]">
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

                const isLive = live.has(fid);

                const dist =
                  isLive && myLoc
                    ? formatDistance(distanceM(myLoc, info[fid]))
                    : null;

                const place = isLive ? places[fid] : null;
                const lastSeen = isLive ? agoLabel(info[fid].at) : null;

                return (
                  <div
                    key={i.id}
                    role={isLive ? "button" : undefined}
                    tabIndex={isLive ? 0 : undefined}
                    onClick={() => isLive && onLocate(fid)}
                    onKeyDown={(e) =>
                      isLive && e.key === "Enter" && onLocate(fid)
                    }
                    className={`glass-row flex min-h-[88px] items-center gap-3 rounded-2xl p-3 ${
                      isLive
                        ? "cursor-pointer transition active:scale-[0.98]"
                        : ""
                    }`}
                  >
                    {/* Avatar teman */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#d9f99d]">
                      {i.avatarUrl ? (
                        <img
                          src={i.avatarUrl}
                          alt={i.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-[#365314]">
                          {i.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Informasi teman */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[15px] font-extrabold">
                          {i.name}
                        </span>

                        {dist && (
                          <span className="shrink-0 text-xs font-bold text-[#52732c]">
                            {dist}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 truncate text-xs font-semibold opacity-65">
                        {place ? `${place}` : "Lokasi tidak tersedia"}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium opacity-55">
                        {lastSeen ? `Aktif · ${lastSeen}` : "Tidak aktif"}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          ping(fid);
                        }}
                        disabled={pinging === fid}
                        aria-label="Ping"
                        title="Ping"
                        className="btn-glass flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
                      >
                        <BellRing size={17} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(i.id);
                        }}
                        aria-label="Hapus teman"
                        title="Hapus"
                        className="btn-glass flex h-10 w-10 items-center justify-center rounded-xl"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
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
