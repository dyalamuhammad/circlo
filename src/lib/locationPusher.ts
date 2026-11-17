import type { SupabaseClient } from "@supabase/supabase-js";

function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Kirim jika: pertama kali, atau >=5 dtk & bergeser >10 m, atau heartbeat tiap 30 dtk
export function createLocationPusher(supabase: SupabaseClient, userId: string) {
  let lastSent = 0;
  let last: { lat: number; lng: number } | null = null;

  return async (lat: number, lng: number, accuracy: number) => {
    const now = Date.now();
    const elapsed = now - lastSent;
    const moved = last ? distanceM(last, { lat, lng }) : Infinity;

    if (last && !((elapsed >= 5000 && moved > 10) || elapsed >= 30000)) return;

    lastSent = now;
    last = { lat, lng };

    const { error } = await supabase.from("circle_locations").upsert({
      user_id: userId,
      lat,
      lng,
      accuracy,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("pushLocation:", error.message);
  };
}
