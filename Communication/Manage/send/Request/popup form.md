"use client"

// ============================================================================
// 매물 상세 정보 팝업 - 완전한 컴포넌트
// ============================================================================
// 이 파일은 매물 상세 정보를 표시하는 팝업 컴포넌트입니다.
// 다른 웹 애플리케이션에서 바로 사용할 수 있도록 모든 필요한 코드를 포함합니다.
//
// 필요한 의존성:
// - @/components/ui/\* (shadcn/ui 컴포넌트들)
// - lucide-react (아이콘)
// - React hooks (useState)
// ============================================================================

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
Heart,
MapPin,
Building,
Ruler,
DollarSign,
Info,
X,
Share2,
FileText,
Calendar,
Home,
Layers,
} from "lucide-react"
import { useState } from "react"

// ============================================================================
// 타입 정의 - 매물 상세 데이터 인터페이스
// ============================================================================
interface PropertyDetailData {
id: string
title: string

// 기본 정보
usage: string // 용도
caseNumber: string // 사건
roadAddress: string // 도로명주소
locationAddress: string // 소재지(주택이름)
buildingArea: number // 건물평형
landArea: number // 토지평형

// 가격 정보
appraisalValue: number // 감정가(만원)
minimumPrice: number // 최저가(만원)
priceRatio: number // 최저가/감정가(%)
publicPriceRatio: number // 최저가/공시가격
publicPrice: number // 공시가격(만원)
under100Million: boolean // 1억 이하 여부

// 상태 및 일정
currentStatus: string // 현재상태
saleDate: string // 매각기일

// 위치 정보
location: string // 소재지
postalCode: string // 우편번호
pnu: string // PNU
longitude: number
latitude: number

// 건물 상세 정보
buildingName: string // 건물명
dongName: string // 동명
landSize: number // 대지면적(㎡)
buildingSize: number // 건축면적(㎡)
totalFloorArea: number // 연면적(㎡)
buildingCoverageRatio: number // 건폐율(%)
floorAreaRatio: number // 용적률(%)
mainStructure: string // 주구조
mainPurpose: string // 주용도
otherPurpose: string // 기타용도
height: number // 높이
groundFloors: number // 지상층수
undergroundFloors: number // 지하층수
households: number // 세대수
units: number // 가구수
roomNumber: string // 호수

// 기타 정보
approvalDate: string // 사용승인일
elevators: number // 승용승강기(대)
constructionYear: number // 건축연도
floorConfirm: string // 층확인
hasElevator: boolean // Elevator여부
specialRights: string // 특수권리
floors: string // 층수
}

// ============================================================================
// Props 인터페이스 정의
// ============================================================================
interface PropertyDetailPopupProps {
isOpen: boolean
onClose: () => void
property: PropertyDetailData | null
onToggleFavorite?: (propertyId: string) => void
isFavorite?: boolean
}

// ============================================================================
// 샘플 데이터 - 실제 사용 시에는 API에서 가져올 데이터
// ============================================================================
const samplePropertyData: PropertyDetailData = {
id: "PROP_2024_001",
title: "서울시 강남구 역삼동 래미안아파트 1501호",
usage: "공동주택",
caseNumber: "2024타경12345",
roadAddress: "서울특별시 강남구 테헤란로 123",
locationAddress: "서울특별시 강남구 역삼동 123-45 (래미안아파트)",
buildingArea: 32.5,
landArea: 8.2,
appraisalValue: 85000,
minimumPrice: 68000,
priceRatio: 80.0,
publicPriceRatio: 1.2,
publicPrice: 56667,
under100Million: true,
currentStatus: "진행중",
saleDate: "2024-03-15",
location: "서울특별시 강남구 역삼동",
postalCode: "06234",
pnu: "1168010100101230045",
longitude: 127.0276,
latitude: 37.5013,
buildingName: "래미안아파트",
dongName: "101동",
landSize: 2847.5,
buildingSize: 1423.8,
totalFloorArea: 42714.0,
buildingCoverageRatio: 50.0,
floorAreaRatio: 1500.0,
mainStructure: "철근콘크리트구조",
mainPurpose: "공동주택",
otherPurpose: "부대복리시설",
height: 45.6,
groundFloors: 15,
undergroundFloors: 2,
households: 300,
units: 300,
roomNumber: "1501호",
approvalDate: "2018-12-15",
elevators: 2,
constructionYear: 2018,
floorConfirm: "15층",
hasElevator: true,
specialRights: "없음",
floors: "15층",
}

