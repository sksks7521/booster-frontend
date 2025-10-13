// API 기본 설정
// NEXT_PUBLIC_API_BASE_URL 환경변수가 있으면 그것을 사용하고, 없으면 로컬 기본값을 사용합니다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

// API 응답 타입 정의
export interface User {
  email: string;
  full_name: string;
  birthdate: string;
  gender: "male" | "female";
  phone_number: string;
  agreed_to_terms: boolean;
  agreed_to_privacy_policy: boolean;
  agreed_to_marketing: boolean;
  id: number;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  birthdate: string;
  gender: "male" | "female";
  phone_number: string;
  agreed_to_terms: boolean;
  agreed_to_privacy_policy: boolean;
  agreed_to_marketing: boolean;
}

export interface Item {
  address: string;
  price: number;
  area: number;
  built_year: number;
  property_type: string;
  lat: number;
  lng: number;
  id: number;
  created_at: string;

  // 🎯 경매 전용 필드들 추가
  usage?: string;
  case_number?: string;
  road_address?: string;
  building_area_pyeong?: number;
  land_area_pyeong?: number;
  appraised_value?: number;
  minimum_bid_price?: number;
  bid_to_appraised_ratio?: string;
  calculated_ratio?: number;
  sale_date?: string;
  sale_month?: number;
  case_year?: number;
  floor_confirmation?: string;
  public_price?: number;
  under_100million?: string;
  construction_year?: number;
  elevator_available?: string;
  hasElevator?: boolean;
  buildYear?: number; // 호환성을 위한 별칭
  // 🆕 상태/특수조건 및 불리언 특수조건 플래그들
  current_status?: string;
  special_rights?: string;
  tenant_with_opposing_power?: boolean;
  hug_acquisition_condition_change?: boolean;
  senior_lease_right?: boolean;
  resale?: boolean;
  partial_sale?: boolean;
  joint_collateral?: boolean;
  separate_registration?: boolean;
  lien?: boolean;
  illegal_building?: boolean;
  lease_right_sale?: boolean;
  land_right_unregistered?: boolean;
}

// 새로운 API 응답 타입들
export interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ComparableItem {
  id: number;
  title: string;
  address: string;
  price: number;
  area: number;
  buildYear: number;
  distance: number;
  similarity: number;
  pricePerArea: number;
}

export interface MarketStatistics {
  averagePrice: number;
  averagePricePerArea: number;
  priceRange: { min: number; max: number };
  totalCount: number;
}

export interface MarketAnalysis {
  priceGradeRelativeToMarket: "below_average" | "average" | "above_average";
  investmentPotential: "low" | "medium" | "high";
  liquidityScore: number;
}

export interface ComparablesResponse {
  baseItem: Item;
  comparables: ComparableItem[];
  statistics: MarketStatistics;
  marketAnalysis: MarketAnalysis;
}

export interface AuctionCompleted {
  id: number;
  title: string;
  address: string;
  finalPrice: number;
  area: number;
  auctionDate: string;
  bidCount: number;
}

export interface RealTransaction {
  id: number;
  address: string;
  price: number;
  area: number;
  transactionDate: string;
  transactionType: string;
}

export interface RealRent {
  id: number;
  address: string;
  deposit: number;
  monthlyRent: number;
  area: number;
  contractDate: string;
  contractType: string;
}

export interface FavoriteCount {
  count: number;
}

export interface FavoriteCheck {
  isFavorite: boolean;
}

export interface Favorite {
  item_id: number;
  id: number;
  user_id: number;
  created_at: string;
  item: Item;
}

export interface ItemCreate {
  address: string;
  price: number;
  area: number;
  built_year: number;
  property_type: string;
  lat: number;
  lng: number;
}

// 표준 에러 객체
export interface ApiError {
  message: string;
  status?: number;
  url: string;
  method: string;
  details?: unknown;
}

function createApiError(params: {
  message: string;
  status?: number;
  url: string;
  method: string;
  details?: unknown;
}): ApiError {
  return {
    message: params.message,
    status: params.status,
    url: params.url,
    method: params.method,
    details: params.details,
  };
}

// API 클라이언트 클래스
class ApiClient {
  private baseURL: string;
  private defaultTimeoutMs: number;

  constructor(
    baseURL: string = API_BASE_URL,
    defaultTimeoutMs: number = 10000
  ) {
    this.baseURL = baseURL;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = this.defaultTimeoutMs
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 백엔드가 text/plain("Internal Server Error")를 반환할 수 있음
        let details: unknown = undefined;
        try {
          details = await response.json();
        } catch {
          try {
            details = await response.text();
          } catch {
            details = undefined;
          }
        }

        const msg =
          (typeof details === "object" && details && (details as any).detail) ||
          `HTTP error ${response.status}`;

        throw createApiError({
          message: String(msg),
          status: response.status,
          url,
          method: (config.method || "GET") as string,
          details,
        });
      }

