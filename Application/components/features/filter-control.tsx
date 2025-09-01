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
import { useItems } from "@/hooks/useItems";
import { useSpecialRights } from "@/hooks/useSpecialRights";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  Building,
  DollarSign,
  Ruler,
  Calendar,
  Layers,
  CableCarIcon as Elevator,
  Search,
  ToggleLeft,
  ToggleRight,
  Save,
  Star,
  CheckCircle,
  Eye,
  AlertTriangle,
  Home,
  Mountain,
} from "lucide-react";

// ✅ 백엔드 API로부터 주소 데이터 로드 (SAMPLE_ADDRESSES 대체)

// 저장된 필터 프리셋 데이터
interface FilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: any;
}

const SAMPLE_PRESETS: FilterPreset[] = [
  {
    id: "preset1",
    name: "강남 아파트 3억 이하",
    emoji: "🏢",
    description: "강남구 아파트, 3억원 이하",
    filters: {
      province: "서울특별시",
      city: "강남구",
      buildingType: "아파트",
      priceRange: [0, 30000],
    },
  },
  {
    id: "preset2",
    name: "경기도 신축 빌라",
    emoji: "🏘️",
    description: "경기도 신축 빌라, 엘리베이터 있음",
    filters: {
      province: "경기도",
      buildingType: "빌라",
      hasElevator: "있음",
      buildYear: [2020, 2024],
    },
  },
  {
    id: "preset3",
    name: "1억대 소형 매물",
    emoji: "💰",
    description: "1-2억원, 소형 평수",
    filters: {
      priceRange: [10000, 20000],
      areaRange: [20, 60],
    },
  },
];

interface FilterControlProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  showLocationOnly?: boolean; // 지역 선택만 표시
  showDetailsOnly?: boolean; // 상세 조건만 표시
  // 🆕 데이터셋별 프리셋/기본값/네임스페이스(선택)
  preset?: Array<Record<string, unknown>>;
  defaults?: Record<string, unknown>;
  namespace?: string;
}

