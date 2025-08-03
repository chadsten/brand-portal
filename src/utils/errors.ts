// Custom error classes and error handling utilities

// Base application error class
export abstract class AppError extends Error {
	abstract readonly code: string;
	abstract readonly statusCode: number;
	readonly timestamp: string;
	readonly context?: Record<string, any>;

	constructor(message: string, context?: Record<string, any>) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date().toISOString();
		this.context = context;
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON(): object {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			timestamp: this.timestamp,
			context: this.context,
			stack: this.stack,
		};
	}
}

// API related errors
export class ApiError extends AppError {
	readonly code = "API_ERROR";
	readonly statusCode: number;
	readonly endpoint?: string;
	readonly method?: string;

	constructor(
		message: string,
		statusCode = 500,
		context?: Record<string, any> & { endpoint?: string; method?: string },
	) {
		super(message, context);
		this.statusCode = statusCode;
		this.endpoint = context?.endpoint;
		this.method = context?.method;
	}
}

export class NetworkError extends AppError {
	readonly code = "NETWORK_ERROR";
	readonly statusCode = 0;

	constructor(
		message = "Network connection failed",
		context?: Record<string, any>,
	) {
		super(message, context);
	}
}

export class TimeoutError extends AppError {
	readonly code = "TIMEOUT_ERROR";
	readonly statusCode = 408;
	readonly timeout: number;

	constructor(timeout: number, context?: Record<string, any>) {
		super(`Request timed out after ${timeout}ms`, context);
		this.timeout = timeout;
	}
}

// Authentication and authorization errors
export class AuthenticationError extends AppError {
	readonly code = "AUTHENTICATION_ERROR";
	readonly statusCode = 401;

	constructor(
		message = "Authentication required",
		context?: Record<string, any>,
	) {
		super(message, context);
	}
}

export class AuthorizationError extends AppError {
	readonly code = "AUTHORIZATION_ERROR";
	readonly statusCode = 403;

	constructor(message = "Access denied", context?: Record<string, any>) {
		super(message, context);
	}
}

// Validation errors
export class ValidationError extends AppError {
	readonly code = "VALIDATION_ERROR";
	readonly statusCode = 400;
	readonly errors: Record<string, string[]>;

	constructor(errors: Record<string, string[]>, context?: Record<string, any>) {
		const message = "Validation failed";
		super(message, context);
		this.errors = errors;
	}
}

export class SchemaError extends AppError {
	readonly code = "SCHEMA_ERROR";
	readonly statusCode = 400;
	readonly field: string;

	constructor(field: string, message: string, context?: Record<string, any>) {
		super(`Schema validation failed for field "${field}": ${message}`, context);
		this.field = field;
	}
}

// Resource errors
export class NotFoundError extends AppError {
	readonly code = "NOT_FOUND_ERROR";
	readonly statusCode = 404;
	readonly resource?: string;
	readonly resourceId?: string;

	constructor(
		resource?: string,
		resourceId?: string,
		context?: Record<string, any>,
	) {
		const message = resource
			? `${resource}${resourceId ? ` with ID "${resourceId}"` : ""} not found`
			: "Resource not found";
		super(message, context);
		this.resource = resource;
		this.resourceId = resourceId;
	}
}

export class ConflictError extends AppError {
	readonly code = "CONFLICT_ERROR";
	readonly statusCode = 409;

	constructor(message = "Resource conflict", context?: Record<string, any>) {
		super(message, context);
	}
}

// File and upload errors
export class FileError extends AppError {
	readonly code = "FILE_ERROR";
	readonly statusCode = 400;
	readonly fileName?: string;
	readonly fileSize?: number;

	constructor(
		message: string,
		context?: Record<string, any> & { fileName?: string; fileSize?: number },
	) {
		super(message, context);
		this.fileName = context?.fileName;
		this.fileSize = context?.fileSize;
	}
}

export class FileSizeError extends AppError {
	readonly code = "FILE_SIZE_ERROR";
	readonly statusCode = 400;
	readonly maxSize: number;
	readonly fileName?: string;
	readonly fileSize?: number;

	constructor(maxSize: number, actualSize?: number, fileName?: string) {
		super(`File size exceeds maximum limit of ${maxSize} bytes`, {
			fileName,
			fileSize: actualSize,
		});
		this.maxSize = maxSize;
		this.fileName = fileName;
		this.fileSize = actualSize;
	}
}

export class FileTypeError extends AppError {
	readonly code = "FILE_TYPE_ERROR";
	readonly statusCode = 400;
	readonly allowedTypes: string[];
	readonly fileName?: string;