      // 정상 응답 파싱
      try {
        return (await response.json()) as T;
      } catch (parseError) {
        throw createApiError({
          message: "Failed to parse JSON response",
          status: response.status,
          url,
          method: (config.method || "GET") as string,
          details: await response.text().catch(() => undefined),
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        throw createApiError({
          message: `Request timeout after ${timeoutMs}ms`,
          url,
          method: (config.method || "GET") as string,
        });
      }
      if (err && err.message) {
        // err가 이미 ApiError 형태면 그대로 전달
        throw err;
      }
      throw createApiError({
        message: "Network error",
        url,
        method: (config.method || "GET") as string,
        details: err,
      });
    }
  }

  // 인증 관련 API
  async signup(userData: UserCreate): Promise<User> {
    return this.request<User>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(
    email: string,
    password: string
  ): Promise<{ access_token: string; user: User }> {
    return this.request<{ access_token: string; user: User }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
  }

  // 사용자 관련 API
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/v1/users/me");
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return this.request<User>("/api/v1/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  // 시스템 상태 확인
  async getHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }

  // 매물 관련 API (고급 필터링 지원)
  async getItems(params?: Record<string, any>): Promise<ItemsResponse> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    if (finalParams.limit === undefined) finalParams.limit = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<ItemsResponse>(`/api/v1/items/?${queryParams}`);
  }

  // 컬럼 메타데이터
  async getItemsColumns(): Promise<any> {
    return this.request<any>(`/api/v1/items/columns`);
  }

