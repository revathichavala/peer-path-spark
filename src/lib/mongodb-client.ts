// MongoDB Backend API Client
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'counselor' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}

export interface Assessment {
  id: string;
  user_id?: string;
  type: 'phq9' | 'gad7' | 'custom';
  responses: Record<string, number>;
  score: number;
  risk_level: 'low' | 'moderate' | 'high';
  created_at: string;
}

export interface ChatRoom {
  id: string;
  slug: string;
  title: string;
  is_private: boolean;
  created_by: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  edited_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  counselor_id: string;
  start_time: string;
  end_time: string;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
}

export interface Counselor {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  experience: string;
  image: string;
  bio: string;
  sessionTypes: ('video' | 'audio' | 'chat')[];
  nextAvailable: string;
  rate: number;
}

class MongoDBApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  setAuthToken(token: string) {
    this.accessToken = token;
  }

  clearAuthToken() {
    this.accessToken = null;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<ApiResponse<{user: User, access_token: string, refresh_token: string}>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{user: User, access_token: string, refresh_token: string}>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{access_token: string}>> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/api/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Assessment endpoints
  async createAssessment(type: string, responses: Record<string, number>): Promise<ApiResponse<Assessment>> {
    return this.request('/api/assessments', {
      method: 'POST',
      body: JSON.stringify({ type, responses }),
    });
  }

  async getAssessments(limit = 20, page = 1): Promise<ApiResponse<Assessment[]>> {
    return this.request(`/api/assessments?limit=${limit}&page=${page}`);
  }

  async getAssessment(id: string): Promise<ApiResponse<Assessment>> {
    return this.request(`/api/assessments/${id}`);
  }

  // Counselor and booking endpoints
  async getCounselors(): Promise<ApiResponse<Counselor[]>> {
    return this.request('/api/counselors');
  }

  async createBooking(counselorId: string, startTime: string, notes?: string): Promise<ApiResponse<Booking>> {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ 
        counselor_id: counselorId, 
        start_time: startTime, 
        notes 
      }),
    });
  }

  async getBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request('/api/bookings');
  }

  async confirmBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.request(`/api/bookings/${bookingId}/confirm`, {
      method: 'PUT',
    });
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.request(`/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
    });
  }

  // Chat endpoints
  async getRooms(): Promise<ApiResponse<ChatRoom[]>> {
    return this.request('/api/rooms');
  }

  async getRoomMessages(roomId: string, limit = 50): Promise<ApiResponse<Message[]>> {
    return this.request(`/api/rooms/${roomId}/messages?limit=${limit}`);
  }
}

// Create singleton instance
export const mongoClient = new MongoDBApiClient(
  process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : 'https://your-flask-backend.com'
);