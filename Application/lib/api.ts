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
    if (finalParams.limit === undefined) finalParams.limit = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<AuctionCompleted[]>(
      `/api/v1/auction-completed/?${queryParams}`
    );
  }

  async getAuctionCompletedDetail(itemId: number): Promise<AuctionCompleted> {
    return this.request<AuctionCompleted>(
      `/api/v1/auction-completed/${itemId}`
    );
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
  ): Promise<RealTransaction[]> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    if (finalParams.limit === undefined) finalParams.limit = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<RealTransaction[]>(
      `/api/v1/real-transactions/?${queryParams}`
    );
  }

  async getMarketPrice(params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<any>(
      `/api/v1/real-transactions/market-price/?${queryParams}`
    );
  }

  // 실거래 전월세 (수익률 분석) API
  async getRealRents(params?: Record<string, any>): Promise<RealRent[]> {
    const finalParams: Record<string, any> = { ...(params ?? {}) };
    if (finalParams.limit === undefined) finalParams.limit = 20;
    const queryParams = new URLSearchParams(finalParams).toString();
    return this.request<RealRent[]>(`/api/v1/real-rents/?${queryParams}`);
  }

  async getRentalYield(params?: Record<string, any>): Promise<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<any>(`/api/v1/real-rents/rental-yield/?${queryParams}`);
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
  getCompletedDetail: (itemId: number) =>
    apiClient.getAuctionCompletedDetail(itemId),
  getMarketAnalysis: (params?: Record<string, any>) =>
    apiClient.getAuctionMarketAnalysis(params),
};

export const realTransactionApi = {
  getTransactions: (params?: Record<string, any>) =>
    apiClient.getRealTransactions(params),
  getMarketPrice: (params?: Record<string, any>) =>
    apiClient.getMarketPrice(params),
};

export const realRentApi = {
  getRents: (params?: Record<string, any>) => apiClient.getRealRents(params),
  getRentalYield: (params?: Record<string, any>) =>
    apiClient.getRentalYield(params),
};
