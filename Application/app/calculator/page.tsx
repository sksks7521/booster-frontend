"use client";

export const metadata = {
  title: "수익률 계산기",
  description: "매입가·임대·비용·대출 조건으로 투자 수익률을 계산하세요.",
  alternates: { canonical: "/calculator" },
  robots: { index: false, follow: false },
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Home,
  PieChart,
  BarChart3,
  Download,
  Share2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Target,
  Calendar,
  Percent,
} from "lucide-react";

interface CalculationInputs {
  // 물건 정보
  purchasePrice: number;
  area: number;
  location: string;
  buildingType: string;

  // 임대 수익
  monthlyRent: number;
  deposit: number;
  vacancyRate: number;
  rentIncreaseRate: number;

  // 비용
  acquisitionTax: number;
  brokerageFee: number;
  registrationFee: number;
  monthlyManagementFee: number;
  repairReserveFund: number;
  insuranceFee: number;
  propertyTax: number;

  // 자금 조달
  loanAmount: number;
  loanInterestRate: number;
  loanPeriod: number;

  // 기타
  holdingPeriod: number;
  expectedAppreciationRate: number;
  taxRate: number;
}

interface CalculationResults {
  // 기본 수익률
  grossYield: number;
  netYield: number;
  roi: number;

  // 현금흐름
  monthlyNetIncome: number;
  annualNetIncome: number;
  totalCashFlow: number;

  // 투자 분석
  totalInvestment: number;
  totalReturn: number;
  capitalGain: number;

  // 세부 계산
  totalAcquisitionCost: number;
  totalAnnualExpenses: number;
  loanPayment: number;

