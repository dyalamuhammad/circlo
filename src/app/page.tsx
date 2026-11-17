"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensureProfile";
import dynamic from "next/dynamic";
import FriendsPanel from "@/components/FriendsPanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [sharing, setSharing] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      await ensureProfile(supabase, data.user);
      const { data: loc } = await supabase
        .from("circle_locations")
        .select("sharing")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (loc) setSharing(loc.sharing);
      setUser(data.user);
    };
    init();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const toggleSharing = async () => {
    const next = !sharing;
    setSharing(next);
    await supabase
      .from("circle_locations")
      .update({ sharing: next })
      .eq("user_id", user!.id);
  };

  if (!user) return <main className="p-8">Memuat...</main>;

  return (
    <main className="relative h-dvh w-full">
      <MapView
        sharing={sharing}
        userId={user.id}
        name={
          user.is_anonymous
            ? "Guest"
            : (user.user_metadata?.full_name ?? user.email ?? "U")
        }
        avatarUrl={user.user_metadata?.avatar_url}
      />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-3 rounded-lg bg-white/90 px-3 py-2 text-sm shadow">
        <span>{user.is_anonymous ? "Guest" : user.email}</span>
        <button onClick={toggleSharing} className="underline">
          Lokasi: {sharing ? "ON" : "OFF"}
        </button>
        <button onClick={() => setShowFriends(true)} className="underline">
          Teman
        </button>
        <button onClick={logout} className="underline">
          Logout
        </button>
      </div>
      {showFriends && (
        <FriendsPanel
          userId={user.id}
          isGuest={!!user.is_anonymous}
          onClose={() => setShowFriends(false)}
        />
      )}
    </main>
  );
}
