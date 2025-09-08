export type LatLng = { lat: number; lng: number };

const toNumber = (v: any): number =>
  typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;

export const isValidLatLng = (p: Partial<LatLng>): p is LatLng => {
  const lat = toNumber((p as any)?.lat);
  const lng = toNumber((p as any)?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(Number(lat) === 0 && Number(lng) === 0)
  );
};

// 공통 좌표 추출: lat|latitude, lng|longitude만 사용
export function pickLatLng(row: any): LatLng | null {
  if (!row) return null;
  const latRaw = row?.lat ?? row?.latitude;
  const lngRaw = row?.lng ?? row?.longitude;
  const lat = toNumber(latRaw);
  const lng = toNumber(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (Number(lat) === 0 && Number(lng) === 0) return null;
  return { lat, lng };
}
