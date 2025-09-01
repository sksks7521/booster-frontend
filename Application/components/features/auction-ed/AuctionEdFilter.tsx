"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  ToggleLeft,
  ToggleRight,
  Eye,
  AlertTriangle,
} from "lucide-react";

import { useFilterStore } from "@/store/filterStore";
import { useSpecialRights } from "@/hooks/useSpecialRights";

interface AuctionEdFilterProps {
  className?: string;
}

export default function AuctionEdFilter({ className }: AuctionEdFilterProps) {
  const filters = useFilterStore((state) => state);
  const { setFilter, setPage } = useFilterStore();

  // 특수권리 동적 로딩
  const { specialRights, isLoading: isLoadingSpecialRights } = useSpecialRights(
    {
      address_area: (filters as any).province,
      address_city: (filters as any).cityDistrict,
    }
  );

  // UI 상태
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCurrentStatusCollapsed, setIsCurrentStatusCollapsed] =
    useState(true);
  const [isSpecialRightsCollapsed, setIsSpecialRightsCollapsed] =
    useState(true);
  const [salePriceInputMode, setSalePriceInputMode] = useState<
    "slider" | "input"
  >("input");
  const [buildingAreaInputMode, setBuildingAreaInputMode] = useState<
    "slider" | "input"
  >("input");
  const [landAreaInputMode, setLandAreaInputMode] = useState<
    "slider" | "input"
  >("input");
  const [buildYearInputMode, setBuildYearInputMode] = useState<
    "slider" | "input"
  >("input");

  // 검색 상태
  const [addressSearch, setAddressSearch] = useState("");
  const [caseNumberSearch, setCaseNumberSearch] = useState("");

  // 검색 핸들러
  const handleAddressSearch = () => {
    setFilter("searchField", addressSearch ? "address" : "all");
    setFilter("searchQuery", addressSearch);
    setPage(1);
  };

  const handleCaseNumberSearch = () => {
    setFilter("searchField", caseNumberSearch ? "case_number" : "all");
    setFilter("searchQuery", caseNumberSearch);
    setPage(1);
  };

  const handleClearAddressSearch = () => {
    setAddressSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPage(1);
  };

  const handleClearCaseNumberSearch = () => {
    setCaseNumberSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPage(1);
  };

  const handleClearSearch = () => {
    setAddressSearch("");
    setCaseNumberSearch("");
    setFilter("searchField", "all");
    setFilter("searchQuery", "");
    setPage(1);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <h3 className="text-lg font-semibold">필터</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
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
              onClick={() => {
                // TODO: 설정 초기화 기능 구현
                console.log("설정 초기화 클릭");
              }}
              className="text-xs"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              설정 초기화
            </Button>
          </div>

          {/* 매각기일 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">매각기일</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">시작일</Label>
                <Input
                  type="date"
                  value={filters.auctionDateFrom || ""}
                  onChange={(e) => {
                    setFilter("auctionDateFrom", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">종료일</Label>
                <Input
                  type="date"
                  value={filters.auctionDateTo || ""}
                  onChange={(e) => {
                    setFilter("auctionDateTo", e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 매각가 범위 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">
                  매각가 (만원)
                </Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSalePriceInputMode(
                    salePriceInputMode === "slider" ? "input" : "slider"
                  )
                }
                className="h-7 px-2 text-xs hover:scale-105 transition-transform"
              >
                {salePriceInputMode === "slider" ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
              </Button>
            </div>

            {salePriceInputMode === "slider" ? (
              <div className="space-y-6">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <Slider
                    value={filters.priceRange || [0, 100000]}
                    onValueChange={(value) =>
                      setFilter("priceRange", value as [number, number])
                    }
                    min={0}
                    max={100000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{filters.priceRange?.[0] || 0}만원</span>
                    <span>{filters.priceRange?.[1] || 100000}만원</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="최소 매각가"
                  value={filters.priceRange?.[0] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 0;
                    setFilter("priceRange", [
                      value,
                      filters.priceRange?.[1] || 100000,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="최대 매각가"
                  value={filters.priceRange?.[1] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 100000;
                    setFilter("priceRange", [
                      filters.priceRange?.[0] || 0,
                      value,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* 건축면적 범위 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">건축면적 (평)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBuildingAreaInputMode(
                    buildingAreaInputMode === "slider" ? "input" : "slider"
                  )
                }
                className="h-7 px-2 text-xs hover:scale-105 transition-transform"
              >
                {buildingAreaInputMode === "slider" ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
              </Button>
            </div>

            {buildingAreaInputMode === "slider" ? (
              <div className="space-y-6">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <Slider
                    value={filters.buildingAreaRange || [0, 100]}
                    onValueChange={(value) =>
                      setFilter("buildingAreaRange", value as [number, number])
                    }
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{filters.buildingAreaRange?.[0] || 0}평</span>
                    <span>{filters.buildingAreaRange?.[1] || 100}평</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="최소 (평)"
                  value={filters.buildingAreaRange?.[0] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 0;
                    setFilter("buildingAreaRange", [
                      value,
                      filters.buildingAreaRange?.[1] || 100,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="최대 (평)"
                  value={filters.buildingAreaRange?.[1] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 100;
                    setFilter("buildingAreaRange", [
                      filters.buildingAreaRange?.[0] || 0,
                      value,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* 토지면적 범위 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">토지면적 (평)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLandAreaInputMode(
                    landAreaInputMode === "slider" ? "input" : "slider"
                  )
                }
                className="h-7 px-2 text-xs hover:scale-105 transition-transform"
              >
                {landAreaInputMode === "slider" ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
              </Button>
            </div>

            {landAreaInputMode === "slider" ? (
              <div className="space-y-6">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <Slider
                    value={filters.landAreaRange || [0, 200]}
                    onValueChange={(value) =>
                      setFilter("landAreaRange", value as [number, number])
                    }
                    max={200}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{filters.landAreaRange?.[0] || 0}평</span>
                    <span>{filters.landAreaRange?.[1] || 200}평</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="최소 (평)"
                  value={filters.landAreaRange?.[0] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 0;
                    setFilter("landAreaRange", [
                      value,
                      filters.landAreaRange?.[1] || 200,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="최대 (평)"
                  value={filters.landAreaRange?.[1] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 200;
                    setFilter("landAreaRange", [
                      filters.landAreaRange?.[0] || 0,
                      value,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* 건축년도 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">건축년도</Label>
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
                    value={filters.buildYear || [1980, 2024]}
                    onValueChange={(value) =>
                      setFilter("buildYear", value as [number, number])
                    }
                    min={1980}
                    max={2024}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{filters.buildYear?.[0] || 1980}년</span>
                    <span>{filters.buildYear?.[1] || 2024}년</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="시작년도"
                  value={filters.buildYear?.[0] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 1980;
                    setFilter("buildYear", [
                      value,
                      filters.buildYear?.[1] || 2024,
                    ]);
                  }}
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="종료년도"
                  value={filters.buildYear?.[1] || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 2024;
                    setFilter("buildYear", [
                      filters.buildYear?.[0] || 1980,
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
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  !filters.floorConfirmation?.length
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
                const isActive = filters.floorConfirmation?.includes(
                  option.value
                );
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const current = filters.floorConfirmation || [];
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
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
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
              {[
                { value: undefined, label: "전체" },
                { value: true, label: "있음" },
                { value: false, label: "없음" },
              ].map((option) => {
                const isActive = filters.hasElevator === option.value;
                return (
                  <button
                    key={option.label}
                    onClick={() => setFilter("hasElevator", option.value)}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
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

          {/* 현재상태 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
                <button
                  onClick={() => setFilter("currentStatus", [])}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    !filters.currentStatus?.length
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  전체
                </button>
                {[
                  { value: "신건", label: "신건" },
                  { value: "유찰", label: "유찰" },
                  { value: "재진행", label: "재진행" },
                  { value: "변경", label: "변경" },
                  { value: "재매각", label: "재매각" },
                  { value: "취하", label: "취하" },
                  { value: "매각", label: "매각" },
                  { value: "잔금납부", label: "잔금납부" },
                  { value: "기각", label: "기각" },
                  { value: "각하", label: "각하" },
                  { value: "배당종결", label: "배당종결" },
                  { value: "기타", label: "기타" },
                  { value: "대금미납", label: "대금미납" },
                  { value: "미진행", label: "미진행" },
                  { value: "불허", label: "불허" },
                  { value: "항고", label: "항고" },
                  { value: "정지", label: "정지" },
                ].map((option) => {
                  const isActive = filters.currentStatus?.includes(
                    option.value
                  );
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const current = filters.currentStatus || [];
                        if (isActive) {
                          setFilter(
                            "currentStatus",
                            current.filter((v: string) => v !== option.value)
                          );
                        } else {
                          setFilter("currentStatus", [
                            ...current,
                            option.value,
                          ]);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
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
            )}
          </div>

          {/* 특수권리 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
              <>
                {isLoadingSpecialRights ? (
                  <div className="text-sm text-gray-500">
                    특수권리 로딩 중...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* 전체 버튼 */}
                    <button
                      onClick={() => {
                        setFilter("specialRights" as any, [] as any);
                      }}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        !Array.isArray((filters as any).specialRights) || 
                        ((filters as any).specialRights as string[]).length === 0
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      전체
                    </button>
                    {specialRights.map((right) => {
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
                          className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                            isActive
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {right}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 주소 검색 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">주소 검색</Label>
            <Input
              placeholder="주소를 입력하세요"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddressSearch}>
                검색
              </Button>
              {addressSearch && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearAddressSearch}
                >
                  검색해제
                </Button>
              )}
            </div>
          </div>

          {/* 사건번호 검색 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">사건번호 검색</Label>
            <Input
              placeholder="사건번호를 입력하세요"
              value={caseNumberSearch}
              onChange={(e) => setCaseNumberSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCaseNumberSearch()}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleCaseNumberSearch}>
                검색
              </Button>
              {caseNumberSearch && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearCaseNumberSearch}
                >
                  검색해제
                </Button>
              )}
            </div>
          </div>

          {/* 검색 초기화 */}
          {(addressSearch || caseNumberSearch) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSearch}
              className="w-full"
            >
              검색 초기화
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
