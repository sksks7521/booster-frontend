import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="text-2xl font-bold text-blue-400">부스터</div>
              <div className="ml-2 text-sm text-gray-400">Booster</div>
            </div>
            <p className="text-gray-400 mb-4">
              부동산 투자의 새로운 기준을 제시하는 AI 기반 분석 플랫폼입니다.
            </p>
            <div className="text-sm text-gray-500">
              <p>© 2024 Booster. All rights reserved.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  href="/analysis"
                  className="hover:text-white transition-colors"
                >
                  부동산 분석
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
                  href="/pricing"
                  className="hover:text-white transition-colors"
                >
                  요금제
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">고객지원</h3>
            <ul className="space-y-2 text-gray-400">
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

          <div>
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <div className="space-y-2 text-gray-400">
              <p>이메일: support@booster.com</p>
              <p>전화: 1588-0000</p>
              <p>주소: 서울시 강남구 테헤란로 123</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
