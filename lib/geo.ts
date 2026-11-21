// Islamabad sectors (approximate centres) used to bucket reports into neighbourhoods.
export const NEIGHBORHOODS: { name: string; lat: number; lng: number }[] = [
  { name: "E-7", lat: 33.7375, lng: 73.0555 },
  { name: "F-6", lat: 33.7290, lng: 73.0760 },
  { name: "F-7", lat: 33.7210, lng: 73.0545 },
  { name: "F-8", lat: 33.7100, lng: 73.0380 },
  { name: "F-10", lat: 33.6955, lng: 73.0115 },
  { name: "F-11", lat: 33.6845, lng: 72.9895 },
  { name: "Blue Area", lat: 33.7175, lng: 73.0700 },
  { name: "G-6", lat: 33.7135, lng: 73.0890 },
  { name: "G-7", lat: 33.7035, lng: 73.0730 },
  { name: "G-8", lat: 33.6930, lng: 73.0560 },
  { name: "G-9", lat: 33.6880, lng: 73.0335 },
  { name: "G-10", lat: 33.6760, lng: 73.0145 },
  { name: "G-11", lat: 33.6670, lng: 72.9950 },
  { name: "H-8", lat: 33.6800, lng: 73.0700 },
  { name: "I-8", lat: 33.6665, lng: 73.0755 },
  { name: "I-9", lat: 33.6555, lng: 73.0560 },
  { name: "I-10", lat: 33.6445, lng: 73.0375 },
];

export const CITY_CENTER: [number, number] = [33.6938, 73.0420];

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestNeighborhood(lat: number, lng: number) {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const n of NEIGHBORHOODS) {
    const d = haversineMeters(lat, lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return bestD < 6000 ? best.name : "Outskirts";
}
