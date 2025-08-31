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
      .union([z.string(), z.number(), z.null()])
      .transform((v) => (v != null ? String(v) : ""))
      .optional(),
    road_address: z.union([z.string(), z.null()]).optional(),
    road_address_real: z.union([z.string(), z.null()]).optional(),
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
  if (!row || typeof row !== "object") {
    console.log("❌ [validateRow] not object:", typeof row);
    return null;
  }

  // auction_ed는 모든 스키마 검증을 완전히 우회 - 강화된 버전
  if (datasetId === "auction_ed") {
    console.log("✅ [validateRow] auction_ed 우회:", {
      id: row?.id || row?.case_number,
    });
    return row;
  }

  // id 필수
  const idRaw =
    (row as any)?.id ??
    (row as any)?.doc_id ??
    (row as any)?.uuid ??
    (row as any)?.case_number ??
    (row as any)?.CASE_NO ??
    (row as any)?.caseNo;
  if (idRaw == null || String(idRaw).trim() === "") {
    console.log("❌ [validateRow] no id:", { idRaw, keys: Object.keys(row) });
    return null;
  }

  let base: { id: string; address?: string; lat?: number; lng?: number };
  try {
    base = commonSchema.parse({ ...row, id: idRaw });
  } catch (error) {
    console.log("❌ [validateRow] commonSchema 실패:", {
      id: idRaw,
      error: error.message,
      data: {
        id: idRaw,
        address: row.address,
        road_address: row.road_address,
        lat: row.lat,
        latitude: row.latitude,
        lng: row.lng,
        longitude: row.longitude,
      },
    });
    return null;
  }

  switch (datasetId) {
    // auction_ed는 이미 위에서 처리됨
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
