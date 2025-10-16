"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-600">입력한 주소가 정확한지 확인해주세요.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded">
            홈으로
          </Link>
          <button
            onClick={() => history.back()}
            className="px-4 py-2 border rounded"
          >
            이전
          </button>
        </div>
      </div>
    </div>
  );
}
