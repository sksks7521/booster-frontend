"use client";

import { Share2, FileText, Heart, FileSignature } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface Props {
  itemId?: number;
}

export default function HeaderActions({ itemId }: Props) {
  const [fav, setFav] = React.useState(false);
  const router = useRouter();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        // optional: toast
      }
    } catch {}
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {}
  };

  const handleCreateReport = () => {
    if (!itemId) return;
    try {
      router.push(`/analysis/${itemId}`);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="공유"
        className="rounded p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        aria-label="인쇄"
        className="rounded p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        onClick={handlePrint}
      >
        <FileText className="w-5 h-5" />
      </button>
      <button
        aria-label="분석 보고서 생성"
        className="rounded p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        onClick={handleCreateReport}
        disabled={!itemId}
        title={itemId ? "분석 보고서 생성" : "아이템 아이디 없음"}
      >
        <FileSignature className="w-5 h-5" />
      </button>
      <button
        aria-label="즐겨찾기"
        className={`rounded p-2 ${
          fav ? "text-red-500" : "text-gray-400 hover:text-red-500"
        }`}
        onClick={() => setFav((v) => !v)}
      >
        <Heart className={`w-5 h-5 ${fav ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
