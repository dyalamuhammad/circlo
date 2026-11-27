"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensureProfile";
import dynamic from "next/dynamic";
import FriendsPanel from "@/components/FriendsPanel";
import IosInstallBanner from "@/components/IosInstallBanner";
import NotifButton from "@/components/NotifButton";
import NotifBanner from "@/components/NotifBanner";
import SplashScreen from "@/components/SplashScreen";
import BottomNav, { type Tab } from "@/components/BottomNav";
import MePanel from "@/components/MePanel";
import type { MapTheme } from "@/lib/mapTheme";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MIN_SPLASH_MS = 2600;
const MAX_SPLASH_MS = 15000;

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
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
  const [mapReady, setMapReady] = useState(false);
  const [stage, setStage] = useState({ style: false, located: false });
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMinDone(true), MIN_SPLASH_MS);
    const t2 = setTimeout(() => setMapReady(true), MAX_SPLASH_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);

  const [mapTheme, setMapTheme] = useState<MapTheme>("auto");
  const [sysDark, setSysDark] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("circlo-map-theme");
      if (s === "light" || s === "dark" || s === "auto") setMapTheme(s);
    } catch {}
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSysDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const changeMapTheme = (t: MapTheme) => {
    setMapTheme(t);
    try {
      localStorage.setItem("circlo-map-theme", t);
    } catch {}
  };
  const mapDark = mapTheme === "dark" || (mapTheme === "auto" && sysDark);

  const allReady = !!user && minDone && mapReady;
  const progress = allReady
    ? 100
    : (user ? 25 : 0) +
      (stage.style ? 20 : 0) +
      (stage.located ? 20 : 0) +
      (mapReady ? 20 : 0) +
      (minDone ? 15 : 0);
  const showSplash = !hide;

  useEffect(() => {
    if (!allReady) return;
    const t = setTimeout(() => setHide(true), 700);
    return () => clearTimeout(t);
  }, [allReady]);

  return (
    <>
      {showSplash && <SplashScreen progress={progress} />}
      {user && (
        <main className="relative h-dvh w-full">
          <MapView
            dark={mapDark}
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
            onReady={() => setMapReady(true)}
            onProgress={(s) => setStage((p) => ({ ...p, [s]: true }))}
          />

          {tab === "friends" && (
            <FriendsPanel
              userId={user.id}
              isGuest={!!user.is_anonymous}
              myLoc={myLoc}
              onClose={() => setTab(null)}
              onLocate={(id) => {
                setFocus({ id, n: Date.now() });
                setTab(null);
              }}
            />
          )}
          {tab === "me" && (
            <MePanel
              mapTheme={mapTheme}
              onMapTheme={changeMapTheme}
              userId={user.id}
              isGuest={!!user.is_anonymous}
              name={
                user.is_anonymous
                  ? "Tamu"
                  : (user.user_metadata?.full_name ?? user.email ?? "Pengguna")
              }
              email={user.is_anonymous ? null : (user.email ?? null)}
              avatarUrl={user.user_metadata?.avatar_url ?? null}
              sharing={sharing}
              onToggleSharing={toggleSharing}
              myLoc={myLoc}
              onLogout={logout}
              onClose={() => setTab(null)}
            />
          )}
          <BottomNav
            userId={user.id}
            isGuest={!!user.is_anonymous}
            active={tab}
            onChange={(t) => setTab((cur) => (cur === t ? null : t))}
          />
          {!user.is_anonymous && <NotifBanner />}
          <IosInstallBanner />
        </main>
      )}
    </>
  );
}
