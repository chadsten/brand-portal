"use client";

import { Calendar, X } from "lucide-react";
import { useState } from "react";

export interface DateRange {
	from?: Date;
	to?: Date;
}

export interface DateRangeFilterProps {
	/**
	 * Current date range value
	 */
	value?: DateRange;
	/**
	 * Callback when date range changes
	 */
	onChange: (dateRange?: DateRange) => void;
	/**
	 * Label for the from date input
	 */
	fromLabel?: string;
	/**
	 * Label for the to date input
	 */
	toLabel?: string;
	/**
	 * Whether to show clear button
	 */
	showClear?: boolean;
	/**
	 * Preset date ranges
	 */
	presets?: Array<{
		label: string;
		range: DateRange;
	}>;
}

/**
 * Reusable date range filter component
 */
export function DateRangeFilter({
	value,
	onChange,
	fromLabel = "From",
	toLabel = "To", 
	showClear = true,
	presets = [],
}: DateRangeFilterProps) {
	const [localRange, setLocalRange] = useState<DateRange>(value || {});

	// Helper to format date for input
	const formatDateForInput = (date?: Date): string => {
		if (!date) return "";
		try {
			return date instanceof Date && !isNaN(date.getTime()) 
				? date.toISOString().split("T")[0]
				: "";
		} catch {
			return "";
		}
	};

	// Handle date change
	const handleDateChange = (field: 'from' | 'to', dateStr: string) => {
		const date = dateStr ? new Date(dateStr) : undefined;
		const newRange = { ...localRange, [field]: date };
		
		setLocalRange(newRange);
		onChange(newRange.from || newRange.to ? newRange : undefined);
	};

	// Handle preset selection
	const handlePresetSelect = (preset: { label: string; range: DateRange }) => {
		setLocalRange(preset.range);
		onChange(preset.range);
	};

	// Handle clear
	const handleClear = () => {
		setLocalRange({});
		onChange(undefined);
	};

	// Check if range has values
	const hasValue = localRange.from || localRange.to;

	return (
		<div className="space-y-4">
			{/* Preset Buttons */}
			{presets.length > 0 && (
				<div className="grid grid-cols-2 gap-2">
					{presets.map((preset) => (
						<button
							key={preset.label}
							type="button"
							className="btn btn-sm btn-outline text-xs"
							onClick={() => handlePresetSelect(preset)}
						>
							{preset.label}
						</button>
					))}
				</div>
			)}

			{/* Date Inputs */}
			<div className="space-y-3">
				<div>
					<label className="label">
						<span className="label-text text-sm">{fromLabel}</span>
					</label>
					<div className="relative">
						<Calendar 
							size={16} 
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" 
						/>
						<input
							type="date"
							className="input w-full pl-10"
							value={formatDateForInput(localRange.from)}
							onChange={(e) => handleDateChange('from', e.target.value)}
							max={localRange.to ? formatDateForInput(localRange.to) : undefined}
						/>
					</div>
				</div>

				<div>
					<label className="label">
						<span className="label-text text-sm">{toLabel}</span>
					</label>
					<div className="relative">
						<Calendar 
							size={16} 
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" 
						/>
						<input
							type="date"
							className="input w-full pl-10"
							value={formatDateForInput(localRange.to)}
							onChange={(e) => handleDateChange('to', e.target.value)}
							min={localRange.from ? formatDateForInput(localRange.from) : undefined}
						/>
					</div>
				</div>
			</div>

			{/* Clear Button */}
			{showClear && hasValue && (
				<button
					type="button"
					className="btn btn-sm btn-outline btn-error w-full gap-2"
					onClick={handleClear}
				>
					<X size={16} />
					Clear Date Range
				</button>
			)}

			{/* Current Selection Display */}
			{hasValue && (
				<div className="p-3 bg-base-200 rounded-lg">
					<div className="text-sm text-base-content/70">Selected Range:</div>
					<div className="text-sm font-medium">
						{localRange.from && (
							<span>{localRange.from.toLocaleDateString()}</span>
						)}
						{localRange.from && localRange.to && (
							<span className="mx-2">→</span>
						)}
						{localRange.to && (
							<span>{localRange.to.toLocaleDateString()}</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// Common preset date ranges
export const dateRangePresets = [
	{
		label: "Last 7 days",
		range: {
			from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
	{
		label: "Last 30 days",
		range: {
			from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
	{
		label: "Last 3 months",
		range: {
			from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
	{
		label: "This year",
		range: {
			from: new Date(new Date().getFullYear(), 0, 1),
			to: new Date(),
		},
	},
];