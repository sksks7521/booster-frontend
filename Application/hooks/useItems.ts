"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { type Item } from "@/lib/api";
import { useFilterStore } from "@/store/filterStore";

// 🔄 C번 문제 해결: 서버 정렬 검증 함수
function checkIfSorted(
  items: any[],
  sortBy: string,
  sortOrder: string
): boolean {
  if (items.length < 2) return true;

  for (let i = 0; i < items.length - 1; i++) {
    const current = getSortValue(items[i], sortBy);
    const next = getSortValue(items[i + 1], sortBy);

    if (sortOrder === "asc") {
      if (current > next) {
        console.log(
          `⚠️ [Sort] 정렬 검증 실패: ${current} > ${next} (${sortBy} asc)`
        );
        return false;
      }
    } else if (sortOrder === "desc") {
      if (current < next) {
        console.log(
          `⚠️ [Sort] 정렬 검증 실패: ${current} < ${next} (${sortBy} desc)`
        );
        return false;
      }
    }
  }

  return true;
}

// 🔄 C번 문제 해결: 클라이언트 사이드 정렬 함수
function clientSideSort(
  items: any[],
  sortBy: string,
  sortOrder: string
): any[] {
  return [...items].sort((a, b) => {
    const aVal = getSortValue(a, sortBy);
    const bVal = getSortValue(b, sortBy);

    let comparison = 0;
    if (aVal > bVal) comparison = 1;
    if (aVal < bVal) comparison = -1;

    return sortOrder === "desc" ? -comparison : comparison;
  });
}

// 🔄 정렬 값 추출 함수 (타입별 적절한 변환)
function getSortValue(item: any, sortBy: string): any {
  const value = item[sortBy];

  // 숫자형 컬럼들
  if (
    [
      "appraised_value",
      "minimum_bid_price",
      "building_area_pyeong",
      "land_area_pyeong",
      "construction_year",
      "public_price",
    ].includes(sortBy)
  ) {
    return parseFloat(value) || 0;
  }

  // 문자형 컬럼들
  return String(value || "").toLowerCase();
}

export interface UseItemsResult {
  items: Item[] | undefined;
  isLoading: boolean;
  error: any;
  totalCount?: number;
  usageValues: string[]; // 🏢 동적 건물 유형 필터 옵션 생성용
  floorValues: string[]; // 🏢 동적 층확인 필터 옵션 생성용
  refetch: () => void;
  isRefreshing: boolean;
}

