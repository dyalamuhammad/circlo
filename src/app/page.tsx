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
import NotifBanner from "@/components/NotifBanner";
import SplashScreen from "@/components/SplashScreen";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MIN_SPLASH_MS = 9600;

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [sharing, setSharing] = useState(true);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);

  const [imgFailed, setImgFailed] = useState(false);

  const isGuest = user?.is_anonymous ?? false;
  const avatarUrl = isGuest ? null : user?.user_metadata?.avatar_url;
  const initial = isGuest
    ? "T"
    : (user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? "U");

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
      try {
        localStorage.setItem(
          "circlo-name",
          data.user.is_anonymous
            ? "Tamu"
            : String(
                data.user.user_metadata?.full_name ??
                  data.user.email ??
                  "Teman",
              ).split(/[ @]/)[0],
        );
      } catch {}
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

  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);

  if (!user || !minDone) return <SplashScreen />;

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
        onPosition={setMyLoc}
      />

      <div className="glass-bar absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex w-[calc(100%-1.5rem)] max-w-xs flex-col gap-3 rounded-[1.75rem] p-3.5 text-[#1a2e05]">
        {/* Baris 1: nama + keluar */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-[#1a2e05] text-base font-extrabold text-[#d9f99d] shadow-md">
            {avatarUrl && !imgFailed ? (
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg leading-tight font-extrabold tracking-tight">
              {user.is_anonymous
                ? "Tamu"
                : (user.user_metadata?.full_name ?? "Pengguna")}
            </p>
            <p className="text-xs font-semibold opacity-60">
              {sharing ? "Lokasi dibagikan" : "Lokasi tidak dibagikan"}
            </p>
          </div>

          <button
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
            className="btn-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Baris 2: aksi */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <button
            onClick={() => setShowFriends(true)}
            className="btn-solid flex items-center gap-1.5 rounded-full px-4 py-2"
          >
            <Users size={16} />
            Teman
          </button>

          <button
            onClick={toggleSharing}
            aria-pressed={sharing}
            title="Bagikan lokasi"
            className={`btn-glass flex items-center gap-1.5 rounded-full px-4 py-2 ${
              sharing ? "ring-2 ring-[#1a2e05]" : "opacity-80"
            }`}
          >
            {sharing ? <MapPin size={16} /> : <MapPinOff size={16} />}
            {sharing ? "ON" : "OFF"}
          </button>

          {!user.is_anonymous && <NotifButton />}
        </div>
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
          myLoc={myLoc}
        />
      )}
      {!user.is_anonymous && <NotifBanner />}
      <IosInstallBanner />
    </main>
  );
}
