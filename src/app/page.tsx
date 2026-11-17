"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensureProfile";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      await ensureProfile(supabase, data.user);
      setUser(data.user);
    };
    init();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!user) return <main className="p-8">Memuat...</main>;

  return (
    <main className="relative h-dvh w-full">
      <MapView
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
        <button onClick={logout} className="underline">
          Logout
        </button>
      </div>
    </main>
  );
}
