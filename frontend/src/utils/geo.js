const EARTH_RADIUS = 6371008.8;

const toRad = (deg) => (deg * Math.PI) / 180;

export function getLength(coords) {
  let length = 0;
  for (let i = 1; i < coords.length; i += 1) {
    const p1 = coords[i - 1];
    const p2 = coords[i];
    const dLat = toRad(p2[1] - p1[1]);
    const dLon = toRad(p2[0] - p1[0]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    length += 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
  }
  return length;
}

export function getArea(coords) {
  let sum = 0;
  const n = coords.length;
  for (let i = 0; i < n; i += 1) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const lon1 = toRad(p1[0]);
    const lat1 = toRad(p1[1]);
    const lon2 = toRad(p2[0]);
    const lat2 = toRad(p2[1]);
    sum += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((EARTH_RADIUS * EARTH_RADIUS * sum) / 2);
}

export function formatLength(value) {
  return value > 1000 ? `${(value / 1000).toFixed(2)} km` : `${value.toFixed(1)} m`;
}

export function formatArea(value) {
  return value > 1000000 ? `${(value / 1000000).toFixed(2)} km²` : `${value.toFixed(1)} m²`;
}
