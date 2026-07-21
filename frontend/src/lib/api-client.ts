import type { AxiosRequestConfig } from "axios";
import api from "@/services/api";

type ApiPayload<T> = T | { success?: boolean; data: T };

function unwrap<T>(payload: ApiPayload<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.get<ApiPayload<T>>(url, config);
    return { data: unwrap(response.data) };
  },
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.post<ApiPayload<T>>(url, body, config);
    return { data: unwrap(response.data) };
  },
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.put<ApiPayload<T>>(url, body, config);
    return { data: unwrap(response.data) };
  },
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.patch<ApiPayload<T>>(url, body, config);
    return { data: unwrap(response.data) };
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.delete<ApiPayload<T>>(url, config);
    return { data: unwrap(response.data) };
  },
};
