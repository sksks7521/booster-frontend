// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

// API 응답 타입 정의
export interface User {
  email: string
  full_name: string
  birthdate: string
  gender: "male" | "female"
  phone_number: string
  agreed_to_terms: boolean
  agreed_to_privacy_policy: boolean
  agreed_to_marketing: boolean
  id: number
  is_active: boolean
  created_at: string
}

export interface UserCreate {
  email: string
  full_name: string
  birthdate: string
  gender: "male" | "female"
  phone_number: string
  agreed_to_terms: boolean
  agreed_to_privacy_policy: boolean
  agreed_to_marketing: boolean
}

export interface Item {
  address: string
  price: number
  area: number
  built_year: number
  property_type: string
  lat: number
  lng: number
  id: number
  created_at: string
}

export interface Favorite {
  item_id: number
  id: number
  user_id: number
  created_at: string
  item: Item
}

export interface ItemCreate {
  address: string
  price: number
  area: number
  built_year: number
  property_type: string
  lat: number
  lng: number
}

// API 클라이언트 클래스
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // 인증 관련 API
  async signup(userData: UserCreate): Promise<User> {
    return this.request<User>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request<{ access_token: string; user: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // 사용자 관련 API
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/v1/users/me")
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return this.request<User>("/api/v1/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // 매물 관련 API
  async getItems(): Promise<Item[]> {
    return this.request<Item[]>("/api/v1/items/")
  }

  async createItem(itemData: ItemCreate): Promise<Item> {
    return this.request<Item>("/api/v1/items/", {
      method: "POST",
      body: JSON.stringify(itemData),
    })
  }

  async getItem(id: number): Promise<Item> {
    return this.request<Item>(`/api/v1/items/${id}`)
  }

  // 관심 매물 관련 API
  async getFavorites(): Promise<Favorite[]> {
    return this.request<Favorite[]>("/api/v1/users/me/favorites")
  }

  async addFavorite(itemId: number): Promise<Favorite> {
    return this.request<Favorite>("/api/v1/users/me/favorites", {
      method: "POST",
      body: JSON.stringify({ item_id: itemId }),
    })
  }

  async removeFavorite(itemId: number): Promise<void> {
    return this.request<void>(`/api/v1/users/me/favorites/${itemId}`, {
      method: "DELETE",
    })
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient()

// 편의 함수들
export const authApi = {
  signup: (userData: UserCreate) => apiClient.signup(userData),
  login: (email: string, password: string) => apiClient.login(email, password),
}

export const userApi = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  updateUser: (userData: Partial<User>) => apiClient.updateUser(userData),
}

export const itemApi = {
  getItems: () => apiClient.getItems(),
  createItem: (itemData: ItemCreate) => apiClient.createItem(itemData),
  getItem: (id: number) => apiClient.getItem(id),
}

export const favoriteApi = {
  getFavorites: () => apiClient.getFavorites(),
  addFavorite: (itemId: number) => apiClient.addFavorite(itemId),
  removeFavorite: (itemId: number) => apiClient.removeFavorite(itemId),
}
