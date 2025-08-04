"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/header"
import FilterControl from "@/components/features/filter-control"
import SelectedFilterBar from "@/components/features/selected-filter-bar"
import MapView from "@/components/features/map-view"
import ItemTable from "@/components/features/item-table"
import { LayoutGrid, Map, SplitSquareHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

interface PropertyItem {
  id: string
  title: string
  address: string
  price: number
  area: number
  buildYear: number
  lat: number
  lng: number
  auctionDate?: string
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
  floor?: string
  hasElevator?: boolean
  hasParking?: boolean
  estimatedValue?: number
}

type ViewMode = "map" | "table" | "split"

export default function AnalysisPage() {
  const [filters, setFilters] = useState({})
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [selectedItem, setSelectedItem] = useState<PropertyItem | null>(null)
  const [favoriteItems, setFavoriteItems] = useState<string[]>([])
  const [items, setItems] = useState<PropertyItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 모의 데이터
  const mockItems: PropertyItem[] = [
    {
      id: "1",
      title: "서울 강남구 역삼동 빌라",
      address: "서울특별시 강남구 역삼동 123-45",
      price: 45000,
      area: 25,
      buildYear: 2010,
      lat: 37.5,
      lng: 127.03,
      auctionDate: "2024-02-15",
      status: "scheduled",
      floor: "3층",
      hasElevator: true,
      hasParking: true,
      estimatedValue: 52000,
    },
    {
      id: "2",
      title: "서울 서초구 서초동 빌라",
      address: "서울특별시 서초구 서초동 678-90",
      price: 38000,
      area: 22,
      buildYear: 2008,
      lat: 37.49,
      lng: 127.02,
      auctionDate: "2024-02-20",
      status: "ongoing",
      floor: "2층",
      hasElevator: false,
      hasParking: true,
      estimatedValue: 42000,
    },
    {
      id: "3",
      title: "서울 송파구 잠실동 빌라",
      address: "서울특별시 송파구 잠실동 111-22",
      price: 35000,
      area: 28,
      buildYear: 2012,
      lat: 37.51,
      lng: 127.08,
      auctionDate: "2024-01-30",
      status: "completed",
      floor: "4층",
      hasElevator: true,
      hasParking: false,
      estimatedValue: 39000,
    },
  ]

  // 사용자 정보 (실제로는 인증 상태에서 가져옴)
  const user = {
    email: "user@example.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  }

  useEffect(() => {
    // 필터 변경 시 데이터 로딩 시뮬레이션
    setLoading(true)
    setTimeout(() => {
      setItems(mockItems)
      setLoading(false)
    }, 500)
  }, [filters])

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters }
    if (key === "priceRange") {
      newFilters[key] = [0, 500000]
    } else if (key === "areaRange") {
      newFilters[key] = [0, 200]
    } else if (key === "buildYear") {
      newFilters[key] = [1980, 2024]
    } else if (key === "hasElevator" || key === "hasParking") {
      newFilters[key] = false
    } else {
      newFilters[key] = ""
    }
    setFilters(newFilters)
  }

  const handleClearAllFilters = () => {
    setFilters({
      region: "",
      buildingType: "",
      priceRange: [0, 500000],
      areaRange: [0, 200],
      buildYear: [1980, 2024],
      floor: "",
      hasElevator: false,
      hasParking: false,
      auctionStatus: "",
    })
  }

  const handleItemSelect = (item: PropertyItem) => {
    setSelectedItem(item)
    // 상세 페이지로 이동
    router.push(`/analysis/${item.id}`)
  }

  const handleItemFavorite = (itemId: string) => {
    setFavoriteItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 필터 패널 */}
        <FilterControl
          onFilterChange={handleFilterChange}
          isCollapsed={isFilterCollapsed}
          onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col">
          {/* 필터 바 */}
          <SelectedFilterBar filters={filters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} />

          {/* 뷰 모드 컨트롤 */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">총 {items.length}개 물건</span>
                {loading && <div className="text-sm text-gray-500">로딩 중...</div>}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="w-4 h-4 mr-2" />
                  지도
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  목록
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("split")}
                >
                  <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                  분할
                </Button>
              </div>
            </div>
          </div>

          {/* 메인 뷰 */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "map" && (
              <MapView items={items} selectedItem={selectedItem} onItemSelect={handleItemSelect} />
            )}

            {viewMode === "table" && (
              <div className="h-full overflow-auto p-4">
                <ItemTable
                  items={items}
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                  onItemFavorite={handleItemFavorite}
                  favoriteItems={favoriteItems}
                />
              </div>
            )}

            {viewMode === "split" && (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <MapView items={items} selectedItem={selectedItem} onItemSelect={handleItemSelect} />
                </div>
                <div className="h-80 border-t border-gray-200 overflow-auto p-4">
                  <ItemTable
                    items={items}
                    selectedItem={selectedItem}
                    onItemSelect={handleItemSelect}
                    onItemFavorite={handleItemFavorite}
                    favoriteItems={favoriteItems}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
