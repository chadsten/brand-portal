// Comprehensive logging and error handling system

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	data?: any;
	context?: {
		userId?: string;
		sessionId?: string;
		component?: string;
		action?: string;
		url?: string;
		userAgent?: string;
	};
	stackTrace?: string;
	fingerprint?: string;
}

export interface LoggerOptions {
	level: LogLevel;
	enableConsole: boolean;
	enableRemote: boolean;
	enableStorage: boolean;
	maxStorageEntries: number;
	bufferSize: number;
	flushInterval: number;
	remoteEndpoint?: string;
	contextExtractors?: Array<() => Partial<LogEntry["context"]>>;
}

export class Logger {
	private static instance: Logger;
	private options: LoggerOptions;
	private buffer: LogEntry[] = [];
	private flushTimer?: NodeJS.Timeout;
	private sessionId: string;

	constructor(options: Partial<LoggerOptions> = {}) {
		this.options = {
			level: LogLevel.INFO,
			enableConsole: true,
			enableRemote: false,
			enableStorage: true,
			maxStorageEntries: 1000,
			bufferSize: 50,
			flushInterval: 10000, // 10 seconds
			...options,
		};

		this.sessionId = this.generateSessionId();
		this.startFlushTimer();
		this.setupErrorHandlers();
	}