  // 선택 컬럼 API
  async getItemsCustom(params?: Record<string, any>): Promise<any> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<any>(`/api/v1/items/custom?${queryParams}`);
  }

  async getItemsSimple(params?: Record<string, any>): Promise<Item[]> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    if (finalParams.limit === undefined) finalParams.limit = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<Item[]>(`/api/v1/items/simple?${queryParams}`);
  }

  async createItem(itemData: ItemCreate): Promise<Item> {
    return this.request<Item>("/api/v1/items/", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async getItem(id: number): Promise<Item> {
    return this.request<Item>(`/api/v1/items/${id}`);
  }

  // 단건 전용 커스텀(제안 엔드포인트): /api/v1/items/{id}/custom?fields=...
  // 백엔드 적용 전까지는 404/400 가능성이 있어 try-catch로 감쌀 것
  async getItemCustom(id: number, params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    const suffix = queryParams ? `?${queryParams}` : "";
    return this.request<any>(`/api/v1/items/${id}/custom${suffix}`);
  }

  // 투자 분석 API
  async getComparables(
    itemId: number,
    params?: Record<string, any>
  ): Promise<ComparablesResponse> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<ComparablesResponse>(
      `/api/v1/items/${itemId}/comparables?${queryParams}`
    );
  }

  // 관심 매물 관련 API (완전한 즐겨찾기 시스템)
  async getFavorites(): Promise<Favorite[]> {
    return this.request<Favorite[]>("/api/v1/users/me/favorites/");
  }

  async addFavorite(auctionItemId: number): Promise<Favorite> {
    return this.request<Favorite>("/api/v1/users/me/favorites/", {
      method: "POST",
      body: JSON.stringify({ auction_item_id: auctionItemId }),
    });
  }

  async removeFavorite(auctionItemId: number): Promise<void> {
    return this.request<void>(`/api/v1/users/me/favorites/${auctionItemId}`, {
      method: "DELETE",
    });
  }

  async getFavoriteCount(): Promise<FavoriteCount> {
    return this.request<FavoriteCount>("/api/v1/users/me/favorites/count");
  }

  async checkFavorite(auctionItemId: number): Promise<FavoriteCheck> {
    return this.request<FavoriteCheck>(
      `/api/v1/users/me/favorites/check/${auctionItemId}`
    );
  }

  // 경매 완료 (낙찰 사례 분석) API
  async getAuctionCompleted(
    params?: Record<string, any>
  ): Promise<AuctionCompleted[]> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    // page/size 방식으로 전환
    if (finalParams.page === undefined) finalParams.page = 1;
    if (finalParams.size === undefined) finalParams.size = 20;
    // 하위호환: limit가 들어오면 size로 승격
    if (finalParams.limit !== undefined && finalParams.size === undefined) {
      finalParams.size = finalParams.limit;
      delete finalParams.limit;
    }
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<AuctionCompleted[]>(
      `/api/v1/auction-completed/?${queryParams}`
    );
  }

  // 영역(원형) 서버 필터 전용 API
  async getAuctionCompletedArea(params?: Record<string, any>): Promise<{
    results: any[];
    total: number;
    page: number;
    size: number;
    ordering?: string;
  }> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    if (finalParams.page === undefined) finalParams.page = 1;
    if (finalParams.size === undefined) finalParams.size = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<{
      results: any[];
      total: number;
      page: number;
      size: number;
      ordering?: string;
    }>(`/api/v1/auction-completed/area?${queryParams}`);
  }

  async getAuctionCompletedDetail(itemId: number): Promise<AuctionCompleted> {
    return this.request<AuctionCompleted>(
      `/api/v1/auction-completed/${itemId}`
    );
  }

  // 컬럼 메타: 경매 완료
  async getAuctionCompletedColumns(): Promise<any> {
    return this.request<any>(`/api/v1/auction-completed/columns`);
  }

  async getAuctionMarketAnalysis(params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<any>(
      `/api/v1/auction-completed/market-analysis/?${queryParams}`
    );
  }

  // 실거래 매매 (시세 분석) API
  async getRealTransactions(
    params?: Record<string, any>
  ): Promise<{ results: RealTransaction[]; count: number }> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    // page/size 방식으로 전환
    if (finalParams.page === undefined) finalParams.page = 1;
    if (finalParams.size === undefined) finalParams.size = 20;
    if (finalParams.limit !== undefined && finalParams.size === undefined) {
      finalParams.size = finalParams.limit;
      delete finalParams.limit;
    }
    const queryParams = new URLSearchParams(finalParams).toString();

    // 백엔드 응답 형식: {items, total} → 프론트엔드 기대 형식: {results, count}
    const response = await this.request<{
      items: RealTransaction[];
      total: number;
    }>(`/api/v1/real-transactions/?${queryParams}`);

    return {
      results: response.items || [],
      count: response.total || 0,
    };
  }

  // 컬럼 메타: 실거래 매매
  async getRealTransactionsColumns(): Promise<any> {
    return this.request<any>(`/api/v1/real-transactions/columns`);
  }

  async getMarketPrice(params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<any>(
      `/api/v1/real-transactions/market-price/?${queryParams}`
    );
  }

  // 실거래 전월세 (수익률 분석) API
  async getRealRents(
    params?: Record<string, any>
  ): Promise<{ results: RealRent[]; count: number }> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    // page/size 방식으로 전환
    if (finalParams.page === undefined) finalParams.page = 1;
    if (finalParams.size === undefined) finalParams.size = 20;
    if (finalParams.limit !== undefined && finalParams.size === undefined) {
      finalParams.size = finalParams.limit;
      delete finalParams.limit;
    }
    const queryParams = new URLSearchParams(finalParams).toString();

    // 백엔드 응답 형식: {items, total} → 프론트엔드 기대 형식: {results, count}
    const response = await this.request<{
      items: RealRent[];
      total: number;
    }>(`/api/v1/real-rents/?${queryParams}`);

    return {
      results: response.items || [],
      count: response.total || 0,
    };
  }

  // 컬럼 메타: 실거래 전월세
  async getRealRentsColumns(): Promise<any> {
    return this.request<any>(`/api/v1/real-rents/columns`);
  }

  async getRentalYield(params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<any>(`/api/v1/real-rents/rental-yield/?${queryParams}`);
  }

  // 사용자 선호도(User Preferences)
  async getUserPreference(page: string, key: string): Promise<any | null> {
    const endpoint = `/api/v1/user-preferences/${encodeURIComponent(
      page
    )}/${encodeURIComponent(key)}`;
    try {
      return await this.request<any>(endpoint, {
        credentials: "include" as any,
      });
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  }

  async putUserPreference(
    page: string,
    key: string,
    value: unknown
  ): Promise<any> {
    const endpoint = `/api/v1/user-preferences/${encodeURIComponent(
      page
    )}/${encodeURIComponent(key)}`;
    return this.request<any>(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, key, value }),
      credentials: "include" as any,
    });
  }

  async deleteUserPreference(page: string, key: string): Promise<void> {
    const endpoint = `/api/v1/user-preferences/${encodeURIComponent(
      page
    )}/${encodeURIComponent(key)}`;
    await this.request<any>(endpoint, {
      method: "DELETE",
      credentials: "include" as any,
    });
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient();

// 편의 함수들
export const systemApi = {
  getHealth: () => apiClient.getHealth(),
};

export const authApi = {
  signup: (userData: UserCreate) => apiClient.signup(userData),
  login: (email: string, password: string) => apiClient.login(email, password),
};

export const userApi = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  updateUser: (userData: Partial<User>) => apiClient.updateUser(userData),
};