  // 시나리오 분석
  breakEvenPoint: number;
  paybackPeriod: number;
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalculationInputs>({
    purchasePrice: 50000,
    area: 25,
    location: "서울특별시",
    buildingType: "빌라",
    monthlyRent: 80,
    deposit: 1000,
    vacancyRate: 5,
    rentIncreaseRate: 2,
    acquisitionTax: 4,
    brokerageFee: 0.5,
    registrationFee: 0.2,
    monthlyManagementFee: 10,
    repairReserveFund: 5,
    insuranceFee: 20,
    propertyTax: 0.2,
    loanAmount: 30000,
    loanInterestRate: 4.5,
    loanPeriod: 20,
    holdingPeriod: 5,
    expectedAppreciationRate: 3,
    taxRate: 22,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [activeTab, setActiveTab] = useState("inputs");
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);

  // 사용자 정보
  const user = {
    email: "demo@booster.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  };

  // 계산 함수
  const calculateReturns = () => {
    const {
      purchasePrice,
      monthlyRent,
      deposit,
      vacancyRate,
      acquisitionTax,
      brokerageFee,
      registrationFee,
      monthlyManagementFee,
      repairReserveFund,
      insuranceFee,
      propertyTax,
      loanAmount,
      loanInterestRate,
      loanPeriod,
      holdingPeriod,
      expectedAppreciationRate,
      taxRate,
    } = inputs;

    // 취득 비용 계산
    const totalAcquisitionCost =
      purchasePrice +
      (purchasePrice * acquisitionTax) / 100 +
      (purchasePrice * brokerageFee) / 100 +
      (purchasePrice * registrationFee) / 100;

    // 총 투자금액 (자기자본)
    const totalInvestment = totalAcquisitionCost - loanAmount + deposit;

    // 연간 임대수입 (공실률 고려)
    const annualRentIncome = monthlyRent * 12 * (1 - vacancyRate / 100);

    // 연간 운영비용
    const totalAnnualExpenses =
      monthlyManagementFee * 12 +
      repairReserveFund +
      insuranceFee +
      (purchasePrice * propertyTax) / 100;

    // 대출 월 상환액 (원리금균등상환)
    const monthlyInterestRate = loanInterestRate / 100 / 12;
    const totalPayments = loanPeriod * 12;
    const loanPayment =
      loanAmount > 0
        ? ((loanAmount *
            monthlyInterestRate *
            Math.pow(1 + monthlyInterestRate, totalPayments)) /
            (Math.pow(1 + monthlyInterestRate, totalPayments) - 1)) *
          12
        : 0;

    // 순 임대수입
    const annualNetIncome =
      annualRentIncome - totalAnnualExpenses - loanPayment;
    const monthlyNetIncome = annualNetIncome / 12;

    // 수익률 계산
    const grossYieldValue = (annualRentIncome / purchasePrice) * 100;
    const netYieldValue = (annualNetIncome / totalInvestment) * 100;
    const roiValue = netYieldValue;

    // 보유기간 동안의 현금흐름
    const totalCashFlow = annualNetIncome * holdingPeriod;

    // 자본이득 (매각 시)
    const futureValue =
      purchasePrice *
      Math.pow(1 + expectedAppreciationRate / 100, holdingPeriod);
    const capitalGain = futureValue - purchasePrice;

    // 총 수익
    const totalReturn = totalCashFlow + capitalGain;

    // 손익분기점 (월)
    const breakEvenPoint = totalInvestment / (monthlyNetIncome || 1);

    // 투자회수기간 (년)
    const paybackPeriod = totalInvestment / (annualNetIncome || 1);

    const calculationResults: CalculationResults = {
      grossYield: grossYieldValue,
      netYield: netYieldValue,
      roi: roiValue,
      monthlyNetIncome,
      annualNetIncome,
      totalCashFlow,
      totalInvestment,
      totalReturn,
      capitalGain,
      totalAcquisitionCost,
      totalAnnualExpenses,
      loanPayment,
      breakEvenPoint,
      paybackPeriod,
    };

    setResults(calculationResults);
    setActiveTab("results");
  };

  // 입력값 변경 핸들러
  const handleInputChange = (
    key: keyof CalculationInputs,
    value: number | string
  ) => {
    setInputs((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? value : Number(value),
    }));
  };

  // 계산 초기화
  const resetCalculation = () => {
    setInputs({
      purchasePrice: 50000,
      area: 25,
      location: "서울특별시",
      buildingType: "빌라",
      monthlyRent: 80,
      deposit: 1000,
      vacancyRate: 5,
      rentIncreaseRate: 2,
      acquisitionTax: 4,
      brokerageFee: 0.5,
      registrationFee: 0.2,
      monthlyManagementFee: 10,
      repairReserveFund: 5,
      insuranceFee: 20,
      propertyTax: 0.2,
      loanAmount: 30000,
      loanInterestRate: 4.5,
      loanPeriod: 20,
      holdingPeriod: 5,
      expectedAppreciationRate: 3,
      taxRate: 22,
    });
    setResults(null);
    setActiveTab("inputs");
  };

  // 계산 저장
  const saveCalculation = () => {
    const calculation = {
      id: Date.now(),
      name: `${inputs.location} ${inputs.buildingType} 분석`,
      date: new Date().toLocaleDateString(),
      inputs,
      results,
    };
    setSavedCalculations((prev) => [calculation, ...prev]);
  };

  // 수익률에 따른 색상 결정
  const getYieldColor = (yieldValue: number) => {
    if (yieldValue >= 8) return "text-green-600";
    if (yieldValue >= 5) return "text-blue-600";
    if (yieldValue >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  // 수익률 평가
  const getYieldGrade = (yieldValue: number) => {
    if (yieldValue >= 8)
      return { grade: "우수", color: "bg-green-100 text-green-800" };
    if (yieldValue >= 5)
      return { grade: "양호", color: "bg-blue-100 text-blue-800" };
    if (yieldValue >= 3)
      return { grade: "보통", color: "bg-yellow-100 text-yellow-800" };
    return { grade: "주의", color: "bg-red-100 text-red-800" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                수익률 계산기
              </h1>
              <p className="text-gray-600">
                부동산 투자 수익률을 정확하게 계산하고 분석해보세요
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetCalculation}>
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              {results && (
                <>
                  <Button variant="outline" onClick={saveCalculation}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 입력 패널 */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inputs" className="flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  입력
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  disabled={!results}
                  className="flex items-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  결과
                </TabsTrigger>
                <TabsTrigger
                  value="analysis"
                  disabled={!results}
                  className="flex items-center"
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  분석
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inputs" className="space-y-6">
                {/* 물건 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="w-5 h-5 mr-2" />
                      물건 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchasePrice">매입가격 (만원)</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          value={inputs.purchasePrice}
                          onChange={(e) =>
                            handleInputChange("purchasePrice", e.target.value)
                          }
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="area">면적 (평)</Label>
                        <Input
                          id="area"
                          type="number"
                          value={inputs.area}
                          onChange={(e) =>
                            handleInputChange("area", e.target.value)
                          }
                          placeholder="25"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">위치</Label>
                        <Select
                          value={inputs.location}
                          onValueChange={(value) =>
                            handleInputChange("location", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="서울특별시">
                              서울특별시
                            </SelectItem>
                            <SelectItem value="경기도">경기도</SelectItem>
                            <SelectItem value="인천광역시">
                              인천광역시
                            </SelectItem>
                            <SelectItem value="부산광역시">
                              부산광역시
                            </SelectItem>
                            <SelectItem value="대구광역시">
                              대구광역시
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="buildingType">건물 유형</Label>
                        <Select
                          value={inputs.buildingType}
                          onValueChange={(value) =>
                            handleInputChange("buildingType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="빌라">빌라</SelectItem>
                            <SelectItem value="아파트">아파트</SelectItem>
                            <SelectItem value="오피스텔">오피스텔</SelectItem>
                            <SelectItem value="상가">상가</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 임대 수익 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      임대 수익
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthlyRent">월세 (만원)</Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          value={inputs.monthlyRent}
                          onChange={(e) =>
                            handleInputChange("monthlyRent", e.target.value)
                          }
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deposit">보증금 (만원)</Label>
                        <Input
                          id="deposit"
                          type="number"
                          value={inputs.deposit}
                          onChange={(e) =>
                            handleInputChange("deposit", e.target.value)
                          }
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vacancyRate">공실률 (%)</Label>
                        <Input
                          id="vacancyRate"
                          type="number"
                          value={inputs.vacancyRate}
                          onChange={(e) =>
                            handleInputChange("vacancyRate", e.target.value)
                          }
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rentIncreaseRate">
                          임대료 상승률 (%/년)
                        </Label>
                        <Input
                          id="rentIncreaseRate"
                          type="number"
                          value={inputs.rentIncreaseRate}
                          onChange={(e) =>
                            handleInputChange(
                              "rentIncreaseRate",
                              e.target.value
                            )
                          }
                          placeholder="2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 취득 및 운영 비용 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      비용
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          취득 비용
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="acquisitionTax">취득세 (%)</Label>
                            <Input
                              id="acquisitionTax"
                              type="number"
                              step="0.1"
                              value={inputs.acquisitionTax}
                              onChange={(e) =>
                                handleInputChange(
                                  "acquisitionTax",
                                  e.target.value
                                )
                              }
                              placeholder="4"
                            />
                          </div>
                          <div>
                            <Label htmlFor="brokerageFee">중개수수료 (%)</Label>
                            <Input
                              id="brokerageFee"
                              type="number"
                              step="0.1"
                              value={inputs.brokerageFee}
                              onChange={(e) =>
                                handleInputChange(
                                  "brokerageFee",
                                  e.target.value
                                )
                              }
                              placeholder="0.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="registrationFee">등록비 (%)</Label>
                            <Input
                              id="registrationFee"
                              type="number"
                              step="0.1"
                              value={inputs.registrationFee}
                              onChange={(e) =>
                                handleInputChange(
                                  "registrationFee",
                                  e.target.value
                                )
                              }
                              placeholder="0.2"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          운영 비용 (연간)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="monthlyManagementFee">
                              관리비 (월, 만원)
                            </Label>
                            <Input
                              id="monthlyManagementFee"
                              type="number"
                              value={inputs.monthlyManagementFee}
                              onChange={(e) =>
                                handleInputChange(
                                  "monthlyManagementFee",
                                  e.target.value
                                )
                              }
                              placeholder="10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="repairReserveFund">
                              수선충당금 (만원)
                            </Label>
                            <Input
                              id="repairReserveFund"
                              type="number"
                              value={inputs.repairReserveFund}
                              onChange={(e) =>
                                handleInputChange(
                                  "repairReserveFund",
                                  e.target.value
                                )
                              }
                              placeholder="5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="insuranceFee">보험료 (만원)</Label>
                            <Input
                              id="insuranceFee"
                              type="number"
                              value={inputs.insuranceFee}
                              onChange={(e) =>
                                handleInputChange(
                                  "insuranceFee",
                                  e.target.value
                                )
                              }
                              placeholder="20"
                            />
                          </div>
                          <div>
                            <Label htmlFor="propertyTax">재산세율 (%)</Label>
                            <Input
                              id="propertyTax"
                              type="number"
                              step="0.1"
                              value={inputs.propertyTax}
                              onChange={(e) =>
                                handleInputChange("propertyTax", e.target.value)
                              }
                              placeholder="0.2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 자금 조달 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Percent className="w-5 h-5 mr-2" />
                      자금 조달
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="loanAmount">대출금액 (만원)</Label>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={inputs.loanAmount}
                          onChange={(e) =>
                            handleInputChange("loanAmount", e.target.value)
                          }
                          placeholder="30000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="loanInterestRate">대출금리 (%)</Label>
                        <Input
                          id="loanInterestRate"
                          type="number"
                          step="0.1"
                          value={inputs.loanInterestRate}
                          onChange={(e) =>
                            handleInputChange(
                              "loanInterestRate",
                              e.target.value
                            )
                          }
                          placeholder="4.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="loanPeriod">대출기간 (년)</Label>
                        <Input
                          id="loanPeriod"
                          type="number"
                          value={inputs.loanPeriod}
                          onChange={(e) =>
                            handleInputChange("loanPeriod", e.target.value)
                          }
                          placeholder="20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 투자 조건 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      투자 조건
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="holdingPeriod">보유기간 (년)</Label>
                        <Input
                          id="holdingPeriod"
                          type="number"
                          value={inputs.holdingPeriod}
                          onChange={(e) =>
                            handleInputChange("holdingPeriod", e.target.value)
                          }
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expectedAppreciationRate">
                          예상 시세상승률 (%/년)
                        </Label>
                        <Input
                          id="expectedAppreciationRate"
                          type="number"
                          step="0.1"
                          value={inputs.expectedAppreciationRate}
                          onChange={(e) =>
                            handleInputChange(
                              "expectedAppreciationRate",
                              e.target.value
                            )
                          }
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxRate">세율 (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          value={inputs.taxRate}
                          onChange={(e) =>
                            handleInputChange("taxRate", e.target.value)
                          }
                          placeholder="22"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center pt-6">
                  <Button
                    size="lg"
                    onClick={calculateReturns}
                    className="px-12"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    수익률 계산하기
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {results && (
                  <>
                    {/* 주요 지표 */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                표면 수익률
                              </p>
                              <p
                                className={`text-2xl font-bold ${getYieldColor(
                                  results.grossYield
                                )}`}
                              >
                                {results.grossYield.toFixed(2)}%
                              </p>
                            </div>
                            <Badge
                              className={
                                getYieldGrade(results.grossYield).color
                              }
                            >
                              {getYieldGrade(results.grossYield).grade}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                실질 수익률
                              </p>
                              <p
                                className={`text-2xl font-bold ${getYieldColor(
                                  results.netYield
                                )}`}
                              >
                                {results.netYield.toFixed(2)}%
                              </p>
                            </div>
                            <Badge
                              className={getYieldGrade(results.netYield).color}
                            >
                              {getYieldGrade(results.netYield).grade}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                ROI
                              </p>
                              <p
                                className={`text-2xl font-bold ${getYieldColor(
                                  results.roi
                                )}`}
                              >
                                {results.roi.toFixed(2)}%
                              </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 현금흐름 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>현금흐름 분석</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">월 순수익</span>
                              <span
                                className={`font-semibold ${
                                  results.monthlyNetIncome >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {results.monthlyNetIncome >= 0 ? "+" : ""}
                                {results.monthlyNetIncome.toLocaleString()}만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">연 순수익</span>
                              <span
                                className={`font-semibold ${
                                  results.annualNetIncome >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {results.annualNetIncome >= 0 ? "+" : ""}
                                {results.annualNetIncome.toLocaleString()}만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                총 현금흐름 ({inputs.holdingPeriod}년)
                              </span>
                              <span
                                className={`font-semibold ${
                                  results.totalCashFlow >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {results.totalCashFlow >= 0 ? "+" : ""}
                                {results.totalCashFlow.toLocaleString()}만원
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 투자금액</span>
                              <span className="font-semibold text-gray-900">
                                {results.totalInvestment.toLocaleString()}만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                예상 자본이득
                              </span>
                              <span
                                className={`font-semibold ${
                                  results.capitalGain >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {results.capitalGain >= 0 ? "+" : ""}
                                {results.capitalGain.toLocaleString()}만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 예상수익</span>
                              <span
                                className={`font-semibold ${
                                  results.totalReturn >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {results.totalReturn >= 0 ? "+" : ""}
                                {results.totalReturn.toLocaleString()}만원
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 비용 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>비용 분석</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 취득비용</span>
                              <span className="font-semibold text-gray-900">
                                {results.totalAcquisitionCost.toLocaleString()}
                                만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                연간 운영비용
                              </span>
                              <span className="font-semibold text-gray-900">
                                {results.totalAnnualExpenses.toLocaleString()}
                                만원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                연간 대출상환액
                              </span>
                              <span className="font-semibold text-gray-900">
                                {results.loanPayment.toLocaleString()}만원
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">손익분기점</span>
                              <span className="font-semibold text-gray-900">
                                {results.breakEvenPoint.toFixed(1)}개월
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                투자회수기간
                              </span>
                              <span className="font-semibold text-gray-900">
                                {results.paybackPeriod.toFixed(1)}년
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                {results && (
                  <>
                    {/* 투자 등급 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>투자 등급 평가</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full ${
                                  results.netYield >= 8
                                    ? "bg-green-500"
                                    : results.netYield >= 5
                                    ? "bg-blue-500"
                                    : results.netYield >= 3
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              ></div>
                              <span className="font-medium">수익률 등급</span>
                            </div>
                            <Badge
                              className={getYieldGrade(results.netYield).color}
                            >
                              {getYieldGrade(results.netYield).grade}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                {results.monthlyNetIncome > 0 ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="font-medium">현금흐름</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {results.monthlyNetIncome > 0
                                  ? "매월 양의 현금흐름이 발생합니다."
                                  : "매월 음의 현금흐름이 발생합니다."}
                              </p>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                {results.paybackPeriod <= 10 ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Info className="w-5 h-5 text-yellow-600" />
                                )}
                                <span className="font-medium">회수기간</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {results.paybackPeriod <= 10
                                  ? "투자금 회수기간이 적절합니다."
                                  : "투자금 회수기간이 다소 깁니다."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 리스크 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>리스크 분석</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-yellow-800 mb-1">
                                  주요 리스크 요인
                                </h4>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                  <li>• 공실률 증가 시 수익률 하락</li>
                                  <li>• 금리 상승 시 대출 부담 증가</li>
                                  <li>• 시세 하락 시 자본손실 발생</li>
                                  <li>• 예상치 못한 수리비 발생</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-800 mb-1">
                                  투자 권장사항
                                </h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  <li>• 충분한 예비자금 확보 필요</li>
                                  <li>• 정기적인 시장 동향 모니터링</li>
                                  <li>• 다양한 시나리오 분석 검토</li>
                                  <li>• 전문가 상담 권장</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 계산 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 계산</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {inputs.purchasePrice
                      ? (
                          ((inputs.monthlyRent * 12) / inputs.purchasePrice) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </div>
                  <div className="text-sm text-gray-600">예상 표면수익률</div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">월세</span>
                    <span className="font-medium">
                      {inputs.monthlyRent}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">연 임대수입</span>
                    <span className="font-medium">
                      {(inputs.monthlyRent * 12).toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">매입가격</span>
                    <span className="font-medium">
                      {inputs.purchasePrice.toLocaleString()}만원
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 저장된 계산 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">저장된 계산</CardTitle>
              </CardHeader>
              <CardContent>
                {savedCalculations.length > 0 ? (
                  <div className="space-y-3">
                    {savedCalculations.slice(0, 3).map((calc) => (
                      <div
                        key={calc.id}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {calc.name}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {calc.date}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">수익률</span>
                          <span
                            className={`font-medium ${getYieldColor(
                              calc.results?.netYield || 0
                            )}`}
                          >
                            {calc.results?.netYield?.toFixed(2) || "0.00"}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {savedCalculations.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        더 보기 ({savedCalculations.length - 3}개)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Save className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-500">
                      저장된 계산이 없습니다
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 도움말 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">계산 도움말</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    표면 수익률
                  </div>
                  <div className="text-gray-600">
                    연간 임대수입 ÷ 매입가격 × 100
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    실질 수익률
                  </div>
                  <div className="text-gray-600">
                    순 임대수입 ÷ 총 투자금액 × 100
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">ROI</div>
                  <div className="text-gray-600">
                    투자 대비 수익률 (자기자본 기준)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
