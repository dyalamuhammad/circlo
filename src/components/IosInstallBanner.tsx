"use client";
import { useEffect, useState } from "react";

export default function IosInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPad mode desktop
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setShow(isIos && !standalone);
  }, []);

  const close = () => setShow(false);

  if (!show) return null;

  return (
    <div className="absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 rounded-2xl bg-white p-4 text-sm shadow-2xl">
      <p className="font-bold">Pasang Circlo di iPhone kamu</p>
      <p className="mt-1 text-gray-600">
        Agar berjalan sebagai aplikasi (layar penuh dan lebih stabil), tambahkan
        ke Home Screen:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Ketuk tombol <b>Bagikan</b> (ikon kotak dengan panah ke atas) di
          Safari
        </li>
        <li>
          Pilih <b>Add to Home Screen</b> (Tambah ke Layar Utama)
        </li>
        <li>Buka Circlo dari ikon di Home Screen</li>
      </ol>
      <button
        onClick={close}
        className="mt-3 w-full rounded-lg bg-brand py-2 font-semibold"
      >
        Mengerti
      </button>
    </div>
  );
}