export const itemApi = {
  // 고급 필터링 지원 매물 API
  getItems: (params?: Record<string, any>) => apiClient.getItems(params),
  getItemsSimple: (params?: Record<string, any>) =>
    apiClient.getItemsSimple(params),
  createItem: (itemData: ItemCreate) => apiClient.createItem(itemData),
  getItem: (id: number) => apiClient.getItem(id),
  getItemCustom: (id: number, params?: Record<string, any>) =>
    apiClient.getItemCustom(id, params),
  // 메타/선택 컬럼 API
  getItemsColumns: () => apiClient.getItemsColumns(),
  getItemsCustom: (params?: Record<string, any>) =>
    apiClient.getItemsCustom(params),
  // 투자 분석
  getComparables: (itemId: number, params?: Record<string, any>) =>
    apiClient.getComparables(itemId, params),
};

export const favoriteApi = {
  getFavorites: () => apiClient.getFavorites(),
  addFavorite: (auctionItemId: number) => apiClient.addFavorite(auctionItemId),
  removeFavorite: (auctionItemId: number) =>
    apiClient.removeFavorite(auctionItemId),
  getFavoriteCount: () => apiClient.getFavoriteCount(),
  checkFavorite: (auctionItemId: number) =>
    apiClient.checkFavorite(auctionItemId),
};

export const auctionApi = {
  getCompleted: (params?: Record<string, any>) =>
    apiClient.getAuctionCompleted(params),
  getCompletedArea: (params?: Record<string, any>) =>
    apiClient.getAuctionCompletedArea(params),
  getCompletedDetail: (itemId: number) =>
    apiClient.getAuctionCompletedDetail(itemId),
  getMarketAnalysis: (params?: Record<string, any>) =>
    apiClient.getAuctionMarketAnalysis(params),
  // 🆕 경매결과 지도용 가까운 순 LIMIT API (서버 KNN)
  getNearestAuctionMap: async (params: {
    ref_lat: number;
    ref_lng: number;
    limit?: number;
    bounds?: { south: number; west: number; north: number; east: number };
    filters?: Record<string, any>;
    timeoutMs?: number;
  }): Promise<RentNearestResponse> => {
    const q: Record<string, any> = {
      // 경매는 별도 엔드포인트를 사용하므로 dataset 키는 불필요. 단, 서버가 요구 시 추가 협의
      sort: "distance_asc",
      // 서버 호환: center_lat/center_lng 표준 + ref_lat/ref_lng 병행 전송
      center_lat: params.ref_lat,
      center_lng: params.ref_lng,
      ref_lat: params.ref_lat,
      ref_lng: params.ref_lng,
    };
    if (typeof params.limit === "number") q.limit = params.limit;
    if (params.bounds) {
      q.south = params.bounds.south;
      q.west = params.bounds.west;
      q.north = params.bounds.north;
      q.east = params.bounds.east;
    }
    if (params.filters && typeof params.filters === "object") {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q[k] = v as any;
      });
    }
    const query = new URLSearchParams(q).toString();
    const endpoint = `/api/v1/auction-completed/map?${query}`;
    const controller = new AbortController();
    const to = setTimeout(
      () => controller.abort(),
      Math.max(5000, Number(params.timeoutMs ?? 10000))
    );
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!res.ok) {
        let details: any = undefined;
        try {
          details = await res.json();
        } catch {
          try {
            details = await res.text();
          } catch {}
        }
        throw createApiError({
          message:
            (details && (details.detail || details.message)) ||
            `HTTP error ${res.status}`,
          status: res.status,
          url: `${API_BASE_URL}${endpoint}`,
          method: "GET",
          details,
        });
      }
      return (await res.json()) as RentNearestResponse;
    } catch (e) {
      clearTimeout(to);
      throw e;
    }
  },
};

