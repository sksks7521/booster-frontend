import { create } from "zustand";

// 필터 상태의 타입(Type)을 정의합니다.
interface FilterState {
  // ✅ 주소 계층 (코드 기반 - 백엔드 가이드 3-1)
  sido_code?: string; // 시도 코드 (새로 추가)
  city_code?: string; // 시군구 코드 (새로 추가)
  town_code?: string; // 읍면동 코드 (새로 추가)

  // 하위호환용 이름 기반 주소
  province: string; // 주소(구역)
  cityDistrict: string; // 주소(시군구)
  town: string; // 읍면동
  region: string;

  // 🔍 키워드 검색 (새로 추가)
  searchQuery: string; // 주소, 법원, 사건번호 등 키워드 검색
  searchField: string; // 검색 필드 선택 (all, case_number, road_address)

  // ✅ 건물/편의시설 필터
  buildingType: string | string[];
  priceRange: [number, number];
  areaRange: [number, number]; // 하위호환용 (deprecated)
  buildingAreaRange: [number, number]; // 건축면적 범위 (평)
  landAreaRange: [number, number]; // 토지면적 범위 (평)
  buildYear: [number, number];
  floor: string; // 기존 층수 필터 (하위호환)
  floorConfirmation: string | string[]; // 멀티선택 지원
  hasElevator: string | string[]; // 멀티선택 지원 ("Y"/"N" 또는 한글)
  hasParking?: boolean; // ❌ 백엔드 데이터 없음 (optional로 변경)
  auctionStatus: string;
  // 🆕 현재상태/특수조건(문자열 any-match)/불리언 특수조건
  currentStatus?: string | string[];
  specialConditions?: string[];
  specialBooleanFlags?: string[]; // 예: ["separate_registration","lien"]

  // ✅ 경매 일정 (백엔드 가이드 3-1)
  auctionDateFrom?: string; // YYYY-MM-DD (optional)
  auctionDateTo?: string; // YYYY-MM-DD (optional)
  auctionMonth?: string; // YYYY-MM (하위호환)

  // 🔄 서버 사이드 정렬
  sortBy?: string; // 정렬 컬럼명 (building_area_pyeong, minimum_bid_price 등)
  sortOrder?: "asc" | "desc"; // 정렬 방향

  // 편의 필터
  under100: boolean; // 1억 이하 여부
  page: number;
  size: number;
  // 지도 Threshold (최저가 만원 구간)
  thresholds: number[]; // 1..5 supported
  // 지도 색상 팔레트(마커/범례 공통)
  palette: {
    blue: string;
    green: string;
    pink: string;
    orange: string;
    red: string;
  };
  // (삭제 예정)이었던 팝업 고정 상태 제거
  // 🆕 선택 전용 보기
  selectedIds: string[];
  showSelectedOnly: boolean;
  // 🆕 관심물건 (간단 북마크 목록)
  favorites: string[];
  // 🆕 지도 이동 펜딩 타깃(상세→지도에서 보기)
  pendingMapTarget?: { lat: number; lng: number } | null;
  // 🆕 네임스페이스별 오버라이드 저장소
  ns?: Record<string, Partial<FilterState>>;
  // 선택적: 원 필터 상태(네임스페이스에서 주로 사용)
  circleEnabled?: boolean;
  circleCenter?: { lat: number; lng: number } | null;
  circleRadiusM?: number; // meters
  applyCircleFilter?: boolean; // 목록/지도에 반영 토글
}

// 필터 상태를 변경하는 액션(Action)의 타입을 정의합니다.
interface FilterActions {
  setFilter: (key: keyof FilterState, value: any) => void;
  setRangeFilter: (
    key:
      | "priceRange"
      | "areaRange"
      | "buildingAreaRange"
      | "landAreaRange"
      | "buildYear",
    value: [number, number]
  ) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setSortConfig: (sortBy?: string, sortOrder?: "asc" | "desc") => void; // 정렬 설정
  resetFilters: () => void;
  setThresholds: (t: number[]) => void;
  setPalette: (p: {
    blue: string;
    green: string;
    pink: string;
    orange: string;
    red: string;
  }) => void;
  // (삭제) setPopupLocked 제거
  // 🆕 선택 연동 액션
  setSelectedIds: (ids: string[]) => void;
  setShowSelectedOnly: (v: boolean) => void;
  // 🆕 지도 이동 펜딩 타깃 설정
  setPendingMapTarget?: (target: { lat: number; lng: number } | null) => void;
  // 🆕 네임스페이스 전용 액션
  setNsFilter?: (namespace: string, key: keyof FilterState, value: any) => void;
  setNsRangeFilter?: (
    namespace: string,
    key:
      | "priceRange"
      | "areaRange"
      | "buildingAreaRange"
      | "landAreaRange"
      | "buildYear",
    value: [number, number]
  ) => void;
  resetNsFilters?: (namespace: string) => void;
}

