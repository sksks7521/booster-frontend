"use client";

export const metadata = {
  title: "고객센터",
  description: "문의 접수, FAQ, 내 문의내역을 확인하세요.",
  alternates: { canonical: "/support" },
};
import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Headphones,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  Search,
  HelpCircle,
  FileText,
  CreditCard,
  Settings,
  Bug,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  BookOpen,
  Video,
  Users,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Zap,
  ChevronDown,
} from "lucide-react";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
  tags: string[];
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  lastUpdate: string;
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("contact");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // 문의 폼 상태
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
    priority: "medium",
    attachments: [] as File[],
  });

  // FAQ 데이터
  const faqs: FAQ[] = [
    {
      id: "faq1",
      category: "account",
      question: "회원가입은 어떻게 하나요?",
      answer:
        "홈페이지 우측 상단의 '회원가입' 버튼을 클릭하신 후, 필요한 정보를 입력하시면 됩니다. 이름, 이메일, 전화번호, 주민번호 앞 7자리가 필요하며, 이용약관과 개인정보처리방침에 동의하셔야 합니다.",
      helpful: 45,
      tags: ["회원가입", "계정", "가입"],
    },
    {
      id: "faq2",
      category: "service",
      question: "부동산 분석 서비스는 어떻게 이용하나요?",
      answer:
        "로그인 후 '통합 분석' 메뉴에서 원하는 지역과 조건을 설정하여 검색하실 수 있습니다. 지도 기반으로 물건을 확인하고, 상세 분석 리포트를 통해 투자 수익률을 확인할 수 있습니다.",
      helpful: 38,
      tags: ["분석", "서비스", "사용법"],
    },
    {
      id: "faq3",
      category: "billing",
      question: "요금제는 어떻게 되나요?",
      answer:
        "무료 체험(7일), Basic(월 29,000원), Pro(월 59,000원), Enterprise(월 199,000원) 요금제가 있습니다. 각 요금제별로 분석 횟수와 기능에 차이가 있으며, 언제든지 업그레이드 가능합니다.",
      helpful: 52,
      tags: ["요금제", "결제", "플랜"],
    },
    {
      id: "faq4",
      category: "technical",
      question: "로그인이 안 돼요.",
      answer:
        "이메일과 비밀번호를 정확히 입력했는지 확인해주세요. 비밀번호를 잊으셨다면 '비밀번호 찾기'를 이용하시거나, 브라우저 쿠키를 삭제한 후 다시 시도해보세요. 문제가 지속되면 고객센터로 연락주세요.",
      helpful: 29,
      tags: ["로그인", "비밀번호", "접속"],
    },
    {
      id: "faq5",
      category: "service",
      question: "관심 물건은 몇 개까지 저장할 수 있나요?",
      answer:
        "요금제에 따라 다릅니다. 무료 체험: 5개, Basic: 20개, Pro: 50개, Enterprise: 무제한입니다. 관심 물건은 '관심 물건' 메뉴에서 관리할 수 있습니다.",
      helpful: 33,
      tags: ["관심물건", "저장", "한도"],
    },
    {
      id: "faq6",
      category: "account",
      question: "회원 탈퇴는 어떻게 하나요?",
      answer:
        "마이페이지 > 설정 > 계정 관리에서 '계정 탈퇴' 버튼을 클릭하시면 됩니다. 탈퇴 시 모든 데이터가 삭제되며, 복구가 불가능하니 신중히 결정해주세요.",
      helpful: 18,
      tags: ["탈퇴", "계정삭제", "회원"],
    },
    {
      id: "faq7",
      category: "billing",
      question: "환불 정책은 어떻게 되나요?",
      answer:
        "유료 서비스 이용 후 7일 이내에 환불 요청 시 100% 환불 가능합니다. 단, 서비스를 실제로 이용한 경우 이용한 만큼 차감 후 환불됩니다. 환불 요청은 고객센터로 연락주세요.",
      helpful: 41,
      tags: ["환불", "취소", "정책"],
    },
    {
      id: "faq8",
      category: "technical",
      question: "모바일에서도 이용할 수 있나요?",
      answer:
        "네, 모바일 브라우저에서 이용 가능합니다. 반응형 웹으로 제작되어 스마트폰과 태블릿에서도 편리하게 이용하실 수 있습니다. 별도의 앱 설치는 필요하지 않습니다.",
      helpful: 27,
      tags: ["모바일", "앱", "접속"],
    },
  ];

  // 최근 티켓 데이터
  const recentTickets: SupportTicket[] = [
    {
      id: "T2024-001",
      subject: "분석 결과가 이상해요",
      category: "technical",
      status: "in-progress",
      priority: "medium",
      createdAt: "2024-02-01T10:30:00Z",
      lastUpdate: "2024-02-01T14:20:00Z",
    },
    {
      id: "T2024-002",
      subject: "결제 오류 문의",
      category: "billing",
      status: "resolved",
      priority: "high",
      createdAt: "2024-01-30T16:45:00Z",
      lastUpdate: "2024-01-31T09:15:00Z",
    },
  ];

  const categories = [
    { value: "all", label: "전체", icon: <HelpCircle className="w-4 h-4" /> },
    {
      value: "account",
      label: "계정/회원",
      icon: <Users className="w-4 h-4" />,
    },
    {
      value: "service",
      label: "서비스 이용",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      value: "billing",
      label: "결제/요금",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      value: "technical",
      label: "기술 문제",
      icon: <Bug className="w-4 h-4" />,
    },
    {
      value: "suggestion",
      label: "제안/개선",
      icon: <Lightbulb className="w-4 h-4" />,
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactFormChange = (field: string, value: string) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // 유효성 검사
    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      setError("필수 항목을 모두 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(
        "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다."
      );
      setContactForm({
        name: "",
        email: "",
        phone: "",
        category: "",
        subject: "",
        message: "",
        priority: "medium",
        attachments: [],
      });
    } catch (err) {
      setError("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      open: "default",
      "in-progress": "secondary",
      resolved: "outline",
      closed: "destructive",
    };

    const labels: { [key: string]: string } = {
      open: "접수",
      "in-progress": "처리중",
      resolved: "해결",
      closed: "종료",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-blue-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Headphones className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">고객센터</h1>
          <p className="text-lg text-gray-600 mb-8">
            궁금한 점이 있으시면 언제든지 문의해주세요
          </p>

          {/* 빠른 연락처 */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">전화 상담</h3>
              <p className="text-2xl font-bold text-blue-600 mb-1">1588-0000</p>
              <p className="text-sm text-gray-500">평일 09:00-18:00</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">이메일 문의</h3>
              <p className="text-lg font-bold text-green-600 mb-1">
                support@booster.com
              </p>
              <p className="text-sm text-gray-500">24시간 접수</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">실시간 채팅</h3>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                채팅 시작
              </Button>
            </div>
          </div>
        </div>

        {/* 성공/에러 메시지 */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 max-w-4xl mx-auto">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 메인 탭 */}
        <div className="max-w-6xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="contact" className="text-sm font-medium">
                <Send className="w-4 h-4 mr-2" />
                문의하기
              </TabsTrigger>
              <TabsTrigger value="faq" className="text-sm font-medium">
                <HelpCircle className="w-4 h-4 mr-2" />
                자주 묻는 질문
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-sm font-medium">
                <FileText className="w-4 h-4 mr-2" />내 문의내역
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-sm font-medium">
                <BookOpen className="w-4 h-4 mr-2" />
                도움말
              </TabsTrigger>
            </TabsList>

            {/* 문의하기 탭 */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* 문의 폼 */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      문의 작성
                    </h2>

                    <form onSubmit={handleSubmitContact} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="text-sm font-medium text-gray-700"
                          >
                            이름 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={contactForm.name}
                            onChange={(e) =>
                              handleContactFormChange("name", e.target.value)
                            }
                            placeholder="이름을 입력하세요"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700"
                          >
                            이메일 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) =>
                              handleContactFormChange("email", e.target.value)
                            }
                            placeholder="이메일을 입력하세요"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium text-gray-700"
                          >
                            전화번호
                          </Label>
                          <Input
                            id="phone"
                            value={contactForm.phone}
                            onChange={(e) =>
                              handleContactFormChange("phone", e.target.value)
                            }
                            placeholder="010-0000-0000"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="category"
                            className="text-sm font-medium text-gray-700"
                          >
                            문의 유형 <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={contactForm.category}
                            onValueChange={(value) =>
                              handleContactFormChange("category", value)
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="문의 유형을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.slice(1).map((category) => (
                                <SelectItem
                                  key={category.value}
                                  value={category.value}
                                >
                                  <div className="flex items-center">
                                    {category.icon}
                                    <span className="ml-2">
                                      {category.label}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="priority"
                          className="text-sm font-medium text-gray-700"
                        >
                          우선순위
                        </Label>
                        <Select
                          value={contactForm.priority}
                          onValueChange={(value) =>
                            handleContactFormChange("priority", value)
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">낮음</SelectItem>
                            <SelectItem value="medium">보통</SelectItem>
                            <SelectItem value="high">높음</SelectItem>
                            <SelectItem value="urgent">긴급</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="subject"
                          className="text-sm font-medium text-gray-700"
                        >
                          제목 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="subject"
                          value={contactForm.subject}
                          onChange={(e) =>
                            handleContactFormChange("subject", e.target.value)
                          }
                          placeholder="문의 제목을 입력하세요"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="message"
                          className="text-sm font-medium text-gray-700"
                        >
                          문의 내용 <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          value={contactForm.message}
                          onChange={(e) =>
                            handleContactFormChange("message", e.target.value)
                          }
                          placeholder="문의 내용을 자세히 작성해주세요"
                          rows={6}
                          disabled={isSubmitting}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>접수 중...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Send className="w-4 h-4" />
                            <span>문의 접수</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* 사이드바 정보 */}
                <div className="space-y-6">
                  {/* 운영시간 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" />
                      운영시간
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>평일</span>
                        <span className="font-medium">09:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>토요일</span>
                        <span className="font-medium">09:00 - 13:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>일요일/공휴일</span>
                        <span className="text-red-600">휴무</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        점심시간(12:00-13:00)에는 전화 상담이 어려울 수
                        있습니다.
                      </p>
                    </div>
                  </div>

                  {/* 응답시간 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-600" />
                      평균 응답시간
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          실시간 채팅
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          즉시
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          이메일 문의
                        </span>
                        <Badge variant="outline">24시간 이내</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">전화 상담</span>
                        <Badge variant="outline">즉시 연결</Badge>
                      </div>
                    </div>
                  </div>

                  {/* 문의 팁 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                      문의 팁
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        구체적인 상황을 자세히 설명해주세요
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        오류 메시지가 있다면 함께 첨부해주세요
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        사용 중인 브라우저와 기기 정보를 알려주세요
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        스크린샷이 있으면 더욱 빠른 해결이 가능합니다
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* FAQ 탭 */}
            <TabsContent value="faq" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  {/* 검색 */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="FAQ 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 카테고리 필터 */}
                  <div className="lg:w-48">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center">
                              {category.icon}
                              <span className="ml-2">{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* FAQ 목록 */}
                <div className="space-y-4">
                  {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12">
                      <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        검색 결과가 없습니다
                      </h3>
                      <p className="text-gray-500">
                        다른 검색어나 카테고리를 시도해보세요.
                      </p>
                    </div>
                  ) : (
                    filteredFAQs.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-gray-200 rounded-lg"
                      >
                        <details className="group">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 group-open:text-blue-600">
                                {faq.question}
                              </h3>
                              <div className="flex items-center space-x-2 mt-2">
                                {faq.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                {faq.helpful}
                              </div>
                              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                            </div>
                          </summary>
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed mt-3">
                              {faq.answer}
                            </p>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <div className="text-sm text-gray-500">
                                이 답변이 도움이 되었나요?
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  도움됨
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-gray-600"
                                >
                                  개선 요청
                                </Button>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 내 문의내역 탭 */}
            <TabsContent value="tickets" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    내 문의내역
                  </h2>
                  <Button variant="outline" asChild>
                    <Link href="#contact">
                      <Send className="w-4 h-4 mr-2" />새 문의 작성
                    </Link>
                  </Button>
                </div>

                {recentTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      문의내역이 없습니다
                    </h3>
                    <p className="text-gray-500 mb-4">
                      궁금한 점이 있으시면 언제든지 문의해주세요.
                    </p>
                    <Button asChild>
                      <Link href="#contact">문의하기</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {ticket.subject}
                              </h3>
                              {getStatusBadge(ticket.status)}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>티켓 번호: {ticket.id}</span>
                              <span>생성: {formatDate(ticket.createdAt)}</span>
                              <span>
                                최근 업데이트: {formatDate(ticket.lastUpdate)}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 도움말 탭 */}
            <TabsContent value="resources" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 사용자 가이드 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <BookOpen className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    사용자 가이드
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    부스터 서비스 이용 방법을 단계별로 안내합니다.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <BookOpen className="w-4 h-4 mr-2" />
                    가이드 보기
                  </Button>
                </div>

                {/* 동영상 튜토리얼 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <Video className="w-8 h-8 text-red-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    동영상 튜토리얼
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    영상으로 쉽게 배우는 부스터 사용법입니다.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Video className="w-4 h-4 mr-2" />
                    영상 보기
                  </Button>
                </div>

                {/* API 문서 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <FileText className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">API 문서</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    개발자를 위한 API 연동 가이드입니다.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    문서 보기
                  </Button>
                </div>

                {/* 릴리즈 노트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <Calendar className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    릴리즈 노트
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    최신 업데이트와 새로운 기능을 확인하세요.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Calendar className="w-4 h-4 mr-2" />
                    업데이트 보기
                  </Button>
                </div>

                {/* 커뮤니티 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <Users className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    사용자 커뮤니티
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    다른 사용자들과 정보를 공유하고 소통하세요.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    커뮤니티 가기
                  </Button>
                </div>

                {/* 다운로드 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <Download className="w-8 h-8 text-indigo-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    자료 다운로드
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    브로슈어, 가이드북 등을 다운로드하세요.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    자료실 가기
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 하단 연락처 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                추가 도움이 필요하신가요?
              </h3>
              <p className="text-gray-600">
                언제든지 연락주시면 친절하게 도와드리겠습니다.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-medium text-gray-900 mb-1">본사 주소</div>
                <div className="text-sm text-gray-600">
                  서울특별시 강남구 테헤란로 123
                  <br />
                  부스터빌딩 10층
                </div>
              </div>

              <div className="text-center">
                <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="font-medium text-gray-900 mb-1">
                  고객센터 운영시간
                </div>
                <div className="text-sm text-gray-600">
                  평일: 09:00 - 18:00
                  <br />
                  토요일: 09:00 - 13:00 (일요일/공휴일 휴무)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