function buildQueryParamsFromFilters(
  filters: ReturnType<typeof useFilterStore.getState>
) {
  const params: Record<string, any> = {};

  // 🚨 D번 문제 해결: 클라이언트 필터링 필요 시 전체 데이터 로드
  const needsClientSideFiltering =
    (filters.floorConfirmation && filters.floorConfirmation !== "all") ||
    (filters.hasElevator && filters.hasElevator !== "all");

  if (needsClientSideFiltering) {
    // 클라이언트 필터링이 필요하면 전체 데이터를 가져온다
    params.limit = 1000; // 백엔드가 지원하는 범위로 조정
    params.page = 1;
    console.log("🚨 [Debug] 클라이언트 필터링 감지 - 전체 데이터 로드 모드");
  } else {
    // 일반적인 페이지네이션
    params.limit = filters.size ?? 20;
    params.page = filters.page ?? 1;
  }

  // ✅ 지역 (코드 기반 - 백엔드 가이드 3-1)
  if (filters.sido_code) params.sido_code = filters.sido_code;
  if (filters.city_code) params.city_code = filters.city_code;
  if (filters.town_code) params.town_code = filters.town_code;

  // 하위호환용 이름 기반 (백엔드에서 지원)
  if (!filters.sido_code && filters.province)
    params.province = filters.province;
  if (!filters.city_code && filters.cityDistrict)
    params.cityDistrict = filters.cityDistrict;
  if (!filters.town_code && filters.town) params.town = filters.town;
  if (filters.region) params.region = filters.region;

  // ✅ 건물 유형 (백엔드 가이드: buildingType → usage)
  if (filters.buildingType && filters.buildingType !== "all") {
    params.usage = filters.buildingType;
  }

  // ❌ 편의시설 (백엔드에서 실제 필터링이 작동하지 않아 클라이언트 사이드로 변경)
  // if (filters.hasElevator && filters.hasElevator !== "all") {
  //   params.hasElevator = filters.hasElevator === "있음" ? true : false;
  // }
  // ❌ hasParking 제거 (백엔드 데이터 없음)

  // ❌ 층확인 필터 - 백엔드 미지원으로 서버 요청에서 제거
  // 클라이언트 사이드에서 처리하도록 변경
  // if (filters.floorConfirmation && filters.floorConfirmation !== "all") {
  //   params.floor_confirmation = filters.floorConfirmation;
  // }

  // 🔄 기존 층수 필터 (하위호환 유지)
  if (filters.floor && filters.floor !== "all") {
    params.floor = filters.floor;
  }

  // 🔍 키워드 검색 (검색 필드 선택 지원)
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const searchQuery = filters.searchQuery.trim();
    const searchField = filters.searchField || "all";

    switch (searchField) {
      case "case_number":
        params.search_case_number = searchQuery;
        break;
      case "road_address":
        params.search_road_address = searchQuery;
        break;
      case "all":
      default:
        params.search = searchQuery;
        break;
    }

    console.log(
      `🔍 [Debug] 키워드 검색: "${searchQuery}" (${searchField} 필드)`
    );
  }

  // 🔄 서버 사이드 정렬 (전체 데이터 기준 정렬)
  if (filters.sortBy && filters.sortOrder) {
    params.sortBy = filters.sortBy;
    params.sortOrder = filters.sortOrder;
    console.log(
      `🔄 [Debug] 서버 사이드 정렬: ${filters.sortBy} ${filters.sortOrder}`
    );
  }

  // ❌ 경매상태 (사용자 요청에 의해 비활성화)
  // if (filters.auctionStatus && filters.auctionStatus !== "all") {
  //   params.currentStatus = filters.auctionStatus;
  // }

  // ✅ 가격 범위 (camelCase - 백엔드 가이드 3-1: minPrice/maxPrice)
  const [minPrice, maxPrice] = filters.priceRange;
  if (minPrice && minPrice > 0) params.minPrice = minPrice;
  if (maxPrice && maxPrice < 500000) params.maxPrice = maxPrice;

  // ✅ 면적 범위 (하위호환용) - deprecated, 새로운 분리된 면적 필터 사용 권장
  const [minArea, maxArea] = filters.areaRange;
  if (minArea && minArea > 0) params.minArea = minArea;
  if (maxArea && maxArea < 200) params.maxArea = maxArea;

  // 🏗️ 건축면적 범위 (평 단위)
  const [minBuildingArea, maxBuildingArea] = filters.buildingAreaRange;
  if (minBuildingArea && minBuildingArea > 0)
    params.minBuildingArea = minBuildingArea;
  if (maxBuildingArea && maxBuildingArea < 100)
    params.maxBuildingArea = maxBuildingArea;

  // 🌍 토지면적 범위 (평 단위)
  const [minLandArea, maxLandArea] = filters.landAreaRange;
  if (minLandArea && minLandArea > 0) params.minLandArea = minLandArea;
  if (maxLandArea && maxLandArea < 200) params.maxLandArea = maxLandArea;

  // ✅ 건축년도 (백엔드 가이드: minBuildYear/maxBuildYear → minYearBuilt/maxYearBuilt)
  const [minYear, maxYear] = filters.buildYear;
  if (minYear && minYear > 1980) params.minYearBuilt = minYear;
  if (maxYear && maxYear < 2024) params.maxYearBuilt = maxYear;

  // ✅ 매각기일 (백엔드 가이드 3-1)
  if (filters.auctionDateFrom) params.auctionDateFrom = filters.auctionDateFrom;
  if (filters.auctionDateTo) params.auctionDateTo = filters.auctionDateTo;

  // 하위호환 (기존 코드)
  if (filters.auctionMonth) params.auction_month = filters.auctionMonth;

  // 1억 이하 여부 (기존 로직 유지)
  if (filters.under100) {
    params.maxPrice = Math.min(params.maxPrice ?? 10000, 10000);
  }

  return params;
}

