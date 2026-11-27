"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";
import { createLocationPusher } from "@/lib/locationPusher";
import OtherMarkers from "@/components/OtherMarkers";
import DemoBots from "@/components/DemoBots";
import { LocateFixed } from "lucide-react";
import { mapStyleUrl } from "@/lib/mapTheme";

type Props = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  sharing: boolean;
  demo?: boolean;
  focus?: { id: string; n: number } | null;
  onPosition?: (p: { lat: number; lng: number }) => void;
  onReady?: () => void;
  onProgress?: (s: "style" | "located") => void;
  dark?: boolean;
};

export default function MapView({
  userId,
  name,
  avatarUrl,
  sharing,
  demo,
  focus,
  onPosition,
  onReady,
  onProgress,
  dark,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const lastPos = useRef<[number, number] | null>(null);
  const darkRef = useRef(!!dark);
  const appliedDark = useRef(!!dark);
  useEffect(() => {
    darkRef.current = !!dark;
  }, [dark]);

  const sharingRef = useRef(sharing);
  useEffect(() => {
    sharingRef.current = sharing;
  }, [sharing]);
  const onPositionRef = useRef(onPosition);
  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  useEffect(() => {
    if (!containerRef.current) return;
    const supabase = createClient();
    const pushLocation = createLocationPusher(supabase, userId);
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    appliedDark.current = darkRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyleUrl(darkRef.current),
      center: [106.8456, -6.2088], // fallback: Jakarta
      zoom: 3,
    });
    setMapInstance(map);
    let located = false;
    let ready = false;
    const finish = () => {
      if (!ready && located && map.loaded()) {
        ready = true;
        onReadyRef.current?.();
      }
    };
    map.on("idle", finish);
    map.on("load", () => onProgressRef.current?.("style"));
    const markLocated = () => {
      if (located) return;
      located = true;
      onProgressRef.current?.("located");
      finish();
    };
    const locateTimer = setTimeout(markLocated, 6000);

    // elemen marker custom (avatar / inisial)
    const el = document.createElement("div");
    el.className =
      "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-brand font-bold shadow-lg";
    if (avatarUrl) {
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.className = "h-full w-full object-cover";
      img.referrerPolicy = "no-referrer";
      el.appendChild(img);
    } else {
      el.textContent = name.charAt(0).toUpperCase();
    }

    const marker = new maplibregl.Marker({ element: el });
    let firstFix = true;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lngLat: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        lastPos.current = lngLat;
        marker.setLngLat(lngLat).addTo(map);
        if (firstFix) {
          map.jumpTo({ center: lngLat, zoom: 16 });
          markLocated();
          setMyPos(lngLat);
          firstFix = false;
        }
        setError(null);
        onPositionRef.current?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (sharingRef.current)
          pushLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
          );
      },
      (err) => {
        setError(
          err.code === 1
            ? "Izin lokasi ditolak. Aktifkan di pengaturan browser."
            : "Gagal mengambil lokasi.",
        );
        markLocated();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      setMapInstance(null);
      navigator.geolocation.clearWatch(watchId);
      map.remove();
      clearTimeout(locateTimer);
    };
  }, [name, avatarUrl]);

  useEffect(() => {
    if (!mapInstance || appliedDark.current === !!dark) return;
    appliedDark.current = !!dark;
    mapInstance.setStyle(mapStyleUrl(!!dark));
  }, [dark, mapInstance]);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      {mapInstance && (
        <OtherMarkers map={mapInstance} userId={userId} focus={focus ?? null} />
      )}{" "}
      {mapInstance && demo && myPos && (
        <DemoBots map={mapInstance} center={myPos} />
      )}
      {mapInstance && (
        <button
          onClick={() =>
            lastPos.current &&
            mapInstance.flyTo({ center: lastPos.current, zoom: 16 })
          }
          aria-label="Ke posisiku"
          title="Ke posisiku"
          className="glass-bar absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-12 w-12 items-center justify-center rounded-full text-[#1a2e05] transition active:scale-95"
        >
          <LocateFixed size={22} />
        </button>
      )}
      {error && (
        <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-10 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white">
          {error}
        </div>
      )}
    </>
  );
}
