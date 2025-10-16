"use client";

import { Suspense } from "react";
import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { identifyUser, setSuperProperties } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 입력 시 에러 메시지 제거
    if (error) setError("");
  };

  const handleRememberMeChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      rememberMe: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 기본 유효성 검사
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 로딩 시뮬레이션

      // 임시 로그인 로직 (실제로는 백엔드 API 연동)
      if (
        formData.email === "demo@booster.com" &&
        formData.password === "demo123"
      ) {
        // 성공 시 토큰 저장 (실제로는 secure storage 사용)
        localStorage.setItem("booster_token", "demo_token_123");
        localStorage.setItem(
          "booster_user",
          JSON.stringify({
            email: formData.email,
            subscription: {
              plan: "Pro",
              expiresAt: "2024-12-31",
            },
          })
        );

        // Mixpanel identify + super props
        try {
          identifyUser(formData.email);
          setSuperProperties({
            environment: process.env.NODE_ENV,
            route: "/login",
          });
        } catch {}

        // 리디렉션 복귀: redirect 파라미터가 있으면 해당 경로로, 없으면 분석 페이지로 이동
        const target =
          redirect && redirect.startsWith("/") ? redirect : "/analysis";
        router.push(target);
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-600 hover:text-gray-900"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center mb-6">
              <div className="text-2xl font-bold text-blue-600">부스터</div>
              <div className="ml-2 text-sm text-gray-500">Booster</div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">부동산 분석을 시작하세요</p>
          </div>

          {/* redirect 안내 배너 */}
          {redirect && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              로그인 완료 후 이전 페이지로 돌아갑니다.
            </div>
          )}

          {/* 데모 계정 안내 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">데모 계정으로 체험해보세요</div>
              <div className="text-xs text-blue-600">
                이메일: demo@booster.com
                <br />
                비밀번호: demo123
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력하세요"
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 로그인 유지 및 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={handleRememberMeChange}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  로그인 상태 유지
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-4 text-sm text-gray-500">또는</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">아직 계정이 없으신가요?</p>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 bg-transparent"
              asChild
            >
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700 mr-4">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 mr-4">
            개인정보처리방침
          </Link>
          <Link href="/support" className="hover:text-gray-700">
            고객센터
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
