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
}

export default function FilterControl({
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  setSearchQuery,
  handleSearch,
}: FilterControlProps) {
  // ✅ API 데이터 로드 (백엔드 가이드 4)
  const {
    locations,
    isLoading: locationsLoading,
    error: locationsError,
    usingFallback: locationsUsingFallback,
  } = useLocationsSimple();

  // 스토어 상태
  const filters = useFilterStore((state) => state);
  const setFilter = useFilterStore((state) => state.setFilter);
  const setRangeFilter = useFilterStore((state) => state.setRangeFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);

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
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");

  // 필터 프리셋 상태
  const [savedPresets, setSavedPresets] =
    useState<FilterPreset[]>(SAMPLE_PRESETS);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [estimatedResults, setEstimatedResults] = useState<number>(4321); // 모킹된 결과 개수

  // 현재 날짜 기반 기본값 설정
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // 지역 필수 선택 여부 및 진행률
  const isLocationSelected = selectedProvince && selectedCity;
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
    if (filters.floor && filters.floor !== "all") count++;
    if ((filters as any).hasElevator && (filters as any).hasElevator !== "all")
      count++;
    if ((filters as any).auctionDateFrom || (filters as any).auctionDateTo)
      count++;
    return count;
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
      size="lg"
      onClick={onToggle}
      className="h-10 px-4 hover:scale-105 transition-transform"
    >
      {mode === "slider" ? (
        <ToggleLeft className="w-6 h-6" />
      ) : (
        <ToggleRight className="w-6 h-6" />
      )}
      <span className="text-base ml-2 font-medium">
        {mode === "slider" ? "🎚️ 슬라이더" : "⌨️ 직접입력"}
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
    <>
      <Card className="w-full shadow-lg border-2">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-8 h-8 text-blue-600" />
              <div>
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
              </div>
              {isLocationSelected && (
                <>
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      ✅ {getActiveFiltersCount()}개 적용됨
                    </Badge>
                  )}
                  <Badge
                    variant="default"
                    className="bg-green-500 text-base px-3 py-1"
                  >
                    ✓ 지역 선택 완료
                  </Badge>
                </>
              )}
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

          {/* 진행률 표시 */}
          {!isCollapsed && (
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
                        <h4 className="font-semibold text-base">
                          {preset.name}
                        </h4>
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
            <div
              className={`p-8 border-3 rounded-xl transition-all duration-300 ${
                !isLocationSelected
                  ? "border-blue-400 bg-blue-50 shadow-lg"
                  : "border-green-400 bg-green-50"
              }`}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    !isLocationSelected ? "bg-blue-500" : "bg-green-500"
                  }`}
                >
                  {!isLocationSelected ? "1" : "✓"}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {!isLocationSelected
                      ? "🏘️ 지역을 선택해주세요"
                      : "✅ 선택된 지역"}
                  </h3>
                  <p className="text-lg text-gray-700 mt-1">
                    {!isLocationSelected
                      ? "원하는 지역을 선택하면 상세 필터를 사용할 수 있어요"
                      : `${selectedProvince} ${selectedCity}${
                          selectedDistrict ? ` ${selectedDistrict}` : ""
                        }`}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* ✅ 지역 선택 (한 줄로 배치된 드롭다운) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 시도명 */}
                  <div>
                    <Label className="text-lg font-bold mb-3 block text-gray-800">
                      시도명
                      <Badge variant="outline" className="ml-2 text-sm">
                        필수
                      </Badge>
                    </Label>
                    <Select
                      value={selectedProvince}
                      onValueChange={setSelectedProvince}
                    >
                      <SelectTrigger className="w-full h-12 text-base">
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
                  <div>
                    <Label className="text-lg font-bold mb-3 block text-gray-800">
                      시군구
                      <Badge variant="outline" className="ml-2 text-sm">
                        필수
                      </Badge>
                    </Label>
                    <Select
                      value={selectedCity}
                      onValueChange={setSelectedCity}
                      disabled={!selectedProvince}
                    >
                      <SelectTrigger className="w-full h-12 text-base">
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
                      onValueChange={setSelectedDistrict}
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

            {/* 경고 또는 성공 메시지 */}
            {!locationsError && !locationsLoading && !isLocationSelected ? (
              <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-yellow-800">
                      ⚠️ 지역을 먼저 선택해주세요
                    </p>
                    <p className="text-base text-yellow-700">
                      지역을 선택하면 아래의 상세 필터들을 사용할 수 있어요
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-lg font-semibold text-green-800">
                      ✅ 훌륭해요! 이제 상세 조건을 설정해보세요
                    </p>
                    <p className="text-base text-green-700">
                      아래 필터들로 더 정확한 매물을 찾을 수 있어요
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2단계: 상세 필터들 - 지역 선택 후 활성화 */}
            {isLocationSelected && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">상세 조건 설정</h3>
                    <p className="text-lg text-gray-600 mt-1">
                      원하는 조건을 선택해주세요 (선택사항)
                    </p>
                  </div>
                </div>

                {/* 1. 건물유형 */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Building className="w-7 h-7 text-blue-600" />
                    <Label className="text-xl font-bold">건물 유형</Label>
                  </div>
                  <ButtonGroup
                    options={[
                      { value: "all", label: "전체" },
                      { value: "아파트", label: "아파트" },
                      { value: "빌라", label: "빌라" },
                      { value: "단독주택", label: "단독" },
                      { value: "오피스텔", label: "오피스텔" },
                      { value: "상가", label: "상가" },
                    ]}
                    value={filters.buildingType || "all"}
                    onChange={(value) => setFilter("buildingType", value)}
                    disabled={!isLocationSelected}
                  />
                </div>

                {/* 2. 매각기일 */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="w-7 h-7 text-red-600" />
                    <Label className="text-xl font-bold">매각기일</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-medium mb-2 block flex items-center">
                        📅 시작일
                        <Badge variant="outline" className="ml-2 text-xs">
                          기본: 오늘
                        </Badge>
                      </Label>
                      <Input
                        type="date"
                        value={(filters as any).auctionDateFrom || ""}
                        onChange={(e) =>
                          setFilter("auctionDateFrom", e.target.value)
                        }
                        disabled={!isLocationSelected}
                        className="h-12 text-base font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-medium mb-2 block flex items-center">
                        📅 종료일
                        <Badge variant="outline" className="ml-2 text-xs">
                          기본: 1개월 후
                        </Badge>
                      </Label>
                      <Input
                        type="date"
                        value={(filters as any).auctionDateTo || ""}
                        onChange={(e) =>
                          setFilter("auctionDateTo", e.target.value)
                        }
                        disabled={!isLocationSelected}
                        className="h-12 text-base font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. 가격범위 / 면적범위 - 한 줄에 배치 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 가격 범위 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-7 h-7 text-green-600" />
                        <Label className="text-xl font-bold">가격 범위</Label>
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
                      <div className="space-y-6">
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
                        <div className="flex items-center justify-between text-xl font-bold text-green-700">
                          <span className="bg-green-100 px-4 py-2 rounded-lg">
                            {formatPrice(filters.priceRange[0])}
                          </span>
                          <span className="text-gray-400">~</span>
                          <span className="bg-green-100 px-4 py-2 rounded-lg">
                            {formatPrice(filters.priceRange[1])}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-lg font-medium mb-3 block">
                            최소 (만원)
                          </Label>
                          <Input
                            type="number"
                            value={filters.priceRange[0]}
                            onChange={(e) => {
                              const value =
                                Number.parseInt(e.target.value) || 0;
                              setRangeFilter("priceRange", [
                                value,
                                filters.priceRange[1],
                              ]);
                            }}
                            disabled={!isLocationSelected}
                            className="h-14 text-lg font-semibold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-lg font-medium mb-3 block">
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
                            className="h-14 text-lg font-semibold"
                            placeholder="500000"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 면적 범위 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Ruler className="w-7 h-7 text-blue-600" />
                        <Label className="text-xl font-bold">면적 범위</Label>
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
                            value={filters.areaRange}
                            onValueChange={(value) =>
                              setRangeFilter(
                                "areaRange",
                                value as [number, number]
                              )
                            }
                            max={200}
                            min={0}
                            step={1}
                            disabled={!isLocationSelected}
                            className="w-full h-3"
                          />
                        </div>
                        <div className="flex items-center justify-between text-lg font-bold text-blue-700">
                          <span className="bg-blue-100 px-3 py-2 rounded-lg">
                            {filters.areaRange[0]}㎡
                          </span>
                          <span className="text-gray-400">~</span>
                          <span className="bg-blue-100 px-3 py-2 rounded-lg">
                            {filters.areaRange[1]}㎡
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-lg font-medium mb-3 block">
                            최소 (㎡)
                          </Label>
                          <Input
                            type="number"
                            value={filters.areaRange[0]}
                            onChange={(e) => {
                              const value =
                                Number.parseInt(e.target.value) || 0;
                              setRangeFilter("areaRange", [
                                value,
                                filters.areaRange[1],
                              ]);
                            }}
                            disabled={!isLocationSelected}
                            className="h-14 text-lg font-semibold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-lg font-medium mb-3 block">
                            최대 (㎡)
                          </Label>
                          <Input
                            type="number"
                            value={filters.areaRange[1]}
                            onChange={(e) => {
                              const value =
                                Number.parseInt(e.target.value) || 200;
                              setRangeFilter("areaRange", [
                                filters.areaRange[0],
                                value,
                              ]);
                            }}
                            disabled={!isLocationSelected}
                            className="h-14 text-lg font-semibold"
                            placeholder="200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. 건축년도 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-7 h-7 text-purple-600" />
                      <Label className="text-xl font-bold">건축년도</Label>
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
                            setRangeFilter(
                              "buildYear",
                              value as [number, number]
                            )
                          }
                          max={2024}
                          min={1980}
                          step={1}
                          disabled={!isLocationSelected}
                          className="w-full h-3"
                        />
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold text-purple-700">
                        <span className="bg-purple-100 px-3 py-2 rounded-lg">
                          {filters.buildYear[0]}년
                        </span>
                        <span className="text-gray-400">~</span>
                        <span className="bg-purple-100 px-3 py-2 rounded-lg">
                          {filters.buildYear[1]}년
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-medium mb-2 block">
                          시작년도
                        </Label>
                        <Input
                          type="number"
                          value={filters.buildYear[0]}
                          onChange={(e) => {
                            const value =
                              Number.parseInt(e.target.value) || 1980;
                            setRangeFilter("buildYear", [
                              value,
                              filters.buildYear[1],
                            ]);
                          }}
                          disabled={!isLocationSelected}
                          className="h-12 text-base font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-base font-medium mb-2 block">
                          종료년도
                        </Label>
                        <Input
                          type="number"
                          value={filters.buildYear[1]}
                          onChange={(e) => {
                            const value =
                              Number.parseInt(e.target.value) || 2024;
                            setRangeFilter("buildYear", [
                              filters.buildYear[0],
                              value,
                            ]);
                          }}
                          disabled={!isLocationSelected}
                          className="h-12 text-base font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. 층수, 엘리베이터 - 한 줄에 배치 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 층수 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xl font-bold">층수</Label>
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ 필터 미적용
                      </Badge>
                    </div>
                    <ButtonGroup
                      options={[
                        { value: "all", label: "전체" },
                        { value: "일반층", label: "일반층" },
                        { value: "지층", label: "지층" },
                        { value: "1층", label: "1층" },
                        { value: "탑층", label: "탑층" },
                        { value: "모름", label: "모름" },
                      ]}
                      value={filters.floor || "all"}
                      onChange={(value) => setFilter("floor", value)}
                      disabled={!isLocationSelected}
                    />
                    <p className="text-xs text-amber-600 mt-2 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />※ 층수 필터는
                      현재 백엔드에서 적용되지 않습니다 (표시만)
                    </p>
                  </div>

                  {/* 엘리베이터 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Elevator className="w-7 h-7 text-blue-600" />
                      <Label className="text-xl font-bold">엘리베이터</Label>
                    </div>
                    <ButtonGroup
                      options={[
                        { value: "all", label: "전체" },
                        { value: "있음", label: "있음" },
                        { value: "없음", label: "없음" },
                        { value: "모름", label: "모름" },
                      ]}
                      value={(filters as any).hasElevator || "all"}
                      onChange={(value) => setFilter("hasElevator", value)}
                      disabled={!isLocationSelected}
                    />
                  </div>
                </div>

                {/* 6. 키워드 검색 */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Search className="w-7 h-7 text-gray-600" />
                      <Label className="text-xl font-bold">키워드 검색</Label>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      선택사항
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="주소, 법원, 사건번호로 검색해보세요..."
                        disabled={!isLocationSelected}
                        className="w-full h-16 pl-14 pr-6 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={!isLocationSelected}
                      className="h-16 px-8 text-lg font-bold bg-green-600 hover:bg-green-700"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      검색하기
                    </Button>
                  </div>

                  {/* 미리보기 */}
                  {isLocationSelected && (
                    <div className="flex items-center justify-center space-x-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <Eye className="w-6 h-6 text-blue-600" />
                      <span className="text-lg font-semibold text-blue-800">
                        현재 조건으로 약{" "}
                        <span className="text-2xl font-bold">
                          {estimatedResults.toLocaleString()}
                        </span>
                        개의 매물이 검색됩니다
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

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
    </>
  );
}
