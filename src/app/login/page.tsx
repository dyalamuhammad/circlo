"use client";
import Image from "next/image";
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
    <main
      className="bg-main relative flex min-h-dvh items-center justify-center overflow-hidden p-5"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="blob absolute -left-20 -top-24 h-80 w-80 rounded-full"
        style={{ background: "#1a2e05", opacity: 0.9, filter: "blur(2px)" }}
      />
      <div
        className="blob absolute -bottom-24 -right-16 h-96 w-96 rounded-full"
        style={{ background: "#fff", opacity: 0.75, animationDelay: "-5s" }}
      />
      <div
        className="blob absolute right-[12%] top-1/2 h-40 w-40 rounded-full"
        style={{ background: "#84cc16", animationDelay: "-8s" }}
      />

      <section className="glass relative w-full max-w-sm rounded-[2.25rem] p-8 sm:p-10">
        <Image
          src="/icon-192.png"
          alt="Circlo"
          width={64}
          height={64}
          priority
          className="mb-8 h-16 w-16 rounded-[1.4rem] shadow-[0_10px_20px_-6px_rgba(26,46,5,0.5)]"
        />

        <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[#1a2e05]">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-[15px] font-medium text-[#1a2e05]/70">
          Masuk untuk lanjut, atau jelajahi dulu sebagai tamu.
        </p>

        <div className="mt-9 space-y-3">
          <button
            onClick={loginGoogle}
            className="btn-solid flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[15px] font-bold"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#d9f99d"
                d="M21.35 11.1H12v2.9h5.35c-.25 1.45-1.7 4.2-5.35 4.2a6 6 0 1 1 0-12c1.9 0 3.15.8 3.85 1.5l2.6-2.5C21.4 3.6 18.95 2.5 12 2.5a9.5 9.5 0 1 0 0 19c5.5 0 9.1-3.85 9.1-9.3 0-.65-.05-1.1-.15-1.6z"
              />
            </svg>
            Masuk dengan Google
          </button>

          <div className="flex items-center gap-3 py-1 text-[#1a2e05]/50">
            <div className="h-px flex-1 bg-current" />
            <span className="text-xs font-semibold">atau</span>
            <div className="h-px flex-1 bg-current" />
          </div>

          <button
            onClick={loginGuest}
            className="btn-glass flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[15px] font-bold text-[#1a2e05]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a2e05"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Masuk sebagai Tamu
          </button>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-[#1a2e05]/60">
          Dengan masuk, kamu menyetujui Syarat &amp; Kebijakan Privasi.
        </p>
      </section>
    </main>
  );
}
