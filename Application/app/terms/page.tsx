"use client";

export const metadata = {
  title: "이용약관",
  description: "부스터 서비스 이용에 관한 약관을 안내합니다.",
  alternates: { canonical: "/terms" },
};
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Download,
  PrinterIcon as Print,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TermsSection {
  id: string;
  title: string;
  content: string[];
  subsections?: {
    title: string;
    content: string[];
  }[];
}

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "section1",
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const termsData: TermsSection[] = [
    {
      id: "section1",
      title: "제1조 (목적)",
      content: [
        "이 약관은 부스터(Booster) 서비스(이하 '서비스')를 제공하는 주식회사 부스터(이하 '회사')와 서비스를 이용하는 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
        "본 약관은 회사가 제공하는 모든 서비스에 적용되며, 서비스별 개별 약관이 있는 경우 해당 약관과 함께 적용됩니다.",
      ],
    },
    {
      id: "section2",
      title: "제2조 (정의)",
      content: ["이 약관에서 사용하는 용어의 정의는 다음과 같습니다:"],
      subsections: [
        {
          title: "1. '서비스'",
          content: [
            "회사가 제공하는 부동산 분석, 경매 정보 제공, 수익률 계산 등의 모든 서비스를 의미합니다.",
          ],
        },
        {
          title: "2. '회원'",
          content: [
            "회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.",
          ],
        },
        {
          title: "3. '아이디(ID)'",
          content: [
            "회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자 또는 숫자의 조합을 의미합니다.",
          ],
        },
        {
          title: "4. '비밀번호'",
          content: [
            "회원이 부여받은 아이디와 일치되는 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 의미합니다.",
          ],
        },
      ],
    },
    {
      id: "section3",
      title: "제3조 (약관의 효력 및 변경)",
      content: [
        "이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.",
        "회사는 합리적인 사유가 발생할 경우에는 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있습니다.",
        "회사가 약관을 변경할 때에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.",
        "회원이 변경된 약관에 동의하지 않는 경우, 회원은 이용계약을 해지할 수 있습니다.",
      ],
    },
    {
      id: "section4",
      title: "제4조 (서비스의 제공 및 변경)",
      content: ["회사는 다음과 같은 업무를 수행합니다:"],
      subsections: [
        {
          title: "1. 부동산 분석 서비스",
          content: [
            "부동산 시장 데이터 분석 및 제공",
            "경매 물건 정보 수집 및 분석",
            "투자 수익률 계산 및 시뮬레이션",
          ],
        },
        {
          title: "2. 정보 제공 서비스",
          content: [
            "부동산 시장 동향 정보",
            "경매 일정 및 결과 정보",
            "법령 및 제도 변경 사항",
          ],
        },
        {
          title: "3. 기타 서비스",
          content: [
            "회원 맞춤형 추천 서비스",
            "커뮤니티 및 상담 서비스",
            "교육 및 세미나 서비스",
          ],
        },
      ],
    },
    {
      id: "section5",
      title: "제5조 (서비스 이용계약의 성립)",
      content: [
        "이용계약은 회원이 되고자 하는 자(이하 '가입신청자')가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.",
        "회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다:",
      ],
      subsections: [
        {
          title: "승낙하지 않는 경우",
          content: [
            "가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우",
            "실명이 아니거나 타인의 명의를 이용한 경우",
            "허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우",
            "14세 미만 아동이 법정대리인(부모 등)의 동의를 얻지 아니한 경우",
            "이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우",
          ],
        },
      ],
    },
    {
      id: "section6",
      title: "제6조 (회원정보의 변경)",
      content: [
        "회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.",
        "회원은 회원가입 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나 전자우편 기타 방법으로 회사에 그 변경사항을 알려야 합니다.",
        "회원이 변경사항을 회사에 알리지 않아 발생한 불이익에 대하여는 회원에게 책임이 있습니다.",
      ],
    },
    {
      id: "section7",
      title: "제7조 (개인정보보호)",
      content: [
        "회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.",
        "회사는 회원의 개인정보를 회원의 동의 없이 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:",
      ],
      subsections: [
        {
          title: "개인정보 제공 예외사항",
          content: [
            "서비스 제공에 따른 요금정산을 위하여 필요한 경우",
            "통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정 개인을 알아볼 수 없는 형태로 가공하여 제공하는 경우",
            "관련 법령에 의하여 수사상의 목적으로 관계기관으로부터의 요구가 있는 경우",
            "기타 관련 법령에서 정한 절차에 따른 요청이 있는 경우",
          ],
        },
      ],
    },
    {
      id: "section8",
      title: "제8조 (회원의 의무)",
      content: ["회원은 다음 행위를 하여서는 안 됩니다:"],
      subsections: [
        {
          title: "금지행위",
          content: [
            "신청 또는 변경시 허위 내용의 등록",
            "타인의 정보 도용",
            "회사가 게시한 정보의 변경",
            "회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시",
            "회사 기타 제3자의 저작권 등 지적재산권에 대한 침해",
            "회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위",
            "외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위",
          ],
        },
      ],
    },
    {
      id: "section9",
      title: "제9조 (서비스 이용료)",
      content: [
        "회사가 제공하는 서비스는 기본적으로 무료입니다. 단, 별도의 유료 서비스의 경우 해당 서비스의 이용약관 및 정책에 따릅니다.",
        "유료 서비스를 이용하는 경우, 회원은 서비스별로 명시된 요금을 지불해야 합니다.",
        "회사는 유료 서비스 이용요금을 회원이 선택한 결제수단에 따라 즉시 결제하거나 청구할 수 있습니다.",
      ],
    },
    {
      id: "section10",
      title: "제10조 (계약해지 및 이용제한)",
      content: [
        "회원이 이용계약을 해지하고자 하는 때에는 회원 본인이 온라인을 통하여 회사에 해지신청을 하여야 합니다.",
        "회사는 회원이 다음 각호의 사유에 해당하는 경우, 사전통지 없이 이용계약을 해지하거나 또는 기간을 정하여 서비스 이용을 중단할 수 있습니다:",
      ],
      subsections: [
        {
          title: "계약해지 사유",
          content: [
            "가입 신청 시에 허위 내용을 등록한 경우",
            "다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우",
            "서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우",
          ],
        },
      ],
    },
    {
      id: "section11",
      title: "제11조 (손해배상)",
      content: [
        "회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도 동 손해가 회사의 고의 또는 중대한 과실로 인한 손해를 제외하고 이에 대하여 책임을 부담하지 아니합니다.",
        "회사가 회원에게 손해배상을 하는 경우 그 손해배상의 범위는 통상손해에 한정됩니다.",
      ],
    },
    {
      id: "section12",
      title: "제12조 (면책조항)",
      content: [
        "회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.",
        "회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.",
        "회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.",
      ],
    },
    {
      id: "section13",
      title: "제13조 (준거법 및 관할법원)",
      content: [
        "회사와 회원 간에 발생한 전자상거래 분쟁에 관한 소송은 대한민국 법을 적용하며, 본 분쟁으로 인한 소는 대한민국의 법원에 제기합니다.",
        "회사와 회원간에 발생한 분쟁에 관한 관할법원은 민사소송법상의 관할법원으로 합니다.",
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredTerms = termsData.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.some((content) =>
        content.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      section.subsections?.some(
        (sub) =>
          sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.content.some((content) =>
            content.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // 실제 구현에서는 PDF 생성 라이브러리 사용
    alert("PDF 다운로드 기능은 준비 중입니다.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">이용약관</h1>
          <p className="text-lg text-gray-600 mb-6">
            부스터 서비스 이용에 관한 약관입니다
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>시행일: 2024년 1월 1일</span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              버전 1.0
            </Badge>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="약관 내용 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 목차 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">목차</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {termsData.map((section, index) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span className="w-6 text-center">{index + 1}.</span>
                <span className="truncate">{section.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 약관 내용 */}
        <div className="space-y-6">
          {filteredTerms.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  {expandedSections.includes(section.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedSections.includes(section.id) && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="space-y-4 pt-4">
                    {section.content.map((paragraph, index) => (
                      <p key={index} className="text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}

                    {section.subsections && (
                      <div className="space-y-4 mt-6">
                        {section.subsections.map((subsection, subIndex) => (
                          <div
                            key={subIndex}
                            className="pl-4 border-l-2 border-blue-100"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">
                              {subsection.title}
                            </h4>
                            <div className="space-y-2">
                              {subsection.content.map((paragraph, pIndex) => (
                                <p
                                  key={pIndex}
                                  className="text-gray-600 text-sm leading-relaxed"
                                >
                                  {paragraph.startsWith("•")
                                    ? paragraph
                                    : `• ${paragraph}`}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 검색 결과 없음 */}
        {searchTerm && filteredTerms.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* 하단 정보 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">문의사항</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-900 mb-1">고객센터</div>
                <div>전화: 1588-0000</div>
                <div>이메일: support@booster.com</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">운영시간</div>
                <div>평일: 09:00 - 18:00</div>
                <div>주말 및 공휴일 휴무</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                본 약관에 대한 문의사항이 있으시면 언제든지 고객센터로
                연락주시기 바랍니다.
              </p>
            </div>
          </div>
        </div>

        {/* 관련 링크 */}
        <div className="mt-8 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/support"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              고객센터
            </Link>
            <Link
              href="/faq"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              자주 묻는 질문
            </Link>
            <Link
              href="/signup"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
