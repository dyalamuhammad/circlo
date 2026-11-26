import type { SupabaseClient } from "@supabase/supabase-js";
import { distanceM } from "@/lib/distance";

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
