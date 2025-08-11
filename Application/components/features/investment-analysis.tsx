"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Building,
  DollarSign,
  Percent,
  Calendar,
  Users,
  Award,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
} from "lucide-react";
import type { ComparablesResponse } from "@/lib/api";

interface InvestmentAnalysisProps {
  data: ComparablesResponse | null;
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
}

export function InvestmentAnalysis({
  data,
  isLoading,
  error,
  onRetry,
}: InvestmentAnalysisProps) {
  const [selectedComparable, setSelectedComparable] = useState<number | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 animate-spin" />
              <CardTitle>투자 분석 데이터를 불러오는 중...</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>투자 분석 데이터 불러오기 실패</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            투자 분석 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              다시 시도
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const { baseItem, comparables, statistics, marketAnalysis } = data;

  const getInvestmentPotentialColor = (potential: string) => {
    switch (potential) {
      case "high":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriceGradeIcon = (grade: string) => {
    switch (grade) {
      case "below_average":
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case "above_average":
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriceGradeText = (grade: string) => {
    switch (grade) {
      case "below_average":
        return "시장 평균 이하 (투자 기회)";
      case "above_average":
        return "시장 평균 이상 (프리미엄)";
      default:
        return "시장 평균 수준";
    }
  };

  return (
    <div className="space-y-6">
      {/* 투자 종합 점수 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>투자 종합 분석</span>
          </CardTitle>
          <CardDescription>
            주변 {comparables.length}개 매물과의 비교 분석 결과입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 투자 잠재력 */}
            <div className="text-center">
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full border ${getInvestmentPotentialColor(
                  marketAnalysis.investmentPotential
                )}`}
              >
                <Award className="h-4 w-4 mr-2" />
                <span className="font-semibold capitalize">
                  {marketAnalysis.investmentPotential}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">투자 잠재력</p>
            </div>

            {/* 유동성 점수 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {marketAnalysis.liquidityScore}/10
              </div>
              <Progress
                value={marketAnalysis.liquidityScore * 10}
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-2">유동성 점수</p>
            </div>

            {/* 가격 등급 */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                {getPriceGradeIcon(marketAnalysis.priceGradeRelativeToMarket)}
                <span className="font-semibold">
                  {getPriceGradeText(marketAnalysis.priceGradeRelativeToMarket)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">시장 대비 가격</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="comparable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparable">유사 매물 비교</TabsTrigger>
          <TabsTrigger value="market">시장 통계</TabsTrigger>
          <TabsTrigger value="analysis">상세 분석</TabsTrigger>
        </TabsList>

        {/* 유사 매물 비교 탭 */}
        <TabsContent value="comparable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-green-600" />
                <span>유사 매물 {comparables.length}개</span>
              </CardTitle>
              <CardDescription>
                현재 매물과 유사한 조건의 주변 매물들과 비교분석입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparables.map((comparable, index) => (
                  <div
                    key={comparable.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedComparable === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() =>
                      setSelectedComparable(
                        selectedComparable === index ? null : index
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {comparable.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            유사도 {Math.round(comparable.similarity * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{comparable.address}</span>
                          <span>•</span>
                          <span>{comparable.distance}km</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">가격</span>
                            <div className="font-semibold">
                              {comparable.price.toLocaleString()}만원
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">면적</span>
                            <div className="font-semibold">
                              {comparable.area}㎡
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">㎡당 가격</span>
                            <div className="font-semibold">
                              {comparable.pricePerArea.toLocaleString()}만원
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">건축년도</span>
                            <div className="font-semibold">
                              {comparable.buildYear}년
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {comparable.price > baseItem.price ? (
                          <div className="flex items-center text-red-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="text-sm font-semibold">
                              +
                              {(
                                ((comparable.price - baseItem.price) /
                                  baseItem.price) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        ) : comparable.price < baseItem.price ? (
                          <div className="flex items-center text-green-600">
                            <TrendingDown className="h-4 w-4 mr-1" />
                            <span className="text-sm font-semibold">
                              {(
                                ((comparable.price - baseItem.price) /
                                  baseItem.price) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-600">
                            <Minus className="h-4 w-4 mr-1" />
                            <span className="text-sm font-semibold">동일</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시장 통계 탭 */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>가격 통계</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 가격</span>
                    <span className="font-semibold">
                      {statistics.averagePrice.toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">최저 가격</span>
                    <span className="font-semibold">
                      {statistics.priceRange.min.toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">최고 가격</span>
                    <span className="font-semibold">
                      {statistics.priceRange.max.toLocaleString()}만원
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">현재 매물</span>
                    <span className="font-bold text-blue-600">
                      {baseItem.price.toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">시장 대비</span>
                    <span
                      className={`font-semibold ${
                        baseItem.price < statistics.averagePrice
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {baseItem.price < statistics.averagePrice
                        ? "저평가"
                        : "고평가"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>면적당 가격</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 ㎡당 가격</span>
                    <span className="font-semibold">
                      {statistics.averagePricePerArea.toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">현재 매물</span>
                    <span className="font-bold text-blue-600">
                      {Math.round(
                        baseItem.price / baseItem.area
                      ).toLocaleString()}
                      만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">비교 매물 수</span>
                    <span className="font-semibold">
                      {statistics.totalCount}개
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 상세 분석 탭 */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>투자 분석 리포트</span>
              </CardTitle>
              <CardDescription>
                AI 기반 종합 투자 분석 결과입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 투자 강점 */}
                <div>
                  <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    투자 강점
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {baseItem.price < statistics.averagePrice && (
                      <li className="flex items-start">
                        <Star className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        시장 평균 대비{" "}
                        {Math.round(
                          (1 - baseItem.price / statistics.averagePrice) * 100
                        )}
                        % 저렴한 가격
                      </li>
                    )}
                    {marketAnalysis.liquidityScore >= 7 && (
                      <li className="flex items-start">
                        <Star className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        높은 유동성 점수 ({marketAnalysis.liquidityScore}/10)로
                        매매 용이성 우수
                      </li>
                    )}
                    {marketAnalysis.investmentPotential === "high" && (
                      <li className="flex items-start">
                        <Star className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        높은 투자 잠재력으로 향후 가치 상승 기대
                      </li>
                    )}
                    <li className="flex items-start">
                      <Star className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      주변 {comparables.length}개 유사 매물과의 비교 분석 완료
                    </li>
                  </ul>
                </div>

                {/* 주의사항 */}
                <div>
                  <h4 className="font-semibold text-orange-600 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    투자 시 주의사항
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {baseItem.price > statistics.averagePrice && (
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        시장 평균 대비{" "}
                        {Math.round(
                          (baseItem.price / statistics.averagePrice - 1) * 100
                        )}
                        % 높은 가격
                      </li>
                    )}
                    {marketAnalysis.liquidityScore < 5 && (
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        낮은 유동성 점수로 매매 시 어려움 예상
                      </li>
                    )}
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      실제 투자 전 현장 답사 및 법적 검토 필수
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      시장 상황 변동에 따른 가격 변동 가능성 고려
                    </li>
                  </ul>
                </div>

                {/* 추천 액션 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    추천 액션
                  </h4>
                  <p className="text-sm text-blue-700">
                    {marketAnalysis.investmentPotential === "high"
                      ? "높은 투자 잠재력을 보이는 매물입니다. 상세 실사 후 투자를 고려해보세요."
                      : marketAnalysis.investmentPotential === "medium"
                      ? "중간 정도의 투자 가치를 보입니다. 다른 대안과 비교 검토 후 결정하세요."
                      : "투자 위험이 높을 수 있습니다. 신중한 검토가 필요합니다."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
