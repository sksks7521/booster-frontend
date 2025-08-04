import Header from "@/components/layout/header"

export default function PropertyDetailLoading() {
  const user = {
    email: "user@example.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* 상단 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 기본 정보 카드 */}
              <div className="bg-white rounded-lg p-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>

              {/* 이미지 갤러리 */}
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-video bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>

              {/* 탭 영역 */}
              <div className="bg-white rounded-lg">
                <div className="border-b">
                  <div className="flex space-x-8 p-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-16"></div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* 액션 버튼들 */}
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
