"use client";

import React from "react";
// Import removed - using native HTML and DaisyUI classes
import {
	ArrowLeft,
	Bookmark,
	ChevronRight,
	Copy,
	ExternalLink,
	Home,
	MoreHorizontal,
	Share2,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbSegment {
	label: string;
	href: string;
	icon?: React.ReactNode;
	current?: boolean;
	metadata?: {
		type?: string;
		status?: string;
		count?: number;
	};
}

interface BreadcrumbNavigationProps {
	segments?: BreadcrumbSegment[];
	showBackButton?: boolean;
	showActions?: boolean;
	onBack?: () => void;
	onShare?: (path: string) => void;
	onBookmark?: (path: string) => void;
	onCopy?: (path: string) => void;
	maxItems?: number;
}

// Route mappings for automatic breadcrumb generation
const ROUTE_MAPPINGS: Record<
	string,
	{ label: string; icon?: React.ReactNode }
> = {
	"/": { label: "Dashboard", icon: <Home size={16} /> },
	"/assets": { label: "Assets" },
	"/assets/upload": { label: "Upload" },
	"/assets/favorites": { label: "Favorites" },
	"/collections": { label: "Collections" },
	"/collections/create": { label: "Create Collection" },
	"/brand": { label: "Brand Portal" },
	"/brand/guidelines": { label: "Guidelines" },
	"/brand/approval": { label: "Approval" },
	"/brand/compliance": { label: "Compliance" },
	"/search": { label: "Search" },
	"/search/saved": { label: "Saved Searches" },
	"/collaboration": { label: "Collaboration" },
	"/collaboration/meetings": { label: "Meetings" },
	"/ai": { label: "AI Tools" },
	"/ai/tagging": { label: "Auto Tagging" },
	"/ai/workflows": { label: "Workflows" },
	"/analytics": { label: "Analytics" },
	"/analytics/reports": { label: "Reports" },
	"/settings": { label: "Settings" },
	"/settings/profile": { label: "Profile" },
	"/settings/preferences": { label: "Preferences" },
};

export function BreadcrumbNavigation({
	segments: customSegments,
	showBackButton = false,
	showActions = true,
	onBack,
	onShare,
	onBookmark,
	onCopy,
	maxItems = 5,
}: BreadcrumbNavigationProps) {
	const pathname = usePathname();

	// Generate breadcrumb segments from pathname if not provided
	const generateSegments = (): BreadcrumbSegment[] => {
		if (customSegments) return customSegments;

		const pathParts = pathname.split("/").filter(Boolean);
		const segments: BreadcrumbSegment[] = [];

		// Always start with home
		segments.push({
			label: "Dashboard",
			href: "/",
			icon: <Home size={16} />,
		});

		// Build segments from path parts
		let currentPath = "";
		pathParts.forEach((part, index) => {
			currentPath += `/${part}`;
			const mapping = ROUTE_MAPPINGS[currentPath];

			if (mapping) {
				segments.push({
					label: mapping.label,
					href: currentPath,
					icon: mapping.icon,
					current: index === pathParts.length - 1,
				});
			} else {
				// For dynamic routes, clean up the segment
				const cleanLabel = part
					.replace(/-/g, " ")
					.replace(/([a-z])([A-Z])/g, "$1 $2")
					.split(" ")
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");

				segments.push({
					label: cleanLabel,
					href: currentPath,
					current: index === pathParts.length - 1,
				});
			}
		});

		return segments;
	};

	const segments = generateSegments();
	const currentPath = pathname;

	// Handle overflow when there are too many segments
	const getDisplaySegments = (): (BreadcrumbSegment & {
		isOverflow?: boolean;
		hiddenSegments?: BreadcrumbSegment[];
	})[] => {
		if (segments.length <= maxItems) {
			return segments;
		}

		const firstSegment = segments[0];
		const lastSegments = segments.slice(-2); // Always show last 2
		const middleSegments = segments.slice(1, -2);
		const hiddenCount = middleSegments.length;

		if (!firstSegment) return segments;

		return [
			firstSegment,
			{
				label: `... (${hiddenCount} more)`,
				href: "#",
				isOverflow: true,
				hiddenSegments: middleSegments,
			},
			...lastSegments,
		];
	};

	const displaySegments = getDisplaySegments();

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: document.title,
				url: window.location.href,
			});
		} else {
			onShare?.(currentPath);
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(window.location.href);
		onCopy?.(currentPath);
	};

	const handleBookmark = () => {
		onBookmark?.(currentPath);
	};

	const renderSegment = (
		segment: BreadcrumbSegment & {
			isOverflow?: boolean;
			hiddenSegments?: BreadcrumbSegment[];
		},
		index: number,
	) => {
		if (segment.isOverflow && segment.hiddenSegments) {
			return (
				<li key={`overflow-${index}`} className="dropdown dropdown-hover">
					<button className="btn btn-ghost btn-sm h-auto min-w-0 p-1">
						<MoreHorizontal size={14} />
						{segment.label}
					</button>
					<ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						{segment.hiddenSegments.map((hiddenSegment) => (
							<li key={hiddenSegment.href}>
								<a href={hiddenSegment.href}>
									{hiddenSegment.icon}
									{hiddenSegment.label}
								</a>
							</li>
						))}
					</ul>
				</li>
			);
		}

		return (
			<li key={segment.href} className={segment.current ? "font-medium text-base-content" : ""}>
				{segment.current ? (
					<span className="flex items-center gap-2">
						{segment.icon}
						<span>{segment.label}</span>
						{segment.metadata?.status && (
							<span className="badge badge-primary badge-sm">
								{segment.metadata.status}
							</span>
						)}
						{segment.metadata?.count !== undefined && (
							<span className="badge badge-neutral badge-sm">
								{segment.metadata.count}
							</span>
						)}
					</span>
				) : (
					<a href={segment.href} className="flex items-center gap-2 text-base-content/60 hover:text-base-content">
						{segment.icon}
						<span>{segment.label}</span>
						{segment.metadata?.status && (
							<span className="badge badge-primary badge-sm">
								{segment.metadata.status}
							</span>
						)}
						{segment.metadata?.count !== undefined && (
							<span className="badge badge-neutral badge-sm">
								{segment.metadata.count}
							</span>
						)}
					</a>
				)}
			</li>
		);
	};

	return (
		<div className="flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				{showBackButton && (
					<button
						className="btn btn-outline btn-sm flex-shrink-0"
						onClick={onBack}
					>
						<ArrowLeft size={16} />
					</button>
				)}

				<div className="min-w-0 flex-1">
					<div className="breadcrumbs">
						<ul className="flex-wrap">
							{displaySegments.map((segment, index) => (
								<React.Fragment key={segment.href || index}>
									{renderSegment(segment, index)}
									{index < displaySegments.length - 1 && (
										<ChevronRight size={14} className="text-base-content/40 mx-2" />
									)}
								</React.Fragment>
							))}
						</ul>
					</div>
				</div>
			</div>

			{showActions && (
				<div className="ml-4 flex flex-shrink-0 items-center gap-1">
					<div className="tooltip tooltip-bottom" data-tip="Copy link">
						<button className="btn btn-outline btn-sm" onClick={handleCopy}>
							<Copy size={16} />
						</button>
					</div>

					<div className="tooltip tooltip-bottom" data-tip="Share page">
						<button className="btn btn-outline btn-sm" onClick={handleShare}>
							<Share2 size={16} />
						</button>
					</div>

					<div className="tooltip tooltip-bottom" data-tip="Bookmark page">
						<button
							className="btn btn-outline btn-sm"
							onClick={handleBookmark}
						>
							<Bookmark size={16} />
						</button>
					</div>

					<div className="dropdown dropdown-end">
						<button className="btn btn-outline btn-sm">
							<MoreHorizontal size={16} />
						</button>
						<ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
							<li>
								<a onClick={() => window.open(window.location.href, "_blank")}>
									<ExternalLink size={16} />
									Open in New Tab
								</a>
							</li>
							<li>
								<a onClick={() => navigator.clipboard.writeText(currentPath)}>
									<Copy size={16} />
									Copy Path
								</a>
							</li>
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
