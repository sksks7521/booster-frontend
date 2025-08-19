"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface LocationNode {
  code: string;
  name: string;
  count?: number;
}

export interface LocationCity extends LocationNode {
  towns?: LocationNode[];
}

export interface LocationSido extends LocationNode {
  cities?: LocationCity[];
}

export interface LocationTreeResponse {
  version: string;
  generated_at: string;
  code_type: string;
  sidos: LocationSido[];
}

export interface LocationSimpleTree {
  provinces: string[];
  cities: Record<string, string[]>;
  districts: Record<string, string[]>;
}

// ⭐ 임시 테스트용 데이터 (백엔드 연결 전까지 사용)
const TEMP_SAMPLE_ADDRESSES: LocationSimpleTree = {
  provinces: ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시"],
  cities: {
    서울특별시: [
      "강남구",
      "서초구",
      "송파구",
      "강서구",
      "마포구",
      "종로구",
      "중구",
      "용산구",
    ],
    경기도: [
      "수원시",
      "성남시",
      "안양시",
      "부천시",
      "광명시",
      "평택시",
      "과천시",
      "구리시",
    ],
    인천광역시: [
      "미추홀구",
      "연수구",
      "남동구",
      "부평구",
      "서구",
      "중구",
      "동구",
    ],
    부산광역시: [
      "해운대구",
      "부산진구",
      "동래구",
      "남구",
      "북구",
      "서구",
      "중구",
    ],
    대구광역시: ["수성구", "달서구", "중구", "동구", "서구", "남구", "북구"],
  },
  districts: {
    강남구: [
      "역삼동",
      "삼성동",
      "청담동",
      "압구정동",
      "논현동",
      "신사동",
      "도곡동",
    ],
    서초구: ["서초동", "잠원동", "반포동", "방배동", "양재동", "내곡동"],
    송파구: ["잠실동", "문정동", "가락동", "석촌동", "송파동", "방이동"],
    수원시: ["팔달구", "영통구", "장안구", "권선구"],
    성남시: ["분당구", "수정구", "중원구"],
    해운대구: ["우동", "중동", "좌동", "송정동", "반여동", "재송동"],
  },
};

/**
 * 간단한 주소 트리 조회 (기존 SAMPLE_ADDRESSES 대체)
 * 백엔드 가이드: GET /api/v1/locations/tree-simple
 */
export function useLocationsSimple() {
  const { data, error, isLoading, mutate } = useSWR<LocationSimpleTree>(
    "/api/v1/locations/tree-simple",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30 * 60 * 1000, // 30분 중복 제거
    }
  );

  // ⭐ 백엔드 연결 실패, 데이터 없음, 또는 빈 데이터시 임시 데이터 사용
  // 백엔드에서 빈 데이터 {provinces: [], cities: {}, districts: {}}를 반환할 수 있음
  const hasValidData = data && data.provinces && data.provinces.length > 0;
  const shouldUseFallback = error || (!isLoading && !hasValidData);
  const finalData = hasValidData ? data : TEMP_SAMPLE_ADDRESSES;

  // ⭐ 개발 환경에서 디버깅 로그 출력
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log("🔍 useLocationsSimple 상태:", {
      hasData: !!data,
      hasError: !!error,
      isLoading,
      hasValidData,
      shouldUseFallback,
      backendProvincesCount: data?.provinces?.length || 0,
      finalProvincesCount: finalData?.provinces?.length || 0,
      backendResponse: data,
      usingTempData: shouldUseFallback,
    });
  }

  return {
    locations: finalData, // 확실한 데이터 반환
    isLoading,
    error,
    refresh: mutate,
    // ⭐ 임시 데이터 사용 중인지 표시
    usingFallback: shouldUseFallback,
  };
}

/**
 * 풀 주소 트리 조회 (코드 및 매물 수량 포함)
 * 백엔드 가이드: GET /api/v1/locations/tree?includeCounts=true
 */
export function useLocationsTree(includeCounts = true) {
  const { data, error, isLoading, mutate } = useSWR<LocationTreeResponse>(
    `/api/v1/locations/tree?includeCounts=${includeCounts}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 6 * 60 * 60 * 1000, // 6시간 캐시 (백엔드 가이드 기준)
    }
  );

  return {
    locationTree: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * 단계별 시도 목록 조회
 * 백엔드 가이드: GET /api/v1/locations/sido
 */
export function useLocationsSido() {
  const { data, error, isLoading } = useSWR<LocationNode[]>(
    "/api/v1/locations/sido",
    fetcher
  );

  return {
    sidos: data || [],
    isLoading,
    error,
  };
}

/**
 * 단계별 시군구 목록 조회
 * 백엔드 가이드: GET /api/v1/locations/cities?sido_code=<코드>
 */
export function useLocationsCities(sidoCode?: string) {
  const { data, error, isLoading } = useSWR<LocationNode[]>(
    sidoCode ? `/api/v1/locations/cities?sido_code=${sidoCode}` : null,
    fetcher
  );

  return {
    cities: data || [],
    isLoading,
    error,
  };
}

/**
 * 단계별 읍면동 목록 조회
 * 백엔드 가이드: GET /api/v1/locations/towns?city_code=<코드>
 */
export function useLocationsTowns(cityCode?: string) {
  const { data, error, isLoading } = useSWR<LocationNode[]>(
    cityCode ? `/api/v1/locations/towns?city_code=${cityCode}` : null,
    fetcher
  );

  return {
    towns: data || [],
    isLoading,
    error,
  };
}

/**
 * 헬퍼: 이름으로 코드 찾기
 */
export function findCodeByName(
  items: LocationNode[],
  name: string
): string | undefined {
  return items.find((item) => item.name === name)?.code;
}

/**
 * 헬퍼: 코드로 이름 찾기
 */
export function findNameByCode(
  items: LocationNode[],
  code: string
): string | undefined {
  return items.find((item) => item.code === code)?.name;
}
