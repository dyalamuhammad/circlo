"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};
type Item = Row & { name: string };

const MESSAGES: Record<string, string> = {
  requested: "Permintaan terkirim ✅",
  accepted: "Kalian sekarang berteman ✅",
  pending: "Permintaan sudah terkirim, menunggu diterima.",
  not_found: "Kode tidak ditemukan.",
  self: "Itu kode kamu sendiri.",
  target_is_guest: "User guest tidak bisa berteman.",
  guest_not_allowed: "Guest tidak bisa menambah teman.",
};

type Props = { userId: string; isGuest: boolean; onClose: () => void };

export default function FriendsPanel({ userId, isGuest, onClose }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

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
  }, [supabase, userId]);

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest, load]);

  const addFriend = async () => {
    if (!input.trim()) return;
    const { data, error } = await supabase.rpc("circle_add_friend_by_code", {
      p_code: input,
    });
    setMsg(error ? error.message : (MESSAGES[data as string] ?? String(data)));
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

  const incoming = items.filter(
    (i) => i.status === "pending" && i.addressee_id === userId,
  );
  const outgoing = items.filter(
    (i) => i.status === "pending" && i.requester_id === userId,
  );
  const friends = items.filter((i) => i.status === "accepted");

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 sm:rounded-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Teman</h2>
        <button onClick={onClose} className="text-sm underline">
          Tutup
        </button>
      </div>

      {isGuest ? (
        <p className="text-sm text-gray-600">
          Guest tidak bisa berteman. Login dengan Google untuk memakai fitur
          ini.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-500">Kode invite kamu</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold tracking-widest">
                {code}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="rounded border px-2 py-1 text-xs"
              >
                Salin
              </button>
            </div>
          </div>

          <div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Kode teman"
                className="w-full rounded border px-3 py-2 uppercase"
              />
              <button
                onClick={addFriend}
                className="rounded bg-brand px-3 py-2 font-semibold"
              >
                Tambah
              </button>
            </div>
            {msg && <p className="mt-1 text-xs text-gray-600">{msg}</p>}
          </div>

          {incoming.length > 0 && (
            <div>
              <p className="mb-1 font-semibold">Permintaan masuk</p>
              {incoming.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between py-1"
                >
                  <span>{i.name}</span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => accept(i.id)}
                      className="rounded bg-brand px-2 py-1 font-semibold"
                    >
                      Terima
                    </button>
                    <button
                      onClick={() => remove(i.id)}
                      className="rounded border px-2 py-1"
                    >
                      Tolak
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <p className="mb-1 font-semibold">Menunggu diterima</p>
              {outgoing.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between py-1"
                >
                  <span>{i.name}</span>
                  <button
                    onClick={() => remove(i.id)}
                    className="rounded border px-2 py-1"
                  >
                    Batal
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-1 font-semibold">Teman ({friends.length})</p>
            {friends.length === 0 && (
              <p className="text-gray-500">Belum ada teman.</p>
            )}
            {friends.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between py-1"
              >
                <span>{i.name}</span>
                <button
                  onClick={() => remove(i.id)}
                  className="rounded border px-2 py-1"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
