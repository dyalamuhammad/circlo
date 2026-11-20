import Link from "next/link";

export const metadata = { title: "Kebijakan Privasi · Circlo" };

const EMAIL = "dyalamuhammad@gmail.com"; // ganti dengan emailmu
const UPDATED = "20 November 2026";

export default function PrivacyPage() {
  return (
    <main className="bg-main min-h-dvh p-5 text-[#1a2e05]">
      <article className="glass mx-auto my-6 max-w-2xl space-y-6 rounded-[2rem] p-6 text-[15px] leading-relaxed sm:p-10">
        <header>
          <Link href="/login" className="text-sm font-semibold underline">
            ← Kembali
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Terakhir diperbarui: {UPDATED}
          </p>
        </header>

        <p>
          Circlo adalah proyek portofolio untuk berbagi lokasi dengan teman
          secara realtime. Halaman ini menjelaskan data apa yang kami simpan dan
          bagaimana data itu digunakan.
        </p>

        <section>
          <h2 className="text-lg font-bold">Data yang kami simpan</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>Akun Google:</b> nama, alamat email, dan foto profil, hanya
              jika kamu masuk dengan Google.
            </li>
            <li>
              <b>Akun tamu:</b> pengenal acak tanpa email atau nama asli.
            </li>
            <li>
              <b>Lokasi:</b> koordinat terakhir, akurasi, dan waktu pembaruan.
              Hanya posisi terbaru yang disimpan, bukan riwayat perjalanan.
            </li>
            <li>
              <b>Pertemanan:</b> daftar permintaan dan teman, serta kode invite
              milikmu.
            </li>
            <li>
              <b>Langganan notifikasi:</b> alamat endpoint push dan kunci
              enkripsi dari browser atau perangkatmu, plus informasi jenis
              browser. Data ini hanya dibuat jika kamu mengaktifkan notifikasi.
            </li>
            <li>
              <b>Catatan ping:</b> siapa mengirim ping ke siapa dan waktunya,
              dipakai untuk membatasi frekuensi ping.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold">
            Siapa yang bisa melihat lokasimu
          </h2>
          <p className="mt-2">
            Hanya teman yang sudah menerima pertemananmu. Pengguna lain,
            termasuk tamu, tidak dapat melihat lokasimu. Kamu bisa menghentikan
            pengiriman kapan saja lewat tombol lokasi <b>OFF</b>, dan teman
            tidak lagi melihat markermu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold">Kapan lokasi dikirim</h2>
          <p className="mt-2">
            Lokasi hanya diperbarui saat Circlo terbuka di layarmu. Aplikasi
            tidak melacak di background. Setelah kamu keluar atau menutup
            aplikasi, posisi terakhir tetap tersimpan sampai kamu menghapus data
            (lihat di bawah), dan teman melihatnya sebagai &ldquo;terakhir
            dilihat&rdquo;.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold">Notifikasi</h2>
          <p className="mt-2">
            Notifikasi bersifat opsional dan hanya aktif setelah kamu
            mengizinkannya. Ada dua jenis:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>Pengingat rutin:</b> maksimal dua kali sehari (sekitar pukul
              08.00 dan 18.00 WIB), dan hanya jika lokasimu sudah lama tidak
              diperbarui. Isinya mengajakmu membuka Circlo.
            </li>
            <li>
              <b>Ping dari teman:</b> hanya dari teman yang sudah kamu terima,
              dengan batas satu ping per teman setiap 15 menit.
            </li>
          </ul>
          <p className="mt-2">
            Kamu bisa mematikannya kapan saja lewat ikon lonceng di bar atas,
            atau lewat pengaturan browser. Saat dimatikan, data langgananmu
            dihapus dari database kami. Di iPhone, notifikasi hanya tersedia
            jika Circlo dipasang ke Home Screen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold">Layanan pihak ketiga</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>Supabase:</b> autentikasi, database, dan sinkronisasi realtime.
            </li>
            <li>
              <b>Google:</b> proses masuk dengan Google.
            </li>
            <li>
              <b>MapTiler:</b> penyedia peta. Browsermu meminta gambar peta
              langsung ke MapTiler, sehingga alamat IP-mu terlihat oleh mereka.
            </li>
            <li>
              <b>Vercel:</b> hosting aplikasi.
            </li>
            <li>
              <b>Layanan push browser (Google, Apple, Mozilla):</b> notifikasi
              diteruskan lewat server push milik vendor browsermu. Isinya
              terenkripsi.
            </li>
            <li>
              <b>Upstash QStash:</b> penjadwal yang memicu pengingat rutin.
              Layanan ini hanya memanggil server kami sesuai jadwal dan tidak
              menerima data pribadimu.
            </li>
          </ul>
          <p className="mt-2">
            Kami tidak menjual data dan tidak memasang iklan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold">Penyimpanan di perangkat</h2>
          <p className="mt-2">
            Circlo menyimpan sesi login di perangkatmu agar kamu tidak perlu
            masuk berulang kali. Kami tidak memakai cookie pelacak atau
            analitik.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold">Hapus data dan kontak</h2>
          <p className="mt-2">
            Untuk meminta penghapusan akun beserta lokasi dan data pertemananmu,
            kirim email ke{" "}
            <a href={`mailto:${EMAIL}`} className="font-semibold underline">
              {EMAIL}
            </a>
            . Karena ini proyek portofolio, harap maklum kalau prosesnya
            dilakukan manual.
          </p>
        </section>

        <p className="text-sm opacity-70">
          Layanan ini disediakan apa adanya untuk demonstrasi. Kebijakan dapat
          berubah, dan tanggal pembaruan akan diperbarui di atas.
        </p>
      </article>
    </main>
  );
}
