import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ChevronUp,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* 상단으로 스크롤 버튼 */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={scrollToTop}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ChevronUp className="w-4 h-4 mr-2" />맨 위로
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 푸터 내용 */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <Building2 className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-bold">부동산부스터</h3>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              AI 기반 부동산 투자 분석 플랫폼으로, 데이터 기반의 스마트한 투자
              결정을 도와드립니다.
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* 서비스 메뉴 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">서비스</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/analysis"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  매물 분석
                </Link>
              </li>
              <li>
                <Link
                  href="/calculator"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  투자 계산기
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  관심 매물
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  투자 리포트
                </Link>
              </li>
              <li>
                <Link
                  href="/market-trends"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  시장 동향
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  도움말
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/notice"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  공지사항
                </Link>
              </li>
              <li>
                <Link
                  href="/api-docs"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  API 문서
                </Link>
              </li>
            </ul>
          </div>

          {/* 연락처 정보 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">연락처</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-gray-400">
                  <p>서울시 강남구 테헤란로 123</p>
                  <p>부동산부스터 빌딩 10층</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">02-1234-5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">contact@booster.co.kr</span>
              </div>
            </div>

            {/* 고객센터 운영시간 */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-white mb-1">
                고객센터 운영시간
              </p>
              <p className="text-xs text-gray-400">평일 09:00 - 18:00</p>
              <p className="text-xs text-gray-400">주말, 공휴일 휴무</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-400">
              <p>&copy; 2024 부동산부스터. All rights reserved.</p>
              <div className="flex space-x-4">
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  개인정보처리방침
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  이용약관
                </Link>
                <Link
                  href="/business-info"
                  className="hover:text-white transition-colors"
                >
                  사업자정보
                </Link>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>사업자등록번호: 123-45-67890</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
