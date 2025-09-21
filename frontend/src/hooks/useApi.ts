import { useState, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

interface PostRequestBody {
  location?: string;
  radius_miles?: number;
  service_type?: string;
  walk_in_only?: boolean;
  lgbtq_friendly?: boolean;
  immigrant_safe?: boolean;
  languages?: string[];
  [key: string]: unknown;
}

interface GetRequestParams {
  walk_in_accepted?: boolean;
  lgbtq_friendly?: boolean;
  immigrant_safe?: boolean;
  services?: string[];
  languages?: string[];
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Debug logging for environment variable
console.log('Environment check:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

const useApi = <T = unknown>() => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const buildQueryString = useCallback(
    (params: Record<string, unknown>): string => {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle arrays by adding multiple entries with the same key
            value.forEach((item) => searchParams.append(key, item.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      return searchParams.toString();
    },
    []
  );

  const makeRequest = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      config: ApiRequestConfig = {}
    ): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const controller = new AbortController();
      const timeoutId = config.timeout
        ? setTimeout(() => controller.abort(), config.timeout)
        : null;

      // Properly construct URL by removing trailing slash from base and leading slash from url if both exist
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const endpoint = url.startsWith('/') ? url : `/${url}`;
      const fullUrl = `${baseUrl}${endpoint}`;

      try {
        const defaultHeaders = {
          "Content-Type": "application/json",
          ...config.headers,
        };

        console.log('Making request to:', fullUrl); // Debug log

        const response = await fetch(fullUrl, {
          ...options,
          headers: defaultHeaders,
          signal: controller.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP Error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        let errorMessage = "An unexpected error occurred";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Request timeout";
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = `Network error: Unable to connect to ${API_BASE_URL}. Please check your internet connection.`;
          } else {
            errorMessage = error.message;
          }
        }

        console.error('API request failed:', {
          url: fullUrl,
          error: error,
          message: errorMessage
        });

        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  // GET request method
  const get = useCallback(
    async (
      endpoint: string,
      params?: GetRequestParams,
      config?: ApiRequestConfig
    ): Promise<T> => {
      let url = endpoint;

      if (params && Object.keys(params).length > 0) {
        const queryString = buildQueryString(params);
        url += `?${queryString}`;
      }

      return makeRequest(url, { method: "GET" }, config);
    },
    [makeRequest, buildQueryString]
  );

  // POST request method
  const post = useCallback(
    async (
      endpoint: string,
      body?: PostRequestBody,
      config?: ApiRequestConfig
    ): Promise<T> => {
      const options: RequestInit = {
        method: "POST",
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      return makeRequest(endpoint, options, config);
    },
    [makeRequest]
  );

  // PUT request method
  const put = useCallback(
    async (
      endpoint: string,
      body?: Record<string, unknown>,
      config?: ApiRequestConfig
    ): Promise<T> => {
      const options: RequestInit = {
        method: "PUT",
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      return makeRequest(endpoint, options, config);
    },
    [makeRequest]
  );

  // DELETE request method
  const del = useCallback(
    async (endpoint: string, config?: ApiRequestConfig): Promise<T> => {
      return makeRequest(endpoint, { method: "DELETE" }, config);
    },
    [makeRequest]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    reset,
  };
};

export default useApi;
export type { ApiState, PostRequestBody, GetRequestParams, ApiRequestConfig };
