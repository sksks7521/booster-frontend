import { Skeleton } from "@/components/ui/skeleton"

export default function FeaturesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex items-center space-x-8">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Skeleton className="h-16 w-96 mx-auto mb-6 bg-blue-500/20" />
            <Skeleton className="h-8 w-[600px] mx-auto mb-8 bg-blue-500/20" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Skeleton className="h-12 w-40 bg-blue-500/20" />
              <Skeleton className="h-12 w-40 bg-blue-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Skeleton */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <Skeleton className="h-12 w-12 mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Skeleton */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-32 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-6">
                <Skeleton className="h-10 w-10 flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Skeleton */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-6 bg-gray-700" />
          <Skeleton className="h-6 w-80 mx-auto mb-8 bg-gray-700" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-40 bg-gray-700" />
            <Skeleton className="h-12 w-32 bg-gray-700" />
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Skeleton className="h-8 w-32 mb-4 bg-gray-700" />
              <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
              <Skeleton className="h-4 w-3/4 mb-4 bg-gray-700" />
              <Skeleton className="h-4 w-48 bg-gray-700" />
            </div>
            <div>
              <Skeleton className="h-6 w-16 mb-4 bg-gray-700" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-20 bg-gray-700" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-12 mb-4 bg-gray-700" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-24 bg-gray-700" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
