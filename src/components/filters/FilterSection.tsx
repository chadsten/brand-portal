"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface FilterSectionProps {
	/**
	 * Section title
	 */
	title: string;
	/**
	 * Section content
	 */
	children: ReactNode;
	/**
	 * Whether section is collapsible
	 */
	collapsible?: boolean;
	/**
	 * Whether section is expanded by default
	 */
	defaultExpanded?: boolean;
	/**
	 * Optional icon to display next to title
	 */
	icon?: ReactNode;
	/**
	 * Badge count to display
	 */
	badgeCount?: number;
}

/**
 * Reusable filter section component with optional collapsible behavior
 */
export function FilterSection({
	title,
	children,
	collapsible = false,
	defaultExpanded = true,
	icon,
	badgeCount,
}: FilterSectionProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const toggleExpanded = () => {
		if (collapsible) {
			setIsExpanded(!isExpanded);
		}
	};

	return (
		<div className="border border-base-300 rounded-lg overflow-hidden">
			<div
				className={`p-4 border-b border-base-300 bg-base-200 ${
					collapsible ? "cursor-pointer hover:bg-base-100" : ""
				}`}
				onClick={toggleExpanded}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{icon && <span className="text-base-content/60">{icon}</span>}
						<h4 className="font-medium text-sm">{title}</h4>
						{badgeCount !== undefined && badgeCount > 0 && (
							<span className="badge badge-primary badge-sm">
								{badgeCount}
							</span>
						)}
					</div>
					{collapsible && (
						<ChevronDown
							size={16}
							className={`transition-transform ${
								isExpanded ? "rotate-180" : ""
							}`}
						/>
					)}
				</div>
			</div>
			<div
				className={`transition-all duration-200 ${
					isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0 overflow-hidden"
				}`}
			>
				<div className="p-4">
					{children}
				</div>
			</div>
		</div>
	);
}