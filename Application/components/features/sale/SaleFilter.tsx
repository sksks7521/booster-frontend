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
import { useLocationsSimple } from "@/hooks/useLocations";
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
} from "lucide-react";

// 실거래가(매매) 특화 프리셋 데이터
interface SaleFilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: any;
}

const SALE_PRESETS: SaleFilterPreset[] = [
  {
    id: "preset1",
    name: "고액 매매 (10억 이상)",
    emoji: "💎",
    description: "10억원 이상 고액 매매 거래",
    filters: {
      priceRange: [100000, 500000],
    },
  },
  {
    id: "preset2",
    name: "신축 매매 (5년 이내)",
    emoji: "🏗️",
    description: "건축 5년 이내 신축 매매",
    filters: {
      buildYearRange: [2019, 2024],
    },
  },
  {
    id: "preset3",
    name: "소형 아파트 (33평 이하)",
    emoji: "🏠",
    description: "33평 이하 소형 아파트 매매",
    filters: {
      areaRange: [0, 110],
    },
  },
];

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
    key: "priceRange" | "areaRange" | "buildYearRange" | "dateRange",
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
  const [priceInputMode, setPriceInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [areaInputMode, setAreaInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState<string>("");

  // 날짜 범위
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  // 프리셋 상태
  const [savedPresets, setSavedPresets] =
    useState<SaleFilterPreset[]>(SALE_PRESETS);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  // API 데이터 로드
  const {
    locations,
    isLoading: locationsLoading,
    error: locationsError,
    usingFallback: locationsUsingFallback,
  } = useLocationsSimple();

  // 지역 선택 로직
  useEffect(() => {
    if (locations && Array.isArray(locations) && locations.length > 0) {
      const provinces = Array.from(
        new Set(locations.map((loc) => loc.province))
      );
      if (selectedProvince && provinces.includes(selectedProvince)) {
        const cities = Array.from(
          new Set(
            locations
              .filter((loc) => loc.province === selectedProvince)
              .map((loc) => loc.city)
          )
        );
        setAvailableCities(cities);
      } else {
        setAvailableCities([]);
      }
    }
  }, [locations, selectedProvince]);

  useEffect(() => {
    if (
      locations &&
      Array.isArray(locations) &&
      locations.length > 0 &&
      selectedProvince &&
      selectedCity
    ) {
      const districts = Array.from(
        new Set(
          locations
            .filter(
              (loc) =>
                loc.province === selectedProvince && loc.city === selectedCity
            )
            .map((loc) => loc.district)
            .filter((d) => d && d.trim() !== "")
        )
      );
      setAvailableDistricts(districts);
    } else {
      setAvailableDistricts([]);
    }
  }, [locations, selectedProvince, selectedCity]);

  // 지역 변경 핸들러
  const handleProvinceChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedProvince(actualValue);
    setSelectedCity("");
    setSelectedDistrict("");
    setFilter("province", actualValue);
    setFilter("city", "");
    setFilter("district", "");
    setPageStore(1);
  };

  const handleCityChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedCity(actualValue);
    setSelectedDistrict("");
    setFilter("city", actualValue);
    setFilter("district", "");
    setPageStore(1);
  };

  const handleDistrictChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setSelectedDistrict(actualValue);
    setFilter("district", actualValue);
    setPageStore(1);
  };

  // 프리셋 적용
  const applyPreset = (preset: SaleFilterPreset) => {
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

  const provinces =
    locations && Array.isArray(locations)
      ? Array.from(new Set(locations.map((loc) => loc.province)))
      : [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            실거래가(매매) 필터
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
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="시/군/구 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
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
                    disabled={!selectedCity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="읍/면/동 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {availableDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
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
              {/* 거래금액 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    거래금액 (만원)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPriceInputMode(
                        priceInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {priceInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {priceInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.priceRange || [0, 200000]}
                      onValueChange={(value) =>
                        setRangeFilter("priceRange", value as [number, number])
                      }
                      max={200000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(filters.priceRange?.[0] || 0).toLocaleString()}만원
                      </span>
                      <span>
                        {(filters.priceRange?.[1] || 200000).toLocaleString()}
                        만원
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.priceRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setRangeFilter("priceRange", [
                          value,
                          filters.priceRange?.[1] || 200000,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.priceRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 200000;
                        setRangeFilter("priceRange", [
                          filters.priceRange?.[0] || 0,
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

              {/* 거래 날짜 범위 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  거래 날짜
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

              {/* 거래 유형 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  거래 유형
                </Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">매수자 유형</Label>
                    <Select
                      value={filters.buyerType || "all"}
                      onValueChange={(value) =>
                        setFilter("buyerType", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="개인">개인</SelectItem>
                        <SelectItem value="법인">법인</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">매도자 유형</Label>
                    <Select
                      value={filters.sellerType || "all"}
                      onValueChange={(value) =>
                        setFilter("sellerType", value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="개인">개인</SelectItem>
                        <SelectItem value="법인">법인</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
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
