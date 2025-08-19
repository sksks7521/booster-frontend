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

  // ✅ 건물/편의시설 필터
  buildingType: string;
  priceRange: [number, number];
  areaRange: [number, number];
  buildYear: [number, number];
  floor: string;
  hasElevator: string; // boolean → string ("있음"/"없음"/"모름"/"all")
  hasParking?: boolean; // ❌ 백엔드 데이터 없음 (optional로 변경)
  auctionStatus: string;

  // ✅ 경매 일정 (백엔드 가이드 3-1)
  auctionDateFrom?: string; // YYYY-MM-DD (optional)
  auctionDateTo?: string; // YYYY-MM-DD (optional)
  auctionMonth?: string; // YYYY-MM (하위호환)

  // 편의 필터
  under100: boolean; // 1억 이하 여부
  page: number;
  size: number;
}

// 필터 상태를 변경하는 액션(Action)의 타입을 정의합니다.
interface FilterActions {
  setFilter: (key: keyof FilterState, value: any) => void;
  setRangeFilter: (
    key: "priceRange" | "areaRange" | "buildYear",
    value: [number, number]
  ) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  resetFilters: () => void;
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

  // 기존 필터들
  buildingType: "all", // 기본값을 "all"로 설정
  priceRange: [0, 500000],
  areaRange: [0, 200],
  buildYear: [1980, 2024],
  floor: "all", // 기본값을 "all"로 설정
  hasElevator: "all", // boolean → string ("all" 기본값)
  hasParking: undefined, // optional
  auctionStatus: "all", // 기본값을 "all"로 설정

  // ✅ 경매 일정 (optional)
  auctionDateFrom: undefined,
  auctionDateTo: undefined,
  auctionMonth: undefined,

  // 편의 필터
  under100: false,
  page: 1,
  size: 20,
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

  // 모든 필터를 초기 상태로 되돌리는 액션
  resetFilters: () => set(initialState),
}));
