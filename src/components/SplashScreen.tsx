"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import "./splash.css";

const v = (o: Record<string, string | number>) => o as CSSProperties;

const ORBIT_1 = [
  { c: "D", a: 0, d: 1.7, bg: "#fff", fg: "#1a2e05" },
  { c: "M", a: 120, d: 1.85, bg: "#1a2e05", fg: "#d9f99d" },
  { c: "P", a: 240, d: 2, bg: "#84cc16", fg: "#1a2e05" },
];
const ORBIT_2 = [
  { c: "L", a: 60, d: 2.1, bg: "#d9f99d", fg: "#1a2e05" },
  { c: "S", a: 240, d: 2.25, bg: "#fff", fg: "#1a2e05" },
];
const SPARKS = [
  { left: "6%", top: "18%", "--d": "1.8s" },
  { right: "4%", top: "12%", "--d": "2.3s", width: 12, height: 12 },
  { left: 0, bottom: "30%", "--d": "2.7s", width: 11, height: 11 },
  { right: "8%", bottom: "16%", "--d": "2.1s" },
  { left: "44%", top: "-2%", "--d": "3s", width: 12, height: 12 },
];
const COLORS = ["#1a2e05", "#ffffff", "#84cc16", "#d9f99d", "#a3e635"];

function Orbit({
  items,
  rev,
  r,
}: {
  items: typeof ORBIT_1;
  rev?: boolean;
  r: number;
}) {
  return (
    <div className={`sp-orbit ${rev ? "rev" : ""}`}>
      {items.map((o) => (
        <div
          key={o.c}
          className="sp-av"
          style={v({
            "--a": `${o.a}deg`,
            "--r": `${r}px`,
            "--d": `${o.d}s`,
            "--bg": o.bg,
            "--fg": o.fg,
          })}
        >
          <div className="sp-in">{o.c}</div>
        </div>
      ))}
    </div>
  );
}

export default function SplashScreen() {
  const [go, setGo] = useState(false);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const burstRef = useRef<HTMLDivElement>(null);

  // sapaan: nama diambil dari localStorage (disimpan saat user terakhir login)
  useEffect(() => {
    let name = "Teman";
    try {
      name = localStorage.getItem("circlo-name") || name;
    } catch {}
    const rest = [
      `Welcome back, ${name}!`,
      "Katanya OTW, kok masih di rumah?",
      "Warga mana nih sekarang?",
      `Gimana harimu, ${name}?`,
      "Jauh di mata, dekat di peta.",
      "Bentar, lagi nyari sinyal paling vibes",
      `${name}, lagi healing atau menghindari tagihan?`,
      "Ada teman yang lagi dekat nih.",
      "Loading dulu, jangan mager",
      "Pindah berkala rumah ke kantor~",
      `Semangat menjalani plot twist hari ini, ${name}.`,
    ].sort(() => Math.random() - 0.5);
    setMsgs([`Hai ${name}, apa kabar hari ini?`, ...rest]);
  }, []);

  useEffect(() => {
    if (!msgs.length) return;
    const t = setInterval(() => setI((x) => (x + 1) % msgs.length), 2400);
    return () => clearInterval(t);
  }, [msgs]);

  // intro + confetti
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const burst = (n: number) => {
      const box = burstRef.current;
      if (!box || reduce) return;
      for (let k = 0; k < n; k++) {
        const p = document.createElement("i");
        p.className = "sp-piece";
        const ang = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 140;
        p.style.background = COLORS[k % COLORS.length];
        p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
        box.appendChild(p);
        setTimeout(() => p.remove(), 1300);
      }
    };
    let iv: ReturnType<typeof setInterval> | undefined;
    const timers = [
      setTimeout(() => setGo(true), 400),
      setTimeout(() => burst(34), 1700),
      setTimeout(() => {
        iv = setInterval(() => burst(14), 3600);
      }, 2800),
    ];
    return () => {
      timers.forEach(clearTimeout);
      if (iv) clearInterval(iv);
    };
  }, []);

  return (
    <div
      className={`sp-root ${go ? "go" : ""}`}
      role="status"
      aria-label="Memuat Circlo"
    >
      <div className="sp-veil" aria-hidden="true" />
      <div className="sp-rays" aria-hidden="true" />
      <div
        className="sp-blob"
        style={{
          width: "20rem",
          height: "20rem",
          top: "-6rem",
          left: "-5rem",
          background: "#1a2e05",
        }}
      />
      <div
        className="sp-blob"
        style={{
          width: "24rem",
          height: "24rem",
          bottom: "-8rem",
          right: "-6rem",
          background: "#fff",
          animationDelay: "-3s",
        }}
      />
      <div
        className="sp-blob"
        style={{
          width: "9rem",
          height: "9rem",
          top: "52%",
          right: "6%",
          background: "#84cc16",
          animationDelay: "-5s",
        }}
      />

      <main className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="sp-stage" aria-hidden="true">
          <span className="sp-ring" />
          <span className="sp-ring" />
          <span className="sp-ring" />
          {SPARKS.map((s, k) => (
            <i key={k} className="sp-spark" style={v(s)} />
          ))}
          <Orbit items={ORBIT_1} r={82} />
          <Orbit items={ORBIT_2} r={122} rev />
          <div className="sp-tile">
            <Image
              src="/icon-192.png"
              alt=""
              width={104}
              height={104}
              priority
            />
          </div>
          <div className="sp-burst" ref={burstRef} />
        </div>

        <h1 className="sp-word" aria-label="Circlo">
          {[..."Circlo"].map((c, k) => (
            <span
              key={k}
              className="sp-l"
              style={v({ "--i": k })}
              aria-hidden="true"
            >
              {c}
            </span>
          ))}
        </h1>
        <p className="sp-sub mt-2 text-[15px] font-semibold opacity-75">
          Dekat dengan lingkaranmu
        </p>

        <div className="sp-load mt-8 flex flex-col items-center gap-3">
          <div className="sp-track">
            <div className="sp-bar" />
          </div>
          <p key={i} className="sp-status">
            {msgs[i] ?? "\u00a0"}
          </p>
        </div>
      </main>
    </div>
  );
}
