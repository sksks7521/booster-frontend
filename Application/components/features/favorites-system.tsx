"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Star,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { favoriteApi } from "@/lib/api";
import type { Favorite, FavoriteCount, FavoriteCheck } from "@/lib/api";

interface FavoritesSystemProps {
  className?: string;
  showCount?: boolean;
  compact?: boolean;
}

interface FavoriteButtonProps {
  auctionItemId: number;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "text" | "full";
  onToggle?: (isFavorite: boolean) => void;
}

// 개별 즐겨찾기 버튼 컴포넌트
export function FavoriteButton({
  auctionItemId,
  size = "md",
  variant = "icon",
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 컴포넌트 마운트 시 즐겨찾기 상태 확인
  useEffect(() => {
    checkFavoriteStatus();
  }, [auctionItemId]);

  const checkFavoriteStatus = async () => {
    try {
      setIsChecking(true);
      const result = await favoriteApi.checkFavorite(auctionItemId);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error("Failed to check favorite status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      setIsLoading(true);

      if (isFavorite) {
        // 즐겨찾기 제거
        await favoriteApi.removeFavorite(auctionItemId);
        setIsFavorite(false);
        onToggle?.(false);
      } else {
        // 즐겨찾기 추가
        await favoriteApi.addFavorite(auctionItemId);
        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // 에러 발생 시 상태 복구
      await checkFavoriteStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8";
      case "lg":
        return "h-12 w-12";
      default:
        return "h-10 w-10";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "lg":
        return "h-6 w-6";
      default:
        return "h-5 w-5";
    }
  };

  if (isChecking) {
    return (
      <Button variant="ghost" size="sm" className={getButtonSize()} disabled>
        <Heart className={`${getIconSize()} animate-pulse text-gray-400`} />
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`${getButtonSize()} transition-colors ${
          isFavorite
            ? "text-red-500 hover:text-red-600"
            : "text-gray-400 hover:text-red-500"
        }`}
        onClick={handleToggleFavorite}
        disabled={isLoading}
      >
        <Heart
          className={`${getIconSize()} ${isFavorite ? "fill-current" : ""} ${
            isLoading ? "animate-pulse" : ""
          }`}
        />
      </Button>
    );
  }

  if (variant === "text") {
    return (
      <Button
        variant={isFavorite ? "default" : "outline"}
        size="sm"
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
      >
        <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
        {isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`${
        isFavorite ? "bg-red-500 hover:bg-red-600" : ""
      } transition-all`}
    >
      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
      <span>{isFavorite ? "관심매물에서 제거" : "관심매물에 추가"}</span>
      {isLoading && (
        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
    </Button>
  );
}

// 즐겨찾기 개수 표시 컴포넌트
export function FavoriteCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavoriteCount();
  }, []);

  const loadFavoriteCount = async () => {
    try {
      setIsLoading(true);
      const result = await favoriteApi.getFavoriteCount();
      setCount(result.count);
    } catch (error) {
      console.error("Failed to load favorite count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Badge variant="secondary" className={className}>
        <Heart className="h-3 w-3 mr-1 animate-pulse" />
        ...
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`${className} bg-red-50 text-red-700 border-red-200`}
    >
      <Heart className="h-3 w-3 mr-1 fill-current" />
      {count}
    </Badge>
  );
}

// 전체 즐겨찾기 목록 컴포넌트
export function FavoritesSystem({
  className,
  showCount = true,
  compact = false,
}: FavoritesSystemProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
    if (showCount) {
      loadFavoriteCount();
    }
  }, [showCount]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await favoriteApi.getFavorites();
      setFavorites(result);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      setError("즐겨찾기 목록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoriteCount = async () => {
    try {
      const result = await favoriteApi.getFavoriteCount();
      setCount(result.count);
    } catch (error) {
      console.error("Failed to load favorite count:", error);
    }
  };

  const handleRemoveFavorite = async (auctionItemId: number) => {
    try {
      await favoriteApi.removeFavorite(auctionItemId);
      // 목록에서 제거
      setFavorites((prev) =>
        prev.filter((fav) => fav.item.id !== auctionItemId)
      );
      // 개수 업데이트
      if (showCount) {
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      // 실패 시 목록 다시 로드
      loadFavorites();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>즐겨찾기</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>즐겨찾기</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={loadFavorites} className="mt-4">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500 fill-current" />
            <span>즐겨찾기</span>
          </div>
          {showCount && (
            <Badge
              variant="secondary"
              className="bg-red-50 text-red-700 border-red-200"
            >
              {count}개
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          관심 있는 매물들을 모아서 비교해보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              즐겨찾기한 매물이 없습니다
            </h3>
            <p className="text-gray-500">
              관심 있는 매물에 하트 버튼을 눌러 즐겨찾기에 추가해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  compact ? "p-3" : "p-4"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h4
                          className={`font-semibold text-gray-900 mb-2 ${
                            compact ? "text-sm" : "text-base"
                          }`}
                        >
                          {favorite.item.address}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{favorite.item.property_type}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{favorite.item.area}㎡</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-lg font-bold text-blue-600">
                            {favorite.item.price.toLocaleString()}만원
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(favorite.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {compact ? "" : "보기"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveFavorite(favorite.item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {compact ? "" : "제거"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