	static getInstance(options?: Partial<LoggerOptions>): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(options);
		}
		return Logger.instance;
	}

	// Core logging methods
	debug(
		message: string,
		data?: any,
		context?: Partial<LogEntry["context"]>,
	): void {
		this.log(LogLevel.DEBUG, message, data, context);
	}

	info(
		message: string,
		data?: any,
		context?: Partial<LogEntry["context"]>,
	): void {
		this.log(LogLevel.INFO, message, data, context);
	}

	warn(
		message: string,
		data?: any,
		context?: Partial<LogEntry["context"]>,
	): void {
		this.log(LogLevel.WARN, message, data, context);
	}

	error(
		message: string,
		error?: Error | any,
		context?: Partial<LogEntry["context"]>,
	): void {
		const data =
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack,
					}
				: error;

		this.log(LogLevel.ERROR, message, data, context, error?.stack);
	}

	fatal(
		message: string,
		error?: Error | any,
		context?: Partial<LogEntry["context"]>,
	): void {
		const data =
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack,
					}
				: error;

		this.log(LogLevel.FATAL, message, data, context, error?.stack);
	}

	// Main logging method
	private log(
		level: LogLevel,
		message: string,
		data?: any,
		context?: Partial<LogEntry["context"]>,
		stackTrace?: string,
	): void {
		if (level < this.options.level) return;

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			data,
			context: this.buildContext(context),
			stackTrace,
			fingerprint: this.generateFingerprint(message, data),
		};

		this.buffer.push(entry);

		// Console output
		if (this.options.enableConsole) {
			this.outputToConsole(entry);
		}

		// Immediate flush for high severity
		if (
			level >= LogLevel.ERROR ||
			this.buffer.length >= this.options.bufferSize
		) {
			this.flush();
		}
	}

	// Build context with extractors
	private buildContext(
		additionalContext?: Partial<LogEntry["context"]>,
	): LogEntry["context"] {
		const context: LogEntry["context"] = {
			sessionId: this.sessionId,
			url: typeof window !== "undefined" ? window.location.href : undefined,
			userAgent:
				typeof navigator !== "undefined" ? navigator.userAgent : undefined,
			...additionalContext,
		};

		// Apply context extractors
		if (this.options.contextExtractors) {
			this.options.contextExtractors.forEach((extractor) => {
				Object.assign(context, extractor());
			});
		}

		return context;
	}

	// Generate unique fingerprint for grouping similar errors
	private generateFingerprint(message: string, data?: any): string {
		const content = message + (data ? JSON.stringify(data) : "");
		return btoa(content).substring(0, 16);
	}

	// Generate session ID
	private generateSessionId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	// Console output with formatting
	private outputToConsole(entry: LogEntry): void {
		const color = this.getConsoleColor(entry.level);
		const levelName = LogLevel[entry.level];
		const prefix = `%c[${entry.timestamp}] ${levelName}`;

		console.log(prefix, `color: ${color}`, entry.message, entry.data || "");

		if (entry.stackTrace) {
			console.trace(entry.stackTrace);
		}
	}

	private getConsoleColor(level: LogLevel): string {
		switch (level) {
			case LogLevel.DEBUG:
				return "#6B7280";
			case LogLevel.INFO:
				return "#3B82F6";
			case LogLevel.WARN:
				return "#F59E0B";
			case LogLevel.ERROR:
				return "#EF4444";
			case LogLevel.FATAL:
				return "#DC2626";
			default:
				return "#000000";
		}
	}

	// Flush buffer to storage and remote
	private flush(): void {
		if (this.buffer.length === 0) return;

		const entries = [...this.buffer];
		this.buffer = [];

		// Store locally
		if (this.options.enableStorage) {
			this.storeEntries(entries);
		}

		// Send to remote endpoint
		if (this.options.enableRemote && this.options.remoteEndpoint) {
			this.sendToRemote(entries);
		}
	}

	// Store entries in local storage
	private storeEntries(entries: LogEntry[]): void {
		if (typeof window === "undefined") return;

		try {
			const existing = this.getStoredEntries();
			const combined = [...existing, ...entries];

			// Keep only the most recent entries
			const trimmed = combined.slice(-this.options.maxStorageEntries);

			localStorage.setItem("app_logs", JSON.stringify(trimmed));
		} catch (error) {
			console.warn("Failed to store log entries:", error);
		}
	}

	// Get stored entries
	private getStoredEntries(): LogEntry[] {
		if (typeof window === "undefined") return [];

		try {
			const stored = localStorage.getItem("app_logs");
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.warn("Failed to retrieve stored log entries:", error);
			return [];
		}
	}

	// Send entries to remote endpoint
	private async sendToRemote(entries: LogEntry[]): Promise<void> {
		try {
			await fetch(this.options.remoteEndpoint!, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ entries }),
			});
		} catch (error) {
			console.warn("Failed to send logs to remote endpoint:", error);
		}
	}

	// Setup global error handlers
	private setupErrorHandlers(): void {
		if (typeof window === "undefined") return;

		// Unhandled errors
		window.addEventListener("error", (event) => {
			this.error("Unhandled error", event.error, {
				component: "global",
				action: "error_handler",
			});
		});

		// Unhandled promise rejections
		window.addEventListener("unhandledrejection", (event) => {
			this.error("Unhandled promise rejection", event.reason, {
				component: "global",
				action: "promise_rejection_handler",
			});
		});
	}

	// Timer management
	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.options.flushInterval);
	}

	private stopFlushTimer(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = undefined;
		}
	}

	// Get logs for debugging
	getLogs(level?: LogLevel, limit = 100): LogEntry[] {
		const stored = this.getStoredEntries();
		const filtered =
			level !== undefined
				? stored.filter((entry) => entry.level >= level)
				: stored;

		return filtered.slice(-limit);
	}

	// Clear stored logs
	clearLogs(): void {
		if (typeof window !== "undefined") {
			localStorage.removeItem("app_logs");
		}
		this.buffer = [];
	}

	// Export logs for support
	exportLogs(): string {
		const logs = this.getLogs();
		return JSON.stringify(logs, null, 2);
	}

	// Destroy logger
	destroy(): void {
		this.flush();
		this.stopFlushTimer();
		Logger.instance = null as any;
	}
}

// Error boundary wrapper for React components
export class ErrorHandler {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	// Wrap async functions with error handling
	wrapAsync<T extends (...args: any[]) => Promise<any>>(
		fn: T,
		context?: Partial<LogEntry["context"]>,
	): T {
		return (async (...args: Parameters<T>) => {
			try {
				return await fn(...args);
			} catch (error) {
				this.logger.error(
					`Error in async function: ${fn.name}`,
					error,
					context,
				);
				throw error;
			}
		}) as T;
	}

