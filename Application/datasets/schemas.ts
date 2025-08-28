import type { DatasetId } from "@/types/datasets";
import { z } from "zod";

const numberLike = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : Number(v)))
  .pipe(z.number().finite())
  .optional();

const coordSchema = z
  .object({ lat: numberLike, lng: numberLike })
  .transform((v) => {
    const out: { lat?: number; lng?: number } = {};
    if (v.lat != null && v.lat >= -90 && v.lat <= 90) out.lat = v.lat;
    if (v.lng != null && v.lng >= -180 && v.lng <= 180) out.lng = v.lng;
    return out;
  });

const commonSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    address: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .optional(),
    road_address: z.string().optional(),
    road_address_real: z.string().optional(),
    lat: numberLike,
    latitude: numberLike,
    lng: numberLike,
    longitude: numberLike,
  })
  .transform((r) => {
    const address = (
      r.address ??
      r.road_address ??
      r.road_address_real ??
      ""
    ).toString();
    const { lat, lng } = coordSchema.parse({
      lat: r.lat ?? r.latitude,
      lng: r.lng ?? r.longitude,
    });
    return { id: r.id, address, lat, lng };
  });

export function validateRow(datasetId: DatasetId, row: any): any | null {
  if (!row || typeof row !== "object") return null;
  // id 필수
  const idRaw =
    (row as any)?.id ??
    (row as any)?.doc_id ??
    (row as any)?.uuid ??
    (row as any)?.case_number ??
    (row as any)?.CASE_NO ??
    (row as any)?.caseNo;
  if (idRaw == null || String(idRaw).trim() === "") return null;

  let base: { id: string; address?: string; lat?: number; lng?: number };
  try {
    base = commonSchema.parse({ ...row, id: idRaw });
  } catch {
    return null;
  }

  switch (datasetId) {
    case "auction_ed":
      return { ...row, ...base };
    case "sale": {
      const price = numberLike.parse(
        (row as any)?.price ?? (row as any)?.transaction_amount
      );
      const area = numberLike.parse(
        (row as any)?.area ?? (row as any)?.exclusive_area_sqm
      );
      return { ...row, ...base, price, area };
    }
    case "rent": {
      const price = numberLike.parse(
        (row as any)?.price ??
          (row as any)?.deposit_amount ??
          (row as any)?.deposit
      );
      const area = numberLike.parse(
        (row as any)?.area ?? (row as any)?.exclusive_area_sqm
      );
      return { ...row, ...base, price, area };
    }
    case "listings":
      return { ...row, ...base };
    default:
      return { ...row, ...base };
  }
}
