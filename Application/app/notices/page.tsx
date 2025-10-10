"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Megaphone,
  Search,
  Calendar,
  Eye,
  Pin,
  AlertTriangle,
  Info,
  Zap,
  Gift,
  Settings,
  Bell,
  ChevronRight,
  Clock,
  User,
  Tag,
  Share2,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  ThumbsUp,
  Download,
} from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: "announcement" | "update" | "maintenance" | "event" | "policy";
  priority: "normal" | "important" | "urgent";
  isPinned: boolean;
  isNew: boolean;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
  relatedNotices?: string[];
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedNotices, setBookmarkedNotices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 모의 공지사항 데이터
  const mockNotices: Notice[] = [
    {
      id: "notice_001",
      title: "부스터 2.0 업데이트 - 새로운 분석 기능 추가",
      content: `안녕하세요, 부스터 팀입니다.

부스터 서비스의 대규모 업데이트를 진행했습니다. 이번 2.0 업데이트에서는 다음과 같은 새로운 기능들이 추가되었습니다:

## 주요 업데이트 내용

### 1. AI 기반 투자 추천 시스템
- 머신러닝 알고리즘을 활용한 개인 맞춤형 투자 추천
- 과거 투자 패턴 분석을 통한 수익률 예측 정확도 향상
- 리스크 레벨에 따른 포트폴리오 제안

### 2. 실시간 시장 분석 대시보드
- 부동산 시장 동향 실시간 모니터링
- 지역별 가격 변동 추이 시각화
- 경매 낙찰률 및 유찰률 통계

### 3. 모바일 앱 출시
- iOS/Android 네이티브 앱 정식 출시
- 푸시 알림을 통한 관심 물건 가격 변동 알림
- 오프라인에서도 이용 가능한 즐겨찾기 기능

### 4. 협업 기능 강화
- 팀 워크스페이스 생성 및 관리
- 분석 결과 공유 및 댓글 기능
- 실시간 협업 도구 통합

## 이용 방법

새로운 기능들은 기존 계정으로 바로 이용하실 수 있습니다. 자세한 사용법은 도움말 페이지를 참고해주세요.

감사합니다.`,
      summary:
        "AI 기반 투자 추천, 실시간 시장 분석, 모바일 앱 출시 등 주요 기능이 추가된 부스터 2.0 업데이트가 완료되었습니다.",
      category: "update",
      priority: "important",
      isPinned: true,
      isNew: true,
      author: "부스터 개발팀",
      publishedAt: "2024-02-01T09:00:00Z",
      views: 1247,
      likes: 89,
      comments: 23,
      tags: ["업데이트", "AI", "모바일앱", "신기능"],
      attachments: [
        {
          name: "부스터_2.0_업데이트_가이드.pdf",
          url: "/files/booster_2.0_guide.pdf",
          size: "2.3MB",
        },
      ],
    },
    {
      id: "notice_002",
      title: "정기 서버 점검 안내 (2024년 2월 5일)",
      content: `안녕하세요, 부스터 팀입니다.

서비스 안정성 향상을 위한 정기 서버 점검을 실시합니다.

## 점검 일정
- **일시**: 2024년 2월 5일 (월) 02:00 ~ 06:00 (4시간)
- **대상**: 전체 서비스 (웹사이트, 모바일 앱)

## 점검 내용
- 서버 하드웨어 업그레이드
- 데이터베이스 최적화
- 보안 패치 적용
- 성능 개선 작업

## 주의사항
- 점검 시간 중에는 서비스 이용이 불가능합니다
- 점검 완료 후 로그인이 필요할 수 있습니다
- 점검 시간은 작업 진행 상황에 따라 연장될 수 있습니다

이용에 불편을 드려 죄송합니다.`,
      summary:
        "2024년 2월 5일 새벽 2시부터 6시까지 정기 서버 점검이 진행됩니다. 점검 시간 중에는 서비스 이용이 불가능합니다.",
      category: "maintenance",
      priority: "important",
      isPinned: true,
      isNew: false,
      author: "부스터 운영팀",
      publishedAt: "2024-01-30T14:30:00Z",
      views: 892,
      likes: 12,
      comments: 8,
      tags: ["점검", "서버", "업그레이드"],
    },
    {
      id: "notice_003",
      title: "신규 회원 대상 무료 체험 기간 연장 이벤트",
      content: `부스터를 처음 이용하시는 분들을 위한 특별 이벤트를 진행합니다!

## 이벤트 내용
- **기존**: 7일 무료 체험
- **연장**: 14일 무료 체험 (2배 연장!)

## 참여 대상
- 2024년 2월 1일 이후 신규 가입 회원
- 기존 무료 체험을 이용하지 않은 회원

## 이벤트 기간
- 2024년 2월 1일 ~ 2024년 2월 29일

## 혜택
- Pro 플랜의 모든 기능 무료 이용
- 월 100회 분석 무료 제공
- 관심 물건 50개까지 저장 가능
- 전담 고객 지원

지금 바로 가입하고 부스터의 강력한 기능을 체험해보세요!`,
      summary:
        "신규 회원 대상으로 무료 체험 기간을 기존 7일에서 14일로 연장하는 특별 이벤트를 진행합니다.",
      category: "event",
      priority: "normal",
      isPinned: false,
      isNew: true,
      author: "부스터 마케팅팀",
      publishedAt: "2024-01-28T10:15:00Z",
      views: 654,
      likes: 45,
      comments: 15,
      tags: ["이벤트", "무료체험", "신규회원", "혜택"],
    },
    {
      id: "notice_004",
      title: "개인정보처리방침 개정 안내",
      content: `개인정보보호법 개정에 따라 개인정보처리방침을 일부 개정합니다.

## 주요 변경사항
1. 개인정보 수집 항목 명확화
2. 제3자 제공 기준 구체화
3. 개인정보 보관 기간 조정
4. 이용자 권리 행사 절차 개선

## 시행일
2024년 2월 15일부터 시행됩니다.

자세한 내용은 개인정보처리방침 페이지에서 확인하실 수 있습니다.`,
      summary:
        "개인정보보호법 개정에 따른 개인정보처리방침 개정 사항을 안내드립니다.",
      category: "policy",
      priority: "normal",
      isPinned: false,
      isNew: false,
      author: "부스터 법무팀",
      publishedAt: "2024-01-25T16:20:00Z",
      views: 423,
      likes: 8,
      comments: 3,
      tags: ["개인정보", "정책", "개정"],
    },
    {
      id: "notice_005",
      title: "부스터 사용자 만족도 조사 결과 발표",
      content: `2023년 4분기 사용자 만족도 조사 결과를 발표합니다.

## 조사 개요
- 조사 기간: 2023년 12월 1일 ~ 12월 31일
- 참여 인원: 1,247명
- 응답률: 78.3%

## 주요 결과
- 전체 만족도: 4.2/5.0 (전분기 대비 0.3점 상승)
- 서비스 품질: 4.1/5.0
- 고객 지원: 4.3/5.0
- 가격 만족도: 3.9/5.0

## 개선 계획
설문 결과를 바탕으로 다음과 같은 개선 작업을 진행하겠습니다:
1. 분석 속도 개선
2. 사용자 인터페이스 개선
3. 고객 지원 채널 확대

소중한 의견을 주신 모든 분들께 감사드립니다.`,
      summary:
        "2023년 4분기 사용자 만족도 조사 결과와 향후 개선 계획을 안내드립니다.",
      category: "announcement",
      priority: "normal",
      isPinned: false,
      isNew: false,
      author: "부스터 기획팀",
      publishedAt: "2024-01-22T11:45:00Z",
      views: 567,
      likes: 34,
      comments: 12,
      tags: ["만족도조사", "결과발표", "개선계획"],
    },
  ];

  const categories = [
    { value: "all", label: "전체", icon: <Megaphone className="w-4 h-4" /> },
    {
      value: "announcement",
      label: "공지사항",
      icon: <Info className="w-4 h-4" />,
    },
    { value: "update", label: "업데이트", icon: <Zap className="w-4 h-4" /> },
    {
      value: "maintenance",
      label: "점검",
      icon: <Settings className="w-4 h-4" />,
    },
    { value: "event", label: "이벤트", icon: <Gift className="w-4 h-4" /> },
    {
      value: "policy",
      label: "정책",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

  const priorities = [
    { value: "all", label: "전체" },
    { value: "urgent", label: "긴급" },
    { value: "important", label: "중요" },
    { value: "normal", label: "일반" },
  ];

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    const loadNotices = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setNotices(mockNotices);
      setIsLoading(false);
    };

    loadNotices();
  }, []);

  useEffect(() => {
    // 필터링 및 정렬 적용
    let filtered = [...notices];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (notice) =>
          notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // 카테고리 필터
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (notice) => notice.category === selectedCategory
      );
    }

    // 우선순위 필터
    if (selectedPriority !== "all") {
      filtered = filtered.filter(
        (notice) => notice.priority === selectedPriority
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      // 고정된 공지사항을 맨 위로
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 우선순위별 정렬
      const priorityOrder = { urgent: 3, important: 2, normal: 1 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // 선택된 정렬 기준 적용
      switch (sortBy) {
        case "publishedAt":
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case "views":
          return b.views - a.views;
        case "likes":
          return b.likes - a.likes;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredNotices(filtered);
    setCurrentPage(1);
  }, [notices, searchTerm, selectedCategory, selectedPriority, sortBy]);

  const handleBookmark = (noticeId: string) => {
    setBookmarkedNotices((prev) =>
      prev.includes(noticeId)
        ? prev.filter((id) => id !== noticeId)
        : [...prev, noticeId]
    );
  };

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    // 조회수 증가 (실제로는 API 호출)
    setNotices((prev) =>
      prev.map((n) => (n.id === notice.id ? { ...n, views: n.views + 1 } : n))
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find((cat) => cat.value === category);
    return categoryData?.icon || <Info className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const categoryData = categories.find((cat) => cat.value === category);
    return categoryData?.label || category;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: any } = {
      urgent: "destructive",
      important: "default",
      normal: "secondary",
    };

    const labels: { [key: string]: string } = {
      urgent: "긴급",
      important: "중요",
      normal: "일반",
    };

    return (
      <Badge variant={variants[priority] || "secondary"}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 페이지네이션
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotices = filteredNotices.slice(startIndex, endIndex);

  if (selectedNotice) {
    // 공지사항 상세 보기
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  목록으로
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <Link href="/" className="flex items-center">
                  <div className="text-xl font-bold text-blue-600">부스터</div>
                  <div className="ml-2 text-sm text-gray-500">Booster</div>
                </Link>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  공유
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmark(selectedNotice.id)}
                  className={
                    bookmarkedNotices.includes(selectedNotice.id)
                      ? "text-blue-600"
                      : ""
                  }
                >
                  {bookmarkedNotices.includes(selectedNotice.id) ? (
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-2" />
                  )}
                  북마크
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 공지사항 헤더 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  {getCategoryIcon(selectedNotice.category)}
                  <span className="text-sm font-medium text-gray-600">
                    {getCategoryLabel(selectedNotice.category)}
                  </span>
                  {getPriorityBadge(selectedNotice.priority)}
                  {selectedNotice.isPinned && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      <Pin className="w-3 h-3 mr-1" />
                      고정
                    </Badge>
                  )}
                  {selectedNotice.isNew && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedNotice.title}
                </h1>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {selectedNotice.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDateTime(selectedNotice.publishedAt)}
                  </div>
                  {selectedNotice.updatedAt && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      수정: {formatDateTime(selectedNotice.updatedAt)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedNotice.views.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 태그 */}
            {selectedNotice.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedNotice.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-50">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 공지사항 내용 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {selectedNotice.content}
              </div>
            </div>

            {/* 첨부파일 */}
            {selectedNotice.attachments &&
              selectedNotice.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">첨부파일</h3>
                  <div className="space-y-2">
                    {selectedNotice.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {file.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {file.size}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* 액션 버튼 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  도움됨 ({selectedNotice.likes})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  댓글 ({selectedNotice.comments})
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  공유하기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBookmark(selectedNotice.id)}
                  className={
                    bookmarkedNotices.includes(selectedNotice.id)
                      ? "text-blue-600 border-blue-200"
                      : ""
                  }
                >
                  {bookmarkedNotices.includes(selectedNotice.id) ? (
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-2" />
                  )}
                  북마크
                </Button>
              </div>
            </div>
          </div>

          {/* 관련 공지사항 */}
          {selectedNotice.relatedNotices &&
            selectedNotice.relatedNotices.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  관련 공지사항
                </h3>
                <div className="space-y-3">
                  {selectedNotice.relatedNotices.map((relatedId) => {
                    const relatedNotice = notices.find(
                      (n) => n.id === relatedId
                    );
                    if (!relatedNotice) return null;

                    return (
                      <div
                        key={relatedId}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNoticeClick(relatedNotice)}
                      >
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(relatedNotice.category)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {relatedNotice.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(relatedNotice.publishedAt)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // 공지사항 목록 보기
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Megaphone className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">공지사항</h1>
          <p className="text-lg text-gray-600">
            부스터의 최신 소식과 업데이트를 확인하세요
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="공지사항 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center">
                        {category.icon}
                        <span className="ml-2">{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishedAt">최신순</SelectItem>
                  <SelectItem value="views">조회순</SelectItem>
                  <SelectItem value="likes">인기순</SelectItem>
                  <SelectItem value="title">제목순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">공지사항을 불러오는 중...</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              공지사항이 없습니다
            </h3>
            <p className="text-gray-500">
              검색 조건을 변경하거나 나중에 다시 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getCategoryIcon(notice.category)}
                      <span className="text-sm font-medium text-gray-600">
                        {getCategoryLabel(notice.category)}
                      </span>
                      {getPriorityBadge(notice.priority)}
                      {notice.isPinned && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          <Pin className="w-3 h-3 mr-1" />
                          고정
                        </Badge>
                      )}
                      {notice.isNew && (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {notice.title}
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {notice.summary}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {notice.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(notice.publishedAt)}
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {notice.views.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {notice.likes}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {notice.comments}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(notice.id);
                          }}
                          className={
                            bookmarkedNotices.includes(notice.id)
                              ? "text-blue-600"
                              : "text-gray-400"
                          }
                        >
                          {bookmarkedNotices.includes(notice.id) ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </Button>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* 태그 */}
                    {notice.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {notice.tags.slice(0, 4).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-gray-50"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {notice.tags.length > 4 && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-50"
                          >
                            +{notice.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          총 {filteredNotices.length}개의 공지사항 • 페이지 {currentPage} /{" "}
          {totalPages}
        </div>
      </div>
    </div>
  );
}
