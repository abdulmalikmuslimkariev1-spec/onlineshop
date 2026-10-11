/**
 * Basic API Client Foundation
 * Configured to communicate with the FastAPI backend.
 */

import { getApiBaseUrl } from '../utils/resolver';

const API_BASE_URL = getApiBaseUrl();

export interface HealthResponse {
  status: string;
}

export const apiClient = {
  /**
   * Health check endpoint with timeout
   */
  async checkHealth(): Promise<HealthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API Health Check Error:', error);
      throw error;
    }
  },

  /**
   * Generic request helper for future expansion
   */
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  }
};
