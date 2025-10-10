import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/header";
import {
  BarChart3,
  Calculator,
  Heart,
  MapPin,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Database,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "기능 소개 | 부스터 - 부동산 투자 분석 플랫폼",
  description:
    "부스터의 강력한 부동산 투자 분석 기능들을 확인해보세요. 통합 분석, 수익률 계산기, 관심 물건 관리 등 다양한 도구를 제공합니다.",
};

const mainFeatures = [
  {
    icon: BarChart3,
    title: "통합 분석",
    description:
      "다양한 부동산 데이터를 한눈에 분석하고 투자 기회를 발견하세요",
    features: [
      "실시간 시장 데이터 분석",
      "지역별 가격 동향 파악",
      "투자 수익성 평가",
      "리스크 분석 및 평가",
    ],
    href: "/analysis",
    color: "bg-blue-500",
  },
  {
    icon: Calculator,
    title: "수익률 계산기",
    description: "정확한 투자 수익률을 계산하고 다양한 시나리오를 비교해보세요",
    features: [
      "표면/실질 수익률 계산",
      "현금흐름 분석",
      "ROI 및 IRR 계산",
      "세금 고려 수익률",
    ],
    href: "/calculator",
    color: "bg-green-500",
  },
  {
    icon: Heart,
    title: "관심 물건 관리",
    description: "관심 있는 부동산을 저장하고 체계적으로 관리하세요",
    features: [
      "즐겨찾기 물건 저장",
      "가격 변동 알림",
      "비교 분석 기능",
      "투자 노트 작성",
    ],
    href: "/favorites",
    color: "bg-red-500",
  },
];

const additionalFeatures = [
  {
    icon: MapPin,
    title: "지도 기반 검색",
    description:
      "직관적인 지도 인터페이스로 원하는 지역의 부동산을 쉽게 찾아보세요",
  },
  {
    icon: TrendingUp,
    title: "시장 동향 분석",
    description:
      "실시간 시장 데이터와 트렌드 분석으로 투자 타이밍을 놓치지 마세요",
  },
  {
    icon: Shield,
    title: "리스크 평가",
    description: "AI 기반 리스크 분석으로 안전한 투자 결정을 내리세요",
  },
  {
    icon: Zap,
    title: "실시간 알림",
    description: "관심 물건의 가격 변동이나 새로운 매물 정보를 즉시 받아보세요",
  },
  {
    icon: Target,
    title: "맞춤형 추천",
    description: "투자 성향과 예산에 맞는 최적의 부동산을 추천받으세요",
  },
  {
    icon: Database,
    title: "빅데이터 분석",
    description:
      "방대한 부동산 데이터를 기반으로 한 정확한 분석 결과를 제공합니다",
  },
];

const benefits = [
  {
    title: "시간 절약",
    description: "복잡한 분석 과정을 자동화하여 투자 결정 시간을 단축합니다",
  },
  {
    title: "정확한 분석",
    description:
      "AI와 빅데이터를 활용한 정확하고 객관적인 분석 결과를 제공합니다",
  },
  {
    title: "리스크 관리",
    description: "다각도 리스크 분석으로 안전한 투자를 도와드립니다",
  },
  {
    title: "수익 극대화",
    description: "최적의 투자 기회를 발견하여 수익률을 극대화할 수 있습니다",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header provided by AppShell */}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              강력한 부동산 투자
              <span className="block text-blue-200">분석 도구</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              부스터의 혁신적인 기능들로 더 스마트한 부동산 투자를 시작하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                asChild
              >
                <Link href="/signup">
                  무료로 시작하기
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                asChild
              >
                <Link href="/analysis">분석 도구 체험하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              핵심 기능
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              부동산 투자의 모든 과정을 지원하는 전문적인 도구들
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${feature.color}`}
                  />
                  <CardHeader className="pb-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {feature.features.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" asChild>
                      <Link href={feature.href}>
                        {feature.title} 사용하기
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              추가 기능
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              투자 성공을 위한 다양한 부가 기능들
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              부스터를 선택해야 하는 이유
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              전문적인 분석 도구로 투자 성공률을 높이세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            부스터의 강력한 기능들을 무료로 체험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/signup">
                무료 회원가입
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
              asChild
            >
              <Link href="/pricing">요금제 보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer removed: now provided by AppShell */}
    </div>
  );
}
