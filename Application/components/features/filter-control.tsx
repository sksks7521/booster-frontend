"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ChevronUp, Filter } from "lucide-react"

interface FilterControlProps {
  onFilterChange: (filters: any) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function FilterControl({ onFilterChange, isCollapsed = false, onToggleCollapse }: FilterControlProps) {
  const [filters, setFilters] = useState({
    region: "",
    buildingType: "",
    priceRange: [0, 500000], // 만원 단위
    areaRange: [0, 200], // 평 단위
    buildYear: [1980, 2024],
    floor: "",
    hasElevator: false,
    hasParking: false,
    auctionStatus: "",
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="mb-4">
          <Filter className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">상세 필터</h2>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* 지역 선택 */}
          <div>
            <Label htmlFor="region" className="text-sm font-medium text-gray-700 mb-2 block">
              지역
            </Label>
            <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
              <SelectTrigger>
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seoul">서울특별시</SelectItem>
                <SelectItem value="gyeonggi">경기도</SelectItem>
                <SelectItem value="incheon">인천광역시</SelectItem>
                <SelectItem value="busan">부산광역시</SelectItem>
                <SelectItem value="daegu">대구광역시</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 건물 유형 */}
          <div>
            <Label htmlFor="buildingType" className="text-sm font-medium text-gray-700 mb-2 block">
              건물 유형
            </Label>
            <Select value={filters.buildingType} onValueChange={(value) => handleFilterChange("buildingType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="건물 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="villa">빌라</SelectItem>
                <SelectItem value="apartment">아파트</SelectItem>
                <SelectItem value="officetel">오피스텔</SelectItem>
                <SelectItem value="commercial">상가</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 가격 범위 */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">가격 범위 (만원)</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange("priceRange", value)}
                max={500000}
                min={0}
                step={1000}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{filters.priceRange[0].toLocaleString()}만원</span>
                <span>{filters.priceRange[1].toLocaleString()}만원</span>
              </div>
            </div>
          </div>

          {/* 면적 범위 */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">면적 범위 (평)</Label>
            <div className="px-2">
              <Slider
                value={filters.areaRange}
                onValueChange={(value) => handleFilterChange("areaRange", value)}
                max={200}
                min={0}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{filters.areaRange[0]}평</span>
                <span>{filters.areaRange[1]}평</span>
              </div>
            </div>
          </div>

          {/* 건축연도 */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">건축연도</Label>
            <div className="px-2">
              <Slider
                value={filters.buildYear}
                onValueChange={(value) => handleFilterChange("buildYear", value)}
                max={2024}
                min={1980}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{filters.buildYear[0]}년</span>
                <span>{filters.buildYear[1]}년</span>
              </div>
            </div>
          </div>

          {/* 층수 */}
          <div>
            <Label htmlFor="floor" className="text-sm font-medium text-gray-700 mb-2 block">
              층수
            </Label>
            <Select value={filters.floor} onValueChange={(value) => handleFilterChange("floor", value)}>
              <SelectTrigger>
                <SelectValue placeholder="층수를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basement">지하</SelectItem>
                <SelectItem value="1-3">1-3층</SelectItem>
                <SelectItem value="4-6">4-6층</SelectItem>
                <SelectItem value="7-10">7-10층</SelectItem>
                <SelectItem value="11+">11층 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 부대시설 */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">부대시설</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="elevator"
                  checked={filters.hasElevator}
                  onCheckedChange={(checked) => handleFilterChange("hasElevator", checked)}
                />
                <Label htmlFor="elevator" className="text-sm text-gray-600">
                  엘리베이터
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parking"
                  checked={filters.hasParking}
                  onCheckedChange={(checked) => handleFilterChange("hasParking", checked)}
                />
                <Label htmlFor="parking" className="text-sm text-gray-600">
                  주차장
                </Label>
              </div>
            </div>
          </div>

          {/* 경매 상태 */}
          <div>
            <Label htmlFor="auctionStatus" className="text-sm font-medium text-gray-700 mb-2 block">
              경매 상태
            </Label>
            <Select value={filters.auctionStatus} onValueChange={(value) => handleFilterChange("auctionStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="경매 상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">경매 예정</SelectItem>
                <SelectItem value="ongoing">경매 진행중</SelectItem>
                <SelectItem value="completed">경매 완료</SelectItem>
                <SelectItem value="cancelled">경매 취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 필터 초기화 버튼 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              const resetFilters = {
                region: "",
                buildingType: "",
                priceRange: [0, 500000],
                areaRange: [0, 200],
                buildYear: [1980, 2024],
                floor: "",
                hasElevator: false,
                hasParking: false,
                auctionStatus: "",
              }
              setFilters(resetFilters)
              onFilterChange(resetFilters)
            }}
          >
            필터 초기화
          </Button>
        </div>
      </div>
    </div>
  )
}
