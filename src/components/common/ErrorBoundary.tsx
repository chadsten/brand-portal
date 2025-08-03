"use client";

// Import removed - using native HTML and DaisyUI classes
import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: { componentStack: string }) => void;
	showDetails?: boolean;
	className?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
		this.setState({
			error,
			errorInfo,
		});

		// Log error to external service
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleGoHome = () => {
		window.location.href = "/";
	};

	handleReportError = () => {
		const errorDetails = {
			message: this.state.error?.message,
			stack: this.state.error?.stack,
			componentStack: this.state.errorInfo?.componentStack,
			url: window.location.href,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
		};

		// In a real app, this would send to an error reporting service
		console.log("Error report:", errorDetails);

		// For demo, copy to clipboard
		navigator.clipboard
			.writeText(JSON.stringify(errorDetails, null, 2))
			.then(() => alert("Error details copied to clipboard"))
			.catch(() => alert("Failed to copy error details"));
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div
					className={`flex min-h-screen items-center justify-center p-6 ${this.props.className || ""}`}
				>
					<div className="card bg-base-100 shadow w-full max-w-2xl">
						<div className="card-body space-y-6 text-center">
							<div className="flex justify-center">
								<div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
									<AlertTriangle className="h-10 w-10 text-danger" />
								</div>
							</div>

							<div>
								<h1 className="mb-2 font-bold text-2xl text-foreground">
									Something went wrong
								</h1>
								<p className="mb-4 text-default-600">
									We encountered an unexpected error. Our team has been notified
									and is working on a fix.
								</p>

								<span className="badge badge-error mb-4">
									Error ID: {this.state.error?.name || "Unknown"}
								</span>
							</div>

							{this.props.showDetails && this.state.error && (
								<div className="card bg-base-200 shadow text-left">
									<div className="card-body">
										<h3 className="mb-2 font-semibold">Error Details:</h3>
										<div className="space-y-2 text-small">
											<div>
												<strong>Message:</strong>
												<p className="mt-1 font-mono text-default-600">
													{this.state.error.message}
												</p>
											</div>
											{this.state.error.stack && (
												<div>
													<strong>Stack Trace:</strong>
													<pre className="mt-1 max-h-32 overflow-auto rounded bg-default-50 p-2 text-default-500 text-tiny">
														{this.state.error.stack}
													</pre>
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							<div className="flex flex-col justify-center gap-3 sm:flex-row">
								<button
									className="btn btn-primary"
									onClick={this.handleReset}
								>
									<RefreshCw size={16} />
									Try Again
								</button>
								<button
									className="btn btn-ghost"
									onClick={this.handleGoHome}
								>
									<Home size={16} />
									Go Home
								</button>
								<button
									className="btn btn-ghost"
									onClick={this.handleReportError}
								>
									<Bug size={16} />
									Report Error
								</button>
							</div>

							<p className="text-default-500 text-small">
								If this problem persists, please contact our support team.
							</p>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Functional wrapper for easier usage
interface ErrorBoundaryWrapperProps
	extends Omit<ErrorBoundaryProps, "children"> {
	children: ReactNode;
}

export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
	return WrappedComponent;
}

export default ErrorBoundary;
