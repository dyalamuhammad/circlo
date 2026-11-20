"use client";
import { useEffect } from "react";
import * as maplibregl from "maplibre-gl";

const BOTS = [
  { name: "Dina", radius: 120, speed: 0.00006, phase: 0 },
  { name: "Raka", radius: 220, speed: -0.00004, phase: 2 },
  { name: "Sari", radius: 340, speed: 0.00003, phase: 4 },
];

export default function DemoBots({
  map,
  center,
}: {
  map: maplibregl.Map;
  center: [number, number];
}) {
  useEffect(() => {
    const [lng0, lat0] = center;
    const mPerLat = 111320;
    const mPerLng = 111320 * Math.cos((lat0 * Math.PI) / 180);

    const markers = BOTS.map((b) => {
      const el = document.createElement("div");
      el.className =
        "bg-zinc-900 text-lime-300 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white font-bold shadow-lg";
      el.textContent = b.name.charAt(0);
      return new maplibregl.Marker({ element: el }).setPopup(
        new maplibregl.Popup({ offset: 25 }).setText(
          `${b.name} (demo) · baru saja`,
        ),
      );
    });

    const place = () => {
      const t = Date.now();
      BOTS.forEach((b, i) => {
        const a = b.phase + t * b.speed;
        markers[i]
          .setLngLat([
            lng0 + (Math.cos(a) * b.radius) / mPerLng,
            lat0 + (Math.sin(a) * b.radius) / mPerLat,
          ])
          .addTo(map);
      });
    };

    place();
    const timer = setInterval(place, 1000);
    return () => {
      clearInterval(timer);
      markers.forEach((m) => m.remove());
    };
  }, [map, center]);

  return (
    <div className="absolute left-3 top-36 z-10 max-w-[260px] rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-700 shadow">
      <b>Mode demo:</b> teman di peta adalah simulasi. Login dengan Google untuk
      berteman sungguhan.
    </div>
  );
}
