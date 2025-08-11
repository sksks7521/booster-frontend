import { create } from "zustand";

// 필터 상태의 타입(Type)을 정의합니다.
interface FilterState {
  region: string;
  buildingType: string;
  priceRange: [number, number];
  areaRange: [number, number];
  buildYear: [number, number];
  floor: string;
  hasElevator: boolean;
  hasParking: boolean;
  auctionStatus: string;
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
  region: "",
  buildingType: "",
  priceRange: [0, 500000],
  areaRange: [0, 200],
  buildYear: [1980, 2024],
  floor: "",
  hasElevator: false,
  hasParking: false,
  auctionStatus: "",
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
