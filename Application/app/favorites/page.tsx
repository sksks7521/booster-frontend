"use client";

export const metadata = {
  title: "관심 목록",
  robots: { index: false, follow: false },
  alternates: { canonical: "/favorites" },
};

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/header";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ExternalLink,
  MapPin,
  Trash2,
  Eye,
  Share2,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Building,
  Home,
  Store,
  Warehouse,
} from "lucide-react";
import { favoriteApi, type Favorite } from "@/lib/api";

interface FilterState {
  search: string;
  buildingType: string;
  status: string;
  priceRange: [number, number];
  profitRateRange: [number, number];
  sortBy: "created_at" | "price" | "area" | "built_year";
  sortOrder: "asc" | "desc";
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    buildingType: "all",
    status: "all",
    priceRange: [0, 1000000],
    profitRateRange: [-10, 50],
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // 미로그인 접근 가드: 안내 후 로그인 페이지로 이동
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      try {
        toast({
          title: "로그인이 필요합니다",
          description: "로그인하면 관심 물건 페이지로 자동 이동합니다.",
        });
      } catch {}
      router.replace(`/login?redirect=/favorites`);
    }
  }, [isAuthLoading, user, router, toast]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    loadFavorites();
  }, [isAuthLoading, user]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await favoriteApi.getFavorites();
      setFavorites(data);
      setError("");
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setError("관심 매물을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 필터링 및 정렬 적용
    let filtered = [...favorites];

    // 검색 필터
    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.item.address
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          item.item.property_type
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    // 건물 유형 필터
    if (filters.buildingType !== "all") {
      filtered = filtered.filter(
        (item) => item.item.property_type === filters.buildingType
      );
    }

    // 가격 범위 필터
    filtered = filtered.filter(
      (item) =>
        item.item.price >= filters.priceRange[0] &&
        item.item.price <= filters.priceRange[1]
    );

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "price":
          aValue = a.item.price;
          bValue = b.item.price;
          break;
        case "area":
          aValue = a.item.area;
          bValue = b.item.area;
          break;
        case "built_year":
          aValue = a.item.built_year;
          bValue = b.item.built_year;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredFavorites(filtered);
  }, [favorites, filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredFavorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredFavorites.map((item) => item.id.toString()));
    }
  };

  const handleRemoveSelected = async () => {
    setIsLoading(true);
    try {
      // 선택된 항목들을 병렬로 삭제
      await Promise.all(
        selectedItems.map(async (itemId) => {
          const favorite = favorites.find((f) => f.id.toString() === itemId);
          if (favorite) {
            await favoriteApi.removeFavorite(favorite.item_id);
          }
        })
      );

      setSelectedItems([]);
      setSuccess(`${selectedItems.length}개의 관심물건이 삭제되었습니다.`);

      // 목록 새로고침
      await loadFavorites();
    } catch (err) {
      console.error("Failed to remove favorites:", err);
      setError("관심물건 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await favoriteApi.removeFavorite(itemId);
      setSuccess("관심물건이 삭제되었습니다.");

      // 목록에서 제거
      setFavorites((prev) => prev.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      setError("관심물건 삭제 중 오류가 발생했습니다.");
    }
  };

  const getBuildingTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "빌라":
      case "villa":
        return <Home className="w-4 h-4" />;
      case "아파트":
      case "apartment":
        return <Building className="w-4 h-4" />;
      case "오피스텔":
      case "officetel":
        return <Building className="w-4 h-4" />;
      case "상가":
      case "commercial":
        return <Store className="w-4 h-4" />;
      case "창고":
      case "warehouse":
        return <Warehouse className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}만`;
    }
    return `${price.toLocaleString()}원`;
  };

  if (!isAuthLoading && !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관심 물건</h1>
              <p className="text-gray-600 mt-1">
                저장한 관심 물건을 관리하고 분석하세요
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                총 {favorites.length}개
              </Badge>
              <Button asChild>
                <Link href="/analysis">
                  <Plus className="w-4 h-4 mr-2" />
                  물건 찾기
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 성공/에러 메시지 */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="주소 또는 매물 유형으로 검색..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 필터 버튼 */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-transparent"
              >
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>

              {/* 정렬 */}
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) =>
                  handleFilterChange("sortBy", value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">추가일순</SelectItem>
                  <SelectItem value="price">가격순</SelectItem>
                  <SelectItem value="area">면적순</SelectItem>
                  <SelectItem value="built_year">건축년도순</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleFilterChange(
                    "sortOrder",
                    filters.sortOrder === "asc" ? "desc" : "asc"
                  )
                }
                className="bg-transparent"
              >
                {filters.sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 확장 필터 */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    건물 유형
                  </label>
                  <Select
                    value={filters.buildingType}
                    onValueChange={(value) =>
                      handleFilterChange("buildingType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="빌라">빌라</SelectItem>
                      <SelectItem value="아파트">아파트</SelectItem>
                      <SelectItem value="오피스텔">오피스텔</SelectItem>
                      <SelectItem value="상가">상가</SelectItem>
                      <SelectItem value="창고">창고</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    가격 범위 (원)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        handleFilterChange("priceRange", [
                          Number(e.target.value),
                          filters.priceRange[1],
                        ])
                      }
                      className="w-24"
                    />
                    <span className="text-gray-500">~</span>
                    <Input
                      type="number"
                      placeholder="최대"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        handleFilterChange("priceRange", [
                          filters.priceRange[0],
                          Number(e.target.value),
                        ])
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 선택된 항목 액션 */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length}개 선택됨
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="bg-transparent"
                >
                  {selectedItems.length === filteredFavorites.length
                    ? "전체 해제"
                    : "전체 선택"}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  공유
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveSelected}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 관심물건 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">관심물건을 불러오는 중...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              관심물건이 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              분석 페이지에서 마음에 드는 물건을 관심물건으로 추가해보세요.
            </p>
            <Button asChild>
              <Link href="/analysis">
                <Plus className="w-4 h-4 mr-2" />
                물건 찾기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 이미지 */}
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={`/placeholder.svg?height=200&width=300&query=${encodeURIComponent(
                      favorite.item.property_type + " " + favorite.item.address
                    )}`}
                    alt={`${favorite.item.property_type} - ${favorite.item.address}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                      {getBuildingTypeIcon(favorite.item.property_type)}
                      <span className="text-xs font-medium">
                        {favorite.item.property_type}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Checkbox
                      checked={selectedItems.includes(favorite.id.toString())}
                      onCheckedChange={() =>
                        handleSelectItem(favorite.id.toString())
                      }
                      className="bg-white/90 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* 콘텐츠 */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {favorite.item.property_type}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">
                        {favorite.item.address}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {favorite.item.area}평 • {favorite.item.built_year}년
                      </span>
                    </div>
                  </div>

                  {/* 가격 */}
                  <div className="mb-4">
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(favorite.item.price)}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      추가: {formatDate(favorite.created_at)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/item/${favorite.item.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/item/${favorite.item.id}`}
                          target="_blank"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(favorite.item_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 (향후 구현) */}
        {filteredFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={loadFavorites}>
              더 보기
            </Button>
          </div>
        )}
      </div>

      {/* Footer removed: now provided by AppShell */}
    </div>
  );
}
