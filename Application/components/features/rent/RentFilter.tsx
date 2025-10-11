"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Star,
  CheckCircle,
  Eye,
  AlertTriangle,
  Home,
  Building,
  Users,
  Clock,
  CreditCard,
} from "lucide-react";

// 실거래가(전월세) 특화 프리셋 데이터
interface RentFilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: any;
}

const RENT_PRESETS: RentFilterPreset[] = [
  {
    id: "preset1",
    name: "전세 (보증금 2억 이상)",
    emoji: "🏡",
    description: "2억원 이상 전세 거래",
    filters: {
      rentType: "전세",
      depositRange: [20000, 100000],
    },
  },
  {
    id: "preset2",
    name: "월세 (50만원 이하)",
    emoji: "💸",
    description: "월세 50만원 이하 거래",
    filters: {
      rentType: "월세",
      monthlyRentRange: [0, 50],
    },
  },
  {
    id: "preset3",
    name: "신축 전월세 (5년 이내)",
    emoji: "🆕",
    description: "건축 5년 이내 신축 전월세",
    filters: {
      buildYearRange: [2019, 2024],
    },
  },
];

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

  // 프리셋 상태
  const [savedPresets, setSavedPresets] =
    useState<RentFilterPreset[]>(RENT_PRESETS);
  const [showPresets, setShowPresets] = useState<boolean>(false);

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

  // 프리셋 적용
  const applyPreset = (preset: RentFilterPreset) => {
    Object.entries(preset.filters).forEach(([key, value]) => {
      if (key.includes("Range")) {
        setRangeFilter(key as any, value as any);
      } else {
        setFilter(key, value);
      }
    });
    setPageStore(1);
  };

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

  // provinces는 위의 정규 API 결과 사용

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" />
            실거래가(전월세) 필터
          </CardTitle>
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
          {/* 프리셋 선택 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">빠른 필터</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
              >
                <Star className="w-4 h-4 mr-1" />
                프리셋
              </Button>
            </div>

            {showPresets && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {savedPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center">
                        <span className="mr-2">{preset.emoji}</span>
                        <span className="font-medium text-sm">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {preset.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 검색 섹션 */}
          {!showLocationOnly && !showDetailsOnly && (
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center">
                <Search className="w-4 h-4 mr-2" />
                검색
              </Label>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">주소 유형</Label>
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
                <Label className="text-xs text-gray-600">주소 검색</Label>
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
                <Label className="text-sm font-medium flex items-center">
                  <Home className="w-4 h-4 mr-2" />
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
                    <SelectItem value="연세">연세</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 보증금 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
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
                  <Label className="text-sm font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
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

              {/* 전용면적 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <Ruler className="w-4 h-4 mr-2" />
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
                  <Label className="text-sm font-medium flex items-center">
                    <Building className="w-4 h-4 mr-2" />
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

              {/* 계약 기간 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  계약 기간
                </Label>

                <Select
                  value={filters.contractType || "all"}
                  onValueChange={(value) =>
                    setFilter("contractType", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="신규">신규</SelectItem>
                    <SelectItem value="갱신">갱신</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 거래 날짜 범위 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  계약 날짜
                </Label>

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
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 필터 초기화 버튼 */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              모든 필터 초기화
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
