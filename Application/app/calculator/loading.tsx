export default function CalculatorLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 스켈레톤 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                {/* 탭 스켈레톤 */}
                <div className="flex space-x-4 mb-6">
                  <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>

                {/* 카드 스켈레톤 */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 버튼 스켈레톤 */}
                <div className="flex justify-center pt-6">
                  <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 스켈레톤 */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
