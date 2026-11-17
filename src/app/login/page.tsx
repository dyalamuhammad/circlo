"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const loginGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const loginGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return alert(error.message);
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Circlo</h1>
      <button
        onClick={loginGoogle}
        className="w-64 rounded-lg bg-brand px-4 py-3 font-semibold"
      >
        Masuk dengan Google
      </button>
      <button onClick={loginGuest} className="w-64 rounded-lg border px-4 py-3">
        Coba sebagai Guest
      </button>
    </main>
  );
}
