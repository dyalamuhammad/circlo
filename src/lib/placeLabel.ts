const cache = new Map<string, Promise<string>>();

const AREA = [
  "county",
  "municipality",
  "joint_municipality",
  "subregion",
  "municipal_district",
  "locality",
  "neighbourhood",
];

export function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = fetch(
    `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  )
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      const feats: { text?: string; place_type?: string[] }[] =
        data.features ?? [];
      const pick = (types: string[]) => {
        for (const t of types) {
          const f = feats.find((x) => x.place_type?.includes(t));
          if (f?.text) return f.text;
        }
      };
      const parts = [pick(AREA), pick(["region"])];
      return parts.filter((x, i) => x && parts.indexOf(x) === i).join(", ");
    })
    .catch(() => {
      cache.delete(key);
      return "";
    });

  cache.set(key, p);
  return p;
}

export function agoLabel(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}
