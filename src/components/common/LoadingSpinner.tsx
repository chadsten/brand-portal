"use client";

// Import removed - using native HTML and DaisyUI classes
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	color?:
		| "current"
		| "white"
		| "default"
		| "primary"
		| "secondary"
		| "success"
		| "warning"
		| "danger";
	label?: string;
	className?: string;
}

export function LoadingSpinner({
	size = "md",
	color = "primary",
	label,
	className,
}: LoadingSpinnerProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-2 ${className}`}
		>
			<span className={`loading loading-spinner ${size === "sm" ? "loading-sm" : size === "lg" ? "loading-lg" : "loading-md"} ${color === "primary" ? "text-primary" : color === "secondary" ? "text-secondary" : color === "success" ? "text-success" : color === "warning" ? "text-warning" : color === "danger" ? "text-error" : color === "white" ? "text-base-100" : "text-base-content"}`}></span>
			{label && <p className="text-base-content/60 text-sm">{label}</p>}
		</div>
	);
}

interface PageLoadingProps {
	title?: string;
	description?: string;
}

export function PageLoading({
	title = "Loading...",
	description,
}: PageLoadingProps) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center">
			<div className="space-y-4 text-center">
				<Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
				<div>
					<h2 className="font-semibold text-xl">{title}</h2>
					{description && (
						<p className="mt-1 text-base-content/60">{description}</p>
					)}
				</div>
			</div>
		</div>
	);
}

interface SkeletonCardProps {
	lines?: number;
	showAvatar?: boolean;
	showImage?: boolean;
	className?: string;
}

export function SkeletonCard({
	lines = 3,
	showAvatar = false,
	showImage = false,
	className,
}: SkeletonCardProps) {
	return (
		<div className={`card bg-base-100 shadow ${className || ""}`}>
			<div className="card-body space-y-3">
				{showImage && (
					<div className="skeleton h-48 w-full rounded-lg"></div>
				)}

				<div className="space-y-3">
					{showAvatar && (
						<div className="flex items-center gap-3">
							<div className="skeleton h-8 w-8 rounded-full"></div>
							<div className="skeleton h-4 w-24 rounded-lg"></div>
						</div>
					)}

					<div className="space-y-2">
						{Array.from({ length: lines }).map((_, i) => (
							<div
								key={i}
								className={`skeleton h-4 rounded-lg ${
									i === lines - 1 ? "w-3/4" : "w-full"
								}`}
							></div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

interface SkeletonGridProps {
	count?: number;
	showAvatar?: boolean;
	showImage?: boolean;
	columns?: number;
}

export function SkeletonGrid({
	count = 6,
	showAvatar = false,
	showImage = true,
	columns = 3,
}: SkeletonGridProps) {
	return (
		<div
			className={`grid gap-4 ${
				columns === 2
					? "grid-cols-1 md:grid-cols-2"
					: columns === 3
						? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
						: columns === 4
							? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
			}`}
		>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonCard key={i} showAvatar={showAvatar} showImage={showImage} />
			))}
		</div>
	);
}

interface SkeletonTableProps {
	rows?: number;
	columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
	return (
		<div className="card bg-base-100 shadow">
			<div className="card-body p-0">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-base-300">
								{Array.from({ length: columns }).map((_, i) => (
									<th key={i} className="p-4 text-left">
										<div className="skeleton h-4 w-20 rounded-lg"></div>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: rows }).map((_, rowIndex) => (
								<tr
									key={rowIndex}
									className="border-divider border-b last:border-b-0"
								>
									{Array.from({ length: columns }).map((_, colIndex) => (
										<td key={colIndex} className="p-4">
											<div
												className={`skeleton h-4 rounded-lg ${
													colIndex === 0
														? "w-32"
														: colIndex === columns - 1
															? "w-16"
															: "w-24"
												}`}
											></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

interface SkeletonListProps {
	items?: number;
	showAvatar?: boolean;
	showImage?: boolean;
}

export function SkeletonList({
	items = 5,
	showAvatar = true,
	showImage = false,
}: SkeletonListProps) {
	return (
		<div className="space-y-3">
			{Array.from({ length: items }).map((_, i) => (
				<div key={i} className="card bg-base-100 shadow">
					<div className="card-body">
						<div className="flex items-center gap-4">
							{showImage && (
								<div className="skeleton h-16 w-16 rounded-lg"></div>
							)}

							{showAvatar && (
								<div className="skeleton h-10 w-10 rounded-full"></div>
							)}

							<div className="flex-1 space-y-2">
								<div className="skeleton h-4 w-3/4 rounded-lg"></div>
								<div className="skeleton h-3 w-1/2 rounded-lg"></div>
							</div>

							<div className="skeleton h-8 w-20 rounded-lg"></div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// Loading states for specific components
export const LoadingStates = {
	Spinner: LoadingSpinner,
	Page: PageLoading,
	Card: SkeletonCard,
	Grid: SkeletonGrid,
	Table: SkeletonTable,
	List: SkeletonList,
};
