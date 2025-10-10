"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  MapPin,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: "3시간 → 30분",
      description: "분석 시간 90% 단축",
    },
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "정확한 분석",
      description: "다양한 데이터 소스 통합",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: "시각적 인사이트",
      description: "지도와 차트로 한눈에",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "전문가 최적화",
      description: "실무진 워크플로우 반영",
    },
  ];

  const benefits = [
    "실거래가, 경매 낙찰가 등 통합 데이터 분석",
    "지도 기반 시각적 비교 분석",
    "수익률 시뮬레이션 계산기",
    "관심 물건 관리 및 알림",
    "전문가용 상세 리포트 생성",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header removed: now provided by AppShell */}

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                부동산 분석의 새로운 기준
              </Badge>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="text-blue-600">데이터 기반</span>으로
                  <br />
                  부동산 분석을
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    혁신하세요
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  빌라, 상가, 창고 등 비정형 부동산의 가치를 정확하고 빠르게
                  분석하여 투자 의사결정에 확신을 더하세요.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-white/60 rounded-lg border border-gray-100"
                  >
                    {feature.icon}
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {feature.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                  asChild
                >
                  <Link href="/signup">
                    무료로 체험해보기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg bg-transparent"
                  asChild
                >
                  <Link href="/login">로그인</Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">200+</span>{" "}
                  전문가가 사용 중
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">10,000+</span>{" "}
                  물건 분석 완료
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              {/* Main Dashboard Preview */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-500">
                      부스터 분석 대시보드
                    </div>
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-6">
                  {/* Mock Map Area */}
                  <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg h-48 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-700">
                          지도 기반 분석
                        </div>
                      </div>
                    </div>
                    {/* Mock Markers */}
                    <div className="absolute top-8 left-12 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3.2
                    </div>
                    <div className="absolute top-16 right-16 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      4.1
                    </div>
                    <div className="absolute bottom-12 left-20 w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2.8
                    </div>
                  </div>

                  {/* Mock Data Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            서울 강남구 역삼동 빌라
                          </div>
                          <div className="text-xs text-gray-500">
                            25평 • 2010년
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          4.5억
                        </div>
                        <div className="text-xs text-green-600">+12.5%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            서울 서초구 서초동 빌라
                          </div>
                          <div className="text-xs text-gray-500">
                            22평 • 2008년
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          3.8억
                        </div>
                        <div className="text-xs text-green-600">+8.3%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-sm font-medium text-gray-900">
                    분석 완료
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">30초 소요</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white rounded-lg shadow-lg p-4">
                <div className="text-sm font-medium">수익률</div>
                <div className="text-2xl font-bold">+15.2%</div>
                <div className="text-xs opacity-90">예상 연수익률</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}

        {/* CTA Section */}
      </main>

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
                부동산 분석의 새로운 기준을 제시하는 혁신적인 플랫폼으로,
                전문가들의 투자 의사결정을 지원합니다.
              </p>
              <div className="text-sm text-gray-500">
                © 2024 Booster. All rights reserved.
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/analysis"
                    className="hover:text-white transition-colors"
                  >
                    통합 분석
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculator"
                    className="hover:text-white transition-colors"
                  >
                    수익률 계산기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favorites"
                    className="hover:text-white transition-colors"
                  >
                    관심 물건
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notices"
                    className="hover:text-white transition-colors"
                  >
                    공지사항
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    요금제
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/support"
                    className="hover:text-white transition-colors"
                  >
                    고객센터
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notices"
                    className="hover:text-white transition-colors"
                  >
                    공지사항
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