// 필터의 초기 상태 값입니다.
const initialState: FilterState = {
  // ✅ 지역 코드 (새로 추가)
  sido_code: undefined,
  city_code: undefined,
  town_code: undefined,

  // 하위호환용 이름 기반
  province: "",
  cityDistrict: "",
  town: "",
  region: "",

  // 🔍 키워드 검색
  searchQuery: "",
  searchField: "all", // 기본값: 전체 검색

  // 기존 필터들
  buildingType: "all", // 단일 또는 배열
  priceRange: [0, 500000],
  areaRange: [0, 200], // 하위호환용 (deprecated)
  buildingAreaRange: [0, 100], // 건축면적 범위 (평) - 일반적인 빌라 크기
  landAreaRange: [0, 200], // 토지면적 범위 (평) - 일반적인 토지 크기
  buildYear: [1980, 2024],
  floor: "all", // 기존 층수 필터 (하위호환)
  floorConfirmation: "all",
  hasElevator: "all",
  hasParking: undefined, // optional
  auctionStatus: "all", // 기본값을 "all"로 설정
  currentStatus: "all",
  specialConditions: [],
  specialBooleanFlags: [],

  // ✅ 경매 일정 (optional)
  auctionDateFrom: undefined,
  auctionDateTo: undefined,
  auctionMonth: undefined,

  // 편의 필터
  under100: false,
  page: 1,
  size: 20, // 서버 사이드 페이지네이션 (20/50/100개 선택 가능)
  // 기본 Threshold: t1=6000, t2=8000, t3=10000, t4=13000 (만원)
  thresholds: [6000, 8000, 10000, 13000],
  // 기본 팔레트
  palette: {
    blue: "#2563eb",
    green: "#16a34a",
    pink: "#ec4899",
    orange: "#f59e0b",
    red: "#ef4444",
  },
  // 🆕 선택 전용 보기 기본값
  selectedIds: [],
  showSelectedOnly: false,
  favorites: [],
  pendingMapTarget: null,
  ns: {},
};

// Zustand 스토어를 생성합니다.
export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...initialState,

  // 특정 필터 값을 설정하는 액션
  setFilter: (key, value) => set({ [key]: value }),

  // 범위(Range) 필터 값을 설정하는 액션
  setRangeFilter: (key, value) => set({ [key]: value }),

  // 페이지/사이즈 변경 액션
  setPage: (page) => set({ page }),
  setSize: (size) => set({ size }),

  // 🔄 정렬 설정 액션
  setSortConfig: (sortBy, sortOrder) =>
    set({
      sortBy,
      sortOrder,
      page: 1, // 정렬 변경 시 1페이지로 초기화
    }),

  // 모든 필터를 초기 상태로 되돌리는 액션
  resetFilters: () => set(initialState),

  // Threshold 업데이트(비내림차순 검증 후 저장)
  setThresholds: (t) =>
    set((state) => {
      const capped = Array.isArray(t)
        ? t.slice(0, 5).filter((n) => typeof n === "number" && n >= 0)
        : [];
      const sorted = [...capped].sort((a, b) => a - b);
      const next: number[] = sorted.length === 0 ? state.thresholds : sorted;
      return { ...state, thresholds: next } as any;
    }),

  // 팔레트 업데이트(간단 검증: 문자열 형태만)
  setPalette: (p) =>
    set((state) => ({
      ...state,
      palette: {
        blue: p.blue || state.palette.blue,
        green: p.green || state.palette.green,
        pink: p.pink || state.palette.pink,
        orange: p.orange || state.palette.orange,
        red: p.red || state.palette.red,
      },
    })),
  // 🆕 선택 연동 액션 구현
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setShowSelectedOnly: (v) => set({ showSelectedOnly: v, page: 1 }),
  // 관심물건 추가/삭제 간단 액션
  addFavorites: (ids: string[]) =>
    set((state: any) => {
      const setFav = new Set<string>([...(state.favorites || [])]);
      ids.forEach((id) => setFav.add(String(id)));
      return { favorites: Array.from(setFav) };
    }),
  removeFavorite: (id: string) =>
    set((state: any) => ({
      favorites: (state.favorites || []).filter(
        (x: string) => x !== String(id)
      ),
    })),
  // 🆕 지도 이동 펜딩 타깃 설정
  setPendingMapTarget: (target) => set({ pendingMapTarget: target }),
  // 🆕 네임스페이스 액션 구현: 오버라이드 병합 저장
  setNsFilter: (namespace, key, value) =>
    set((state: any) => {
      const nextNs = { ...(state.ns || {}) };
      nextNs[namespace] = { ...(nextNs[namespace] || {}), [key]: value };
      return { ns: nextNs };
    }),
  setNsRangeFilter: (namespace, key, value) =>
    set((state: any) => {
      const nextNs = { ...(state.ns || {}) };
      nextNs[namespace] = { ...(nextNs[namespace] || {}), [key]: value };
      return { ns: nextNs };
    }),
  resetNsFilters: (namespace) =>
    set((state: any) => {
      const nextNs = { ...(state.ns || {}) };
      nextNs[namespace] = {};
      return { ns: nextNs };
    }),
}));
