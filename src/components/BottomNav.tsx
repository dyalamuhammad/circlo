"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Tab = "friends" | "me";

type Props = {
  userId: string;
  isGuest: boolean;
  active: Tab | null;
  onChange: (t: Tab) => void;
};

export default function BottomNav({
  userId,
  isGuest,
  active,
  onChange,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    const { count } = await supabase
      .from("circle_friendships")
      .select("id", { count: "exact", head: true })
      .eq("addressee_id", userId)
      .eq("status", "pending");
    setPending(count ?? 0);
  }, [supabase, userId]);

  useEffect(() => {
    if (isGuest) return;
    refresh();
    const ch = supabase
      .channel("circle-nav-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circle_friendships" },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, isGuest, refresh]);

  useEffect(() => {
    if (!isGuest) refresh();
  }, [active, isGuest, refresh]);

  const tabs = [
    { id: "friends" as const, label: "Teman", Icon: Users, badge: pending },
    { id: "me" as const, label: "Saya", Icon: UserRound, badge: 0 },
  ];

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
      <div className="glass-bar pointer-events-auto flex gap-1 rounded-full p-1.5">
        {tabs.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active === id}
            className={`relative flex h-14 min-w-[92px] flex-col items-center justify-center gap-0.5 rounded-full px-5 text-[11px] font-bold transition active:scale-95 ${
              active === id ? "bg-[#1a2e05] text-[#d9f99d]" : "text-[#1a2e05]"
            }`}
          >
            <Icon size={20} />
            {label}
            {badge > 0 && (
              <span className="absolute right-4 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
