"use client"

import { useState } from "react"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Header from "@/components/layout/header"
import {
  Check,
  X,
  Star,
  Zap,
  Shield,
  Headphones,
  ArrowRight,
  Sparkles,
  Award,
  Gift,
  HelpCircle,
  AlertTriangle,
} from "lucide-react"

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  originalMonthlyPrice?: number
  originalYearlyPrice?: number
  badge?: string
  badgeColor?: string
  popular?: boolean
  features: {
    category: string
    items: {
      name: string
      included: boolean | string | number
      tooltip?: string
    }[]
  }[]
  limitations?: string[]
  cta: string
  ctaVariant?: "default" | "outline" | "secondary"
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // 사용자 정보 (실제로는 인증 상태에서 가져옴)
  const user = {
    email: "demo@booster.com",
    subscription: {
      plan: "Free Trial",
      expiresAt: "2024-02-08",
    },
  }

  const plans: PricingPlan[] = [
    {
      id: "free-trial",
      name: "Free Trial",
      description: "부스터를 처음 체험하는 분들을 위한 무료 체험",
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: "7일 무료",
      badgeColor: "bg-green-100 text-green-800",
      cta: "무료 체험 시작",
      ctaVariant: "outline",
      features: [
        {
          category: "분석 기능",
          items: [
            { name: "월 분석 횟수", included: 10, tooltip: "매월 10회까지 부동산 분석 가능" },
            { name: "기본 분석 리포트", included: true },
            { name: "지도 기반 검색", included: true },
            { name: "수익률 계산기", included: true },
            { name: "AI 추천 시스템", included: false },
            { name: "상세 분석 리포트", included: false },
          ],
        },
        {
          category: "데이터 관리",
          items: [
            { name: "관심 물건 저장", included: 5, tooltip: "최대 5개까지 관심 물건 저장" },
            { name: "분석 히스토리", included: "7일", tooltip: "7일간 분석 기록 보관" },
            { name: "데이터 내보내기", included: false },
            { name: "클라우드 백업", included: false },
          ],
        },
        {
          category: "고객 지원",
          items: [
            { name: "이메일 지원", included: true },
            { name: "실시간 채팅", included: false },
            { name: "전화 상담", included: false },
            { name: "전담 매니저", included: false },
          ],
        },
      ],
      limitations: [
        "체험 기간 종료 후 자동으로 서비스 이용 중단",
        "고급 분석 기능 및 AI 추천 기능 제한",
        "데이터 내보내기 및 백업 기능 미제공",
      ],
    },
    {
      id: "basic",
      name: "Basic",
      description: "개인 투자자를 위한 기본 플랜",
      monthlyPrice: 29000,
      yearlyPrice: 290000,
      originalMonthlyPrice: 39000,
      originalYearlyPrice: 390000,
      cta: "Basic 시작하기",
      features: [
        {
          category: "분석 기능",
          items: [
            { name: "월 분석 횟수", included: 50, tooltip: "매월 50회까지 부동산 분석 가능" },
            { name: "기본 분석 리포트", included: true },
            { name: "지도 기반 검색", included: true },
            { name: "수익률 계산기", included: true },
            { name: "AI 추천 시스템", included: "기본", tooltip: "기본 AI 추천 기능 제공" },
            { name: "상세 분석 리포트", included: false },
          ],
        },
        {
          category: "데이터 관리",
          items: [
            { name: "관심 물건 저장", included: 20, tooltip: "최대 20개까지 관심 물건 저장" },
            { name: "분석 히스토리", included: "30일", tooltip: "30일간 분석 기록 보관" },
            { name: "데이터 내보내기", included: "기본", tooltip: "CSV 형태로 데이터 내보내기" },
            { name: "클라우드 백업", included: true },
          ],
        },
        {
          category: "고객 지원",
          items: [
            { name: "이메일 지원", included: true },
            { name: "실시간 채팅", included: "평일", tooltip: "평일 09:00-18:00 실시간 채팅 지원" },
            { name: "전화 상담", included: false },
            { name: "전담 매니저", included: false },
          ],
        },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "전문 투자자를 위한 고급 플랜",
      monthlyPrice: 59000,
      yearlyPrice: 590000,
      originalMonthlyPrice: 79000,
      originalYearlyPrice: 790000,
      badge: "인기",
      badgeColor: "bg-blue-100 text-blue-800",
      popular: true,
      cta: "Pro 시작하기",
      features: [
        {
          category: "분석 기능",
          items: [
            { name: "월 분석 횟수", included: 100, tooltip: "매월 100회까지 부동산 분석 가능" },
            { name: "기본 분석 리포트", included: true },
            { name: "지도 기반 검색", included: true },
            { name: "수익률 계산기", included: true },
            { name: "AI 추천 시스템", included: "고급", tooltip: "고급 AI 추천 및 예측 기능" },
            { name: "상세 분석 리포트", included: true },
          ],
        },
        {
          category: "데이터 관리",
          items: [
            { name: "관심 물건 저장", included: 50, tooltip: "최대 50개까지 관심 물건 저장" },
            { name: "분석 히스토리", included: "90일", tooltip: "90일간 분석 기록 보관" },
            { name: "데이터 내보내기", included: "고급", tooltip: "CSV, Excel, PDF 형태로 내보내기" },
            { name: "클라우드 백업", included: true },
          ],
        },
        {
          category: "고객 지원",
          items: [
            { name: "이메일 지원", included: true },
            { name: "실시간 채팅", included: "24/7", tooltip: "24시간 실시간 채팅 지원" },
            { name: "전화 상담", included: "평일", tooltip: "평일 전화 상담 지원" },
            { name: "전담 매니저", included: false },
          ],
        },
        {
          category: "추가 기능",
          items: [
            { name: "모바일 앱", included: true },
            { name: "알림 서비스", included: true },
            { name: "API 접근", included: "제한적", tooltip: "월 1,000회 API 호출" },
            { name: "팀 협업", included: false },
          ],
        },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "기업 및 대규모 투자사를 위한 맞춤형 솔루션",
      monthlyPrice: 199000,
      yearlyPrice: 1990000,
      originalMonthlyPrice: 299000,
      originalYearlyPrice: 2990000,
      badge: "맞춤형",
      badgeColor: "bg-purple-100 text-purple-800",
      cta: "상담 문의",
      ctaVariant: "secondary",
      features: [
        {
          category: "분석 기능",
          items: [
            { name: "월 분석 횟수", included: "무제한", tooltip: "무제한 부동산 분석" },
            { name: "기본 분석 리포트", included: true },
            { name: "지도 기반 검색", included: true },
            { name: "수익률 계산기", included: true },
            { name: "AI 추천 시스템", included: "프리미엄", tooltip: "최고급 AI 분석 및 예측" },
            { name: "상세 분석 리포트", included: true },
          ],
        },
        {
          category: "데이터 관리",
          items: [
            { name: "관심 물건 저장", included: "무제한", tooltip: "무제한 관심 물건 저장" },
            { name: "분석 히스토리", included: "무제한", tooltip: "모든 분석 기록 영구 보관" },
            { name: "데이터 내보내기", included: "프리미엄", tooltip: "모든 형태의 데이터 내보내기" },
            { name: "클라우드 백업", included: true },
          ],
        },
        {
          category: "고객 지원",
          items: [
            { name: "이메일 지원", included: true },
            { name: "실시간 채팅", included: "24/7", tooltip: "24시간 우선 지원" },
            { name: "전화 상담", included: "24/7", tooltip: "24시간 전화 상담" },
            { name: "전담 매니저", included: true },
          ],
        },
        {
          category: "추가 기능",
          items: [
            { name: "모바일 앱", included: true },
            { name: "알림 서비스", included: true },
            { name: "API 접근", included: "무제한", tooltip: "무제한 API 호출" },
            { name: "팀 협업", included: true },
            { name: "맞춤형 개발", included: true },
            { name: "온사이트 교육", included: true },
          ],
        },
      ],
    },
  ]

  const faqs = [
    {
      question: "무료 체험 후 자동으로 결제되나요?",
      answer:
        "아니요, 무료 체험 기간이 끝나면 자동으로 서비스 이용이 중단됩니다. 계속 이용하시려면 원하는 플랜을 선택해서 결제하셔야 합니다.",
    },
    {
      question: "플랜은 언제든지 변경할 수 있나요?",
      answer:
        "네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.",
    },
    {
      question: "연간 결제 시 할인 혜택이 있나요?",
      answer:
        "네, 연간 결제 시 월간 결제 대비 약 25% 할인된 가격으로 이용하실 수 있습니다. 또한 연간 결제 고객에게는 추가 혜택도 제공됩니다.",
    },
    {
      question: "환불 정책은 어떻게 되나요?",
      answer:
        "결제 후 7일 이내에 환불 요청 시 100% 환불 가능합니다. 단, 서비스를 실제로 이용한 경우 이용한 만큼 차감 후 환불됩니다.",
    },
    {
      question: "Enterprise 플랜의 맞춤형 개발은 어떤 내용인가요?",
      answer:
        "고객사의 특별한 요구사항에 맞춰 추가 기능 개발, 기존 시스템과의 연동, 맞춤형 리포트 생성 등의 서비스를 제공합니다.",
    },
  ]

  const getPrice = (plan: PricingPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getOriginalPrice = (plan: PricingPlan) => {
    return isYearly ? plan.originalYearlyPrice : plan.originalMonthlyPrice
  }

  const getDiscountPercentage = (plan: PricingPlan) => {
    const currentPrice = getPrice(plan)
    const originalPrice = getOriginalPrice(plan)
    if (!originalPrice || originalPrice === 0) return 0
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "무료"
    return `₩${price.toLocaleString()}`
  }

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === "boolean") {
      return value ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-gray-400" />
    }
    return <span className="text-sm font-medium text-gray-900">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            투자 성공의 시작
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">당신에게 맞는 플랜을 선택하세요</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            개인 투자자부터 대기업까지, 모든 규모의 부동산 분석 요구사항을 충족하는 다양한 플랜을 제공합니다.
          </p>

          {/* 연간/월간 토글 */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-500"}`}>월간 결제</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-500"}`}>연간 결제</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
              <Gift className="w-3 h-3 mr-1" />
              25% 할인
            </Badge>
          </div>
        </div>

        {/* 요금제 카드 */}
        <div className="grid lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-blue-500 ring-4 ring-blue-100"
                  : selectedPlan === plan.id
                    ? "border-blue-300"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* 인기 배지 */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    가장 인기
                  </Badge>
                </div>
              )}

              {/* 플랜 배지 */}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-3 left-6">
                  <Badge className={plan.badgeColor}>{plan.badge}</Badge>
                </div>
              )}

              <div className="p-8">
                {/* 플랜 헤더 */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                  {/* 가격 */}
                  <div className="mb-4">
                    {getOriginalPrice(plan) && getOriginalPrice(plan) !== getPrice(plan) && (
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-lg text-gray-400 line-through">
                          {formatPrice(getOriginalPrice(plan)!)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {getDiscountPercentage(plan)}% 할인
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{formatPrice(getPrice(plan))}</span>
                      {plan.monthlyPrice > 0 && <span className="text-gray-500 ml-2">/ {isYearly ? "년" : "월"}</span>}
                    </div>
                  </div>

                  {/* CTA 버튼 */}
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : plan.ctaVariant === "outline"
                          ? "border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                          : plan.ctaVariant === "secondary"
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* 기능 목록 */}
                <div className="space-y-6">
                  {plan.features.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        {category.category}
                      </h4>
                      <ul className="space-y-3">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-700">{item.name}</span>
                              {item.tooltip && (
                                <div className="group relative">
                                  <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {item.tooltip}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">{renderFeatureValue(item.included)}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* 제한사항 */}
                {plan.limitations && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">제한사항</h4>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="text-xs text-gray-500 flex items-start">
                          <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 기능 비교 테이블 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-16">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">상세 기능 비교</h2>
            <p className="text-gray-600">모든 플랜의 기능을 한눈에 비교해보세요</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">기능</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      <div className="flex flex-col items-center">
                        <span>{plan.name}</span>
                        {plan.popular && <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">인기</Badge>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {plans[0].features.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-gray-25">
                      <td
                        colSpan={plans.length + 1}
                        className="px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-50"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <span>{item.name}</span>
                            {item.tooltip && (
                              <div className="group relative">
                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {item.tooltip}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        {plans.map((plan) => {
                          const planItem = plan.features
                            .find((cat) => cat.category === category.category)
                            ?.items.find((it) => it.name === item.name)
                          return (
                            <td key={plan.id} className="px-6 py-4 text-center">
                              {planItem ? (
                                renderFeatureValue(planItem.included)
                              ) : (
                                <X className="w-5 h-5 text-gray-400 mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 추가 혜택 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">안전한 결제</h3>
            <p className="text-gray-600">
              SSL 암호화와 PCI DSS 인증으로 안전한 결제 환경을 제공합니다. 모든 결제 정보는 암호화되어 보호됩니다.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">만족 보장</h3>
            <p className="text-gray-600">
              7일 무조건 환불 보장으로 안심하고 시작하세요. 만족하지 않으시면 전액 환불해드립니다.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Headphones className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 지원</h3>
            <p className="text-gray-600">
              언제든지 도움이 필요하시면 연락주세요. 전문 고객 지원팀이 빠르고 친절하게 도와드립니다.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">자주 묻는 질문</h2>
            <p className="text-gray-600">요금제에 대해 궁금한 점들을 확인해보세요</p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <details key={index} className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900">{faq.question}</h3>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>
                <div className="px-6 pb-6 border-t border-gray-100">
                  <p className="text-gray-600 leading-relaxed mt-4">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">더 궁금한 점이 있으신가요?</p>
            <Button variant="outline" asChild>
              <Link href="/support">
                <HelpCircle className="w-4 h-4 mr-2" />
                고객센터 문의
              </Link>
            </Button>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            무료 체험으로 부스터의 강력한 분석 기능을 직접 경험해보세요. 신용카드 등록 없이 즉시 이용 가능합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold">
              <Zap className="w-5 h-5 mr-2" />
              무료 체험 시작
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
              asChild
            >
              <Link href="/support">
                <Headphones className="w-5 h-5 mr-2" />
                상담 문의
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center mb-4">
                <div className="text-2xl font-bold text-blue-400">부스터</div>
                <div className="ml-2 text-sm text-gray-400">Booster</div>
              </Link>
              <p className="text-gray-400 mb-4 max-w-md">
                부동산 분석의 새로운 기준을 제시하는 혁신적인 플랫폼으로, 전문가들의 투자 의사결정을 지원합니다.
              </p>
              <div className="text-sm text-gray-500">© 2024 Booster. All rights reserved.</div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/analysis" className="hover:text-white transition-colors">
                    통합 분석
                  </Link>
                </li>
                <li>
                  <Link href="/calculator" className="hover:text-white transition-colors">
                    수익률 계산기
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="hover:text-white transition-colors">
                    관심 물건
                  </Link>
                </li>
                <li>
                  <Link href="/notices" className="hover:text-white transition-colors">
                    공지사항
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    요금제
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    고객센터
                  </Link>
                </li>
                <li>
                  <Link href="/notices" className="hover:text-white transition-colors">
                    공지사항
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
