const [title, body, url = "/"] = process.argv.slice(2);
const token = process.env.QSTASH_TOKEN;
const app = process.env.APP_URL || "https://circlo-rouge.vercel.app";

if (!token || !title || !body) {
  console.error('Pakai: node scripts/announce.mjs "Judul" "Isi pesan" [/path]');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
if (process.env.DELAY) headers["Upstash-Delay"] = process.env.DELAY; // misal 30m, 2h

const res = await fetch(
  `https://qstash.upstash.io/v2/publish/${app}/api/cron/announce`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({ title, body, url }),
  },
);
console.log(res.status, await res.text());
