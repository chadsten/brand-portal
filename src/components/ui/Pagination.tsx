"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useCallback, useMemo } from "react";

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	showPageSizeSelector?: boolean;
	pageSizeOptions?: number[];
	disabled?: boolean;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
	showPageSizeSelector = true,
	pageSizeOptions = [25, 50, 100],
	disabled = false,
	className = "",
}: PaginationProps) {
	// Generate page numbers to display
	const pageNumbers = useMemo(() => {
		const delta = 2; // Number of pages to show on each side of current page
		const range = [];
		const rangeWithDots = [];

		// Calculate start and end of range around current page
		const start = Math.max(1, currentPage - delta);
		const end = Math.min(totalPages, currentPage + delta);

		// Add first page if not in range
		if (start > 1) {
			range.push(1);
			if (start > 2) {
				range.push("...");
			}
		}

		// Add pages in range
		for (let i = start; i <= end; i++) {
			range.push(i);
		}

		// Add last page if not in range
		if (end < totalPages) {
			if (end < totalPages - 1) {
				range.push("...");
			}
			range.push(totalPages);
		}

		return range;
	}, [currentPage, totalPages]);

	const handlePageChange = useCallback(
		(page: number) => {
			if (disabled || page < 1 || page > totalPages || page === currentPage) {
				return;
			}
			onPageChange(page);
		},
		[disabled, totalPages, currentPage, onPageChange],
	);

	const handlePageSizeChange = useCallback(
		(newPageSize: number) => {
			if (disabled || !onPageSizeChange) return;
			onPageSizeChange(newPageSize);
		},
		[disabled, onPageSizeChange],
	);

	// Calculate display range
	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, total);

	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
			{/* Results summary */}
			<div className="text-base-content/70 text-sm">
				Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {total.toLocaleString()} results
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				{/* Page size selector */}
				{showPageSizeSelector && onPageSizeChange && (
					<div className="flex items-center gap-2">
						<span className="text-base-content/70 text-sm">Show:</span>
						<select
							className="select select select-sm"
							value={pageSize}
							onChange={(e) => handlePageSizeChange(Number(e.target.value))}
							disabled={disabled}
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Pagination controls */}
				<div className="join">
					{/* Previous button */}
					<button
						className={`btn btn-outline join-item ${disabled || currentPage === 1 ? "btn-disabled" : ""}`}
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={disabled || currentPage === 1}
						aria-label="Go to previous page"
					>
						<ChevronLeft size={16} />
						<span className="hidden sm:inline">Previous</span>
					</button>

					{/* Page numbers */}
					{pageNumbers.map((page, index) => {
						if (page === "...") {
							return (
								<button
									key={`dots-${index}`}
									className="btn btn-outline join-item btn-disabled"
									disabled
								>
									<MoreHorizontal size={16} />
								</button>
							);
						}

						const pageNum = page as number;
						const isActive = pageNum === currentPage;

						return (
							<button
								key={pageNum}
								className={`btn join-item ${
									isActive
										? "btn-primary"
										: disabled
											? "btn-disabled"
											: "btn-outline"
								}`}
								onClick={() => handlePageChange(pageNum)}
								disabled={disabled}
								aria-label={`Go to page ${pageNum}`}
								aria-current={isActive ? "page" : undefined}
							>
								{pageNum}
							</button>
						);
					})}

					{/* Next button */}
					<button
						className={`btn btn-outline join-item ${disabled || currentPage === totalPages ? "btn-disabled" : ""}`}
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={disabled || currentPage === totalPages}
						aria-label="Go to next page"
					>
						<span className="hidden sm:inline">Next</span>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			{/* Jump to page (mobile-friendly) */}
			<div className="flex items-center gap-2 sm:hidden">
				<span className="text-base-content/70 text-sm">Page:</span>
				<input
					type="number"
					min={1}
					max={totalPages}
					value={currentPage}
					onChange={(e) => {
						const page = Number(e.target.value);
						if (page >= 1 && page <= totalPages) {
							handlePageChange(page);
						}
					}}
					className="input input-sm w-20"
					disabled={disabled}
					aria-label="Jump to page"
				/>
				<span className="text-base-content/70 text-sm">of {totalPages}</span>
			</div>
		</div>
	);
}

// Compact pagination for smaller spaces
export interface CompactPaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
	className?: string;
}

export function CompactPagination({
	currentPage,
	totalPages,
	onPageChange,
	disabled = false,
	className = "",
}: CompactPaginationProps) {
	const handlePageChange = useCallback(
		(page: number) => {
			if (disabled || page < 1 || page > totalPages || page === currentPage) {
				return;
			}
			onPageChange(page);
		},
		[disabled, totalPages, currentPage, onPageChange],
	);

	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className={`flex items-center justify-center gap-1 ${className}`}>
			<button
				className={`btn btn-circle btn-sm ${disabled || currentPage === 1 ? "btn-disabled" : "btn-outline"}`}
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={disabled || currentPage === 1}
				aria-label="Previous page"
			>
				<ChevronLeft size={14} />
			</button>

			<div className="flex items-center gap-1 px-2">
				<span className="text-base-content/70 text-sm">
					{currentPage} of {totalPages}
				</span>
			</div>

			<button
				className={`btn btn-circle btn-sm ${disabled || currentPage === totalPages ? "btn-disabled" : "btn-outline"}`}
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={disabled || currentPage === totalPages}
				aria-label="Next page"
			>
				<ChevronRight size={14} />
			</button>
		</div>
	);
}