export const realTransactionApi = {
  getTransactions: (params?: Record<string, any>) =>
    apiClient.getRealTransactions(params),
  getMarketPrice: (params?: Record<string, any>) =>
    apiClient.getMarketPrice(params),
  getColumns: async (): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/real-transactions/columns`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch columns");
    }
    return response.json();
  },
  // 🆕 주소별 실거래가 조회 (백엔드 API 연동 완료)
  getTransactionsByAddress: async (address: string): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/real-transactions/by-address?address=${encodeURIComponent(
        address
      )}&size=1000&ordering=-contract_date`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transactions by address");
    }

    return response.json();
  },
  // 🆕 매매 지도용 가까운 순 LIMIT API (서버 KNN)
  getNearestSaleMap: async (params: {
    ref_lat: number;
    ref_lng: number;
    limit?: number;
    bounds?: { south: number; west: number; north: number; east: number };
    filters?: Record<string, any>;
    timeoutMs?: number;
  }): Promise<RentNearestResponse> => {
    const q: Record<string, any> = {
      dataset: "sale",
      sort: "distance_asc",
      ref_lat: params.ref_lat,
      ref_lng: params.ref_lng,
    };
    if (typeof params.limit === "number") q.limit = params.limit;
    if (params.bounds) {
      q.south = params.bounds.south;
      q.west = params.bounds.west;
      q.north = params.bounds.north;
      q.east = params.bounds.east;
    }
    if (params.filters && typeof params.filters === "object") {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q[k] = v as any;
      });
    }
    const query = new URLSearchParams(q).toString();
    const endpoint = `/api/v1/real-transactions/map?${query}`;
    const controller = new AbortController();
    const to = setTimeout(
      () => controller.abort(),
      Math.max(5000, Number(params.timeoutMs ?? 10000))
    );
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!res.ok) {
        let details: any = undefined;
        try {
          details = await res.json();
        } catch {
          try {
            details = await res.text();
          } catch {}
        }
        throw createApiError({
          message:
            (details && (details.detail || details.message)) ||
            `HTTP error ${res.status}`,
          status: res.status,
          url: `${API_BASE_URL}${endpoint}`,
          method: "GET",
          details,
        });
      }
      return (await res.json()) as RentNearestResponse;
    } catch (e) {
      clearTimeout(to);
      throw e;
    }
  },
};

import { RentNearestResponse } from "@/types/datasets";

export const realRentApi = {
  getRents: (params?: Record<string, any>) => apiClient.getRealRents(params),
  // 컬럼 메타: 실거래 전월세
  getColumns: (): Promise<any> => apiClient.getRealRentsColumns(),
  getRentalYield: (params?: Record<string, any>) =>
    apiClient.getRentalYield(params),
  // 🆕 전월세 지도용 가까운 순 LIMIT API (서버 KNN)
  getNearestRentMap: async (params: {
    ref_lat: number;
    ref_lng: number;
    limit?: number;
    bounds?: { south: number; west: number; north: number; east: number };
    filters?: Record<string, any>;
    timeoutMs?: number;
  }): Promise<RentNearestResponse> => {
    const q: Record<string, any> = {
      dataset: "rent",
      sort: "distance_asc",
      ref_lat: params.ref_lat,
      ref_lng: params.ref_lng,
    };
    if (typeof params.limit === "number") q.limit = params.limit;
    if (params.bounds) {
      q.south = params.bounds.south;
      q.west = params.bounds.west;
      q.north = params.bounds.north;
      q.east = params.bounds.east;
    }
    if (params.filters && typeof params.filters === "object") {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q[k] = v as any;
      });
    }
    const query = new URLSearchParams(q).toString();
    const endpoint = `/api/v1/real-transactions/map?${query}`;
    const controller = new AbortController();
    const to = setTimeout(
      () => controller.abort(),
      Math.max(5000, Number(params.timeoutMs ?? 10000))
    );
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!res.ok) {
        let details: any = undefined;
        try {
          details = await res.json();
        } catch {
          try {
            details = await res.text();
          } catch {}
        }
        throw createApiError({
          message:
            (details && (details.detail || details.message)) ||
            `HTTP error ${res.status}`,
          status: res.status,
          url: `${API_BASE_URL}${endpoint}`,
          method: "GET",
          details,
        });
      }
      return (await res.json()) as RentNearestResponse;
    } catch (e) {
      clearTimeout(to);
      throw e;
    }
  },
  // 주소별 전월세 조회 (실거래가 팝업과 유사한 UX)
  getRentsByAddress: async (address: string): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/real-rents/by-address?address=${encodeURIComponent(
        address
      )}&size=1000&ordering=-contract_date`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch rents by address");
    }
    return response.json();
  },
};

export const userPrefsApi = {
  get: (page: string, key: string) => apiClient.getUserPreference(page, key),
  put: (page: string, key: string, value: unknown) =>
    apiClient.putUserPreference(page, key, value),
  delete: (page: string, key: string) =>
    apiClient.deleteUserPreference(page, key),
};
