"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  DollarSign,
  Ruler,
  Calendar,
  Search,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle,
  Eye,
  AlertTriangle,
  Home,
  Building,
  Users,
} from "lucide-react";

interface SaleFilterProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  showLocationOnly?: boolean;
  showDetailsOnly?: boolean;
  namespace?: string;
}

export default function SaleFilter({
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  setSearchQuery,
  handleSearch,
  showLocationOnly = false,
  showDetailsOnly = false,
  namespace = "sale",
}: SaleFilterProps) {
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
      | "transactionAmountRange"
      | "exclusiveAreaRange"
      | "buildYearRange"
      | "dateRange",
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
  // ⭐ availableCities, availableDistricts 제거 (API에서 직접 로드)

  // 범위 입력 모드
  const [transactionAmountInputMode, setTransactionAmountInputMode] = useState<
    "slider" | "input"
  >("input");
  const [exclusiveAreaInputMode, setExclusiveAreaInputMode] = useState<
    "slider" | "input"
  >("input");
  const [landRightsAreaInputMode, setLandRightsAreaInputMode] = useState<
    "slider" | "input"
  >("input");
  const [pricePerPyeongInputMode, setPricePerPyeongInputMode] = useState<
    "slider" | "input"
  >("input");
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState<string>("");

  // 날짜 범위
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 필터 활성화 상태 판단
  const isTransactionAmountActive = Array.isArray(
    filters.transactionAmountRange
  )
    ? !(
        filters.transactionAmountRange[0] === 0 &&
        filters.transactionAmountRange[1] === 100000
      )
    : false;

  const isExclusiveAreaActive = Array.isArray(filters.exclusiveAreaRange)
    ? !(
        filters.exclusiveAreaRange[0] === 0 &&
        filters.exclusiveAreaRange[1] === 300
      )
    : false;

  const isBuildYearActive = Array.isArray(filters.buildYearRange)
    ? !(
        filters.buildYearRange[0] === 1980 && filters.buildYearRange[1] === 2024
      )
    : false;

  const isLandRightsAreaActive = Array.isArray(filters.landRightsAreaRange)
    ? !(
        filters.landRightsAreaRange[0] === 0 &&
        filters.landRightsAreaRange[1] === 600
      )
    : false;

  const isPricePerPyeongActive = Array.isArray(filters.pricePerPyeongRange)
    ? !(
        filters.pricePerPyeongRange[0] === 0 &&
        filters.pricePerPyeongRange[1] === 5000
      )
    : false;

  const isDateRangeActive = Boolean(startDate || endDate);

  // 검색 핸들러
  const setPageStore = useFilterStore((s) => s.setPage);

  const handleAddressSearch = () => {
    const q = addressSearch.trim();
    setFilter("searchField", q ? "address" : "all");
    setFilter("searchQuery", q);
    setPageStore(1);
  };

  const handleClearSearch = () => {
    setAddressSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPageStore(1);
  };

  // ⭐ 실거래가 전용 지역 목록 API 사용
  const {
    sidos,
    isLoading: sidoLoading,
    error: sidoError,
  } = useRealTransactionsSido();
  const {
    sigungus,
    isLoading: sigunguLoading,
    error: sigunguError,
  } = useRealTransactionsSigungu(selectedProvince);

  // 디버그 로깅 제거로 렌더링 안정화
  const {
    adminDongs,
    isLoading: dongLoading,
    error: dongError,
  } = useRealTransactionsAdminDong(selectedProvince, selectedCity);

  // ⭐ 시/도 변경 시 시군구 목록 자동 업데이트 (API에서 직접 로드)
  // sigungus는 useRealTransactionsSigungu(selectedProvince)에서 자동으로 로드됨

  // ⭐ 시군구 변경 시 읍면동 목록 자동 업데이트 (API에서 직접 로드)
  // adminDongs는 useRealTransactionsAdminDong(selectedProvince, selectedCity)에서 자동으로 로드됨

  // URL/스토어에서 지역 값 복원
  useEffect(() => {
    if (filters.province && filters.province !== selectedProvince) {
      setSelectedProvince(filters.province);
    }
    if (filters.cityDistrict && filters.cityDistrict !== selectedCity) {
      setSelectedCity(filters.cityDistrict);
    }
    if (filters.town && filters.town !== selectedDistrict) {
      setSelectedDistrict(filters.town);
    }
  }, [filters.province, filters.cityDistrict, filters.town]);

  // 지역 변경 핸들러
  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedCity("");
    setSelectedDistrict("");
    setFilter("province", value);
    setFilter("cityDistrict", undefined);
    setFilter("town", undefined);
    setPageStore(1);
  };

  const handleCityChange = (value: string) => {
    // ⚠️ 중요: value는 "경기도 고양시 덕양구" 형태 (구 단위까지 포함)
    setSelectedCity(value);
    setSelectedDistrict("");
    setFilter("cityDistrict", value); // 전체 값을 그대로 저장
    setFilter("town", undefined);
    setPageStore(1);
  };

  const handleDistrictChange = (value: string) => {
    // 읍면동: "전체"(value: "") 선택 시 필터 제거
    setSelectedDistrict(value);
    if (!value) {
      setFilter("town", undefined);
    } else {
      setFilter("town", value);
    }
    setPageStore(1);
  };

  // 필터 초기화 (지역 유지)
  const handleResetFilters = () => {
    const savedProvince = (filters as any)?.province || selectedProvince;
    const savedCity = (filters as any)?.cityDistrict || selectedCity;
    const savedTown = (filters as any)?.town || selectedDistrict || undefined;

    // 전체 리셋 후 지역은 복원
    try {
      resetFilters();
    } catch {}

    setFilter("province", savedProvince || "");
    setFilter("cityDistrict", savedCity || "");
    setFilter("town", savedTown || undefined);

    setSelectedProvince(savedProvince || "");
    setSelectedCity(savedCity || "");
    setSelectedDistrict(savedTown || "");

    setAddressSearch("");
    setStartDate("");
    setEndDate("");
    setPageStore(1);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <h3 className="text-lg font-semibold">필터</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
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
          {/* 선택 항목만 보기 & 설정 초기화 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: 선택 항목만 보기 기능 구현
                console.log("선택 항목만 보기 클릭");
              }}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              선택 항목만 보기
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

          {/* 검색 섹션 */}
          {!showLocationOnly && !showDetailsOnly && (
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center">
                <Search className="w-4 h-4 mr-2" />
                검색
              </Label>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">주소 검색</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="도로명주소로 검색하세요"
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

          {/* 지역 선택 */}
          {!showDetailsOnly && (
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                지역 선택
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">시/도</Label>
                  <Select
                    value={selectedProvince}
                    onValueChange={handleProvinceChange}
                    disabled={sidoLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={sidoLoading ? "로딩 중..." : "시/도 선택"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sidos.map((sido) => (
                        <SelectItem key={sido.name} value={sido.name}>
                          {sido.name} ({sido.count.toLocaleString()}건)
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
                    disabled={!selectedProvince || sigunguLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          sigunguLoading ? "로딩 중..." : "시/군/구 선택"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sigungus.map((sigungu) => (
                        <SelectItem key={sigungu.name} value={sigungu.name}>
                          {sigungu.name} ({sigungu.count.toLocaleString()}건)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">읍/면/동</Label>
                  <Select
                    value={selectedDistrict}
                    onValueChange={handleDistrictChange}
                    disabled={!selectedCity || dongLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          dongLoading ? "로딩 중..." : "읍/면/동 선택 (선택사항)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {adminDongs.map((dong) => (
                        <SelectItem key={dong.name} value={dong.name}>
                          {dong.name} ({dong.count.toLocaleString()}건)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 상세 조건 */}
          {!showLocationOnly && (
            <div className="space-y-6">
              {/* 거래 날짜 범위 */}
              <div className="space-y-3">
                <Label
                  className={`text-sm font-medium ${
                    isDateRangeActive
                      ? "text-blue-700 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  거래 날짜
                </Label>

                {/* 빠른 선택 버튼 */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const oneMonthAgo = new Date(today);
                      oneMonthAgo.setMonth(today.getMonth() - 1);
                      const startStr = oneMonthAgo.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr]);
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
                      const threeMonthsAgo = new Date(today);
                      threeMonthsAgo.setMonth(today.getMonth() - 3);
                      const startStr = threeMonthsAgo
                        .toISOString()
                        .split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr]);
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
                      const sixMonthsAgo = new Date(today);
                      sixMonthsAgo.setMonth(today.getMonth() - 6);
                      const startStr = sixMonthsAgo.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr]);
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
                      const yearStart = new Date(today.getFullYear(), 0, 1);
                      const startStr = yearStart.toISOString().split("T")[0];
                      const endStr = today.toISOString().split("T")[0];
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setRangeFilter("dateRange", [startStr, endStr]);
                    }}
                  >
                    올해
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">시작일</Label>
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
                        }
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">종료일</Label>
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
                        }
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 거래금액 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      className={`text-sm font-medium ${
                        isTransactionAmountActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      거래금액 (만원)
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTransactionAmountInputMode(
                        transactionAmountInputMode === "slider"
                          ? "input"
                          : "slider"
                      )
                    }
                    className="h-7 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {transactionAmountInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {transactionAmountInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.transactionAmountRange || [0, 100000]}
                        onValueChange={(value) =>
                          setFilter(
                            "transactionAmountRange",
                            value as [number, number]
                          )
                        }
                        min={0}
                        max={100000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>
                          {filters.transactionAmountRange?.[0] || 0}만원
                        </span>
                        <span>
                          {filters.transactionAmountRange?.[1] || 100000}만원
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소 거래금액"
                      value={filters.transactionAmountRange?.[0] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 0;
                        setFilter("transactionAmountRange", [
                          value,
                          filters.transactionAmountRange?.[1] || 100000,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="최대 거래금액"
                      value={filters.transactionAmountRange?.[1] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 100000;
                        setFilter("transactionAmountRange", [
                          filters.transactionAmountRange?.[0] || 0,
                          value,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 평단가 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      className={`text-sm font-medium ${
                        isPricePerPyeongActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      평단가 (만원/평)
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPricePerPyeongInputMode(
                        pricePerPyeongInputMode === "slider"
                          ? "input"
                          : "slider"
                      )
                    }
                    className="h-7 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {pricePerPyeongInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {pricePerPyeongInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.pricePerPyeongRange || [0, 5000]}
                        onValueChange={(value) =>
                          setFilter(
                            "pricePerPyeongRange",
                            value as [number, number]
                          )
                        }
                        min={0}
                        max={5000}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{filters.pricePerPyeongRange?.[0] || 0}만원</span>
                        <span>
                          {filters.pricePerPyeongRange?.[1] || 5000}만원
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소 평단가"
                      value={filters.pricePerPyeongRange?.[0] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 0;
                        setFilter("pricePerPyeongRange", [
                          value,
                          filters.pricePerPyeongRange?.[1] || 5000,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="최대 평단가"
                      value={filters.pricePerPyeongRange?.[1] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 5000;
                        setFilter("pricePerPyeongRange", [
                          filters.pricePerPyeongRange?.[0] || 0,
                          value,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 전용면적 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      className={`text-sm font-medium ${
                        isExclusiveAreaActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      전용면적 (㎡)
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExclusiveAreaInputMode(
                        exclusiveAreaInputMode === "slider" ? "input" : "slider"
                      )
                    }
                    className="h-7 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {exclusiveAreaInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {exclusiveAreaInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.exclusiveAreaRange || [0, 300]}
                        onValueChange={(value) =>
                          setFilter(
                            "exclusiveAreaRange",
                            value as [number, number]
                          )
                        }
                        min={0}
                        max={300}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{filters.exclusiveAreaRange?.[0] || 0}㎡</span>
                        <span>{filters.exclusiveAreaRange?.[1] || 300}㎡</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소 전용면적"
                      value={filters.exclusiveAreaRange?.[0] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 0;
                        setFilter("exclusiveAreaRange", [
                          value,
                          filters.exclusiveAreaRange?.[1] || 300,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="최대 전용면적"
                      value={filters.exclusiveAreaRange?.[1] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 300;
                        setFilter("exclusiveAreaRange", [
                          filters.exclusiveAreaRange?.[0] || 0,
                          value,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 대지권면적 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      className={`text-sm font-medium ${
                        isLandRightsAreaActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      대지권면적 (㎡)
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setLandRightsAreaInputMode(
                        landRightsAreaInputMode === "slider"
                          ? "input"
                          : "slider"
                      )
                    }
                    className="h-7 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {landRightsAreaInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {landRightsAreaInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.landRightsAreaRange || [0, 600]}
                        onValueChange={(value) =>
                          setFilter(
                            "landRightsAreaRange",
                            value as [number, number]
                          )
                        }
                        min={0}
                        max={600}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{filters.landRightsAreaRange?.[0] || 0}㎡</span>
                        <span>{filters.landRightsAreaRange?.[1] || 600}㎡</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소 대지권면적"
                      value={filters.landRightsAreaRange?.[0] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 0;
                        setFilter("landRightsAreaRange", [
                          value,
                          filters.landRightsAreaRange?.[1] || 600,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="최대 대지권면적"
                      value={filters.landRightsAreaRange?.[1] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 600;
                        setFilter("landRightsAreaRange", [
                          filters.landRightsAreaRange?.[0] || 0,
                          value,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 건축연도 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      className={`text-sm font-medium ${
                        isBuildYearActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      건축연도
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBuildYearInputMode(
                        buildYearInputMode === "slider" ? "input" : "slider"
                      )
                    }
                    className="h-7 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {buildYearInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {buildYearInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.buildYearRange || [1980, 2024]}
                        onValueChange={(value) =>
                          setFilter("buildYearRange", value as [number, number])
                        }
                        min={1980}
                        max={2024}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{filters.buildYearRange?.[0] || 1980}년</span>
                        <span>{filters.buildYearRange?.[1] || 2024}년</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="시작년도"
                      value={filters.buildYearRange?.[0] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 1980;
                        setFilter("buildYearRange", [
                          value,
                          filters.buildYearRange?.[1] || 2024,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="종료년도"
                      value={filters.buildYearRange?.[1] || ""}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 2024;
                        setFilter("buildYearRange", [
                          filters.buildYearRange?.[0] || 1980,
                          value,
                        ]);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 층확인 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">층확인</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter("floorConfirmation", [])}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      !(filters as any).floorConfirmation?.length
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
                  ].map((option) => {
                    const isActive = (
                      filters as any
                    ).floorConfirmation?.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          const current =
                            (filters as any).floorConfirmation || [];
                          if (isActive) {
                            setFilter(
                              "floorConfirmation",
                              current.filter((v: string) => v !== option.value)
                            );
                          } else {
                            setFilter("floorConfirmation", [
                              ...current,
                              option.value,
                            ]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 엘리베이터 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">엘리베이터</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter("elevatorAvailable", undefined)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      (filters as any).elevatorAvailable === undefined
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    전체
                  </button>
                  {[
                    { value: true, label: "있음" },
                    { value: false, label: "없음" },
                  ].map((option) => {
                    const isActive =
                      (filters as any).elevatorAvailable === option.value;
                    return (
                      <button
                        key={option.label}
                        onClick={() =>
                          setFilter("elevatorAvailable", option.value)
                        }
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
