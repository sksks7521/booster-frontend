// API 기본 설정
const API_BASE_URL = "http://127.0.0.1:8000";

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

// API 클라이언트 클래스
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
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
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    return this.request<ItemsResponse>(`/api/v1/items/?${queryParams}`);
  }

  async getItemsSimple(params?: Record<string, any>): Promise<Item[]> {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
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
    const queryParams = params ? new URLSearchParams(params).toString() : "";
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
    const queryParams = params ? new URLSearchParams(params).toString() : "";
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
    const queryParams = params ? new URLSearchParams(params).toString() : "";
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
