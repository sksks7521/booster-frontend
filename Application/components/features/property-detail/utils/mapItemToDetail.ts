import { type Item } from "@/lib/api";

export interface PropertyDetailData {
  id: string;
  title: string;
  usage: string;
  caseNumber: string;
  roadAddress: string;
  locationAddress: string;
  buildingArea: number;
  landArea: number;
  appraisalValue: number;
  minimumPrice: number;
  priceRatio: number; // %
  publicPriceRatio: number; // ratio
  publicPrice: number;
  under100Million: boolean;
  currentStatus: string;
  saleDate: string;
  location: string;
  postalCode: string;
  pnu: string;
  longitude: number;
  latitude: number;
  buildingName: string;
  dongName: string;
  landSize: number;
  buildingSize: number;
  totalFloorArea: number;
  buildingCoverageRatio: number;
  floorAreaRatio: number;
  mainStructure: string;
  mainPurpose: string;
  otherPurpose: string;
  height: number;
  groundFloors: number;
  undergroundFloors: number;
  households: number;
  units: number;
  roomNumber: string;
  approvalDate: string;
  elevators: number;
  constructionYear: number;
  floorConfirm: string;
  hasElevator: boolean | null;
  specialRights: string;
  floors: string;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim().replace(/%$/, "");
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : 0;
  }
  return 0;
}

function toBoolLoose(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toUpperCase();
  if (["O", "Y", "TRUE", "1"].includes(s)) return true;
  if (["X", "N", "FALSE", "0"].includes(s)) return false;
  return null;
}

export function mapItemToDetail(item: Item): PropertyDetailData {
  // 좌표 후보 추출 및 보정(대한민국 범위 기준)
  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/,/g, "").trim();
      const n = parseFloat(cleaned);
      return isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  const latCandidates: Array<unknown> = [
    (item as any).lat,
    (item as any).latitude,
    (item as any).y,
    (item as any).lat_y,
  ];
  const lngCandidates: Array<unknown> = [
    (item as any).lng,
    (item as any).longitude,
    (item as any).x,
    (item as any).lon,
    (item as any).long,
  ];
  let lat = latCandidates.map(toNum).find((v) => typeof v === "number");
  let lng = lngCandidates.map(toNum).find((v) => typeof v === "number");
  // 범위 스왑 보정: 한국 위도(33~39), 경도(124~132)
  const inLatRange = (v?: number) =>
    typeof v === "number" && v >= 33 && v <= 39.5;
  const inLngRange = (v?: number) =>
    typeof v === "number" && v >= 124 && v <= 132.5;
  if (!inLatRange(lat) && inLatRange(lng) && inLngRange(lat)) {
    const tmp = lat;
    lat = lng;
    lng = tmp;
  }
  // 최종 좌표(없는 값은 0으로)
  const finalLat = typeof lat === "number" ? lat : 0;
  const finalLng = typeof lng === "number" ? lng : 0;
  const minimum = parseNumber(item.minimum_bid_price);
  const appraised = parseNumber(item.appraised_value);
  const publicPrice = parseNumber(item.public_price);
  const ratioFromText = parseNumber(item.bid_to_appraised_ratio);

  const priceRatio =
    ratioFromText > 0
      ? ratioFromText
      : appraised > 0
      ? (minimum / appraised) * 100
      : 0;

  const publicPriceRatio =
    item.calculated_ratio ?? (publicPrice > 0 ? minimum / publicPrice : 0);

  const elevatorLoose = toBoolLoose(item.elevator_available);
  const hasElevator =
    elevatorLoose !== null
      ? elevatorLoose
      : typeof item.hasElevator === "boolean"
      ? item.hasElevator
      : null;

  return {
    id: String(item.id),
    title:
      `${item.usage ?? ""} ${item.case_number ?? ""}`.trim() || String(item.id),
    usage: item.usage ?? "-",
    caseNumber: item.case_number ?? "-",
    roadAddress: item.road_address ?? item.address ?? "-",
    locationAddress: item.address ?? "-",
    buildingArea: parseNumber(item.building_area_pyeong),
    landArea: parseNumber(item.land_area_pyeong),
    appraisalValue: appraised,
    minimumPrice: minimum,
    priceRatio,
    publicPriceRatio,
    publicPrice,
    under100Million: String(item.under_100million ?? "").includes("O"),
    currentStatus: item.current_status ?? "-",
    saleDate: item.sale_date ?? "-",
    location: item.address ?? "-",
    postalCode: "-",
    pnu: "-",
    longitude: finalLng,
    latitude: finalLat,
    buildingName: "-",
    dongName: "-",
    landSize: 0,
    buildingSize: 0,
    totalFloorArea: 0,
    buildingCoverageRatio: 0,
    floorAreaRatio: 0,
    mainStructure: "-",
    mainPurpose: "-",
    otherPurpose: "-",
    height: 0,
    groundFloors: 0,
    undergroundFloors: 0,
    households: 0,
    units: 0,
    roomNumber: "-",
    approvalDate: "-",
    elevators: 0,
    constructionYear: item.construction_year ?? item.built_year ?? 0,
    floorConfirm: item.floor_confirmation ?? "-",
    hasElevator,
    specialRights: item.special_rights ?? "-",
    floors: item.floor_confirmation ?? "-",
  };
}
