"use client";
import { useEffect } from "react";
import * as maplibregl from "maplibre-gl";
import { createClient } from "@/lib/supabase/client";

type Loc = { user_id: string; lat: number; lng: number; sharing: boolean };

export default function OtherMarkers({
  map,
  userId,
}: {
  map: maplibregl.Map;
  userId: string;
}) {
  useEffect(() => {
    const supabase = createClient();
    const markers = new Map<string, maplibregl.Marker>();

    const decorate = async (id: string, el: HTMLElement) => {
      const { data } = await supabase
        .from("circle_profiles")
        .select("display_name, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      el.title = data.display_name;
      if (data.avatar_url) {
        const img = document.createElement("img");
        img.src = data.avatar_url;
        img.referrerPolicy = "no-referrer";
        img.className = "h-full w-full object-cover";
        el.textContent = "";
        el.appendChild(img);
      } else {
        el.textContent = data.display_name.charAt(0).toUpperCase();
      }
    };

    const upsert = (loc: Loc) => {
      if (loc.user_id === userId) return;
      if (!loc.sharing) return remove(loc.user_id);

      let marker = markers.get(loc.user_id);
      if (!marker) {
        const el = document.createElement("div");
        el.className =
          "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-emerald-600 font-bold text-white shadow-lg";
        el.textContent = "?";
        marker = new maplibregl.Marker({ element: el });
        markers.set(loc.user_id, marker);
        decorate(loc.user_id, el);
      }
      marker.setLngLat([loc.lng, loc.lat]).addTo(map);
    };

    const remove = (id: string) => {
      markers.get(id)?.remove();
      markers.delete(id);
    };

    supabase
      .from("circle_locations")
      .select("user_id, lat, lng, sharing")
      .then(({ data }) => data?.forEach((l) => upsert(l as Loc)));

    const channel = supabase
      .channel("circle-locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circle_locations" },
        (payload) => {
          if (payload.eventType === "DELETE")
            remove((payload.old as { user_id: string }).user_id);
          else upsert(payload.new as Loc);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      markers.forEach((m) => m.remove());
    };
  }, [map, userId]);

  return null;
}
