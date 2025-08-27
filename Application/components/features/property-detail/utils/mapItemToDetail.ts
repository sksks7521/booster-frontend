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
  publicPriceRatio: number; // %
  publicPrice: number;
  under100Million: boolean;
  currentStatus: string;
  saleDate: string;
  location: string;
  postalCode: string;
  pnu: string;
  adminDongName: string;
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
  // 좌표: 공식 키 사용
  const finalLat = parseNumber((item as any).latitude);
  const finalLng = parseNumber((item as any).longitude);

  const minimum = parseNumber((item as any).minimum_bid_price);
  const appraised = parseNumber((item as any).appraised_value);
  const publicPrice = parseNumber((item as any).public_price);
  const ratioBidToAppraised = parseNumber((item as any).bid_to_appraised_ratio);
  const ratioBidToPublic = parseNumber((item as any).bid_to_public_ratio);

  const priceRatio =
    ratioBidToAppraised > 0
      ? ratioBidToAppraised
      : appraised > 0
      ? (minimum / appraised) * 100
      : 0;

  const publicPriceRatio =
    ratioBidToPublic > 0
      ? ratioBidToPublic
      : publicPrice > 0
      ? (minimum / publicPrice) * 100
      : 0;

  const elevatorLoose = toBoolLoose((item as any).elevator_available);
  const hasElevator = elevatorLoose;

  // 건축연도 숫자 정규화
  const normalizedConstructionYear = (() => {
    const v = (item as any).construction_year;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const m = (v as string).match(/\d{4}/);
      return m ? parseInt(m[0], 10) : 0;
    }
    return 0;
  })();

  return {
    id: String(item.id),
    title:
      `${(item as any).usage ?? ""} ${
        (item as any).case_number ?? ""
      }`.trim() || String(item.id),
    usage: (item as any).usage ?? "-",
    caseNumber: (item as any).case_number ?? "-",
    roadAddress: (item as any).road_address ?? (item as any).address ?? "-",
    locationAddress: (item as any).address ?? "-",
    buildingArea: parseNumber((item as any).building_area_pyeong),
    landArea: parseNumber((item as any).land_area_pyeong),
    appraisalValue: appraised,
    minimumPrice: minimum,
    priceRatio,
    publicPriceRatio,
    publicPrice,
    under100Million:
      String((item as any).under_100million ?? "").toUpperCase() === "O",
    currentStatus: (item as any).current_status ?? "-",
    saleDate: (item as any).sale_date ?? "-",
    location: (item as any).location_detail ?? "-",
    postalCode: String((item as any).postal_code ?? "-") as string,
    pnu: String((item as any).pnu ?? "-"),
    adminDongName: String((item as any).administrative_dong_name ?? "-"),
    longitude: finalLng,
    latitude: finalLat,
    buildingName: String((item as any).building_name ?? "-"),
    dongName: String((item as any).dong_name ?? "-"),
    landSize: parseNumber((item as any).land_area_m2),
    buildingSize: parseNumber((item as any).building_area_m2),
    totalFloorArea: parseNumber((item as any).total_floor_area),
    buildingCoverageRatio: parseNumber((item as any).building_coverage_ratio),
    floorAreaRatio: parseNumber((item as any).floor_area_ratio),
    mainStructure: String((item as any).main_structure ?? "-"),
    mainPurpose: String((item as any).main_usage ?? "-"),
    otherPurpose: String((item as any).other_usage ?? "-"),
    height: parseNumber((item as any).height) || 0,
    groundFloors: parseNumber((item as any).ground_floors) || 0,
    undergroundFloors: parseNumber((item as any).basement_floors) || 0,
    households: parseNumber((item as any).household_count) || 0,
    units: parseNumber((item as any).family_count) || 0,
    roomNumber: "-",
    approvalDate: String((item as any).use_approval_date ?? "-"),
    elevators: parseNumber((item as any).elevator_count) || 0,
    constructionYear: normalizedConstructionYear,
    floorConfirm: (item as any).floor_confirmation ?? "-",
    hasElevator,
    specialRights: (item as any).special_rights ?? "-",
    floors: (item as any).floor_info ?? "-",
  };
}
