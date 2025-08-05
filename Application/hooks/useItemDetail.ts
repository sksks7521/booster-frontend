import useSWR from "swr"

// PropertyDetail 타입 정의
interface PropertyDetail {
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
  description?: string
  images?: string[]
  legalInfo?: {
    caseNumber: string
    court: string
    auctionType: string
    minimumBid: number
    deposit: number
  }
  buildingInfo?: {
    totalFloors: number
    buildingType: string
    structure: string
    landArea: number
    buildingArea: number
    parkingSpaces: number
  }
  marketAnalysis?: {
    averagePrice: number
    priceChange: number
    marketTrend: "up" | "down" | "stable"
    competitiveProperties: number
  }
  investmentAnalysis?: {
    expectedRoi: number
    riskLevel: "low" | "medium" | "high"
    profitability: "excellent" | "good" | "fair" | "poor"
    recommendations: string[]
  }
}

// 모의 데이터 (기존 page.tsx에서 가져옴)
const mockPropertyDetail: Omit<PropertyDetail, "id"> = {
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
  description:
    "강남 핵심지역에 위치한 투자가치가 높은 빌라입니다. 교통이 편리하고 주변 상권이 발달되어 있어 임대 수요가 안정적입니다.",
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  legalInfo: {
    caseNumber: "2024타경12345",
    court: "서울중앙지방법원",
    auctionType: "강제경매",
    minimumBid: 45000,
    deposit: 4500,
  },
  buildingInfo: {
    totalFloors: 4,
    buildingType: "다세대주택",
    structure: "철근콘크리트",
    landArea: 120,
    buildingArea: 100,
    parkingSpaces: 1,
  },
  marketAnalysis: {
    averagePrice: 48000,
    priceChange: -6.25,
    marketTrend: "down",
    competitiveProperties: 8,
  },
  investmentAnalysis: {
    expectedRoi: 8.5,
    riskLevel: "medium",
    profitability: "good",
    recommendations: [
      "시장가 대비 할인된 가격으로 투자 매력도 높음",
      "강남권 위치로 안정적인 임대 수요 예상",
      "리모델링 후 임대료 상승 가능성 있음",
      "주변 재개발 계획 확인 필요",
    ],
  },
}

/**
 * 실제 API가 없는 동안 모의 데이터를 반환하는 '가짜 fetcher' 함수입니다.
 * @param _ - SWR 키 (사용하지 않음)
 * @param itemId - 상세 정보를 가져올 아이템 ID
 */
const mockFetcher = async ([_, itemId]: [string, string]): Promise<PropertyDetail> => {
  console.log(`[Mock Fetch] Fetching details for item: ${itemId}`)

  // 실제 네트워크 요청을 시뮬레이션하기 위해 1초의 딜레이를 줍니다.
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 실제 API가 있다면, 여기서 fetch(`/api/v1/items/${itemId}`)를 호출합니다.
  // 지금은 모의 데이터에 id를 결합하여 반환합니다.
  return {
    id: itemId,
    ...mockPropertyDetail,
  }
}

/**
 * 특정 매물의 상세 정보를 가져오는 커스텀 훅입니다.
 * @param itemId - 정보를 조회할 매물의 ID
 */
export function useItemDetail(itemId: string | null) {
  // SWR 키는 API 엔드포인트와 파라미터를 배열로 구성하는 것이 일반적입니다.
  const swrKey = itemId ? [`/api/v1/items/`, itemId] : null

  const { data, error, isLoading } = useSWR<PropertyDetail>(swrKey, mockFetcher)

  return {
    property: data,
    isLoading,
    error,
  }
}

// PropertyDetail 타입을 다른 곳에서도 사용할 수 있도록 export
export type { PropertyDetail }
