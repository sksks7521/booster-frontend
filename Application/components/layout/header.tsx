"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">부스터</div>
            <div className="ml-2 text-sm text-gray-500">Booster</div>
          </Link>

          {/* Desktop Navigation - 4 dropdown groups */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* 기능소개 */}
            <Link
              href="/features"
              className="flex items-center text-gray-700 hover:text-blue-600 font-medium"
            >
              기능소개
            </Link>

            {/* 요금제 */}
            <Link
              href="/pricing"
              className="flex items-center text-gray-700 hover:text-blue-600 font-medium"
            >
              요금제
            </Link>

            {/* 서비스 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-gray-700 hover:text-blue-600 font-medium cursor-pointer">
                서비스 <ChevronDown className="w-4 h-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/analysis">통합 분석</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/calculator">수익률 계산기</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites">관심 물건</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* 기능소개로 이동됨 */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 고객지원 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-gray-700 hover:text-blue-600 font-medium cursor-pointer">
                고객지원 <ChevronDown className="w-4 h-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/support">고객센터</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notices">공지사항</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/terms">이용약관</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/privacy">개인정보처리방침</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.email}</div>
                  {user.subscription && (
                    <div className="text-blue-600 text-xs">
                      {user.subscription.plan} 플랜
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mypage">
                    <User className="w-4 h-4 mr-2" />내 정보
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <div>
                <div className="text-xs tracking-wider text-gray-500 mb-1">
                  기능소개
                </div>
                <div className="flex flex-col">
                  <Link
                    href="/features"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    기능 소개
                  </Link>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs tracking-wider text-gray-500 mb-1">
                  요금제
                </div>
                <div className="flex flex-col">
                  <Link
                    href="/pricing"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    요금제
                  </Link>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs tracking-wider text-gray-500 mb-1">
                  서비스
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/analysis"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    통합 분석
                  </Link>
                  <Link
                    href="/calculator"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    수익률 계산기
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    관심 물건
                  </Link>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs tracking-wider text-gray-500 mb-1">
                  고객지원
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/support"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    고객센터
                  </Link>
                  <Link
                    href="/notices"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    공지사항
                  </Link>
                  <Link
                    href="/terms"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    이용약관
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-gray-700 hover:text-blue-600 text-sm"
                  >
                    개인정보처리방침
                  </Link>
                </div>
              </div>
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {user.email}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      asChild
                    >
                      <Link href="/mypage">
                        <User className="w-4 h-4 mr-2" />내 정보
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start cursor-pointer"
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">회원가입</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
