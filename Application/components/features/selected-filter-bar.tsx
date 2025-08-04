"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FilterTag {
  key: string
  label: string
  value: any
}

interface SelectedFilterBarProps {
  filters: any
  onRemoveFilter: (key: string) => void
  onClearAll: () => void
}

export default function SelectedFilterBar({ filters, onRemoveFilter, onClearAll }: SelectedFilterBarProps) {
  const getFilterTags = (): FilterTag[] => {
    const tags: FilterTag[] = []

    if (filters.region) {
      const regionLabels: { [key: string]: string } = {
        seoul: "서울특별시",
        gyeonggi: "경기도",
        incheon: "인천광역시",
        busan: "부산광역시",
        daegu: "대구광역시",
      }
      tags.push({
        key: "region",
        label: regionLabels[filters.region] || filters.region,
        value: filters.region,
      })
    }

    if (filters.buildingType) {
      const typeLabels: { [key: string]: string } = {
        villa: "빌라",
        apartment: "아파트",
        officetel: "오피스텔",
        commercial: "상가",
      }
      tags.push({
        key: "buildingType",
        label: typeLabels[filters.buildingType] || filters.buildingType,
        value: filters.buildingType,
      })
    }

    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000)) {
      tags.push({
        key: "priceRange",
        label: `${filters.priceRange[0].toLocaleString()}-${filters.priceRange[1].toLocaleString()}만원`,
        value: filters.priceRange,
      })
    }

    if (filters.areaRange && (filters.areaRange[0] > 0 || filters.areaRange[1] < 200)) {
      tags.push({
        key: "areaRange",
        label: `${filters.areaRange[0]}-${filters.areaRange[1]}평`,
        value: filters.areaRange,
      })
    }

    if (filters.buildYear && (filters.buildYear[0] > 1980 || filters.buildYear[1] < 2024)) {
      tags.push({
        key: "buildYear",
        label: `${filters.buildYear[0]}-${filters.buildYear[1]}년`,
        value: filters.buildYear,
      })
    }

    if (filters.floor) {
      const floorLabels: { [key: string]: string } = {
        basement: "지하",
        "1-3": "1-3층",
        "4-6": "4-6층",
        "7-10": "7-10층",
        "11+": "11층 이상",
      }
      tags.push({
        key: "floor",
        label: floorLabels[filters.floor] || filters.floor,
        value: filters.floor,
      })
    }

    if (filters.hasElevator) {
      tags.push({
        key: "hasElevator",
        label: "엘리베이터",
        value: filters.hasElevator,
      })
    }

    if (filters.hasParking) {
      tags.push({
        key: "hasParking",
        label: "주차장",
        value: filters.hasParking,
      })
    }

    if (filters.auctionStatus) {
      const statusLabels: { [key: string]: string } = {
        scheduled: "경매 예정",
        ongoing: "경매 진행중",
        completed: "경매 완료",
        cancelled: "경매 취소",
      }
      tags.push({
        key: "auctionStatus",
        label: statusLabels[filters.auctionStatus] || filters.auctionStatus,
        value: filters.auctionStatus,
      })
    }

    return tags
  }

  const filterTags = getFilterTags()

  if (filterTags.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">적용된 필터:</span>
          <div className="flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <div
                key={tag.key}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {tag.label}
                <button onClick={() => onRemoveFilter(tag.key)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-gray-500 hover:text-gray-700">
          전체 해제
        </Button>
      </div>
    </div>
  )
}
