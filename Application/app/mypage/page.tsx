"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Header from "@/components/layout/header"
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  Heart,
  BarChart3,
  Settings,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Crown,
  TrendingUp,
  Clock,
} from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  joinDate: string
  lastLogin: string
  profileImage?: string
  phone?: string
}

interface Subscription {
  plan: "Free Trial" | "Basic" | "Pro" | "Enterprise"
  status: "active" | "expired" | "cancelled"
  startDate: string
  expiresAt: string
  autoRenew: boolean
  usageLimit: {
    analyses: { used: number; total: number }
    favorites: { used: number; total: number }
  }
}

interface ActivityItem {
  id: string
  type: "analysis" | "favorite" | "login"
  title: string
  description: string
  date: string
  status?: "completed" | "in-progress"
}

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // 사용자 프로필 데이터
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "user_123",
    name: "김부동산",
    email: "demo@booster.com",
    joinDate: "2024-01-15",
    lastLogin: "2024-02-01T10:30:00Z",
    phone: "010-1234-5678",
  })

  // 구독 정보
  const subscription: Subscription = {
    plan: "Pro",
    status: "active",
    startDate: "2024-01-15",
    expiresAt: "2024-12-31",
    autoRenew: true,
    usageLimit: {
      analyses: { used: 45, total: 100 },
      favorites: { used: 12, total: 50 },
    },
  }

  // 비밀번호 변경 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 알림 설정
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    analysis: true,
  })

  // 최근 활동
  const recentActivities: ActivityItem[] = [
    {
      id: "1",
      type: "analysis",
      title: "서울 강남구 역삼동 빌라 분석",
      description: "수익률 15.2% 예상",
      date: "2024-02-01T09:30:00Z",
      status: "completed",
    },
    {
      id: "2",
      type: "favorite",
      title: "관심 물건 추가",
      description: "서울 서초구 서초동 빌라",
      date: "2024-01-31T14:20:00Z",
    },
    {
      id: "3",
      type: "analysis",
      title: "부산 해운대구 상가 분석",
      description: "수익률 8.7% 예상",
      date: "2024-01-30T16:45:00Z",
      status: "completed",
    },
    {
      id: "4",
      type: "login",
      title: "로그인",
      description: "Chrome 브라우저에서 접속",
      date: "2024-01-30T08:15:00Z",
    },
  ]

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("프로필이 성공적으로 업데이트되었습니다.")
      setIsEditing(false)
    } catch (err) {
      setError("프로필 업데이트 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // 유효성 검사
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("비밀번호가 성공적으로 변경되었습니다.")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      setError("비밀번호 변경 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "Free Trial":
        return "bg-gray-100 text-gray-800"
      case "Basic":
        return "bg-blue-100 text-blue-800"
      case "Pro":
        return "bg-purple-100 text-purple-800"
      case "Enterprise":
        return "bg-gold-100 text-gold-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "analysis":
        return <BarChart3 className="w-4 h-4 text-blue-600" />
      case "favorite":
        return <Heart className="w-4 h-4 text-red-600" />
      case "login":
        return <User className="w-4 h-4 text-green-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 사용자 정보 (Header에 전달)
  const user = {
    email: userProfile.email,
    subscription: {
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
              <p className="text-gray-600 mt-1">계정 정보와 설정을 관리하세요</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getPlanBadgeColor(subscription.plan)} font-medium`}>
                <Crown className="w-4 h-4 mr-1" />
                {subscription.plan}
              </Badge>
            </div>
          </div>
        </div>

        {/* 성공/에러 메시지 */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* 프로필 요약 */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{userProfile.name}</h3>
                <p className="text-sm text-gray-500">{userProfile.email}</p>
                <p className="text-xs text-gray-400 mt-1">가입일: {formatDate(userProfile.joinDate)}</p>
              </div>

              {/* 사용량 요약 */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">분석 사용량</span>
                    <span className="font-medium">
                      {subscription.usageLimit.analyses.used}/{subscription.usageLimit.analyses.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (subscription.usageLimit.analyses.used / subscription.usageLimit.analyses.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">관심 물건</span>
                    <span className="font-medium">
                      {subscription.usageLimit.favorites.used}/{subscription.usageLimit.favorites.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (subscription.usageLimit.favorites.used / subscription.usageLimit.favorites.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 빠른 액션 */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/analysis">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    분석하기
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/favorites">
                    <Heart className="w-4 h-4 mr-2" />
                    관심 물건
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    플랜 업그레이드
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="profile" className="text-sm font-medium">
                  <User className="w-4 h-4 mr-2" />
                  프로필
                </TabsTrigger>
                <TabsTrigger value="subscription" className="text-sm font-medium">
                  <CreditCard className="w-4 h-4 mr-2" />
                  구독
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-sm font-medium">
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  활동
                </TabsTrigger>
              </TabsList>

              {/* 프로필 탭 */}
              <TabsContent value="profile" className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">프로필 정보</h2>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={isLoading}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      {isEditing ? "취소" : "편집"}
                    </Button>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          이름
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="name"
                            value={userProfile.name}
                            onChange={(e) => setUserProfile((prev) => ({ ...prev, name: e.target.value }))}
                            className="pl-10"
                            disabled={!isEditing || isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          이메일
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="email"
                            type="email"
                            value={userProfile.email}
                            onChange={(e) => setUserProfile((prev) => ({ ...prev, email: e.target.value }))}
                            className="pl-10"
                            disabled={!isEditing || isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          전화번호
                        </Label>
                        <Input
                          id="phone"
                          value={userProfile.phone || ""}
                          onChange={(e) => setUserProfile((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="010-0000-0000"
                          disabled={!isEditing || isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">가입일</Label>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(userProfile.joinDate)}</span>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                        >
                          취소
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    )}
                  </form>
                </div>

                {/* 비밀번호 변경 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">비밀번호 변경</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                        현재 비밀번호
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                        새 비밀번호
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        새 비밀번호 확인
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "변경 중..." : "비밀번호 변경"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* 구독 탭 */}
              <TabsContent value="subscription" className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">구독 정보</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <div className="font-semibold text-purple-900">현재 플랜</div>
                          <div className="text-2xl font-bold text-purple-600">{subscription.plan}</div>
                        </div>
                        <Crown className="w-8 h-8 text-purple-600" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">상태</span>
                          <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                            {subscription.status === "active" ? "활성" : "비활성"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">시작일</span>
                          <span className="font-medium">{formatDate(subscription.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">만료일</span>
                          <span className="font-medium">{formatDate(subscription.expiresAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">자동 갱신</span>
                          <Badge variant={subscription.autoRenew ? "default" : "outline"}>
                            {subscription.autoRenew ? "활성" : "비활성"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">사용량 현황</h3>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">월간 분석 횟수</span>
                            <span className="font-medium">
                              {subscription.usageLimit.analyses.used}/{subscription.usageLimit.analyses.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${
                                  (subscription.usageLimit.analyses.used / subscription.usageLimit.analyses.total) * 100
                                }%`,
                              }}
                            >
                              <span className="text-xs text-white font-medium">
                                {Math.round(
                                  (subscription.usageLimit.analyses.used / subscription.usageLimit.analyses.total) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">관심 물건 저장</span>
                            <span className="font-medium">
                              {subscription.usageLimit.favorites.used}/{subscription.usageLimit.favorites.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-red-500 h-3 rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${
                                  (subscription.usageLimit.favorites.used / subscription.usageLimit.favorites.total) *
                                  100
                                }%`,
                              }}
                            >
                              <span className="text-xs text-white font-medium">
                                {Math.round(
                                  (subscription.usageLimit.favorites.used / subscription.usageLimit.favorites.total) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button asChild>
                        <Link href="/pricing">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          플랜 업그레이드
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/billing">
                          <CreditCard className="w-4 h-4 mr-2" />
                          결제 내역
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 설정 탭 */}
              <TabsContent value="settings" className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">알림 설정</h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">이메일 알림</div>
                          <div className="text-sm text-gray-500">중요한 업데이트를 이메일로 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">푸시 알림</div>
                          <div className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">분석 완료 알림</div>
                          <div className="text-sm text-gray-500">분석이 완료되면 알림을 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.analysis}
                        onCheckedChange={(checked) => handleNotificationChange("analysis", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">마케팅 정보</div>
                          <div className="text-sm text-gray-500">새로운 기능과 프로모션 정보를 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => handleNotificationChange("marketing", checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* 계정 관리 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">계정 관리</h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-900">데이터 내보내기</div>
                          <div className="text-sm text-yellow-700 mt-1">
                            분석 데이터와 관심 물건 목록을 내보낼 수 있습니다.
                          </div>
                          <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                            데이터 내보내기
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-red-900">계정 탈퇴</div>
                          <div className="text-sm text-red-700 mt-1">
                            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                          </div>
                          <Button variant="destructive" size="sm" className="mt-3">
                            계정 탈퇴
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 활동 탭 */}
              <TabsContent value="activity" className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">최근 활동</h2>

                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 truncate">{activity.title}</div>
                            <div className="text-sm text-gray-500 ml-2">{formatDateTime(activity.date)}</div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                          {activity.status && (
                            <Badge variant={activity.status === "completed" ? "default" : "secondary"} className="mt-2">
                              {activity.status === "completed" ? "완료" : "진행중"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline">더 보기</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
