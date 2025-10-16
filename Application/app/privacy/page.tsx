"use client";
import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Shield,
  Calendar,
  Download,
  PrinterIcon as Print,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  Database,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone,
} from "lucide-react";

interface PrivacySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  subsections?: {
    title: string;
    content: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
}

export default function PrivacyPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "section1",
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const privacyData: PrivacySection[] = [
    {
      id: "section1",
      title: "개인정보 처리방침 개요",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "주식회사 부스터(이하 '회사')는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.",
        "회사는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.",
        "본 방침은 2024년 1월 1일부터 시행됩니다.",
      ],
    },
    {
      id: "section2",
      title: "개인정보의 처리목적",
      icon: <Eye className="w-5 h-5" />,
      content: [
        "회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.",
      ],
      subsections: [
        {
          title: "1. 회원가입 및 관리",
          content: [
            "회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 만14세 미만 아동의 개인정보 처리 시 법정대리인의 동의여부 확인, 각종 고지·통지, 고충처리 목적으로 개인정보를 처리합니다.",
          ],
        },
        {
          title: "2. 재화 또는 서비스 제공",
          content: [
            "서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산, 채권추심을 목적으로 개인정보를 처리합니다.",
          ],
        },
        {
          title: "3. 고충처리",
          content: [
            "민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보의 목적으로 개인정보를 처리합니다.",
          ],
        },
        {
          title: "4. 마케팅 및 광고에의 활용",
          content: [
            "신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계 등을 목적으로 개인정보를 처리합니다.",
          ],
        },
      ],
    },
    {
      id: "section3",
      title: "개인정보의 처리 및 보유기간",
      icon: <Clock className="w-5 h-5" />,
      content: [
        "회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.",
      ],
      subsections: [
        {
          title: "각각의 개인정보 처리 및 보유 기간은 다음과 같습니다",
          content: [],
          table: {
            headers: ["처리목적", "보유기간", "관련법령"],
            rows: [
              ["회원가입 및 관리", "회원탈퇴 시까지", "개인정보보호법"],
              [
                "재화 또는 서비스 제공",
                "재화·서비스 공급완료 및 요금결제·정산 완료시까지",
                "전자상거래법",
              ],
              ["계약 또는 청약철회 등에 관한 기록", "5년", "전자상거래법"],
              ["대금결제 및 재화 등의 공급에 관한 기록", "5년", "전자상거래법"],
              [
                "소비자의 불만 또는 분쟁처리에 관한 기록",
                "3년",
                "전자상거래법",
              ],
              ["웹사이트 방문기록", "3개월", "통신비밀보호법"],
            ],
          },
        },
      ],
    },
    {
      id: "section4",
      title: "처리하는 개인정보의 항목",
      icon: <Database className="w-5 h-5" />,
      content: ["회사는 다음의 개인정보 항목을 처리하고 있습니다."],
      subsections: [
        {
          title: "1. 필수항목",
          content: [
            "이름, 생년월일, 성별, 이메일, 휴대전화번호, 주소",
            "서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보, 결제기록",
          ],
        },
        {
          title: "2. 선택항목",
          content: [
            "관심분야, 직업, 회사명, 부서, 직책",
            "마케팅 수신 동의 여부",
          ],
        },
        {
          title: "3. 자동 수집 항목",
          content: [
            "IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록 등",
          ],
        },
      ],
    },
    {
      id: "section5",
      title: "개인정보의 제3자 제공",
      icon: <Users className="w-5 h-5" />,
      content: [
        "회사는 정보주체의 개인정보를 개인정보의 처리목적에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.",
      ],
      subsections: [
        {
          title: "회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다",
          content: [],
          table: {
            headers: ["제공받는 자", "제공목적", "제공항목", "보유·이용기간"],
            rows: [
              [
                "결제대행업체",
                "결제처리",
                "이름, 이메일, 휴대전화번호, 결제정보",
                "결제완료 후 5년",
              ],
              [
                "배송업체",
                "상품배송",
                "이름, 주소, 휴대전화번호",
                "배송완료 후 즉시 파기",
              ],
              [
                "고객센터 운영업체",
                "고객상담",
                "이름, 이메일, 휴대전화번호, 문의내용",
                "상담완료 후 3년",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "section6",
      title: "개인정보처리의 위탁",
      icon: <Users className="w-5 h-5" />,
      content: [
        "회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.",
      ],
      subsections: [
        {
          title: "위탁업무 내용",
          content: [],
          table: {
            headers: ["위탁받는 자", "위탁업무", "개인정보 보유·이용기간"],
            rows: [
              [
                "AWS(Amazon Web Services)",
                "클라우드 서비스 제공",
                "위탁계약 종료시까지",
              ],
              ["Google Analytics", "웹사이트 분석", "수집일로부터 26개월"],
              ["SendGrid", "이메일 발송", "발송완료 후 즉시 파기"],
              ["Twilio", "SMS 발송", "발송완료 후 즉시 파기"],
            ],
          },
        },
        {
          title: "위탁업체 관리",
          content: [
            "회사는 위탁계약 체결시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.",
          ],
        },
      ],
    },
    {
      id: "section7",
      title: "정보주체의 권리·의무 및 행사방법",
      icon: <CheckCircle className="w-5 h-5" />,
      content: [
        "정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.",
      ],
      subsections: [
        {
          title: "1. 개인정보 처리현황 통지요구",
          content: [
            "정보주체는 개인정보보호법 제35조에 따른 개인정보의 처리현황에 대한 통지를 요구할 수 있습니다.",
          ],
        },
        {
          title: "2. 개인정보 열람요구",
          content: [
            "정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람을 요구할 수 있으며, 회사는 이에 지체 없이 응할 의무가 있습니다.",
          ],
        },
        {
          title: "3. 개인정보 정정·삭제요구",
          content: [
            "정보주체는 개인정보보호법 제36조에 따른 개인정보의 정정·삭제를 요구할 수 있습니다.",
            "다만, 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.",
          ],
        },
        {
          title: "4. 개인정보 처리정지요구",
          content: [
            "정보주체는 개인정보보호법 제37조에 따른 개인정보의 처리정지를 요구할 수 있습니다.",
            "다만, 개인정보 처리정지 요구시 다음 각 호의 어느 하나에 해당하는 경우에는 그 요구를 거절할 수 있습니다:",
            "• 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우",
            "• 다른 사람의 생명·신체를 해할 우려가 있거나 다른 사람의 재산과 그 밖의 이익을 부당하게 침해할 우려가 있는 경우",
            "• 공공기관이 개인정보를 처리하지 아니하면 다른 법률에서 정하는 소관 업무를 수행할 수 없는 경우",
            "• 개인정보를 처리하지 아니하면 정보주체와 약정한 서비스를 제공하지 못하는 등 계약의 이행이 곤란한 경우",
          ],
        },
        {
          title: "권리 행사 방법",
          content: [
            "위의 권리 행사는 회사에 대해 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.",
            "권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.",
          ],
        },
      ],
    },
    {
      id: "section8",
      title: "개인정보의 파기",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: [
        "회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.",
      ],
      subsections: [
        {
          title: "파기절차",
          content: [
            "이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.",
            "이 때, DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.",
          ],
        },
        {
          title: "파기방법",
          content: [
            "전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.",
            "종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.",
          ],
        },
      ],
    },
    {
      id: "section9",
      title: "개인정보의 안전성 확보조치",
      icon: <Lock className="w-5 h-5" />,
      content: [
        "회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.",
      ],
      subsections: [
        {
          title: "1. 개인정보 취급 직원의 최소화 및 교육",
          content: [
            "개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화 하여 개인정보를 관리하는 대책을 시행하고 있습니다.",
          ],
        },
        {
          title: "2. 정기적인 자체 감사 실시",
          content: [
            "개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.",
          ],
        },
        {
          title: "3. 내부관리계획의 수립 및 시행",
          content: [
            "개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.",
          ],
        },
        {
          title: "4. 개인정보의 암호화",
          content: [
            "이용자의 개인정보는 비밀번호는 암호화 되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화 하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.",
          ],
        },
        {
          title: "5. 해킹 등에 대비한 기술적 대책",
          content: [
            "회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.",
          ],
        },
        {
          title: "6. 개인정보에 대한 접근 제한",
          content: [
            "개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여,변경,말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.",
          ],
        },
        {
          title: "7. 접속기록의 보관 및 위변조 방지",
          content: [
            "개인정보처리시스템에 접속한 기록을 최소 6개월 이상 보관, 관리하고 있으며, 접속 기록이 위변조 및 도난, 분실되지 않도록 보안기능 사용하고 있습니다.",
          ],
        },
        {
          title: "8. 문서보안을 위한 잠금장치 사용",
          content: [
            "개인정보가 포함된 서류, 보조저장매체 등을 잠금장치가 있는 안전한 장소에 보관하고 있습니다.",
          ],
        },
        {
          title: "9. 비인가자에 대한 출입 통제",
          content: [
            "개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.",
          ],
        },
      ],
    },
    {
      id: "section10",
      title: "개인정보 보호책임자",
      icon: <Users className="w-5 h-5" />,
      content: [
        "회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.",
      ],
      subsections: [
        {
          title: "개인정보 보호책임자",
          content: [
            "성명: 김개인정보",
            "직책: 개인정보보호팀장",
            "직급: 팀장",
            "연락처: 02-1234-5678, privacy@booster.com",
            "※ 개인정보 보호 담당부서로 연결됩니다.",
          ],
        },
        {
          title: "개인정보 보호 담당부서",
          content: [
            "부서명: 개인정보보호팀",
            "담당자: 이담당자",
            "연락처: 02-1234-5679, privacy-team@booster.com",
          ],
        },
        {
          title: "권익침해 구제방법",
          content: [
            "정보주체는 아래의 기관에 대해 개인정보 침해에 대한 신고나 상담을 하실 수 있습니다.",
            "",
            "▶ 개인정보 침해신고센터 (한국인터넷진흥원 운영)",
            "- 소관업무: 개인정보 침해신고 접수 및 처리, 피해구제 신청 접수 및 조사 등",
            "- 홈페이지: privacy.go.kr",
            "- 전화: (국번없이) 182",
            "- 주소: (58324) 전남 나주시 진흥길 9(빛가람동 301-2) 3층 개인정보침해신고센터",
            "",
            "▶ 개인정보 분쟁조정위원회",
            "- 소관업무: 개인정보 분쟁조정신청, 집단분쟁조정 (민사상 배상)",
            "- 홈페이지: www.kopico.go.kr",
            "- 전화: (국번없이) 1833-6972",
            "- 주소: (03171)서울특별시 종로구 세종대로 209 정부서울청사 4층",
            "",
            "▶ 대검찰청 사이버범죄수사단: 02-3480-3573",
            "▶ 경찰청 사이버테러대응센터: 1566-0112",
          ],
        },
      ],
    },
    {
      id: "section11",
      title: "개인정보 처리방침 변경",
      icon: <Calendar className="w-5 h-5" />,
      content: [
        "이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.",
      ],
      subsections: [
        {
          title: "개인정보 처리방침 버전 정보",
          content: [
            "현재 버전: v1.0",
            "시행일자: 2024년 1월 1일",
            "이전 버전과의 주요 변경사항: 최초 제정",
          ],
        },
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

  const filteredPrivacy = privacyData.filter(
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
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            개인정보처리방침
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            부스터 서비스 이용 시 개인정보 보호에 관한 방침입니다
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>시행일: 2024년 1월 1일</span>
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              버전 1.0
            </Badge>
          </div>
        </div>

        {/* 중요 공지 */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>개인정보 보호 약속:</strong> 부스터는 이용자의 개인정보를
            소중히 여기며, 개인정보보호법에 따라 안전하게 관리하고 있습니다.
            개인정보 처리에 대한 문의사항이 있으시면 언제든지 연락주시기
            바랍니다.
          </AlertDescription>
        </Alert>

        {/* 검색 */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="개인정보처리방침 내용 검색..."
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
            {privacyData.map((section, index) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center p-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span className="w-6 text-center">{index + 1}.</span>
                <span className="mr-2">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 개인정보처리방침 내용 */}
        <div className="space-y-6">
          {filteredPrivacy.map((section) => (
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
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600">{section.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                  </div>
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
                      <div className="space-y-6 mt-6">
                        {section.subsections.map((subsection, subIndex) => (
                          <div
                            key={subIndex}
                            className="pl-4 border-l-2 border-blue-100"
                          >
                            <h4 className="font-medium text-gray-900 mb-3">
                              {subsection.title}
                            </h4>

                            {subsection.table ? (
                              <div className="overflow-x-auto mb-4">
                                <table className="min-w-full border border-gray-200 rounded-lg">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      {subsection.table.headers.map(
                                        (header, hIndex) => (
                                          <th
                                            key={hIndex}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                                          >
                                            {header}
                                          </th>
                                        )
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {subsection.table.rows.map(
                                      (row, rIndex) => (
                                        <tr
                                          key={rIndex}
                                          className="hover:bg-gray-50"
                                        >
                                          {row.map((cell, cIndex) => (
                                            <td
                                              key={cIndex}
                                              className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200"
                                            >
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {subsection.content.map((paragraph, pIndex) => (
                                  <p
                                    key={pIndex}
                                    className="text-gray-600 text-sm leading-relaxed whitespace-pre-line"
                                  >
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            )}
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
        {searchTerm && filteredPrivacy.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* 연락처 정보 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              개인정보 관련 문의
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="font-medium text-gray-900 mb-2">
                  개인정보 보호책임자
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>김개인정보 (개인정보보호팀장)</div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    02-1234-5678
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    privacy@booster.com
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-2">
                  개인정보 보호담당부서
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>개인정보보호팀</div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    02-1234-5679
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    privacy-team@booster.com
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs text-gray-600">
                개인정보 처리에 관한 문의사항이나 권리 행사를 원하시는 경우
                언제든지 연락주시기 바랍니다. 평일 09:00-18:00 (주말 및 공휴일
                휴무)
              </p>
            </div>
          </div>
        </div>

        {/* 외부 기관 연락처 */}
        <div className="mt-6">
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              개인정보 침해신고 및 상담
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  개인정보 침해신고센터
                </div>
                <div>privacy.go.kr</div>
                <div>(국번없이) 182</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  개인정보 분쟁조정위원회
                </div>
                <div>www.kopico.go.kr</div>
                <div>(국번없이) 1833-6972</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  사이버범죄수사단
                </div>
                <div>대검찰청</div>
                <div>02-3480-3573</div>
              </div>
            </div>
          </div>
        </div>

        {/* 관련 링크 */}
        <div className="mt-8 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              이용약관
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
