"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";

export interface SidebarLayoutProps {
	/**
	 * Main content area
	 */
	children: ReactNode;
	/**
	 * Sidebar content (filters)
	 */
	sidebar: ReactNode;
	/**
	 * Whether sidebar should be open by default on desktop
	 */
	defaultSidebarOpen?: boolean;
	/**
	 * Whether to show mobile filter toggle
	 */
	showMobileToggle?: boolean;
	/**
	 * Custom title for the filter section
	 */
	filterTitle?: string;
	/**
	 * Number of active filters (for badge display)
	 */
	activeFilterCount?: number;
	/**
	 * Callback when mobile filter is toggled
	 */
	onMobileToggle?: (isOpen: boolean) => void;
}

export function SidebarLayout({
	children,
	sidebar,
	defaultSidebarOpen = true,
	showMobileToggle = true,
	filterTitle = "Filters",
	activeFilterCount = 0,
	onMobileToggle,
}: SidebarLayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);
	const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

	const handleMobileToggle = () => {
		const newState = !isMobileFilterOpen;
		setIsMobileFilterOpen(newState);
		onMobileToggle?.(newState);
	};

	const handleSidebarToggle = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Mobile Filter Toggle - Only visible on mobile */}
			{showMobileToggle && (
				<div className="lg:hidden mb-4">
					<button
						className="btn btn-outline w-full gap-2"
						onClick={handleMobileToggle}
					>
						<Filter size={16} />
						{filterTitle}
						{activeFilterCount > 0 && (
							<span className="badge badge-primary badge-sm">
								{activeFilterCount}
							</span>
						)}
						<ChevronDown
							size={16}
							className={`ml-auto transition-transform ${
								isMobileFilterOpen ? "rotate-180" : ""
							}`}
						/>
					</button>

					{/* Mobile Filter Accordion */}
					<div
						className={`overflow-hidden transition-all duration-300 ${
							isMobileFilterOpen ? "max-h-[80vh] mt-4" : "max-h-0"
						}`}
					>
						<div className="card bg-base-100 shadow">
							<div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200">
								<h3 className="font-semibold">{filterTitle}</h3>
								<button
									className="btn btn-ghost btn-sm btn-square"
									onClick={handleMobileToggle}
								>
									<X size={16} />
								</button>
							</div>
							<div className="card-body max-h-96 overflow-y-auto">
								{sidebar}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Desktop Layout */}
			<div className="hidden lg:flex flex-1 gap-6">
				{/* Desktop Sidebar */}
				<div
					className={`transition-all duration-300 ${
						isSidebarOpen ? "w-80 min-w-80" : "w-0 min-w-0 overflow-hidden"
					}`}
				>
					{isSidebarOpen && (
						<div className="h-full">
							<div className="card bg-base-100 shadow h-full">
								<div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200">
									<h3 className="font-semibold flex items-center gap-2">
										<Filter size={16} />
										{filterTitle}
										{activeFilterCount > 0 && (
											<span className="badge badge-primary badge-sm">
												{activeFilterCount}
											</span>
										)}
									</h3>
									<button
										className="btn btn-ghost btn-sm btn-square"
										onClick={handleSidebarToggle}
									>
										<X size={16} />
									</button>
								</div>
								<div className="card-body overflow-y-auto flex-1">
									{sidebar}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Desktop Sidebar Toggle Button */}
				{!isSidebarOpen && (
					<div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
						<button
							className="btn btn-primary btn-circle shadow-lg"
							onClick={handleSidebarToggle}
							title="Open Filters"
						>
							<Filter size={16} />
						</button>
					</div>
				)}

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					{children}
				</div>
			</div>

			{/* Mobile Layout - When accordion is closed */}
			<div className="lg:hidden flex-1">
				{children}
			</div>
		</div>
	);
}