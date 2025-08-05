"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useFilterStore } from "@/store/filterStore"
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
  Car,
  CableCarIcon as Elevator,
  Gavel,
} from "lucide-react"

interface FilterControlProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function FilterControl({ isCollapsed, onToggleCollapse }: FilterControlProps) {
  // 스토어에서 상태와 액션을 직접 가져옵니다.
  const filters = useFilterStore((state) => state)
  const setFilter = useFilterStore((state) => state.setFilter)
  const setRangeFilter = useFilterStore((state) => state.setRangeFilter)
  const resetFilters = useFilterStore((state) => state.resetFilters)

  const [expandedSections, setExpandedSections] = useState({
    location: true,
    property: true,
    price: true,
    building: false,
    auction: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatPrice = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억`
    }
    return `${value.toLocaleString()}만`
  }

  const formatArea = (value: number) => {
    return `${value}㎡`
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.region) count++
    if (filters.buildingType) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000) count++
    if (filters.areaRange[0] > 0 || filters.areaRange[1] < 200) count++
    if (filters.buildYear[0] > 1980 || filters.buildYear[1] < 2024) count++
    if (filters.floor) count++
    if (filters.hasElevator) count++
    if (filters.hasParking) count++
    if (filters.auctionStatus) count++
    return count
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <CardTitle className="text-lg">필터</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              초기화
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="p-1">
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* 지역 필터 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("location")}>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <Label className="font-medium">지역</Label>
              </div>
              {expandedSections.location ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedSections.location && (
              <Select value={filters.region} onValueChange={(value) => setFilter("region", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="서울">서울특별시</SelectItem>
                  <SelectItem value="부산">부산광역시</SelectItem>
                  <SelectItem value="대구">대구광역시</SelectItem>
                  <SelectItem value="인천">인천광역시</SelectItem>
                  <SelectItem value="광주">광주광역시</SelectItem>
                  <SelectItem value="대전">대전광역시</SelectItem>
                  <SelectItem value="울산">울산광역시</SelectItem>
                  <SelectItem value="세종">세종특별자치시</SelectItem>
                  <SelectItem value="경기">경기도</SelectItem>
                  <SelectItem value="강원">강원도</SelectItem>
                  <SelectItem value="충북">충청북도</SelectItem>
                  <SelectItem value="충남">충청남도</SelectItem>
                  <SelectItem value="전북">전라북도</SelectItem>
                  <SelectItem value="전남">전라남도</SelectItem>
                  <SelectItem value="경북">경상북도</SelectItem>
                  <SelectItem value="경남">경상남도</SelectItem>
                  <SelectItem value="제주">제주특별자치도</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 건물 유형 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("property")}>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <Label className="font-medium">건물 유형</Label>
              </div>
              {expandedSections.property ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedSections.property && (
              <Select value={filters.buildingType} onValueChange={(value) => setFilter("buildingType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="건물 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="아파트">아파트</SelectItem>
                  <SelectItem value="빌라">빌라/연립</SelectItem>
                  <SelectItem value="단독주택">단독주택</SelectItem>
                  <SelectItem value="오피스텔">오피스텔</SelectItem>
                  <SelectItem value="상가">상가</SelectItem>
                  <SelectItem value="사무실">사무실</SelectItem>
                  <SelectItem value="토지">토지</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 가격 범위 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("price")}>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <Label className="font-medium">가격 범위</Label>
              </div>
              {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedSections.price && (
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setRangeFilter("priceRange", value as [number, number])}
                    max={500000}
                    min={0}
                    step={1000}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatPrice(filters.priceRange[0])}</span>
                  <span>{formatPrice(filters.priceRange[1])}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">최소 가격 (만원)</Label>
                    <Input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 0
                        setRangeFilter("priceRange", [value, filters.priceRange[1]])
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">최대 가격 (만원)</Label>
                    <Input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 500000
                        setRangeFilter("priceRange", [filters.priceRange[0], value])
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 면적 범위 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Ruler className="w-4 h-4" />
              <Label className="font-medium">면적 범위</Label>
            </div>
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={filters.areaRange}
                  onValueChange={(value) => setRangeFilter("areaRange", value as [number, number])}
                  max={200}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{formatArea(filters.areaRange[0])}</span>
                <span>{formatArea(filters.areaRange[1])}</span>
              </div>
            </div>
          </div>

          {/* 건축년도 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("building")}>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <Label className="font-medium">건축년도</Label>
              </div>
              {expandedSections.building ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedSections.building && (
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={filters.buildYear}
                    onValueChange={(value) => setRangeFilter("buildYear", value as [number, number])}
                    max={2024}
                    min={1980}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{filters.buildYear[0]}년</span>
                  <span>{filters.buildYear[1]}년</span>
                </div>
              </div>
            )}
          </div>

          {/* 층수 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <Label className="font-medium">층수</Label>
            </div>
            <Select value={filters.floor} onValueChange={(value) => setFilter("floor", value)}>
              <SelectTrigger>
                <SelectValue placeholder="층수를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="지하">지하</SelectItem>
                <SelectItem value="반지하">반지하</SelectItem>
                <SelectItem value="1층">1층</SelectItem>
                <SelectItem value="2층">2층</SelectItem>
                <SelectItem value="3층">3층</SelectItem>
                <SelectItem value="4층">4층</SelectItem>
                <SelectItem value="5층 이상">5층 이상</SelectItem>
                <SelectItem value="10층 이상">10층 이상</SelectItem>
                <SelectItem value="20층 이상">20층 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 편의시설 */}
          <div className="space-y-3">
            <Label className="font-medium">편의시설</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="elevator"
                  checked={filters.hasElevator}
                  onCheckedChange={(checked) => setFilter("hasElevator", checked)}
                />
                <Elevator className="w-4 h-4" />
                <Label htmlFor="elevator" className="text-sm">
                  엘리베이터
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parking"
                  checked={filters.hasParking}
                  onCheckedChange={(checked) => setFilter("hasParking", checked)}
                />
                <Car className="w-4 h-4" />
                <Label htmlFor="parking" className="text-sm">
                  주차장
                </Label>
              </div>
            </div>
          </div>

          {/* 경매 상태 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("auction")}>
              <div className="flex items-center space-x-2">
                <Gavel className="w-4 h-4" />
                <Label className="font-medium">경매 상태</Label>
              </div>
              {expandedSections.auction ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedSections.auction && (
              <Select value={filters.auctionStatus} onValueChange={(value) => setFilter("auctionStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="경매 상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="scheduled">경매예정</SelectItem>
                  <SelectItem value="ongoing">경매진행중</SelectItem>
                  <SelectItem value="completed">경매완료</SelectItem>
                  <SelectItem value="cancelled">경매취소</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