export default function FilterControl({
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  setSearchQuery,
  handleSearch,
  showLocationOnly = false,
  showDetailsOnly = false,
  preset,
  defaults,
  namespace,
}: FilterControlProps) {
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

  // 특수권리 동적 로딩
  const { specialRights, isLoading: isLoadingSpecialRights } = useSpecialRights(
    {
      address_area: filters.province,
      address_city: filters.cityDistrict,
    }
  );

  // 접기/펴기 상태
  const [isCurrentStatusCollapsed, setIsCurrentStatusCollapsed] =
    useState(true);
  const [isSpecialRightsCollapsed, setIsSpecialRightsCollapsed] =
    useState(true);
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
      | "priceRange"
      | "areaRange"
      | "buildingAreaRange"
      | "landAreaRange"
      | "buildYear",
    value: [number, number]
  ) => {
    if (namespace && typeof setNsRangeFilter === "function") {
      (setNsRangeFilter as any)(namespace, key, value);
    } else {
      setRangeFilterBase(key, value);
    }
  };

  // ✅ 지역 선택 상태 (이름 기반으로 유지, 코드는 내부적으로 관리)
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // 범위 입력 모드 (slider vs input)
  const [priceInputMode, setPriceInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [areaInputMode, setAreaInputMode] = useState<"slider" | "input">(
    "input"
  );
  const [landAreaInputMode, setLandAreaInputMode] = useState<
    "slider" | "input"
  >("input");
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState<string>("");
  const [caseNumberSearch, setCaseNumberSearch] = useState<string>("");

  // 검색 핸들러
  const setPageStore = useFilterStore((s) => s.setPage);

  const handleAddressSearch = () => {
    const q = addressSearch.trim();
    setFilter("searchField", q ? ("road_address" as any) : ("all" as any));
    setFilter("searchQuery", q);
    setPageStore(1);
  };

  const handleCaseNumberSearch = () => {
    const q = caseNumberSearch.trim();
    setFilter("searchField", q ? ("case_number" as any) : ("all" as any));
    setFilter("searchQuery", q);
    setPageStore(1);
  };

  const handleClearSearch = () => {
    setAddressSearch("");
    setCaseNumberSearch("");
    setFilter("searchField", "all" as any);
    setFilter("searchQuery", "");
    setPageStore(1);
  };

  // 필터 프리셋 상태
  const [savedPresets, setSavedPresets] =
    useState<FilterPreset[]>(SAMPLE_PRESETS);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [estimatedResults, setEstimatedResults] = useState<number>(4321); // 모킹된 결과 개수

  // ✅ API 데이터 로드
  const {
    locations,
    isLoading: locationsLoading,
    error: locationsError,
    usingFallback: locationsUsingFallback,
  } = useLocationsSimple();

  // ✅ 실제 데이터 기반 동적 필터 옵션 로드
  const { usageValues, floorValues } = useItems();

  // ✅ FilterStore 연동
  // setFilter 는 상단에서 가져옵니다
  const setSortConfig = useFilterStore((state) => state.setSortConfig);
  const showSelectedOnly = (useFilterStore as any)(
    (s: any) => s.showSelectedOnly
  );
  const setShowSelectedOnly = (useFilterStore as any)(
    (s: any) => s.setShowSelectedOnly
  );
  const selectedIds = (useFilterStore as any)(
    (s: any) => s.selectedIds as string[]
  );

  // URL 쿼리 동기화 준비
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const writeSelOnlyParam = (flag: boolean) => {
    try {
      const qs = new URLSearchParams(searchParams?.toString() || "");
      if (flag) qs.set("selOnly", "1");
      else qs.delete("selOnly");
      const next = `${pathname}${qs.toString() ? `?${qs.toString()}` : ""}`;
      router.replace(next, { scroll: false });
    } catch {}
  };
  // 초기 쿼리 → 스토어 동기화
  useEffect(() => {
    try {
      const v = searchParams?.get("selOnly");
      const flag = v === "1";
      if (flag !== showSelectedOnly) setShowSelectedOnly(flag);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  // 스토어 → 쿼리 동기화
  useEffect(() => {
    writeSelOnlyParam(showSelectedOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelectedOnly]);

  // 현재 날짜 기반 기본값 설정
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // 지역 선택 여부: 데이터 로딩 제어용
  const isLocationSelectedForData =
    (filters.province && filters.cityDistrict) ||
    (selectedProvince && selectedCity);
  // UI 표시용: 상세 필터를 항상 활성화하기 위해 true로 설정
  const isLocationSelected = true;
  const getProgress = () => {
    let progress = 0;
    if (selectedProvince) progress += 40;
    if (selectedCity) progress += 40;
    if (getActiveFiltersCount() > 0) progress += 20;
    return Math.min(progress, 100);
  };

  const formatPrice = (value: number) => {
    if (value >= 10000) return `${(value / 10000).toFixed(1)}억`;
    return `${value.toLocaleString()}만`;
  };

  const formatArea = (value: number) => `${value}㎡`;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedProvince || selectedCity) count++;
    if (filters.buildingType && filters.buildingType !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000) count++;
    if (filters.areaRange[0] > 0 || filters.areaRange[1] < 200) count++;
    if (filters.buildYear[0] > 1980 || filters.buildYear[1] < 2024) count++;
    if (
      (filters as any).floorConfirmation &&
      (filters as any).floorConfirmation !== "all"
    )
      count++;
    if ((filters as any).hasElevator && (filters as any).hasElevator !== "all")
      count++;
    if ((filters as any).auctionDateFrom || (filters as any).auctionDateTo)
      count++;
    return count;
  };

  // 상세 조건만 초기화 (지역은 유지)
  const resetDetailFilters = () => {
    // 오늘과 +1개월 기본 매각기일 설정으로 UI/데이터 정합성 유지
    const today = new Date();
    const plus30 = new Date(today);
    plus30.setDate(plus30.getDate() + 31);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    setRangeFilter("priceRange", [0, 500000]);
    setRangeFilter("areaRange", [0, 200]); // deprecated 유지 초기화
    setRangeFilter("buildingAreaRange", [0, 100]);
    setRangeFilter("landAreaRange", [0, 200]);
    setRangeFilter("buildYear", [1980, 2024]);

    setFilter("buildingType", "all" as any);
    setFilter("floor", "all" as any);
    setFilter("floorConfirmation", "all" as any);
    setFilter("hasElevator", "all" as any);
    setFilter("hasParking", undefined as any);
    setFilter("auctionStatus", "all" as any);
    setFilter("under100", false as any);
    setFilter("auctionDateFrom", fmt(today) as any);
    setFilter("auctionDateTo", fmt(plus30) as any);
    // 🆕 상태/특수조건 초기화
    setFilter("currentStatus" as any, "all");
    setFilter("specialConditions" as any, []);
    setFilter("specialBooleanFlags" as any, []);
    setSortConfig(undefined, undefined);
  };

  // 필터 미리보기 업데이트
  const updateEstimatedResults = () => {
    // 실제로는 API 호출로 결과 개수를 가져옴
    const baseCount = 4321;
    let multiplier = 1;

    if (selectedProvince) multiplier *= 0.3;
    if (selectedCity) multiplier *= 0.5;
    if (filters.buildingType && filters.buildingType !== "all")
      multiplier *= 0.4;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000)
      multiplier *= 0.6;

    const estimated = Math.floor(baseCount * multiplier);
    setEstimatedResults(estimated);
  };

  // 프리셋 저장 기능
  const saveCurrentAsPreset = () => {
    const presetName = prompt("필터 프리셋 이름을 입력하세요:");
    if (presetName) {
      const newPreset: FilterPreset = {
        id: `preset_${Date.now()}`,
        name: presetName,
        emoji: "💾",
        description: `${selectedProvince} ${selectedCity} 설정`,
        filters: {
          ...filters,
          province: selectedProvince,
          city: selectedCity,
          district: selectedDistrict,
        },
      };
      setSavedPresets([...savedPresets, newPreset]);
      // 실제로는 localStorage나 서버에 저장
      localStorage.setItem(
        "filterPresets",
        JSON.stringify([...savedPresets, newPreset])
      );
    }
  };

  // 프리셋 로드 기능
  const loadPreset = (preset: FilterPreset) => {
    if (preset.filters.province) setSelectedProvince(preset.filters.province);
    if (preset.filters.city) setSelectedCity(preset.filters.city);
    if (preset.filters.district) setSelectedDistrict(preset.filters.district);

    // 다른 필터들도 로드
    Object.keys(preset.filters).forEach((key) => {
      if (key !== "province" && key !== "city" && key !== "district") {
        // 타입 안전성을 위해 as any로 캐스팅
        (setFilter as any)(key, preset.filters[key]);
      }
    });

    setShowPresets(false);
  };

  // 대형 버튼 그룹 컴포넌트 (크기 확대)
  const ButtonGroup = ({
    options,
    value,
    onChange,
    disabled = false,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div className="flex gap-4 flex-wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          size="lg"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className="h-12 px-6 text-base font-medium hover:scale-105 transition-transform"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );

  // 확대된 범위 입력 토글 버튼
  const RangeToggle = ({
    mode,
    onToggle,
  }: {
    mode: "slider" | "input";
    onToggle: () => void;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-7 px-2 text-xs hover:scale-105 transition-transform"
    >
      {mode === "slider" ? (
        <ToggleLeft className="w-3 h-3" />
      ) : (
        <ToggleRight className="w-3 h-3" />
      )}
      <span className="text-xs ml-1">
        {mode === "slider" ? "슬라이더" : "직접입력"}
      </span>
    </Button>
  );

  // ✅ 주소 체인 업데이트 (API 데이터 기반 - 백엔드 가이드 4)
  useEffect(() => {
    if (selectedProvince && locations?.cities) {
      const cities = locations.cities[selectedProvince] || [];
      setAvailableCities(cities);
      if (!cities.includes(selectedCity)) {
        setSelectedCity("");
        setSelectedDistrict("");
        setAvailableDistricts([]);
      }

      // ✅ 필터 스토어에 이름 기반 필터 설정 (하위호환)
      setFilter("province", selectedProvince);
    } else {
      setAvailableCities([]);
      setSelectedCity("");
      setSelectedDistrict("");
      setAvailableDistricts([]);
      setFilter("province", "");
    }
    updateEstimatedResults();
  }, [selectedProvince, selectedCity, locations]);

  useEffect(() => {
    if (selectedCity && locations?.districts) {
      const districts = locations.districts[selectedCity] || [];
      setAvailableDistricts(districts);
      if (!districts.includes(selectedDistrict)) {
        setSelectedDistrict("");
      }

      // ✅ 필터 스토어에 이름 기반 필터 설정 (하위호환)
      setFilter("cityDistrict", selectedCity);
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict("");
      setFilter("cityDistrict", "");
    }
    updateEstimatedResults();
  }, [selectedCity, selectedDistrict, locations]);

  // ✅ 읍면동 선택 시 필터 설정
  useEffect(() => {
    if (selectedDistrict) {
      setFilter("town", selectedDistrict);
    } else {
      setFilter("town", "");
    }
  }, [selectedDistrict]);

  // 필터 변경 시 미리보기 업데이트
  useEffect(() => {
    updateEstimatedResults();
  }, [filters]);

  // 저장된 프리셋 로드
  useEffect(() => {
    const saved = localStorage.getItem("filterPresets");
    if (saved) {
      try {
        const parsedPresets = JSON.parse(saved);
        setSavedPresets([...SAMPLE_PRESETS, ...parsedPresets]);
      } catch (e) {
        console.error("Failed to load saved presets:", e);
      }
    }
  }, []);

  // ✅ 데이터셋별 기본값(defaults) 적용 (namespace 변경 또는 defaults 변경 시 1회 적용)
  const [lastAppliedNs, setLastAppliedNs] = useState<string | undefined>(
    undefined
  );
  const [lastDefaultsKey, setLastDefaultsKey] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    if (!defaults || typeof defaults !== "object") return;
    const currentKey = JSON.stringify(defaults);
    if (lastAppliedNs === namespace && lastDefaultsKey === currentKey) return;

    try {
      Object.entries(defaults).forEach(([key, value]) => {
        // Range 계열 키는 setRangeFilter 사용
        const isRangeKey =
          key === "priceRange" ||
          key === "areaRange" ||
          key === "buildingAreaRange" ||
          key === "landAreaRange" ||
          key === "buildYear";
        if (isRangeKey && Array.isArray(value) && value.length === 2) {
          setRangeFilter(key as any, value as [number, number]);
        } else {
          (setFilter as any)(key, value as any);
        }
      });
    } catch {}

    setLastAppliedNs(namespace);
    setLastDefaultsKey(currentKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, defaults]);

  // 매각기일 기본값 설정
  useEffect(() => {
    if (!(filters as any).auctionDateFrom) {
      setFilter("auctionDateFrom", formatDate(today));
    }
    if (!(filters as any).auctionDateTo) {
      setFilter("auctionDateTo", formatDate(oneMonthLater));
    }
  }, []);

  return (
    <Card className="w-full shadow-lg border-2">
      {/* 
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-8 h-8 text-blue-600" />
            <div>
              {!showDetailsOnly && (
                <>
                  <CardTitle className="text-2xl font-bold">
                    {!isLocationSelected
                      ? "🎯 1단계: 지역을 선택해주세요"
                      : "🔍 매물 필터"}
                  </CardTitle>
                  <p className="text-base text-gray-600 mt-1">
                    {!isLocationSelected
                      ? "원하는 지역을 먼저 선택하면 상세 필터를 사용할 수 있어요"
                      : `예상 결과: 약 ${estimatedResults.toLocaleString()}개 매물`}
                  </p>
                </>
              )}
            </div>

            {!isLocationSelected && (
              <Badge
                variant="destructive"
                className="text-base px-3 py-1 animate-pulse"
              >
                ⚠️ 지역 선택 필수
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {isLocationSelected && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowPresets(!showPresets)}
                  className="h-12 px-4 text-base"
                >
                  <Star className="w-5 h-5 mr-2" />
                  저장된 필터
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={saveCurrentAsPreset}
                  className="h-12 px-4 text-base"
                >
                  <Save className="w-5 h-5 mr-2" />
                  저장
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    resetFilters();
                    setSelectedProvince("");
                    setSelectedCity("");
                    setSelectedDistrict("");
                  }}
                  className="h-12 px-4 text-base text-gray-500 hover:text-gray-700"
                >
                  🔄 초기화
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="lg"
              onClick={onToggleCollapse}
              className="h-12 px-3"
            >
              {isCollapsed ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <ChevronUp className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {!isCollapsed && !showDetailsOnly && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>설정 진행률</span>
              <span>{getProgress()}% 완료</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      */}

      {!isCollapsed && (
        <CardContent className="space-y-8">
          {/* 저장된 프리셋 표시 */}
          {showPresets && (
            <div className="p-6 border-2 border-purple-200 rounded-xl bg-purple-50 animate-fadeIn">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-purple-800">
                  저장된 필터 프리셋
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 border border-purple-200 rounded-lg bg-white hover:bg-purple-50 cursor-pointer transition-colors"
                    onClick={() => loadPreset(preset)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{preset.emoji}</span>
                      <h4 className="font-semibold text-base">{preset.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. 지역 선택 (필수) */}
          {!showDetailsOnly && (
            <div className="p-8 rounded-xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    !isLocationSelected ? "bg-blue-500" : "bg-green-500"
                  }`}
                >
                  {!isLocationSelectedForData ? "1" : "✓"}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {!isLocationSelectedForData
                      ? "🏘️ 지역을 선택해주세요"
                      : "✅ 선택된 지역"}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {!isLocationSelectedForData
                      ? "원하는 지역을 선택하면 상세 필터를 사용할 수 있어요"
                      : `${selectedCity}${
                          selectedDistrict ? ` ${selectedDistrict}` : ""
                        }`}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* ✅ 지역 선택 (한 줄로 배치된 드롭다운) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 시도명 */}
                  <div
                    className={`rounded-lg p-3 transition-colors ${
                      selectedProvince
                        ? "bg-white border border-gray-200"
                        : "bg-blue-50 border border-blue-300"
                    }`}
                  >
                    <Label className="text-lg font-bold mb-3 block text-gray-800">
                      시도명
                      <Badge variant="outline" className="ml-2 text-sm">
                        필수
                      </Badge>
                    </Label>
                    <Select
                      value={selectedProvince}
                      onValueChange={(value) => {
                        setSelectedProvince(value);
                        setFilter("province", value);
                        // 시도 변경 시 하위 지역 초기화
                        setSelectedCity("");
                        setSelectedDistrict("");
                        setFilter("cityDistrict", "");
                        setFilter("town", "");
                      }}
                    >
                      <SelectTrigger
                        className={`w-full h-12 text-base ${
                          selectedProvince ? "" : "border-blue-400"
                        }`}
                      >
                        <SelectValue placeholder="시도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations?.provinces || []).map((province) => (
                          <SelectItem
                            key={province}
                            value={province}
                            className="text-base"
                          >
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 시군구 */}
                  <div
                    className={`rounded-lg p-3 transition-colors ${
                      selectedCity
                        ? "bg-white border border-gray-200"
                        : "bg-blue-50 border border-blue-300"
                    }`}
                  >
                    <Label className="text-lg font-bold mb-3 block text-gray-800">
                      시군구
                      <Badge variant="outline" className="ml-2 text-sm">
                        필수
                      </Badge>
                    </Label>
                    <Select
                      value={selectedCity}
                      onValueChange={(value) => {
                        setSelectedCity(value);
                        setFilter("cityDistrict", value);
                        // 시군구 변경 시 읍면동 초기화
                        setSelectedDistrict("");
                        setFilter("town", "");
                      }}
                      disabled={!selectedProvince}
                    >
                      <SelectTrigger
                        className={`w-full h-12 text-base ${
                          selectedCity ? "" : "border-blue-400"
                        }`}
                      >
                        <SelectValue placeholder="시군구 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem
                            key={city}
                            value={city}
                            className="text-base"
                          >
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 읍면동 */}
                  <div>
                    <Label className="text-lg font-bold mb-3 block text-gray-800">
                      읍면동
                      <Badge variant="secondary" className="ml-2 text-sm">
                        선택사항
                      </Badge>
                    </Label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={(value) => {
                        setSelectedDistrict(value);
                        setFilter("town", value);
                      }}
                      disabled={
                        !selectedCity || availableDistricts.length === 0
                      }
                    >
                      <SelectTrigger className="w-full h-12 text-base">
                        <SelectValue placeholder="전체 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDistricts.map((district) => (
                          <SelectItem
                            key={district}
                            value={district}
                            className="text-base"
                          >
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 선택 항목만 보기 토글 (상세 필터 패널에서만 표시) */}
          {showDetailsOnly && (
            <div className="flex items-center justify-between rounded border px-3 py-2 bg-white">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">선택 항목만 보기</span>
                {Array.isArray(selectedIds) && selectedIds.length > 0 && (
                  <Badge variant="secondary">선택 {selectedIds.length}건</Badge>
                )}
              </div>
              <button
                className={`rounded px-3 py-1 text-xs border ${
                  showSelectedOnly
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 border-gray-300"
                } ${
                  selectedIds.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() =>
                  selectedIds.length > 0 &&
                  setShowSelectedOnly(!showSelectedOnly)
                }
                title={
                  selectedIds.length === 0
                    ? "선택된 항목이 없습니다"
                    : "선택 항목만 보기 토글"
                }
              >
                {showSelectedOnly ? "해제" : "적용"}
              </button>
            </div>
          )}

          {/* ✅ 임시 데이터 사용 알림 */}
          {locationsUsingFallback && (
            <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-xl mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-orange-800">
                    🔄 임시 데이터로 테스트 중
                  </p>
                  <p className="text-sm text-orange-700">
                    백엔드 서버에서 빈 데이터를 반환하고 있어서 임시 데이터로
                    대체 중입니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {locationsLoading && (
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-base font-semibold text-blue-800">
                    🔄 백엔드 서버 연결 중...
                  </p>
                  <p className="text-sm text-blue-700">
                    주소 데이터를 불러오고 있어요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 경고 또는 성공 메시지 제거: 상세 필터를 처음부터 노출 */}

          {/* 🔧 상세 조건 섹션: 항상 표시 (데이터 로딩은 별도 제어) */}
          {!showLocationOnly && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs">
                    2
                  </div>
                  <h3 className="text-base font-medium text-gray-900">
                    상세 조건 설정
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDetailFilters}
                    className="h-8 px-2 text-xs"
                  >
                    설정 초기화
                  </Button>
                </div>
              </div>

              {/* 1. 건물 유형 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Label className="text-sm font-medium">건물 유형</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "전체" },
                    { value: "다세대(빌라)", label: "다세대(빌라)" },
                  ].map((option) => {
                    const current = filters.buildingType;
                    const isAll = option.value === "all";
                    const isActive = Array.isArray(current)
                      ? current.includes(option.value)
                      : current === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (isAll) {
                            setFilter("buildingType", "all" as any);
                            return;
                          }
                          const prev = filters.buildingType;
                          if (Array.isArray(prev)) {
                            const next = isActive
                              ? prev.filter((v) => v !== option.value)
                              : [...prev, option.value];
                            setFilter(
                              "buildingType",
                              next.length === 0 ? "all" : (next as any)
                            );
                          } else {
                            setFilter(
                              "buildingType",
                              prev === "all"
                                ? ([option.value] as any)
                                : [prev, option.value]
                            );
                          }
                        }}
                        disabled={!isLocationSelected}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        } ${
                          !isLocationSelected
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 매각기일 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Label className="text-sm font-medium">매각기일</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">
                      시작일
                    </Label>
                    <Input
                      type="date"
                      value={
                        (filters as any).auctionDateFrom || formatDate(today)
                      }
                      onChange={(e) =>
                        setFilter("auctionDateFrom", e.target.value)
                      }
                      disabled={!isLocationSelected}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">
                      종료일
                    </Label>
                    <Input
                      type="date"
                      value={
                        (filters as any).auctionDateTo ||
                        formatDate(oneMonthLater)
                      }
                      onChange={(e) =>
                        setFilter("auctionDateTo", e.target.value)
                      }
                      disabled={!isLocationSelected}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 가격 범위 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">가격 범위</Label>
                  </div>
                  <RangeToggle
                    mode={priceInputMode}
                    onToggle={() =>
                      setPriceInputMode(
                        priceInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  />
                </div>

                {priceInputMode === "slider" ? (
                  <div className="space-y-4">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) =>
                          setRangeFilter(
                            "priceRange",
                            value as [number, number]
                          )
                        }
                        max={500000}
                        min={0}
                        step={1000}
                        disabled={!isLocationSelected}
                        className="w-full h-3"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.priceRange[0].toLocaleString()}만원
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.priceRange[1].toLocaleString()}만원
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최소 (만원)
                      </Label>
                      <Input
                        type="number"
                        value={filters.priceRange[0]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 0;
                          setRangeFilter("priceRange", [
                            value,
                            filters.priceRange[1],
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최대 (만원)
                      </Label>
                      <Input
                        type="number"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          const value =
                            Number.parseInt(e.target.value) || 500000;
                          setRangeFilter("priceRange", [
                            filters.priceRange[0],
                            value,
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="500000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 건축면적 범위 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">건축면적 범위</Label>
                  </div>
                  <RangeToggle
                    mode={areaInputMode}
                    onToggle={() =>
                      setAreaInputMode(
                        areaInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  />
                </div>

                {areaInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.buildingAreaRange}
                        onValueChange={(value: number[]) =>
                          setRangeFilter("buildingAreaRange", [
                            value[0] || 0,
                            value[1] || 100,
                          ])
                        }
                        min={0}
                        max={300}
                        step={5}
                        disabled={!isLocationSelected}
                        className="w-full h-3"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.buildingAreaRange[0]}평
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.buildingAreaRange[1]}평
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최소 (평)
                      </Label>
                      <Input
                        type="number"
                        value={filters.buildingAreaRange[0]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 0;
                          setRangeFilter("buildingAreaRange", [
                            value,
                            filters.buildingAreaRange[1],
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최대 (평)
                      </Label>
                      <Input
                        type="number"
                        value={filters.buildingAreaRange[1]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 100;
                          setRangeFilter("buildingAreaRange", [
                            filters.buildingAreaRange[0],
                            value,
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 토지면적 범위 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">토지면적 범위</Label>
                  </div>
                  <RangeToggle
                    mode={landAreaInputMode}
                    onToggle={() =>
                      setLandAreaInputMode(
                        landAreaInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  />
                </div>

                {landAreaInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={[
                          filters.landAreaRange?.[0] || 0,
                          filters.landAreaRange?.[1] || 200,
                        ]}
                        onValueChange={(value: number[]) =>
                          setRangeFilter("landAreaRange", [
                            value[0] || 0,
                            value[1] || 200,
                          ])
                        }
                        min={0}
                        max={300}
                        step={5}
                        disabled={!isLocationSelected}
                        className="w-full h-3"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.landAreaRange?.[0] || 0}평
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.landAreaRange?.[1] || 200}평
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최소 (평)
                      </Label>
                      <Input
                        type="number"
                        value={filters.landAreaRange?.[0] || 0}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 0;
                          setRangeFilter("landAreaRange", [
                            value,
                            filters.landAreaRange?.[1] || 200,
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        최대 (평)
                      </Label>
                      <Input
                        type="number"
                        value={filters.landAreaRange?.[1] || 200}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 200;
                          setRangeFilter("landAreaRange", [
                            filters.landAreaRange?.[0] || 0,
                            value,
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                        placeholder="200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 건축년도 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">건축년도</Label>
                  </div>
                  <RangeToggle
                    mode={buildYearInputMode}
                    onToggle={() =>
                      setBuildYearInputMode(
                        buildYearInputMode === "slider" ? "input" : "slider"
                      )
                    }
                  />
                </div>

                {buildYearInputMode === "slider" ? (
                  <div className="space-y-6">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.buildYear}
                        onValueChange={(value) =>
                          setRangeFilter("buildYear", value as [number, number])
                        }
                        max={2024}
                        min={1980}
                        step={1}
                        disabled={!isLocationSelected}
                        className="w-full h-3"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.buildYear[0]}년
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="px-2 py-1 rounded-md text-xs border">
                        {filters.buildYear[1]}년
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        시작년도
                      </Label>
                      <Input
                        type="number"
                        value={filters.buildYear[0]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 1980;
                          setRangeFilter("buildYear", [
                            value,
                            filters.buildYear[1],
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">
                        종료년도
                      </Label>
                      <Input
                        type="number"
                        value={filters.buildYear[1]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 2024;
                          setRangeFilter("buildYear", [
                            filters.buildYear[0],
                            value,
                          ]);
                        }}
                        disabled={!isLocationSelected}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 층확인 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Label className="text-sm font-medium">층확인</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "전체" },
                    { value: "반지하", label: "반지하" },
                    { value: "1층", label: "1층" },
                    { value: "일반층", label: "일반층" },
                    { value: "탑층", label: "탑층" },
                  ].map((option) => {
                    const current = filters.floorConfirmation;
                    const isAll = option.value === "all";
                    const isActive = Array.isArray(current)
                      ? current.includes(option.value)
                      : current === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (isAll) {
                            setFilter("floorConfirmation", "all" as any);
                            return;
                          }
                          const prev = filters.floorConfirmation;
                          if (Array.isArray(prev)) {
                            const next = isActive
                              ? prev.filter((v) => v !== option.value)
                              : [...prev, option.value];
                            setFilter(
                              "floorConfirmation",
                              next.length === 0 ? "all" : (next as any)
                            );
                          } else {
                            setFilter(
                              "floorConfirmation",
                              prev === "all"
                                ? ([option.value] as any)
                                : [prev, option.value]
                            );
                          }
                        }}
                        disabled={!isLocationSelected}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        } ${
                          !isLocationSelected
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 엘리베이터 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Label className="text-sm font-medium">엘리베이터</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "전체" },
                    { value: "Y", label: "있음" },
                    { value: "N", label: "없음" },
                  ].map((option) => {
                    const current = filters.hasElevator;
                    const isAll = option.value === "all";
                    const isActive = Array.isArray(current)
                      ? current.includes(option.value)
                      : current === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (isAll) {
                            setFilter("hasElevator", "all" as any);
                            return;
                          }
                          const prev = filters.hasElevator;
                          if (Array.isArray(prev)) {
                            const next = isActive
                              ? prev.filter((v) => v !== option.value)
                              : [...prev, option.value];
                            setFilter(
                              "hasElevator",
                              next.length === 0 ? "all" : (next as any)
                            );
                          } else {
                            setFilter(
                              "hasElevator",
                              prev === "all"
                                ? ([option.value] as any)
                                : [prev, option.value]
                            );
                          }
                        }}
                        disabled={!isLocationSelected}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        } ${
                          !isLocationSelected
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 현재상태 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">현재상태</Label>
                  <button
                    onClick={() =>
                      setIsCurrentStatusCollapsed(!isCurrentStatusCollapsed)
                    }
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {isCurrentStatusCollapsed ? "펴기" : "접기"}
                    <span
                      className={`transform transition-transform ${
                        isCurrentStatusCollapsed ? "rotate-0" : "rotate-180"
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </div>
                {!isCurrentStatusCollapsed && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "전체" },
                      { value: "신건", label: "신건" },
                      { value: "유찰", label: "유찰" },
                      { value: "재진행", label: "재진행" },
                      { value: "변경", label: "변경" },
                      { value: "재매각", label: "재매각" },
                      { value: "취하", label: "취하" },
                      { value: "낙찰", label: "낙찰" },
                    ].map((option) => {
                      const current = (filters as any).currentStatus as
                        | string
                        | string[]
                        | undefined;
                      const isAll = option.value === "all";
                      const isActive = Array.isArray(current)
                        ? current.includes(option.value)
                        : current === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (isAll) {
                              setFilter("currentStatus" as any, "all");
                              return;
                            }
                            const prev = (filters as any).currentStatus;
                            if (Array.isArray(prev)) {
                              const next = isActive
                                ? prev.filter((v) => v !== option.value)
                                : [...prev, option.value];
                              setFilter(
                                "currentStatus" as any,
                                next.length === 0
                                  ? ("all" as any)
                                  : (next as any)
                              );
                            } else if (!prev || prev === "all") {
                              setFilter(
                                "currentStatus" as any,
                                [option.value] as any
                              );
                            } else {
                              setFilter(
                                "currentStatus" as any,
                                [prev, option.value] as any
                              );
                            }
                          }}
                          disabled={!isLocationSelected}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                            isActive
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                          } ${
                            !isLocationSelected
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 특수권리 (동적) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">특수권리</Label>
                    {isLoadingSpecialRights && (
                      <span className="text-xs text-gray-500">로딩 중...</span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setIsSpecialRightsCollapsed(!isSpecialRightsCollapsed)
                    }
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {isSpecialRightsCollapsed ? "펴기" : "접기"}
                    <span
                      className={`transform transition-transform ${
                        isSpecialRightsCollapsed ? "rotate-0" : "rotate-180"
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </div>
                {!isSpecialRightsCollapsed && (
                  <div className="flex flex-wrap gap-2">
                    {/* 전체 버튼 */}
                    <button
                      onClick={() => {
                        setFilter("specialRights" as any, [] as any);
                      }}
                      disabled={!isLocationSelected}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        !Array.isArray((filters as any).specialRights) || 
                        ((filters as any).specialRights as string[]).length === 0
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
                      } ${
                        !isLocationSelected
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      전체
                    </button>
                    {specialRights && specialRights.length > 0 ? (
                      specialRights.map((right) => {
                        const current = (filters as any).specialRights as
                          | string[]
                          | undefined;
                        const isActive = Array.isArray(current)
                          ? current.includes(right)
                          : false;
                        return (
                          <button
                            key={right}
                            onClick={() => {
                              const prev = (filters as any).specialRights as
                                | string[]
                                | undefined;
                              const next = Array.isArray(prev)
                                ? isActive
                                  ? prev.filter((v) => v !== right)
                                  : [...prev, right]
                                : [right];
                              setFilter("specialRights" as any, next as any);
                            }}
                            disabled={!isLocationSelected}
                            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                              isActive
                                ? "bg-purple-500 text-white border-purple-500"
                                : "bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
                            } ${
                              !isLocationSelected
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {right}
                          </button>
                        );
                      })
                    ) : (
                      !isLoadingSpecialRights && (
                        <span className="text-xs text-gray-500">
                          특수권리 없음
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* 검색바 */}
              <div className="pt-8 border-t-2 border-gray-200">
                <div className="space-y-6">
                  {/* 주소 검색 */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Label className="text-sm font-medium">주소 검색</Label>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        선택
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="도로명주소로 검색해보세요..."
                          value={addressSearch}
                          onChange={(e) => setAddressSearch(e.target.value)}
                          className="w-full pl-12 pr-6 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddressSearch()
                          }
                          disabled={!isLocationSelected}
                        />
                      </div>
                      <div className="flex justify-start gap-2">
                        <Button
                          onClick={handleAddressSearch}
                          size="sm"
                          variant="outline"
                          disabled={!isLocationSelected}
                          className="h-8 px-3 text-xs"
                        >
                          검색
                        </Button>
                        <Button
                          onClick={handleClearSearch}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                        >
                          검색 해제
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 사건번호 검색 */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Label className="text-sm font-medium">
                        사건번호 검색
                      </Label>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        선택
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="사건번호로 검색해보세요... (예: 2024-1234)"
                          value={caseNumberSearch}
                          onChange={(e) => setCaseNumberSearch(e.target.value)}
                          className="w-full pl-12 pr-6 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCaseNumberSearch()
                          }
                          disabled={!isLocationSelected}
                        />
                      </div>
                      <div className="flex justify-start gap-2">
                        <Button
                          onClick={handleCaseNumberSearch}
                          size="sm"
                          variant="outline"
                          disabled={!isLocationSelected}
                          className="h-8 px-3 text-xs"
                        >
                          검색
                        </Button>
                        <Button
                          onClick={handleClearSearch}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                        >
                          검색 해제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}

      {/* CSS 애니메이션 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </Card>
  );
}
