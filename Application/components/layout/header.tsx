"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut } from "lucide-react"

interface HeaderProps {
  user?: {
    email: string
    subscription?: {
      plan: string
      expiresAt: string
    }
  }
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">부스터</div>
            <div className="ml-2 text-sm text-gray-500">Booster</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-700 hover:text-blue-600 font-medium">
              기능
            </Link>
            <Link href="/analysis" className="text-gray-700 hover:text-blue-600 font-medium">
              통합 분석
            </Link>
            <Link href="/calculator" className="text-gray-700 hover:text-blue-600 font-medium">
              수익률 계산기
            </Link>
            <Link href="/favorites" className="text-gray-700 hover:text-blue-600 font-medium">
              관심 물건
            </Link>
            <Link href="/notices" className="text-gray-700 hover:text-blue-600 font-medium">
              공지사항
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.email}</div>
                  {user.subscription && <div className="text-blue-600 text-xs">{user.subscription.plan} 플랜</div>}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mypage">
                    <User className="w-4 h-4 mr-2" />내 정보
                  </Link>
                </Button>
                <Button variant="ghost" size="sm">
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
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/features" className="text-gray-700 hover:text-blue-600 font-medium">
                기능
              </Link>
              <Link href="/analysis" className="text-gray-700 hover:text-blue-600 font-medium">
                통합 분석
              </Link>
              <Link href="/calculator" className="text-gray-700 hover:text-blue-600 font-medium">
                수익률 계산기
              </Link>
              <Link href="/favorites" className="text-gray-700 hover:text-blue-600 font-medium">
                관심 물건
              </Link>
              <Link href="/notices" className="text-gray-700 hover:text-blue-600 font-medium">
                공지사항
              </Link>
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">{user.email}</div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/mypage">
                        <User className="w-4 h-4 mr-2" />내 정보
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start">
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
  )
}
