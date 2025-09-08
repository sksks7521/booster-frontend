// 간단한 지오 유틸: 하버사인 거리(m) 계산 및 반경 내 포함 여부

export interface LatLng {
  lat: number;
  lng: number;
}

// 두 좌표 간 거리를 미터 단위로 반환
export function haversineDistanceM(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// 중심/반경으로 포함 여부 판단
export function isWithinRadius(
  center: LatLng,
  point: LatLng,
  radiusM: number
): boolean {
  if (!center || !point || !Number.isFinite(radiusM) || radiusM < 0)
    return false;
  const d = haversineDistanceM(center, point);
  return Number.isFinite(d) && d <= radiusM;
}
