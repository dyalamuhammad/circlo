"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensureProfile";
import dynamic from "next/dynamic";
import FriendsPanel from "@/components/FriendsPanel";
import IosInstallBanner from "@/components/IosInstallBanner";
import { Users, MapPin, MapPinOff, LogOut } from "lucide-react";
import NotifButton from "@/components/NotifButton";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [sharing, setSharing] = useState(true);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);

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
        focus={focus}
        demo={!!user.is_anonymous}
        sharing={sharing}
        userId={user.id}
        name={
          user.is_anonymous
            ? "Guest"
            : (user.user_metadata?.full_name ?? user.email ?? "U")
        }
        avatarUrl={user.user_metadata?.avatar_url}
      />
      <div className="glass-bar absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-[#1a2e05]">
        <span className="max-w-[140px] truncate">
          {user.is_anonymous ? "Tamu" : user.email}
        </span>
        <button
          onClick={() => setShowFriends(true)}
          className="btn-solid flex items-center gap-1.5 rounded-full px-3 py-1"
        >
          <Users size={16} />
          Teman
        </button>
        <button
          onClick={toggleSharing}
          aria-pressed={sharing}
          title="Bagikan lokasi"
          className="btn-glass flex items-center gap-1.5 rounded-full px-3 py-1"
        >
          {sharing ? <MapPin size={16} /> : <MapPinOff size={16} />}
          {sharing ? "ON" : "OFF"}
        </button>
        {!user.is_anonymous && <NotifButton />}
        <button
          onClick={logout}
          aria-label="Keluar"
          title="Keluar"
          className="btn-glass flex h-8 w-8 items-center justify-center rounded-full"
        >
          <LogOut size={16} />
        </button>
      </div>
      {showFriends && (
        <FriendsPanel
          onLocate={(id) => {
            setFocus({ id, n: Date.now() });
            setShowFriends(false);
          }}
          userId={user.id}
          isGuest={!!user.is_anonymous}
          onClose={() => setShowFriends(false)}
        />
      )}
      <IosInstallBanner />
    </main>
  );
}
