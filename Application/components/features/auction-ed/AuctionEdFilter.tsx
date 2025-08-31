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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Gavel,
  Hash,
} from "lucide-react";

// 경매 특화 프리셋 데이터
interface AuctionEdFilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: any;
}

const AUCTION_ED_PRESETS: AuctionEdFilterPreset[] = [
  {
    id: "preset1",
    name: "고액 낙찰 (5억 이상)",
    emoji: "💰",
    description: "5억원 이상 고액 낙찰 경매",
    filters: {
      priceRange: [50000, 200000],
    },
  },
  {
    id: "preset2",
    name: "최근 3개월 경매",
    emoji: "📅",
    description: "최근 3개월 이내 진행된 경매",
    filters: {
      dateRange: ["2024-06-01", "2024-08-31"],
    },
  },
  {
    id: "preset3",
    name: "경쟁 치열 (입찰 5회 이상)",
    emoji: "🔥",
    description: "입찰 5회 이상의 치열한 경매",
    filters: {
      bidCountRange: [5, 100],
    },
  },
];

interface AuctionEdFilterProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  showLocationOnly?: boolean;
  showDetailsOnly?: boolean;
  namespace?: string;
}

export default function AuctionEdFilter({
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  setSearchQuery,
  handleSearch,
  showLocationOnly = false,
  showDetailsOnly = false,
  namespace = "auction_ed",
}: AuctionEdFilterProps) {
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
    key: "priceRange" | "areaRange" | "bidCountRange" | "dateRange",
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
  const [bidCountInputMode, setBidCountInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState<string>("");
  const [caseNumberSearch, setCaseNumberSearch] = useState<string>("");

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

  const handleCaseNumberSearch = () => {
    const q = caseNumberSearch.trim();
    setFilter("searchField", q ? "case_number" : "all");
    setFilter("searchQuery", q);
    setPageStore(1);
  };

  const handleClearSearch = () => {
    setAddressSearch("");
    setCaseNumberSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPageStore(1);
  };

  // 프리셋 상태
  const [savedPresets, setSavedPresets] =
    useState<AuctionEdFilterPreset[]>(AUCTION_ED_PRESETS);
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
    setSelectedProvince(value);
    setSelectedCity("");
    setSelectedDistrict("");
    setFilter("province", value);
    setFilter("city", "");
    setFilter("district", "");
    setPageStore(1);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedDistrict("");
    setFilter("city", value);
    setFilter("district", "");
    setPageStore(1);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setFilter("district", value);
    setPageStore(1);
  };

  // 프리셋 적용
  const applyPreset = (preset: AuctionEdFilterPreset) => {
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
    setCaseNumberSearch("");
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
            <Gavel className="w-5 h-5 mr-2 text-amber-600" />
            경매 결과 필터
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">주소 검색</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="주소를 입력하세요"
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

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">사건 번호</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="사건 번호를 입력하세요"
                      value={caseNumberSearch}
                      onChange={(e) => setCaseNumberSearch(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleCaseNumberSearch()
                      }
                    />
                    <Button size="sm" onClick={handleCaseNumberSearch}>
                      검색
                    </Button>
                  </div>
                </div>
              </div>

              {(addressSearch || caseNumberSearch) && (
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
                      <SelectItem value="">전체</SelectItem>
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
                      <SelectItem value="">전체</SelectItem>
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
                      <SelectItem value="">전체</SelectItem>
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
              {/* 낙찰가 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    낙찰가 (만원)
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
                      value={filters.priceRange || [0, 100000]}
                      onValueChange={(value) =>
                        setRangeFilter("priceRange", value as [number, number])
                      }
                      max={100000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {(filters.priceRange?.[0] || 0).toLocaleString()}만원
                      </span>
                      <span>
                        {(filters.priceRange?.[1] || 100000).toLocaleString()}
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
                          filters.priceRange?.[1] || 100000,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.priceRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100000;
                        setRangeFilter("priceRange", [
                          filters.priceRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 면적 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <Ruler className="w-4 h-4 mr-2" />
                    면적 (㎡)
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
                      value={filters.areaRange || [0, 500]}
                      onValueChange={(value) =>
                        setRangeFilter("areaRange", value as [number, number])
                      }
                      max={500}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.areaRange?.[0] || 0}㎡</span>
                      <span>{filters.areaRange?.[1] || 500}㎡</span>
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
                          filters.areaRange?.[1] || 500,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.areaRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 500;
                        setRangeFilter("areaRange", [
                          filters.areaRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 입찰 횟수 범위 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    입찰 횟수
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBidCountInputMode(
                        bidCountInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  >
                    {bidCountInputMode === "slider" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {bidCountInputMode === "slider" ? (
                  <div className="space-y-2">
                    <Slider
                      value={filters.bidCountRange || [0, 50]}
                      onValueChange={(value) =>
                        setRangeFilter(
                          "bidCountRange",
                          value as [number, number]
                        )
                      }
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.bidCountRange?.[0] || 0}회</span>
                      <span>{filters.bidCountRange?.[1] || 50}회</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.bidCountRange?.[0] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setRangeFilter("bidCountRange", [
                          value,
                          filters.bidCountRange?.[1] || 50,
                        ]);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.bidCountRange?.[1] || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 50;
                        setRangeFilter("bidCountRange", [
                          filters.bidCountRange?.[0] || 0,
                          value,
                        ]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 경매 날짜 범위 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  경매 날짜
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
