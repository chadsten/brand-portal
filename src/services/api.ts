// API Configuration and Base Service
interface ApiConfig {
	baseUrl: string;
	timeout: number;
	retries: number;
	retryDelay: number;
}

interface ApiResponse<T = any> {
	data: T;
	success: boolean;
	message?: string;
	errors?: string[];
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
		totalPages?: number;
	};
}

interface ApiError {
	message: string;
	status: number;
	code?: string;
	details?: any;
}

class ApiClient {
	private config: ApiConfig;
	private baseHeaders: Record<string, string>;

	constructor(config: Partial<ApiConfig> = {}) {
		this.config = {
			baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
			timeout: 30000,
			retries: 3,
			retryDelay: 1000,
			...config,
		};

		this.baseHeaders = {
			"Content-Type": "application/json",
		};
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		attempt = 1,
	): Promise<ApiResponse<T>> {
		const url = `${this.config.baseUrl}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			// Get auth token if available
			const token = this.getAuthToken();
			const headers = {
				...this.baseHeaders,
				...(token && { Authorization: `Bearer ${token}` }),
				...options.headers,
			};

			const response = await fetch(url, {
				...options,
				headers,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new ApiError({
					message:
						errorData.message ||
						`HTTP ${response.status}: ${response.statusText}`,
					status: response.status,
					code: errorData.code,
					details: errorData,
				});
			}

			const data = await response.json();
			return data;
		} catch (error) {
			clearTimeout(timeoutId);

			// Retry logic for network errors
			if (
				attempt < this.config.retries &&
				(error instanceof TypeError || // Network errors
					error instanceof DOMException || // Abort errors
					(error instanceof ApiError && error.status >= 500)) // Server errors
			) {
				await this.delay(this.config.retryDelay * attempt);
				return this.request<T>(endpoint, options, attempt + 1);
			}

			throw error;
		}
	}

	private getAuthToken(): string | null {
		if (typeof window !== "undefined") {
			return (
				localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
			);
		}
		return null;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// HTTP Methods
	async get<T>(
		endpoint: string,
		params?: Record<string, any>,
	): Promise<ApiResponse<T>> {
		const url = params
			? `${endpoint}?${new URLSearchParams(params).toString()}`
			: endpoint;
		return this.request<T>(url, { method: "GET" });
	}

	async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: "DELETE" });
	}

	// File upload
	async upload<T>(
		endpoint: string,
		file: File,
		data?: Record<string, any>,
	): Promise<ApiResponse<T>> {
		const formData = new FormData();
		formData.append("file", file);

		if (data) {
			Object.entries(data).forEach(([key, value]) => {
				formData.append(key, String(value));
			});
		}

		const token = this.getAuthToken();
		const headers: Record<string, string> = {};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		return this.request<T>(endpoint, {
			method: "POST",
			body: formData,
			headers,
		});
	}

	// Bulk operations
	async batch<T>(
		requests: Array<{ endpoint: string; method: string; data?: any }>,
	): Promise<ApiResponse<T[]>> {
		return this.post<T[]>("/batch", { requests });
	}

	// Set auth token
	setAuthToken(token: string, persistent = false): void {
		if (typeof window !== "undefined") {
			if (persistent) {
				localStorage.setItem("authToken", token);
			} else {
				sessionStorage.setItem("authToken", token);
			}
		}
	}

	// Clear auth token
	clearAuthToken(): void {
		if (typeof window !== "undefined") {
			localStorage.removeItem("authToken");
			sessionStorage.removeItem("authToken");
		}
	}
}

// Create default API client instance
export const apiClient = new ApiClient();

// Custom ApiError class
class ApiError extends Error {
	status: number;
	code?: string;
	details?: any;

	constructor({
		message,
		status,
		code,
		details,
	}: {
		message: string;
		status: number;
		code?: string;
		details?: any;
	}) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export { ApiError };
export type { ApiResponse, ApiConfig };