	constructor(allowedTypes: string[], fileName?: string) {
		super(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`, {
			fileName,
		});
		this.allowedTypes = allowedTypes;
		this.fileName = fileName;
	}
}

// Business logic errors
export class BusinessLogicError extends AppError {
	readonly code = "BUSINESS_LOGIC_ERROR";
	readonly statusCode = 422;

	constructor(message: string, context?: Record<string, any>) {
		super(message, context);
	}
}

export class QuotaExceededError extends AppError {
	readonly code = "QUOTA_EXCEEDED_ERROR";
	readonly statusCode = 429;
	readonly quota: number;
	readonly current: number;

	constructor(quota: number, current: number, context?: Record<string, any>) {
		super(`Quota exceeded: ${current}/${quota}`, context);
		this.quota = quota;
		this.current = current;
	}
}

// Configuration errors
export class ConfigurationError extends AppError {
	readonly code = "CONFIGURATION_ERROR";
	readonly statusCode = 500;
	readonly configKey?: string;

	constructor(
		message: string,
		configKey?: string,
		context?: Record<string, any>,
	) {
		super(message, context);
		this.configKey = configKey;
	}
}

// External service errors
export class ExternalServiceError extends AppError {
	readonly code = "EXTERNAL_SERVICE_ERROR";
	readonly statusCode = 502;
	readonly service: string;

	constructor(service: string, message: string, context?: Record<string, any>) {
		super(`External service "${service}" error: ${message}`, context);
		this.service = service;
	}
}

// Error factory for creating errors from HTTP responses
export class ErrorFactory {
	static fromHttpResponse(response: Response, data?: any): AppError {
		const context = {
			endpoint: response.url,
			method: "unknown",
			response: data,
		};

		switch (response.status) {
			case 400:
				return new ValidationError(data?.errors || {}, context);
			case 401:
				return new AuthenticationError(data?.message, context);
			case 403:
				return new AuthorizationError(data?.message, context);
			case 404:
				return new NotFoundError(data?.resource, data?.resourceId, context);
			case 409:
				return new ConflictError(data?.message, context);
			case 422:
				return new BusinessLogicError(data?.message, context);
			case 429:
				return new QuotaExceededError(
					data?.quota || 0,
					data?.current || 0,
					context,
				);
			case 502:
			case 503:
			case 504:
				return new ExternalServiceError(
					"API",
					data?.message || "Service unavailable",
					context,
				);
			default:
				return new ApiError(
					data?.message || `HTTP ${response.status}: ${response.statusText}`,
					response.status,
					context,
				);
		}
	}

	static fromNetworkError(error: Error): NetworkError {
		return new NetworkError(error.message, { originalError: error.name });
	}

	static fromTimeout(timeout: number): TimeoutError {
		return new TimeoutError(timeout);
	}
}

// Error retry utility
export class ErrorRetry {
	static isRetryable(error: AppError): boolean {
		return (
			error instanceof NetworkError ||
			error instanceof TimeoutError ||
			(error instanceof ApiError && error.statusCode >= 500)
		);
	}

	static async withRetry<T>(
		operation: () => Promise<T>,
		options: {
			maxAttempts?: number;
			baseDelay?: number;
			maxDelay?: number;
			backoffFactor?: number;
			shouldRetry?: (error: Error) => boolean;
		} = {},
	): Promise<T> {
		const {
			maxAttempts = 3,
			baseDelay = 1000,
			maxDelay = 30000,
			backoffFactor = 2,
			shouldRetry = (error) =>
				error instanceof AppError && ErrorRetry.isRetryable(error as AppError),
		} = options;

		let lastError: Error;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				if (attempt === maxAttempts || !shouldRetry(lastError)) {
					throw lastError;
				}

				const delay = Math.min(
					baseDelay * backoffFactor ** (attempt - 1),
					maxDelay,
				);

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw lastError!;
	}
}

// Error context builder
export class ErrorContext {
	private context: Record<string, any> = {};

	user(userId: string, userName?: string): this {
		this.context.user = { id: userId, name: userName };
		return this;
	}

	component(name: string): this {
		this.context.component = name;
		return this;
	}

	action(name: string): this {
		this.context.action = name;
		return this;
	}

	request(method: string, url: string): this {
		this.context.request = { method, url };
		return this;
	}

	data(key: string, value: any): this {
		if (!this.context.data) {
			this.context.data = {};
		}
		this.context.data[key] = value;
		return this;
	}

	build(): Record<string, any> {
		return { ...this.context };
	}
}

// Error aggregator for collecting multiple errors
export class ErrorAggregator {
	private errors: AppError[] = [];

	add(error: AppError): this {
		this.errors.push(error);
		return this;
	}

	addIf(condition: boolean, error: AppError): this {
		if (condition) {
			this.add(error);
		}
		return this;
	}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}

	getErrors(): AppError[] {
		return [...this.errors];
	}

	getErrorsByType<T extends AppError>(type: new (...args: any[]) => T): T[] {
		return this.errors.filter((error) => error instanceof type) as T[];
	}

	throwIfAny(): void {
		if (this.hasErrors()) {
			if (this.errors.length === 1) {
				throw this.errors[0];
			}

			throw new ValidationError(
				this.errors.reduce(
					(acc, error, index) => {
						acc[`error_${index}`] = [error.message];
						return acc;
					},
					{} as Record<string, string[]>,
				),
				{ errors: this.errors.map((e) => e.toJSON()) },
			);
		}
	}

	clear(): this {
		this.errors = [];
		return this;
	}
}

// React hooks for error handling
export function useErrorBoundary(): {
	captureError: (error: Error) => void;
	resetError: () => void;
} {
	const [, setError] = React.useState<Error | null>(null);

	const captureError = React.useCallback((error: Error) => {
		setError(error);
	}, []);

	const resetError = React.useCallback(() => {
		setError(null);
	}, []);

	return { captureError, resetError };
}

export function useAsyncError(): (error: Error) => void {
	const { captureError } = useErrorBoundary();

	return React.useCallback(
		(error: Error) => {
			captureError(error);
		},
		[captureError],
	);
}

// Utility functions
export function isAppError(error: any): error is AppError {
	return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof AppError) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "An unknown error occurred";
}

export function getErrorCode(error: unknown): string {
	if (error instanceof AppError) {
		return error.code;
	}

	return "UNKNOWN_ERROR";
}

// Export utility instances
export const errorContext = (): ErrorContext => new ErrorContext();
export const errorAggregator = (): ErrorAggregator => new ErrorAggregator();

// React import
import React from "react";
