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
  buildingType: string;
  priceRange: [number, number];
  areaRange: [number, number]; // 하위호환용 (deprecated)
  buildingAreaRange: [number, number]; // 건축면적 범위 (평)
  landAreaRange: [number, number]; // 토지면적 범위 (평)
  buildYear: [number, number];
  floor: string; // 기존 층수 필터 (하위호환)
  floorConfirmation: string; // 새로운 층확인 필터 (탑층, 일반층, 1층, 반지하)
  hasElevator: string; // boolean → string ("있음"/"없음"/"모름"/"all")
  hasParking?: boolean; // ❌ 백엔드 데이터 없음 (optional로 변경)
  auctionStatus: string;

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
  buildingType: "all", // 기본값을 "all"로 설정
  priceRange: [0, 500000],
  areaRange: [0, 200], // 하위호환용 (deprecated)
  buildingAreaRange: [0, 100], // 건축면적 범위 (평) - 일반적인 빌라 크기
  landAreaRange: [0, 200], // 토지면적 범위 (평) - 일반적인 토지 크기
  buildYear: [1980, 2024],
  floor: "all", // 기존 층수 필터 (하위호환)
  floorConfirmation: "all", // 새로운 층확인 필터 기본값
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
  size: 20, // 서버 사이드 페이지네이션 (20/50/100개 선택 가능)
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
}));
