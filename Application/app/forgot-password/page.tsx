"use client"

export const metadata = {
  title: "비밀번호/아이디 찾기",
  description: "등록된 정보로 계정 복구를 진행하세요.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: false },
}

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, User, ArrowLeft, AlertCircle, CheckCircle, Send } from "lucide-react"

export default function ForgotPasswordPage() {
  const [activeTab, setActiveTab] = useState("password")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // 비밀번호 찾기 상태
  const [passwordForm, setPasswordForm] = useState({
    email: "",
  })

  // 아이디 찾기 상태
  const [idForm, setIdForm] = useState({
    name: "",
    email: "",
  })

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error || success) {
      setError("")
      setSuccess("")
    }
  }

  const handleIdFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setIdForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error || success) {
      setError("")
      setSuccess("")
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // 유효성 검사
    if (!passwordForm.email.trim()) {
      setError("이메일을 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (!passwordForm.email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.")
      setIsLoading(false)
      return
    }

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 로딩 시뮬레이션

      // 임시 비밀번호 재설정 로직
      setSuccess(
        `${passwordForm.email}로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인해주세요. (링크는 24시간 동안 유효합니다)`,
      )
      setPasswordForm({ email: "" })
    } catch (err) {
      setError("비밀번호 재설정 요청 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIdFind = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // 유효성 검사
    if (!idForm.name.trim() || !idForm.email.trim()) {
      setError("이름과 이메일을 모두 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (!idForm.email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.")
      setIsLoading(false)
      return
    }

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 로딩 시뮬레이션

      // 임시 아이디 찾기 로직
      const maskedEmail = idForm.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
      setSuccess(`입력하신 정보와 일치하는 아이디는 ${maskedEmail} 입니다.`)
      setIdForm({ name: "", email: "" })
    } catch (err) {
      setError("아이디 찾기 요청 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center mb-6">
              <div className="text-2xl font-bold text-blue-600">부스터</div>
              <div className="ml-2 text-sm text-gray-500">Booster</div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">계정 찾기</h1>
            <p className="text-gray-600">아이디 또는 비밀번호를 찾아드립니다</p>
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

          {/* 탭 메뉴 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="password" className="text-sm font-medium">
                비밀번호 찾기
              </TabsTrigger>
              <TabsTrigger value="id" className="text-sm font-medium">
                아이디 찾기
              </TabsTrigger>
            </TabsList>

            {/* 비밀번호 찾기 탭 */}
            <TabsContent value="password" className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">비밀번호를 잊으셨나요?</h2>
                <p className="text-sm text-gray-600">
                  가입하신 이메일 주소를 입력하시면
                  <br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                    이메일 주소
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      value={passwordForm.email}
                      onChange={handlePasswordFormChange}
                      placeholder="가입하신 이메일을 입력하세요"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
                  disabled={isLoading || !passwordForm.email.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>발송 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>재설정 링크 발송</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* 추가 안내 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">이메일이 오지 않나요?</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 스팸 메일함을 확인해보세요</li>
                  <li>• 이메일 주소가 정확한지 확인해보세요</li>
                  <li>• 5분 후에도 메일이 오지 않으면 다시 시도해보세요</li>
                </ul>
              </div>
            </TabsContent>

            {/* 아이디 찾기 탭 */}
            <TabsContent value="id" className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">아이디를 잊으셨나요?</h2>
                <p className="text-sm text-gray-600">
                  가입 시 입력하신 이름과 이메일을 입력하시면
                  <br />
                  아이디를 찾아드립니다.
                </p>
              </div>

              <form onSubmit={handleIdFind} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="find-name" className="text-sm font-medium text-gray-700">
                    이름
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="find-name"
                      name="name"
                      type="text"
                      value={idForm.name}
                      onChange={handleIdFormChange}
                      placeholder="가입 시 입력한 이름을 입력하세요"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="find-email" className="text-sm font-medium text-gray-700">
                    이메일 주소
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="find-email"
                      name="email"
                      type="email"
                      value={idForm.email}
                      onChange={handleIdFormChange}
                      placeholder="가입하신 이메일을 입력하세요"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-base"
                  disabled={isLoading || !idForm.name.trim() || !idForm.email.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>찾는 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>아이디 찾기</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* 추가 안내 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">아이디를 찾을 수 없나요?</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 가입 시 입력한 정보와 정확히 일치해야 합니다</li>
                  <li>• 소셜 로그인으로 가입하신 경우 해당 서비스를 이용해주세요</li>
                  <li>• 문제가 지속되면 고객센터로 문의해주세요</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* 구분선 */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-4 text-sm text-gray-500">또는</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* 하단 액션 */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">계정 정보가 기억나셨나요?</p>
              <Button variant="outline" className="w-full h-12 border-gray-300 text-gray-700 bg-transparent" asChild>
                <Link href="/login">로그인하기</Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">아직 계정이 없으신가요?</p>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/support" className="hover:text-gray-700 mr-4">
            고객센터
          </Link>
          <Link href="/faq" className="hover:text-gray-700 mr-4">
            자주 묻는 질문
          </Link>
          <Link href="/terms" className="hover:text-gray-700">
            이용약관
          </Link>
        </div>

        {/* 고객센터 안내 */}
        <div className="mt-6 p-4 bg-white/60 rounded-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">도움이 필요하신가요?</h3>
            <p className="text-xs text-gray-600 mb-3">계정 복구에 어려움이 있으시면 고객센터로 문의해주세요.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/support">고객센터 문의</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
