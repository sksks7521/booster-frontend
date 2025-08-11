"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import { useItemDetail } from "@/hooks/useItemDetail";
import { itemApi } from "@/lib/api";
import type { ComparablesResponse } from "@/lib/api";
import { InvestmentAnalysis } from "@/components/features/investment-analysis";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/data-state";
import { mapApiErrorToMessage } from "@/lib/errors";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Car,
  CableCarIcon as Elevator,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Download,
  Calculator,
  Phone,
} from "lucide-react";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = (params as any)?.id as string;

  // 새로 만든 커스텀 훅을 호출하여 데이터와 상태를 가져옵니다.
  const { property, isLoading, error, refetch, isRefreshing } =
    useItemDetail(itemId);

  // Comparables 실데이터(SWR) - 상세 진입 시 지연 로딩
  const {
    data: comparables,
    error: comparablesError,
    isLoading: isComparablesLoading,
  } = useSWR<ComparablesResponse>(
    itemId ? ["/api/v1/items/", itemId, "comparables"] : null,
    ([, id]) => itemApi.getComparables(Number(id))
  );

  // UI 상태는 그대로 유지합니다.
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // 사용자 정보
  const user = {
    email: "user@example.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  };

  const handleBack = () => {
    router.back();
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    navigator.share?.({
      title: property?.title,
      text: property?.description,
      url: window.location.href,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "경매예정", variant: "secondary" as const },
      ongoing: { label: "경매진행중", variant: "default" as const },
      completed: { label: "경매완료", variant: "outline" as const },
      cancelled: { label: "경매취소", variant: "destructive" as const },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.scheduled
    );
  };

  const getRiskBadge = (risk: string) => {
    const riskConfig = {
      low: {
        label: "낮음",
        variant: "secondary" as const,
        color: "text-green-600",
      },
      medium: {
        label: "보통",
        variant: "outline" as const,
        color: "text-yellow-600",
      },
      high: {
        label: "높음",
        variant: "destructive" as const,
        color: "text-red-600",
      },
    };
    return riskConfig[risk as keyof typeof riskConfig] || riskConfig.medium;
  };

  const getProfitabilityBadge = (profitability: string) => {
    const profitConfig = {
      excellent: {
        label: "우수",
        variant: "default" as const,
        color: "text-blue-600",
      },
      good: {
        label: "양호",
        variant: "secondary" as const,
        color: "text-green-600",
      },
      fair: {
        label: "보통",
        variant: "outline" as const,
        color: "text-yellow-600",
      },
      poor: {
        label: "주의",
        variant: "destructive" as const,
        color: "text-red-600",
      },
    };
    return (
      profitConfig[profitability as keyof typeof profitConfig] ||
      profitConfig.fair
    );
  };

  // 로딩 상태 처리
  if (isLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <LoadingState title="불러오는 중입니다..." />
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <ErrorState
            onRetry={refetch}
            retryText="다시 시도"
            title={mapApiErrorToMessage(error)}
          />
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <EmptyState onRetry={refetch} retryText="다시 불러오기" />
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(property.status);
  const riskBadge = getRiskBadge(
    property.investmentAnalysis?.riskLevel || "medium"
  );
  const profitabilityBadge = getProfitabilityBadge(
    property.investmentAnalysis?.profitability || "fair"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={handleFavorite}
            >
              <Heart
                className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`}
              />
              관심등록
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            {/* 물건 기본 정보 */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">
                      {property.title}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.address}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{property.area}㎡</span>
                      <span>{property.buildYear}년 건축</span>
                      <span>{property.floor}</span>
                    </div>
                  </div>
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {property.price.toLocaleString()}만원
                    </div>
                    <div className="text-sm text-gray-500">경매 시작가</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {property.estimatedValue?.toLocaleString()}만원
                    </div>
                    <div className="text-sm text-gray-500">감정가</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {property.investmentAnalysis?.expectedRoi}%
                    </div>
                    <div className="text-sm text-gray-500">예상 수익률</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {property.hasParking && (
                        <Car className="w-5 h-5 text-green-500" />
                      )}
                      {property.hasElevator && (
                        <Elevator className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">편의시설</div>
                  </div>
                </div>

                {property.description && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">물건 설명</h3>
                    <p className="text-gray-700">{property.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 이미지 갤러리 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>물건 사진</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {property.images?.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${property.title} 사진 ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 상세 정보 탭 */}
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="legal">법적정보</TabsTrigger>
                    <TabsTrigger value="building">건물정보</TabsTrigger>
                    <TabsTrigger value="location">위치정보</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">경매 일정</h3>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          {property.auctionDate} 10:00
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">물건 특징</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>면적: {property.area}㎡</div>
                          <div>건축년도: {property.buildYear}년</div>
                          <div>층수: {property.floor}</div>
                          <div>
                            엘리베이터: {property.hasElevator ? "있음" : "없음"}
                          </div>
                          <div>
                            주차장: {property.hasParking ? "있음" : "없음"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="legal" className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">사건번호:</span>
                          <span className="ml-2">
                            {property.legalInfo?.caseNumber}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">법원:</span>
                          <span className="ml-2">
                            {property.legalInfo?.court}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">경매구분:</span>
                          <span className="ml-2">
                            {property.legalInfo?.auctionType}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">최저입찰가:</span>
                          <span className="ml-2">
                            {property.legalInfo?.minimumBid.toLocaleString()}
                            만원
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">보증금:</span>
                          <span className="ml-2">
                            {property.legalInfo?.deposit.toLocaleString()}만원
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="building" className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">건물유형:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.buildingType}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">구조:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.structure}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">총 층수:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.totalFloors}층
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">대지면적:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.landArea}㎡
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">건물면적:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.buildingArea}㎡
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">주차대수:</span>
                          <span className="ml-2">
                            {property.buildingInfo?.parkingSpaces}대
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="p-6">
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-2" />
                          <p>지도 영역</p>
                          <p className="text-sm">실제 구현 시 지도 API 연동</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">주변 시설</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                          <div>• 지하철 2호선 역삼역 도보 5분</div>
                          <div>• 버스정류장 도보 2분</div>
                          <div>• 대형마트 도보 10분</div>
                          <div>• 초등학교 도보 8분</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 투자 분석(Comparables) 섹션 */}
            <div className="mt-6">
              <InvestmentAnalysis
                data={comparables ?? null}
                isLoading={isComparablesLoading}
                error={comparablesError}
                onRetry={() => void itemApi.getComparables(Number(itemId))}
              />
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 투자 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  투자 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">수익성</span>
                  <Badge variant={profitabilityBadge.variant}>
                    {profitabilityBadge.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">리스크</span>
                  <Badge variant={riskBadge.variant}>{riskBadge.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">예상 ROI</span>
                  <span className="font-bold text-green-600">
                    {property.investmentAnalysis?.expectedRoi}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 시장 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  시장 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">주변 평균가</span>
                  <span className="font-bold">
                    {property.marketAnalysis?.averagePrice.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">가격 변동</span>
                  <span
                    className={`font-bold ${
                      property.marketAnalysis?.priceChange &&
                      property.marketAnalysis.priceChange > 0
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {property.marketAnalysis?.priceChange}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">경쟁 물건</span>
                  <span className="font-bold">
                    {property.marketAnalysis?.competitiveProperties}개
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 추천사항 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  투자 추천사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {property.investmentAnalysis?.recommendations.map(
                    (rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                <Calculator className="w-4 h-4 mr-2" />
                수익률 계산하기
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                상세 자료 다운로드
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Phone className="w-4 h-4 mr-2" />
                전문가 상담 신청
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