	// Wrap sync functions with error handling
	wrapSync<T extends (...args: any[]) => any>(
		fn: T,
		context?: Partial<LogEntry["context"]>,
	): T {
		return ((...args: Parameters<T>) => {
			try {
				return fn(...args);
			} catch (error) {
				this.logger.error(`Error in sync function: ${fn.name}`, error, context);
				throw error;
			}
		}) as T;
	}

	// Handle API errors
	handleApiError(error: any, endpoint: string): void {
		const errorInfo = {
			endpoint,
			status: error.status,
			statusText: error.statusText,
			response: error.response,
		};

		this.logger.error(`API Error: ${endpoint}`, errorInfo, {
			component: "api",
			action: "request",
		});
	}

	// Handle validation errors
	handleValidationError(errors: any, context?: string): void {
		this.logger.warn(
			`Validation Error${context ? ` in ${context}` : ""}`,
			errors,
			{
				component: context || "validation",
				action: "validate",
			},
		);
	}

	// Handle user action errors
	handleUserActionError(action: string, error: any): void {
		this.logger.error(`User Action Error: ${action}`, error, {
			component: "user_action",
			action,
		});
	}
}

// Performance logger for tracking slow operations
export class PerformanceLogger {
	private logger: Logger;
	private timers = new Map<string, number>();

	constructor(logger: Logger) {
		this.logger = logger;
	}

	// Start timing an operation
	startTimer(name: string): void {
		this.timers.set(name, performance.now());
	}

	// End timing and log if slow
	endTimer(name: string, threshold = 1000): void {
		const startTime = this.timers.get(name);
		if (!startTime) return;

		const duration = performance.now() - startTime;
		this.timers.delete(name);

		if (duration > threshold) {
			this.logger.warn(
				`Slow operation detected: ${name}`,
				{ duration },
				{
					component: "performance",
					action: name,
				},
			);
		} else {
			this.logger.debug(
				`Operation completed: ${name}`,
				{ duration },
				{
					component: "performance",
					action: name,
				},
			);
		}
	}

	// Log performance metric
	logMetric(name: string, value: number, unit = "ms"): void {
		this.logger.info(
			`Performance metric: ${name}`,
			{ value, unit },
			{
				component: "performance",
				action: "metric",
			},
		);
	}
}

// React hooks for logging
export function useLogger(): Logger {
	return React.useMemo(() => Logger.getInstance(), []);
}

export function useErrorHandler(): ErrorHandler {
	const logger = useLogger();
	return React.useMemo(() => new ErrorHandler(logger), [logger]);
}

export function usePerformanceLogger(): PerformanceLogger {
	const logger = useLogger();
	return React.useMemo(() => new PerformanceLogger(logger), [logger]);
}

// React Error Boundary component (requires React import)
interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends React.Component<
	React.PropsWithChildren<{
		fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
		onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	}>,
	ErrorBoundaryState
> {
	private logger = Logger.getInstance();

	constructor(props: any) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		this.logger.error("React Error Boundary caught error", error, {
			component: "error_boundary",
			action: "component_error",
		});

		this.props.onError?.(error, errorInfo);
	}

	render(): React.ReactNode {
		if (this.state.hasError) {
			const reset = () => this.setState({ hasError: false, error: undefined });

			if (this.props.fallback) {
				const Fallback = this.props.fallback;
				return React.createElement(Fallback, {
					error: this.state.error!,
					reset,
				});
			}

			return React.createElement(
				"div",
				{ className: "error-boundary" },
				React.createElement("h2", null, "Something went wrong"),
				React.createElement("button", { onClick: reset }, "Try again"),
			);
		}

		return this.props.children;
	}
}

// Export singleton instances
export const logger = Logger.getInstance({
	level:
		process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
	enableRemote: process.env.NODE_ENV === "production",
	remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
});

export const errorHandler = new ErrorHandler(logger);
export const performanceLogger = new PerformanceLogger(logger);

// React import
import React from "react";
