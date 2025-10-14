"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterStore } from "@/store/filterStore";
import {
  useRealTransactionsSido,
  useRealTransactionsSigungu,
  useRealTransactionsAdminDong,
} from "@/hooks/useLocations";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Eye,
} from "lucide-react";

// 매매 UX와 동일한 심플 레이아웃을 적용하기 위해 프리셋/이모지 요소 제거

interface RentFilterProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  showLocationOnly?: boolean;
  showDetailsOnly?: boolean;
  namespace?: string;
}

export default function RentFilter({
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  setSearchQuery,
  handleSearch,
  showLocationOnly = false,
  showDetailsOnly = false,
  namespace = "rent",
}: RentFilterProps) {
  // 스토어 상태 (네임스페이스 대응)
  const storeAll = useFilterStore((state) => state as any);
  const setRangeFilterBase = useFilterStore((state) => state.setRangeFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const setFilterBase = useFilterStore((state) => state.setFilter);
  const setNsFilter = useFilterStore((s) => (s as any).setNsFilter);
  const setNsRangeFilter = useFilterStore((s) => (s as any).setNsRangeFilter);

  const nsOverrides = (
    storeAll.ns && namespace ? (storeAll.ns as any)[namespace] : undefined
  ) as any;
  const filters: any =
    namespace && nsOverrides ? { ...storeAll, ...nsOverrides } : storeAll;

  // 선택 항목만 보기 상태/액션 (매매와 동일 패턴)
  const showSelectedOnly = useFilterStore((s: any) => s.showSelectedOnly);
  const setShowSelectedOnly = useFilterStore((s: any) => s.setShowSelectedOnly);
  const selectedIds = useFilterStore((s: any) => s.selectedIds || []);

  // 네임스페이스 라우팅 래퍼
  const setFilter = (key: any, value: any) => {
    if (namespace && typeof setNsFilter === "function") {
      (setNsFilter as any)(namespace, key, value);
    } else {
      (setFilterBase as any)(key, value);
    }
  };

  const setRangeFilter = (
    key:
      | "depositRange"
      | "monthlyRentRange"
      | "areaRange"
      | "buildYearRange"
      | "dateRange"
      | "jeonseConversionAmountRange"
      | "depositPerPyeongRange"
      | "monthlyRentPerPyeongRange",
    value: [number, number] | [string, string]
  ) => {
    if (namespace && typeof setNsRangeFilter === "function") {
      (setNsRangeFilter as any)(namespace, key, value);
    } else {
      setRangeFilterBase(key as any, value as any);
    }
  };

  // 지역 선택 상태
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // 범위 입력 모드
  const [depositInputMode, setDepositInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [monthlyRentInputMode, setMonthlyRentInputMode] = useState<
    "slider" | "input"
  >("input");
  const [areaInputMode, setAreaInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");
  // 신규 범위 컨트롤 입력 모드
  const [conversionInputMode, setConversionInputMode] = useState<
    "slider" | "input"
  >("input");
  const [depositPerPyeongInputMode, setDepositPerPyeongInputMode] = useState<
    "slider" | "input"
  >("input");
  const [monthlyPerPyeongInputMode, setMonthlyPerPyeongInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState<string>("");
  // 주소 검색 유형(Option A): 도로명 | 지번
  const [addressSearchField, setAddressSearchField] = useState<
    "address" | "jibun_address"
  >("address");

  // 날짜 범위
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 검색 핸들러
  const setPageStore = useFilterStore((s) => s.setPage);

  const handleAddressSearch = () => {
    const q = addressSearch.trim();
    setFilter("searchField", q ? (addressSearchField as any) : "all");
    setFilter("searchQuery", q);
    setPageStore(1);
  };

  const handleClearSearch = () => {
    setAddressSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPageStore(1);
  };

  // 프리셋/실험 요소 제거(상태 사용 안 함)

  // 지역 목록: 백엔드 정규 API 연동 (매매와 동일)
  const { sidos, isLoading: sidosLoading } = useRealTransactionsSido();
  const provinces = (sidos || []).map((s) => s.name);
  const { sigungus, isLoading: sigunguLoading } = useRealTransactionsSigungu(
    selectedProvince || undefined
  );
  const sigunguNames = (sigungus || []).map((c) => c.name);
  const { adminDongs, isLoading: townsLoading } = useRealTransactionsAdminDong(
    selectedProvince || undefined,
    selectedCity || undefined
  );
  const adminDongNames = (adminDongs || []).map((t) => t.name);
  useEffect(() => {
    setAvailableCities(sigunguNames);
  }, [sigunguNames.join(",")]);
  useEffect(() => {
    setAvailableDistricts(adminDongNames);
  }, [adminDongNames.join(",")]);

  // 스토어 초기값과 로컬 상태 동기화(최초 1회 및 목록 로드 이후 보정)
  useEffect(() => {
    const p = (filters as any)?.province;
    const c = (filters as any)?.cityDistrict;
    const d = (filters as any)?.town;
    if (p && !selectedProvince) setSelectedProvince(p);
    // 시군구 목록 로드 후 초기 선택 반영
    if (c && !selectedCity && sigunguNames.includes(c)) setSelectedCity(c);
    // 읍면동 목록 로드 후 초기 선택 반영
    if (d && !selectedDistrict && adminDongNames.includes(d))
      setSelectedDistrict(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidosLoading, sigunguNames.join(","), adminDongNames.join(",")]);

  // 지역 변경 핸들러
  const handleProvinceChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedProvince(actualValue);
    setSelectedCity("");
    setSelectedDistrict("");
    setFilter("province", actualValue);
    setFilter("cityDistrict", "");
    setFilter("town", "");
    setPageStore(1);
  };

  const handleCityChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedCity(actualValue);
    setSelectedDistrict("");
    setFilter("cityDistrict", actualValue);
    setFilter("town", "");
    setPageStore(1);
  };

  const handleDistrictChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedDistrict(actualValue);
    setFilter("town", actualValue);
    setPageStore(1);
  };

  // 프리셋 기능 제거로 인한 핸들러 삭제

  // 필터 초기화
  const handleResetFilters = () => {
    resetFilters();
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedDistrict("");
    setAddressSearch("");
    setStartDate("");
    setEndDate("");
    setPageStore(1);
  };

  // 섹션 활성화 상태(제목 파란색 처리)
  const isFloorConfirmationActive = Array.isArray(
    (filters as any).floorConfirmation
  )
    ? (filters as any).floorConfirmation.length > 0
    : false;
  const isElevatorActive =
    (filters as any).elevatorAvailable === true ||
    (filters as any).elevatorAvailable === false;
  const isAddressSearchActive = Boolean(
    (filters as any).searchQuery && String((filters as any).searchQuery).trim()
  );
  const isRentTypeActive = Boolean(
    (filters as any).rentType && String((filters as any).rentType).trim()
  );
  const isDateRangeActive = Boolean(startDate || endDate);
  const isDepositActive = Array.isArray((filters as any).depositRange)
    ? !(
        (filters as any).depositRange[0] === 0 &&
        (filters as any).depositRange[1] === 100000
      )
    : false;
  const isMonthlyRentActive = Array.isArray((filters as any).monthlyRentRange)
    ? !(
        (filters as any).monthlyRentRange[0] === 0 &&
        (filters as any).monthlyRentRange[1] === 500
      )
    : false;
  const isConversionActive = Array.isArray(
    (filters as any).jeonseConversionAmountRange
  )
    ? !(
        (filters as any).jeonseConversionAmountRange[0] === 0 &&
        (filters as any).jeonseConversionAmountRange[1] === 200000
      )
    : false;
  const isYieldActive = Array.isArray((filters as any).rentalYieldAnnualRange)
    ? !(
        (filters as any).rentalYieldAnnualRange[0] === 0 &&
        (filters as any).rentalYieldAnnualRange[1] === 20
      )
    : false;
  const isDepositPerPyeongActive = Array.isArray(
    (filters as any).depositPerPyeongRange
  )
    ? !(
        (filters as any).depositPerPyeongRange[0] === 0 &&
        (filters as any).depositPerPyeongRange[1] === 500
      )
    : false;
  const isMonthlyPerPyeongActive = Array.isArray(
    (filters as any).monthlyRentPerPyeongRange
  )
    ? !(
        (filters as any).monthlyRentPerPyeongRange[0] === 0 &&
        (filters as any).monthlyRentPerPyeongRange[1] === 20
      )
    : false;
  const isAreaActive = Array.isArray((filters as any).areaRange)
    ? !(
        (filters as any).areaRange[0] === 0 &&
        (filters as any).areaRange[1] === 300
      )
    : false;
  const isBuildYearActive = Array.isArray((filters as any).buildYearRange)
    ? !(
        (filters as any).buildYearRange[0] === 1970 &&
        (filters as any).buildYearRange[1] === 2024
      )
    : false;

  // provinces는 위의 정규 API 결과 사용

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <h3 className="text-lg font-semibold">필터</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* 선택 항목만 보기 & 설정 초기화 (매매와 동일) */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  const hasSelection =
                    Array.isArray(selectedIds) && selectedIds.length > 0;
                  if (!hasSelection && !showSelectedOnly) {
                    alert("선택된 행이 없습니다. 먼저 목록에서 체크하세요.");
                    return;
                  }
                  setShowSelectedOnly(!showSelectedOnly);
                  setPageStore(1);
                } catch {}
              }}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showSelectedOnly ? "선택만 해제" : "선택 항목만 보기"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              설정 초기화
            </Button>
          </div>

          {/* 지역 선택 */}
          {!showDetailsOnly && (
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center">
                지역 선택
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">시/도</Label>
                  <Select
                    value={selectedProvince}
                    onValueChange={handleProvinceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="시/도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">시/군/구</Label>
                  <Select
                    value={selectedCity}
                    onValueChange={handleCityChange}
                    disabled={
                      !selectedProvince ||
                      sigunguLoading ||
                      availableCities.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="시/군/구 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {sigunguLoading && (
                        <SelectItem value="loading" disabled>
                          불러오는 중...
                        </SelectItem>
                      )}
                      {!sigunguLoading && (
                        <>
                          <SelectItem value="all">전체</SelectItem>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">읍/면/동</Label>
                  <Select
                    value={selectedDistrict}
                    onValueChange={handleDistrictChange}
                    disabled={
                      !selectedCity ||
                      townsLoading ||
                      availableDistricts.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="읍/면/동 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {townsLoading && (
                        <SelectItem value="loading" disabled>
                          불러오는 중...
                        </SelectItem>
                      )}
                      {!townsLoading && (
                        <>
                          <SelectItem value="all">전체</SelectItem>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 상세 조건 */}
          {!showLocationOnly && (
            <div className="space-y-6">
              {/* 전월세 구분 */}
              <div className="space-y-3">
                <Label
                  className={`text-sm font-medium flex items-center ${
                    isRentTypeActive ? "text-blue-700 font-semibold" : ""
                  }`}
                >
                  전월세 구분
                </Label>

                <Select
                  value={filters.rentType || "all"}
                  onValueChange={(value) =>
                    setFilter("rentType", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="전세">전세</SelectItem>
                    <SelectItem value="월세">월세</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 계약 날짜 범위 */}
              <div className="space-y-3">
                <Label
                  className={`text-sm font-medium flex items-center ${
                    isDateRangeActive ? "text-blue-700 font-semibold" : ""
                  }`}
                >
                  계약 날짜
                </Label>

                {/* 빠른 선택 버튼 (매매와 동일 UX) */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const d = new Date(today);
                      d.setMonth(today.getMonth() - 1);
                      const startStr = d.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr] as [
                        string,
                        string
                      ]);
                      setPageStore(1);
                    }}
                  >
                    최근 1개월
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const d = new Date(today);
                      d.setMonth(today.getMonth() - 3);
                      const startStr = d.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr] as [
                        string,
                        string
                      ]);
                      setPageStore(1);
                    }}
                  >
                    최근 3개월
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const d = new Date(today);
                      d.setMonth(today.getMonth() - 6);
                      const startStr = d.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr] as [
                        string,
                        string
                      ]);
                      setPageStore(1);
                    }}
                  >
                    최근 6개월
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const startStr = new Date(year, 0, 1)
                        .toISOString()
                        .split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr] as [
                        string,
                        string
                      ]);
                      setPageStore(1);
                    }}
                  >
                    올해
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label
                      className={`text-xs ${
                        isDateRangeActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      시작일
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value && endDate) {
                          setRangeFilter("dateRange", [
                            e.target.value,
                            endDate,
                          ] as [string, string]);
                          setPageStore(1);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      className={`text-xs ${
                        isDateRangeActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      종료일
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (startDate && e.target.value) {
                          setRangeFilter("dateRange", [
                            startDate,
                            e.target.value,
                          ] as [string, string]);
                          setPageStore(1);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 보증금 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium flex items-center ${
                      isDepositActive ? "text-blue-700 font-semibold" : ""
                    }`}
                  >
                    보증금 (만원)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDepositInputMode(
                        depositInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {depositInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {depositInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.depositRange || [0, 100000]}
                      onValueChange={(value) =>
                        setRangeFilter(
                          "depositRange",
                          value as [number, number]
                        )
                      }
                      max={100000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(filters.depositRange?.[0] || 0).toLocaleString()}만원
                      </span>
                      <span>
                        {(filters.depositRange?.[1] || 100000).toLocaleString()}
                        만원
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.depositRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setRangeFilter("depositRange", [
                          value,
                          filters.depositRange?.[1] || 100000,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.depositRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100000;
                        setRangeFilter("depositRange", [
                          filters.depositRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 월세 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium flex items-center ${
                      isMonthlyRentActive ? "text-blue-700 font-semibold" : ""
                    }`}
                  >
                    월세 (만원)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMonthlyRentInputMode(
                        monthlyRentInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {monthlyRentInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {monthlyRentInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.monthlyRentRange || [0, 500]}
                      onValueChange={(value) =>
                        setRangeFilter(
                          "monthlyRentRange",
                          value as [number, number]
                        )
                      }
                      max={500}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(filters.monthlyRentRange?.[0] || 0).toLocaleString()}
                        만원
                      </span>
                      <span>
                        {(
                          filters.monthlyRentRange?.[1] || 500
                        ).toLocaleString()}
                        만원
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.monthlyRentRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setRangeFilter("monthlyRentRange", [
                          value,
                          filters.monthlyRentRange?.[1] || 500,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.monthlyRentRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 500;
                        setRangeFilter("monthlyRentRange", [
                          filters.monthlyRentRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 전월세 전환금 (만원) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium ${
                      isConversionActive ? "text-blue-700 font-semibold" : ""
                    }`}
                  >
                    전월세 전환금 (만원)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setConversionInputMode(
                        conversionInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {conversionInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {conversionInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.jeonseConversionAmountRange || [0, 200000]}
                      onValueChange={(value) => {
                        setRangeFilter(
                          "jeonseConversionAmountRange",
                          value as [number, number]
                        );
                        setPageStore(1);
                      }}
                      max={200000}
                      step={1000}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(
                          filters.jeonseConversionAmountRange?.[0] || 0
                        ).toLocaleString()}
                        만원
                      </span>
                      <span>
                        {(
                          filters.jeonseConversionAmountRange?.[1] || 200000
                        ).toLocaleString()}
                        만원
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.jeonseConversionAmountRange?.[0] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setRangeFilter("jeonseConversionAmountRange", [
                          v,
                          filters.jeonseConversionAmountRange?.[1] || 200000,
                        ]);
                        setPageStore(1);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.jeonseConversionAmountRange?.[1] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 200000;
                        setRangeFilter("jeonseConversionAmountRange", [
                          filters.jeonseConversionAmountRange?.[0] || 0,
                          v,
                        ]);
                        setPageStore(1);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 연 임대수익률 (%) - 제거됨 */}

              {/* 평당 보증금 (만원/평) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium ${
                      isDepositPerPyeongActive
                        ? "text-blue-700 font-semibold"
                        : ""
                    }`}
                  >
                    평당 보증금 (만원/평)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDepositPerPyeongInputMode(
                        depositPerPyeongInputMode === "slider"
                          ? "input"
                          : "slider"
                      )
                    }
                  >
                    {depositPerPyeongInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {depositPerPyeongInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.depositPerPyeongRange || [0, 500]}
                      onValueChange={(value) => {
                        setRangeFilter(
                          "depositPerPyeongRange",
                          value as [number, number]
                        );
                        setPageStore(1);
                      }}
                      max={1000}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(
                          filters.depositPerPyeongRange?.[0] ?? 0
                        ).toLocaleString()}
                        만원/평
                      </span>
                      <span>
                        {(
                          filters.depositPerPyeongRange?.[1] ?? 500
                        ).toLocaleString()}
                        만원/평
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.depositPerPyeongRange?.[0] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setRangeFilter("depositPerPyeongRange", [
                          v,
                          filters.depositPerPyeongRange?.[1] || 500,
                        ]);
                        setPageStore(1);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.depositPerPyeongRange?.[1] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 500;
                        setRangeFilter("depositPerPyeongRange", [
                          filters.depositPerPyeongRange?.[0] || 0,
                          v,
                        ]);
                        setPageStore(1);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 평당 월세 (만원/평) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium ${
                      isMonthlyPerPyeongActive
                        ? "text-blue-700 font-semibold"
                        : ""
                    }`}
                  >
                    평당 월세 (만원/평)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMonthlyPerPyeongInputMode(
                        monthlyPerPyeongInputMode === "slider"
                          ? "input"
                          : "slider"
                      )
                    }
                  >
                    {monthlyPerPyeongInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {monthlyPerPyeongInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.monthlyRentPerPyeongRange || [0, 20]}
                      onValueChange={(value) => {
                        setRangeFilter(
                          "monthlyRentPerPyeongRange",
                          value as [number, number]
                        );
                        setPageStore(1);
                      }}
                      max={50}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {filters.monthlyRentPerPyeongRange?.[0] ?? 0}만원/평
                      </span>
                      <span>
                        {filters.monthlyRentPerPyeongRange?.[1] ?? 20}만원/평
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.monthlyRentPerPyeongRange?.[0] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setRangeFilter("monthlyRentPerPyeongRange", [
                          v,
                          filters.monthlyRentPerPyeongRange?.[1] || 20,
                        ]);
                        setPageStore(1);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.monthlyRentPerPyeongRange?.[1] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 20;
                        setRangeFilter("monthlyRentPerPyeongRange", [
                          filters.monthlyRentPerPyeongRange?.[0] || 0,
                          v,
                        ]);
                        setPageStore(1);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 전용면적 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium flex items-center ${
                      isAreaActive ? "text-blue-700 font-semibold" : ""
                    }`}
                  >
                    전용면적 (㎡)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAreaInputMode(
                        areaInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {areaInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {areaInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.areaRange || [0, 300]}
                      onValueChange={(value) =>
                        setRangeFilter("areaRange", value as [number, number])
                      }
                      max={300}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.areaRange?.[0] || 0}㎡</span>
                      <span>{filters.areaRange?.[1] || 300}㎡</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.areaRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setRangeFilter("areaRange", [
                          value,
                          filters.areaRange?.[1] || 300,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.areaRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 300;
                        setRangeFilter("areaRange", [
                          filters.areaRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 건축연도 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    className={`text-sm font-medium flex items-center ${
                      isBuildYearActive ? "text-blue-700 font-semibold" : ""
                    }`}
                  >
                    건축연도
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBuildYearInputMode(
                        buildYearInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {buildYearInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {buildYearInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.buildYearRange || [1970, 2024]}
                      onValueChange={(value) =>
                        setRangeFilter(
                          "buildYearRange",
                          value as [number, number]
                        )
                      }
                      min={1970}
                      max={2024}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.buildYearRange?.[0] || 1970}년</span>
                      <span>{filters.buildYearRange?.[1] || 2024}년</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="시작년도"
                      value={filters.buildYearRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1970;
                        setRangeFilter("buildYearRange", [
                          value,
                          filters.buildYearRange?.[1] || 2024,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="종료년도"
                      value={filters.buildYearRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 2024;
                        setRangeFilter("buildYearRange", [
                          filters.buildYearRange?.[0] || 1970,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 층확인 */}
              <div className="space-y-3">
                <Label
                  className={`text-sm font-medium ${
                    isFloorConfirmationActive
                      ? "text-blue-700 font-semibold"
                      : ""
                  }`}
                >
                  층확인
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setFilter("floorConfirmation", "all");
                      setPageStore(1);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      (() => {
                        const raw = (filters as any).floorConfirmation;
                        const arr = Array.isArray(raw)
                          ? (raw as string[])
                          : raw && raw !== "all"
                          ? String(raw)
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [];
                        return arr.length === 0;
                      })()
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    전체
                  </button>
                  {[
                    { value: "basement", label: "반지하" },
                    { value: "first_floor", label: "1층" },
                    { value: "normal_floor", label: "일반층" },
                    { value: "top_floor", label: "탑층" },
                  ].map((opt) => {
                    const raw = (filters as any).floorConfirmation;
                    const arr = Array.isArray(raw)
                      ? (raw as string[])
                      : raw && raw !== "all"
                      ? String(raw)
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];
                    const selected = arr.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const prev = arr;
                          if (selected) {
                            const next = prev.filter(
                              (v: string) => v !== opt.value
                            );
                            setFilter(
                              "floorConfirmation",
                              next.length ? next : "all"
                            );
                          } else {
                            const next = Array.from(
                              new Set([...(prev as string[]), opt.value])
                            );
                            setFilter(
                              "floorConfirmation",
                              next.length ? next : "all"
                            );
                          }
                          setPageStore(1);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          selected
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 엘리베이터 */}
              <div className="space-y-3">
                <Label
                  className={`text-sm font-medium ${
                    isElevatorActive ? "text-blue-700 font-semibold" : ""
                  }`}
                >
                  엘리베이터
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setFilter("elevatorAvailable", undefined);
                      setPageStore(1);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      (filters as any).elevatorAvailable === undefined
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    전체
                  </button>
                  {[
                    { v: true, l: "있음" },
                    { v: false, l: "없음" },
                  ].map((opt) => {
                    const isActive =
                      (filters as any).elevatorAvailable === opt.v;
                    return (
                      <button
                        key={String(opt.v)}
                        onClick={() => {
                          setFilter("elevatorAvailable", opt.v);
                          setPageStore(1);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 계약 기간 제거 */}
            </div>
          )}

          {/* 검색 섹션 (하단 고정) */}
          {!showLocationOnly && (
            <div className="space-y-4">
              <Label
                className={`text-sm font-medium flex items-center ${
                  isAddressSearchActive ? "text-blue-700 font-semibold" : ""
                }`}
              >
                주소 검색
              </Label>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label
                    className={`text-xs ${
                      isAddressSearchActive ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    주소 유형
                  </Label>
                  <Select
                    value={addressSearchField}
                    onValueChange={(v) =>
                      setAddressSearchField(v as "address" | "jibun_address")
                    }
                  >
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="address">도로명주소</SelectItem>
                      <SelectItem value="jibun_address">지번주소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Label
                  className={`text-xs ${
                    isAddressSearchActive ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  주소 검색
                </Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder={
                      addressSearchField === "address"
                        ? "도로명주소로 검색하세요"
                        : "지번주소(예: ○○동 123-45)로 검색하세요"
                    }
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddressSearch()
                    }
                  />
                  <Button size="sm" onClick={handleAddressSearch}>
                    검색
                  </Button>
                </div>
              </div>

              {addressSearch && (
                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                  검색 초기화
                </Button>
              )}
            </div>
          )}

          {/* 하단 초기화 버튼 제거 (상단 설정 초기화와 중복) */}
        </CardContent>
      )}
    </Card>
  );
}