export function useItems(): UseItemsResult {
  const filters = useFilterStore();

  // 🚨 지역 선택 필수 조건 확인 (성능 최적화) - 시도명과 시군구 모두 필요
  const hasLocationSelected = Boolean(filters.province && filters.cityDistrict);

  // 🎉 /custom API 사용 (16개 컬럼 선택 + 모든 필터링 완전 지원 확인!)
  const requiredFields = [
    "id",
    "usage",
    "case_number",
    "road_address",
    "building_area_pyeong",
    "land_area_pyeong",
    "appraised_value",
    "minimum_bid_price",
    "bid_to_appraised_ratio",
    "public_price",
    "sale_month",
    "special_rights",
    "floor_confirmation",
    "under_100million",
    "construction_year",
    "elevator_available",
  ].join(",");

  const allParams = {
    ...buildQueryParamsFromFilters(filters),
    fields: requiredFields,
  };

  // 🔍 디버깅 로그 - 페이지네이션 확인
  if (hasLocationSelected) {
    console.log(
      `🔍 [Debug] 📄 페이지네이션: ${filters.page}페이지, ${filters.size}개씩`
    );
    console.log("🔍 [Debug] 필터 파라미터:", allParams);
    console.log("🔍 [Debug] floorConfirmation 값:", filters.floorConfirmation);
    console.log("🔍 [Debug] hasElevator 값:", filters.hasElevator);
    console.log("🔍 [Debug] buildingType 값:", filters.buildingType);
  } else {
    console.log("🚨 [Debug] 지역이 선택되지 않아서 데이터 로딩 중지");
  }

  // 🎯 지역 선택된 경우에만 API 호출 (성능 최적화)
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    hasLocationSelected
      ? ["/api/v1/items/custom", allParams] // ✅ 지역 선택 시에만 API 호출
      : null, // ❌ 지역 미선택 시 API 호출 안함
    fetcher
  );

  // 🚨 지역 미선택 시 빈 데이터 반환 (성능 최적화)
  if (!hasLocationSelected) {
    return {
      items: [],
      isLoading: false,
      error: null,
      totalCount: 0,
      usageValues: [],
      floorValues: [],
      refetch: () => {},
      isRefreshing: false,
    };
  }

  // 🔍 실제 데이터 구조 확인 및 클라이언트 사이드 필터링
  let items = (data as any)?.items ?? (data as any) ?? [];
  let originalTotalCount =
    (data as any)?.total_items ??
    (data as any)?.totalItems ??
    (data as any)?.total ??
    (data as any)?.count ??
    0;

  // 🎯 클라이언트 사이드 층확인 필터링 (백엔드 미지원으로)
  if (
    filters.floorConfirmation &&
    filters.floorConfirmation !== "all" &&
    items.length > 0
  ) {
    console.log(
      "🔍 [Debug] 층확인 클라이언트 필터 적용:",
      filters.floorConfirmation
    );
    console.log("🔍 [Debug] 필터링 전 아이템 수:", items.length);

    items = items.filter((item: any) => {
      const floorValue = item.floor_confirmation;
      console.log(
        "🔍 [Debug] 아이템 층확인 값:",
        floorValue,
        "vs 필터:",
        filters.floorConfirmation
      );
      return floorValue === filters.floorConfirmation;
    });

    console.log("🔍 [Debug] 필터링 후 아이템 수:", items.length);
  }

  // 🎯 클라이언트 사이드 엘리베이터 필터링 (백엔드 필터링 미작동으로)
  if (
    filters.hasElevator &&
    filters.hasElevator !== "all" &&
    items.length > 0
  ) {
    console.log(
      "🔍 [Debug] 엘리베이터 클라이언트 필터 적용:",
      filters.hasElevator
    );
    console.log("🔍 [Debug] 필터링 전 아이템 수:", items.length);

    items = items.filter((item: any) => {
      const elevatorValue = item.elevator_available;
      const hasElevator = elevatorValue === "O" || elevatorValue === "Y";

      console.log(
        "🔍 [Debug] 아이템 엘리베이터 값:",
        elevatorValue,
        "→",
        hasElevator ? "있음" : "없음",
        "vs 필터:",
        filters.hasElevator
      );

      if (filters.hasElevator === "있음") {
        return hasElevator;
      } else if (filters.hasElevator === "없음") {
        return !hasElevator;
      }
      return true;
    });

    console.log("🔍 [Debug] 엘리베이터 필터링 후 아이템 수:", items.length);
  }

  // 🔄 C번 문제 해결: 서버 사이드 정렬 폴백 메커니즘
  if (filters.sortBy && filters.sortOrder && items.length > 1) {
    // 서버 정렬이 제대로 되었는지 검증
    const isServerSorted = checkIfSorted(
      items,
      filters.sortBy,
      filters.sortOrder
    );

    if (!isServerSorted) {
      console.warn(
        `⚠️ [Sort] 서버 정렬 실패 감지 - 클라이언트 정렬로 폴백: ${filters.sortBy} ${filters.sortOrder}`
      );
      items = clientSideSort(items, filters.sortBy, filters.sortOrder);
      console.log(
        `✅ [Sort] 클라이언트 정렬 완료: ${filters.sortBy} ${filters.sortOrder}`
      );
    } else {
      console.log(
        `✅ [Sort] 서버 정렬 정상 동작: ${filters.sortBy} ${filters.sortOrder}`
      );
    }
  }

  // 🏢 데이터 분석: usage 및 층확인 컬럼의 모든 unique 값들 확인 (동적 필터 옵션 생성용)
  const usageValues =
    items.length > 0 ? [...new Set(items.map((item: any) => item.usage))] : [];
  const floorValues =
    items.length > 0
      ? [...new Set(items.map((item: any) => item.floor_confirmation))]
      : [];

  if (items.length > 0) {
    console.log("🔍 [Debug] 실제 데이터 구조:", items[0]);
    console.log("🔍 [Debug] usage 값:", items[0].usage);
    console.log("🔍 [Debug] sale_date 값:", items[0].sale_date);
    console.log("🔍 [Debug] sale_month 값:", items[0].sale_month);
    console.log(
      "🔍 [Debug] floor_confirmation 값:",
      items[0].floor_confirmation
    );
    console.log(
      "🔍 [Debug] elevator_available 값:",
      items[0].elevator_available
    );

    console.log("🔍 [Debug] usage 고유값들:", usageValues);
    console.log("🔍 [Debug] floor_confirmation 고유값들:", floorValues);
    console.log(
      "🏢 [Debug] 동적 건물 유형 옵션 생성을 위한 usage 값들:",
      usageValues
    );
  }

  // 🎯 D번 문제 해결: 클라이언트 필터링 후 총 개수 재계산
  const hasClientSideFiltering =
    (filters.floorConfirmation && filters.floorConfirmation !== "all") ||
    (filters.hasElevator && filters.hasElevator !== "all");

  let actualTotalCount = originalTotalCount;

  if (hasClientSideFiltering) {
    // 클라이언트 필터링이 적용된 경우, 실제 필터링된 개수로 업데이트
    actualTotalCount = items.length;
    console.log(
      `🔄 [Filter] 클라이언트 필터링 적용됨 - 총 개수 업데이트: ${originalTotalCount} → ${actualTotalCount}`
    );

    // 🎯 D번 문제 해결: 클라이언트 필터링 후 페이지네이션 재적용
    const pageSize = filters.size ?? 20;
    const currentPage = filters.page ?? 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    console.log(
      `📄 [Pagination] 클라이언트 페이지네이션 적용: ${currentPage}페이지 (${
        startIndex + 1
      }-${Math.min(endIndex, items.length)}/${items.length})`
    );

    items = items.slice(startIndex, endIndex);
  }

  // 🔍 페이지네이션 관련 서버 응답 로그
  console.log(
    `🔍 [Debug] 📊 서버 응답: ${
      items.length
    }개 아이템, 총 ${actualTotalCount}개 데이터 ${
      hasClientSideFiltering ? "(클라이언트 필터링 적용)" : "(서버 데이터)"
    }`
  );

  return {
    items,
    isLoading,
    error,
    totalCount: actualTotalCount,
    usageValues, // 🏢 동적 건물 유형 필터 옵션 생성용
    floorValues, // 🏢 동적 층확인 필터 옵션 생성용
    refetch: () => {
      void mutate();
    },
    isRefreshing: isValidating,
  };
}
