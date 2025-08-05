"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/layout/header"
import FilterControl from "@/components/features/filter-control"
import SelectedFilterBar from "@/components/features/selected-filter-bar"
import ItemTable from "@/components/features/item-table"
import MapView from "@/components/features/map-view"
import { useFilterStore } from "@/store/filterStore"
import { Search, Map, List, Download, Bell } from "lucide-react"

export default function AnalysisPage() {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"table" | "map">("table")
  const [isLoading, setIsLoading] = useState(false)

  // 스토어에서 필터 상태를 직접 구독합니다.
  const filters = useFilterStore((state) => state)

  // 사용자 정보
  const user = {
    email: "user@example.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  }

  // 필터가 변경될 때마다 데이터를 다시 로드합니다.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // 실제로는 여기서 API를 호출하여 필터링된 데이터를 가져옵니다.
      console.log("Filters changed:", filters)

      // 모의 로딩 시간
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsLoading(false)
    }

    loadData()
  }, [filters])

  const handleSearch = () => {
    console.log("Search query:", searchQuery)
    // 검색 로직 구현
  }

  const handleExport = () => {
    console.log("Exporting data...")
    // 데이터 내보내기 로직 구현
  }

  const handleSetAlert = () => {
    console.log("Setting up alert...")
    // 알림 설정 로직 구현
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">매물 분석</h1>
            <p className="text-gray-600">AI 기반 분석으로 최적의 투자 기회를 찾아보세요</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button variant="outline" onClick={handleSetAlert}>
              <Bell className="w-4 h-4 mr-2" />
              알림 설정
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <FilterControl
              isCollapsed={isFilterCollapsed}
              onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 검색 바 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="주소, 법원, 사건번호로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch}>검색</Button>
                </div>
              </CardContent>
            </Card>

            {/* 선택된 필터 표시 */}
            <SelectedFilterBar />

            {/* 뷰 전환 및 결과 요약 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">검색 결과 {isLoading ? "로딩 중..." : "1,234건"}</CardTitle>
                  <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "table" | "map")}>
                    <TabsList>
                      <TabsTrigger value="table" className="flex items-center space-x-2">
                        <List className="w-4 h-4" />
                        <span>목록</span>
                      </TabsTrigger>
                      <TabsTrigger value="map" className="flex items-center space-x-2">
                        <Map className="w-4 h-4" />
                        <span>지도</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {activeView === "table" ? <ItemTable isLoading={isLoading} /> : <MapView isLoading={isLoading} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
