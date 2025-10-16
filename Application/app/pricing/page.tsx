export const metadata = {
  title: "요금제",
  description: "스탠다드/프로 요금제 비교와 혜택을 확인하세요.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "요금제 | 부동산부스터",
    description: "스탠다드와 프로 플랜의 기능과 가격을 비교하세요.",
  },
  twitter: {
    title: "요금제 | 부동산부스터",
    description: "스탠다드와 프로 플랜의 기능과 가격을 비교하세요.",
  },
};
"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/header";
import {
  Check,
  X,
  Crown,
  Zap,
  BarChart3,
  Headphones,
  Star,
  ArrowRight,
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  // 사용자 정보 (임시)
  const user = {
    email: "demo@booster.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  };

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free Trial",
      description: "부동산 분석을 시작해보세요",
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        { name: "월 5회 분석", included: true, limit: "5회" },
        { name: "관심 물건 저장", included: true, limit: "10개" },
        { name: "기본 분석 리포트", included: true },
        { name: "이메일 지원", included: true },
        { name: "고급 분석 도구", included: false },
        { name: "API 접근", included: false },
        { name: "우선 지원", included: false },
        { name: "데이터 내보내기", included: false },
      ],
      icon: <Zap className="w-6 h-6" />,
      color: "border-gray-200",
    },
    {
      id: "standard",
      name: "Standard",
      description: "개인 투자자를 위한 스탠다드 플랜",
      price: {
        monthly: 29000,
        yearly: 290000,
      },
      features: [
        { name: "월 50회 분석", included: true, limit: "50회" },
        { name: "관심 물건 저장", included: true, limit: "100개" },
        { name: "기본 분석 리포트", included: true },
        { name: "이메일 지원", included: true },
        { name: "고급 분석 도구", included: true },
        { name: "API 접근", included: false },
        { name: "우선 지원", included: false },
        { name: "데이터 내보내기", included: true },
      ],
      icon: <BarChart3 className="w-6 h-6" />,
      color: "border-blue-200",
      popular: true,
    },
    {
      id: "pro",
      name: "Pro",
      description: "전문 투자자를 위한 고급 플랜",
      price: {
        monthly: 79000,
        yearly: 790000,
      },
      features: [
        { name: "월 200회 분석", included: true, limit: "200회" },
        { name: "관심 물건 저장", included: true, limit: "500개" },
        { name: "고급 분석 리포트", included: true },
        { name: "이메일 지원", included: true },
        { name: "고급 분석 도구", included: true },
        { name: "API 접근", included: true },
        { name: "우선 지원", included: true },
        { name: "데이터 내보내기", included: true },
      ],
      icon: <Crown className="w-6 h-6" />,
      color: "border-gray-200",
    },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return "무료";
    return `₩${price.toLocaleString()}`;
  };

  const getDiscountPercentage = (monthly: number, yearly: number) => {
    if (monthly === 0 || yearly === 0) return 0;
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            투자 목표에 맞는{" "}
            <span className="text-blue-600">플랜을 선택하세요</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            부동산 분석의 모든 기능을 경험해보세요. 언제든지 플랜을 변경할 수
            있습니다.
          </p>

          {/* 요금제 토글 */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span
              className={`text-sm font-medium ${
                !isYearly ? "text-gray-900" : "text-gray-500"
              }`}
            >
              월간 결제
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span
              className={`text-sm font-medium ${
                isYearly ? "text-gray-900" : "text-gray-500"
              }`}
            >
              연간 결제
            </span>
            <Badge variant="secondary" className="ml-2">
              최대 17% 할인
            </Badge>
          </div>
        </div>

        {/* 요금제 카드 */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.color} ${
                plan.popular
                  ? "ring-2 ring-purple-500 shadow-lg scale-105"
                  : plan.id === "pro"
                  ? "opacity-70"
                  : "hover:shadow-lg"
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    인기
                  </Badge>
                </div>
              )}
              {!plan.popular && plan.id === "pro" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gray-300 text-gray-700 px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    준비중
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {/* 가격 */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(
                      isYearly ? plan.price.yearly : plan.price.monthly
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.price.monthly === 0
                      ? "영구 무료"
                      : isYearly
                      ? "/ 년"
                      : "/ 월"}
                  </div>
                  {isYearly && plan.price.monthly > 0 && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      {getDiscountPercentage(
                        plan.price.monthly,
                        plan.price.yearly
                      )}
                      % 할인
                    </div>
                  )}
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            feature.included ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {feature.name}
                        </span>
                        {feature.limit && feature.included && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({feature.limit})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.id === "pro" ? (
                  <Button
                    className="w-full bg-gray-300 text-gray-700 cursor-not-allowed"
                    disabled
                  >
                    준비중
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : plan.id === "free"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    asChild
                  >
                    <Link
                      href={
                        plan.id === "free"
                          ? "/signup"
                          : `/checkout?plan=${plan.id}`
                      }
                    >
                      {plan.id === "free" ? "무료로 시작하기" : "플랜 선택하기"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 기능 비교표 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-16">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              상세 기능 비교
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    기능
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-6 py-4 text-center text-sm font-medium text-gray-900"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    name: "월간 분석 횟수",
                    values: ["5회", "50회", "200회"],
                  },
                  {
                    name: "관심 물건 저장",
                    values: ["10개", "100개", "500개"],
                  },
                  {
                    name: "분석 리포트",
                    values: ["기본", "기본", "고급"],
                  },
                  { name: "고급 분석 도구", values: ["✗", "✓", "✓"] },
                  { name: "API 접근", values: ["✗", "✗", "✓"] },
                  { name: "데이터 내보내기", values: ["✗", "✓", "✓"] },
                  {
                    name: "고객 지원",
                    values: ["이메일", "이메일", "우선 지원"],
                  },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.name}
                    </td>
                    {row.values.map((value, valueIndex) => (
                      <td
                        key={valueIndex}
                        className="px-6 py-4 text-center text-sm text-gray-600"
                      >
                        {value === "✓" ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : value === "✗" ? (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            자주 묻는 질문
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  플랜을 언제든지 변경할 수 있나요?
                </h3>
                <p className="text-gray-600">
                  네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수
                  있습니다. 변경사항은 다음 결제 주기부터 적용됩니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  무료 체험 기간이 있나요?
                </h3>
                <p className="text-gray-600">
                  Free Trial 플랜을 통해 영구적으로 기본 기능을 무료로 사용할 수
                  있습니다. 유료 플랜은 별도의 체험 기간 없이 바로 시작됩니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  결제는 어떻게 이루어지나요?
                </h3>
                <p className="text-gray-600">
                  신용카드, 체크카드, 계좌이체를 통해 결제할 수 있습니다. 모든
                  결제는 안전하게 암호화되어 처리됩니다.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  환불 정책은 어떻게 되나요?
                </h3>
                <p className="text-gray-600">
                  서비스에 만족하지 않으시면 구매 후 7일 이내에 전액 환불받을 수
                  있습니다. 자세한 내용은 이용약관을 참고해주세요.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  기업용 플랜이 따로 있나요?
                </h3>
                <p className="text-gray-600">
                  Enterprise 플랜이 기업용으로 설계되었습니다. 더 많은 기능이나
                  맞춤형 솔루션이 필요하시면 별도로 문의해주세요.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  고객 지원은 어떻게 받을 수 있나요?
                </h3>
                <p className="text-gray-600">
                  플랜에 따라 이메일, 우선 지원, 전담 지원을 제공합니다.
                  고객센터를 통해 언제든지 도움을 받을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8 opacity-90">
            부동산 투자의 새로운 기준을 경험해보세요. 언제든지 플랜을 변경할 수
            있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              asChild
            >
              <Link href="/signup">
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              asChild
            >
              <Link href="/support">
                <Headphones className="w-5 h-5 mr-2" />
                상담 받기
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer removed: now provided by AppShell */}
    </div>
  );
}
