"use client";
import { useEffect } from "react";
import * as maplibregl from "maplibre-gl";
import { createClient } from "@/lib/supabase/client";

type Loc = {
  user_id: string;
  lat: number;
  lng: number;
  sharing: boolean;
  updated_at: string;
};
type Entry = {
  marker: maplibregl.Marker;
  el: HTMLElement;
  name: string;
  updatedAt: number;
};

const STALE_MS = 2 * 60 * 1000;

function ago(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function OtherMarkers({
  map,
  userId,
}: {
  map: maplibregl.Map;
  userId: string;
}) {
  useEffect(() => {
    const supabase = createClient();
    const entries = new Map<string, Entry>();
    let alive = true;

    const refreshStyle = (e: Entry) => {
      const age = Date.now() - e.updatedAt;
      e.el.style.opacity = age > STALE_MS ? "0.5" : "1";
      e.marker.getPopup()?.setText(`${e.name} · ${ago(age)}`);
    };

    const decorate = async (id: string, e: Entry) => {
      const { data } = await supabase
        .from("circle_profiles")
        .select("display_name, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (!data || !alive) return;
      e.name = data.display_name;
      if (data.avatar_url) {
        const img = document.createElement("img");
        img.src = data.avatar_url;
        img.referrerPolicy = "no-referrer";
        img.className = "h-full w-full object-cover";
        e.el.textContent = "";
        e.el.appendChild(img);
      } else {
        e.el.textContent = data.display_name.charAt(0).toUpperCase();
      }
      refreshStyle(e);
    };

    const remove = (id: string) => {
      entries.get(id)?.marker.remove();
      entries.delete(id);
    };

    const upsert = (loc: Loc) => {
      if (!alive || loc.user_id === userId) return;
      if (!loc.sharing) return remove(loc.user_id);

      let e = entries.get(loc.user_id);
      if (!e) {
        const el = document.createElement("div");
        el.className =
          "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-emerald-600 font-bold text-white shadow-lg";
        el.textContent = "?";
        const marker = new maplibregl.Marker({ element: el }).setPopup(
          new maplibregl.Popup({ offset: 25 }),
        );
        e = { marker, el, name: "Teman", updatedAt: 0 };
        entries.set(loc.user_id, e);
        decorate(loc.user_id, e);
      }
      e.updatedAt = new Date(loc.updated_at).getTime();
      e.marker.setLngLat([loc.lng, loc.lat]).addTo(map);
      refreshStyle(e);
    };

    const sync = async () => {
      const { data } = await supabase
        .from("circle_locations")
        .select("user_id, lat, lng, sharing, updated_at");
      const seen = new Set<string>();
      ((data ?? []) as Loc[]).forEach((l) => {
        if (l.user_id !== userId && l.sharing) seen.add(l.user_id);
        upsert(l);
      });
      entries.forEach((_, id) => {
        if (!seen.has(id)) remove(id);
      });
    };

    sync();

    const channel = supabase
      .channel("circle-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circle_locations" },
        (p) => {
          if (p.eventType === "DELETE")
            remove((p.old as { user_id: string }).user_id);
          else upsert(p.new as Loc);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circle_friendships" },
        () => sync(),
      )
      .subscribe();

    // refresh status "terakhir dilihat" + sinkron ulang sebagai cadangan
    const timer = setInterval(() => {
      entries.forEach(refreshStyle);
      sync();
    }, 30000);

    return () => {
      alive = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
      entries.forEach((e) => e.marker.remove());
    };
  }, [map, userId]);

  return null;
}