// ============================================================================
// 메인 컴포넌트 - 매물 상세 정보 팝업
// ============================================================================
export default function PropertyDetailPopup({
isOpen,
onClose,
property = samplePropertyData, // 기본값으로 샘플 데이터 사용
onToggleFavorite,
isFavorite = false,
}: PropertyDetailPopupProps) {
const [isSharing, setIsSharing] = useState(false)

if (!property) return null

// ============================================================================
// 유틸리티 함수들
// ============================================================================
const formatCurrency = (amount: number) => {
return new Intl.NumberFormat("ko-KR").format(amount)
}

const formatNumber = (num: number) => {
return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(num)
}

const getStatusBadgeColor = (status: string) => {
switch (status) {
case "진행중":
return "bg-green-100 text-green-800 border-green-200"
case "예정":
return "bg-blue-100 text-blue-800 border-blue-200"
case "완료":
return "bg-gray-100 text-gray-800 border-gray-200"
case "취소":
return "bg-red-100 text-red-800 border-red-200"
default:
return "bg-gray-100 text-gray-800 border-gray-200"
}
}

// ============================================================================
// 이벤트 핸들러들
// ============================================================================
const handleShare = async () => {
setIsSharing(true)
try {
if (navigator.share) {
await navigator.share({
title: property.title,
text: `${property.title} - 최저가 ${formatCurrency(property.minimumPrice)}만원`,
url: window.location.href,
})
} else {
// 폴백: 클립보드에 복사
await navigator.clipboard.writeText(window.location.href)
alert("링크가 클립보드에 복사되었습니다.")
}
} catch (error) {
console.error("공유 실패:", error)
} finally {
setIsSharing(false)
}
}

const handlePrint = () => {
window.print()
}

const handleDetailView = () => {
window.open(`/analysis/${property.id}`, "\_blank")
}

// ============================================================================
// 컴포넌트 렌더링
// ============================================================================
return (
<Dialog open={isOpen} onOpenChange={onClose}>
<DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
{/_ ============================================================================ _/}
{/_ 헤더 섹션 _/}
{/_ ============================================================================ _/}
<DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
<div className="flex-1 pr-4">
<DialogTitle className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{property.title}</DialogTitle>
<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
<span className="flex items-center">
<MapPin className="w-4 h-4 mr-1" />
{property.location}
</span>
<span className="flex items-center">
<FileText className="w-4 h-4 mr-1" />
사건번호: {property.caseNumber}
</span>
<span className="flex items-center">
<Calendar className="w-4 h-4 mr-1" />
매각기일: {property.saleDate}
</span>
</div>
</div>
<div className="flex items-center space-x-2">
<Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className="text-gray-600 hover:text-gray-900"
            >
<Share2 className="w-5 h-5" />
</Button>
<Button variant="ghost" size="sm" onClick={handlePrint} className="text-gray-600 hover:text-gray-900">
<FileText className="w-5 h-5" />
</Button>
{onToggleFavorite && (
<Button
variant="ghost"
size="sm"
onClick={() => onToggleFavorite(property.id)}
className={isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"} >
<Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
</Button>
)}
<Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900">
<X className="w-5 h-5" />
</Button>
</div>
</DialogHeader>

        {/* ============================================================================ */}
        {/* 가격 하이라이트 섹션 */}
        {/* ============================================================================ */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">감정가</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(property.appraisalValue)}만원</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">최저가</p>
              <p className="text-4xl font-bold text-red-600">{formatCurrency(property.minimumPrice)}만원</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">할인율</p>
              <p className="text-3xl font-bold text-green-600">{(100 - property.priceRatio).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">현재상태</p>
              <Badge className={`text-lg px-4 py-2 ${getStatusBadgeColor(property.currentStatus)}`}>
                {property.currentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* 메인 정보 그리드 */}
        {/* ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 기본 정보 카드 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <span>기본 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">용도</span>
                  <span className="text-sm font-semibold bg-blue-50 px-3 py-1 rounded-full">{property.usage}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">사건번호</span>
                  <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">{property.caseNumber}</span>
                </div>
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600 block mb-2">도로명주소</span>
                  <span className="text-sm leading-relaxed">{property.roadAddress}</span>
                </div>
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600 block mb-2">소재지</span>
                  <span className="text-sm leading-relaxed">{property.locationAddress}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">우편번호</span>
                  <span className="text-sm font-mono">{property.postalCode}</span>
                </div>
                <div className="py-3">
                  <span className="text-sm font-medium text-gray-600 block mb-2">PNU</span>
                  <span className="text-xs font-mono bg-gray-100 px-3 py-2 rounded break-all">{property.pnu}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 가격 상세 정보 카드 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span>가격 상세</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">감정가</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(property.appraisalValue)}만원</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">최저가</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(property.minimumPrice)}만원</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">최저가/감정가</span>
                  <span className="text-sm font-semibold bg-orange-50 px-3 py-1 rounded-full">
                    {property.priceRatio}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">공시가격</span>
                  <span className="text-sm font-semibold">{formatCurrency(property.publicPrice)}만원</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">최저가/공시가격</span>
                  <span className="text-sm font-semibold">{property.publicPriceRatio}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-gray-600">1억 이하 여부</span>
                  <Badge variant={property.under100Million ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {property.under100Million ? "해당" : "비해당"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 면적 정보 카드 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ruler className="w-6 h-6 text-purple-600" />
                </div>
                <span>면적 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2">건물평형</p>
                  <p className="text-2xl font-bold text-blue-700">{formatNumber(property.buildingArea)}평</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2">토지평형</p>
                  <p className="text-2xl font-bold text-green-700">{formatNumber(property.landArea)}평</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">대지면적</span>
                  <span className="text-sm font-semibold">{formatCurrency(property.landSize)}㎡</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">건축면적</span>
                  <span className="text-sm font-semibold">{formatCurrency(property.buildingSize)}㎡</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">연면적</span>
                  <span className="text-sm font-semibold">{formatCurrency(property.totalFloorArea)}㎡</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">건폐율</span>
                  <span className="text-sm font-semibold text-orange-600">{property.buildingCoverageRatio}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">용적률</span>
                  <span className="text-sm font-semibold text-purple-600">{property.floorAreaRatio}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================================ */}
        {/* 건물 정보 섹션 */}
        {/* ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* 건물 기본 정보 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building className="w-6 h-6 text-orange-600" />
                </div>
                <span>건물 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">건물명</span>
                  <span className="text-sm font-semibold">{property.buildingName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">동명</span>
                  <span className="text-sm font-semibold">{property.dongName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">호수</span>
                  <span className="text-sm font-semibold text-blue-600">{property.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">건축연도</span>
                  <span className="text-sm font-semibold">{property.constructionYear}년</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">주구조</span>
                  <span className="text-sm">{property.mainStructure}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">주용도</span>
                  <span className="text-sm">{property.mainPurpose}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">기타용도</span>
                  <span className="text-sm">{property.otherPurpose}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-gray-600">높이</span>
                  <span className="text-sm font-semibold">{property.height}m</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 층수 및 시설 정보 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Layers className="w-6 h-6 text-indigo-600" />
                </div>
                <span>층수 및 시설</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">지상층수</p>
                  <p className="text-3xl font-bold text-blue-600">{property.groundFloors}층</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">지하층수</p>
                  <p className="text-3xl font-bold text-red-600">{property.undergroundFloors}층</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">세대수</p>
                  <p className="text-3xl font-bold text-green-600">{property.households}세대</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">가구수</p>
                  <p className="text-3xl font-bold text-purple-600">{property.units}가구</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">승용승강기</span>
                  <span className="text-sm font-semibold">{property.elevators}대</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">엘리베이터</span>
                  <Badge variant={property.hasElevator ? "default" : "secondary"}>
                    {property.hasElevator ? "있음" : "없음"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">층확인</span>
                  <span className="text-sm font-semibold">{property.floorConfirm}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================================ */}
        {/* 기타 정보 섹션 */}
        {/* ============================================================================ */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 mt-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Home className="w-6 h-6 text-gray-600" />
              </div>
              <span>기타 정보</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">사용승인일</span>
                <span className="text-sm font-semibold">{property.approvalDate}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">특수권리</span>
                <span className="text-sm">{property.specialRights}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">층수</span>
                <span className="text-sm font-semibold">{property.floors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* ============================================================================ */}
        {/* 하단 액션 및 좌표 정보 */}
        {/* ============================================================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
            <MapPin className="w-4 h-4" />
            <span>
              위도: {property.latitude}, 경도: {property.longitude}
            </span>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="px-6 bg-transparent">
              닫기
            </Button>
            <Button onClick={handleDetailView} className="bg-blue-600 hover:bg-blue-700 px-6">
              상세 분석 보기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

)
}

// ============================================================================
// 사용 예시 컴포넌트 - 실제 구현 시 참고용
// ============================================================================
export function PropertyDetailPopupExample() {
const [isOpen, setIsOpen] = useState(false)
const [isFavorite, setIsFavorite] = useState(false)

const handleToggleFavorite = (propertyId: string) => {
setIsFavorite(!isFavorite)
console.log(`Property ${propertyId} favorite toggled:`, !isFavorite)
// 실제 구현 시 여기에 API 호출 로직 추가
}

return (
<div className="p-8 space-y-4">
<h2 className="text-2xl font-bold mb-4">매물 상세 정보 팝업 예시</h2>
<p className="text-gray-600 mb-6">아래 버튼을 클릭하면 매물 상세 정보 팝업이 표시됩니다.</p>

      <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700">
        매물 상세 정보 보기
      </Button>

      <PropertyDetailPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        property={samplePropertyData}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
      />
    </div>

)
}

// ============================================================================
// 사용 방법 및 설치 가이드 (주석)
// ============================================================================
/\*
사용 방법:

1. 필요한 의존성 설치:
   npm install lucide-react
2. shadcn/ui 컴포넌트 설치:
   npx shadcn@latest add dialog button badge card separator

3. 컴포넌트 import 및 사용:
   import PropertyDetailPopup from './components/features/property-detail-popup-complete'

   <PropertyDetailPopup
   isOpen={isPopupOpen}
   onClose={() => setIsPopupOpen(false)}
   property={propertyData}
   onToggleFavorite={handleFavoriteToggle}
   isFavorite={isFavorite}
   />

4. 데이터 구조:
   PropertyDetailData 인터페이스에 맞는 데이터를 전달하세요.
   샘플 데이터(samplePropertyData)를 참고하여 실제 API 데이터를 구성하세요.

5. 커스터마이징:
   - 색상: Tailwind CSS 클래스를 수정하여 브랜드 색상에 맞게 조정
   - 레이아웃: 그리드 구조를 수정하여 원하는 레이아웃으로 변경
   - 기능: 필요에 따라 추가 버튼이나 기능을 구현

주의사항:

- Next.js 13+ App Router 환경에서 사용하도록 설계됨
- "use client" 지시어가 필요한 클라이언트 컴포넌트
- 반응형 디자인으로 모바일/태블릿/데스크톱 모두 지원
  \*/
