"use client";

import { ChevronDown, X } from "lucide-react";

export interface SelectFilterOption {
	/**
	 * Unique value for the option
	 */
	value: string;
	/**
	 * Display label
	 */
	label: string;
	/**
	 * Whether option is disabled
	 */
	disabled?: boolean;
}

export interface SelectFilterProps {
	/**
	 * Available options
	 */
	options: SelectFilterOption[];
	/**
	 * Currently selected value
	 */
	value?: string;
	/**
	 * Callback when selection changes
	 */
	onChange: (value?: string) => void;
	/**
	 * Placeholder text when no option is selected
	 */
	placeholder?: string;
	/**
	 * Whether to show clear button
	 */
	showClear?: boolean;
	/**
	 * Whether the select allows no selection
	 */
	allowEmpty?: boolean;
}

/**
 * Reusable select filter component
 */
export function SelectFilter({
	options,
	value,
	onChange,
	placeholder = "Select an option",
	showClear = true,
	allowEmpty = true,
}: SelectFilterProps) {
	const selectedOption = options.find(opt => opt.value === value);

	const handleChange = (newValue: string) => {
		if (newValue === "") {
			onChange(undefined);
		} else {
			onChange(newValue);
		}
	};

	const handleClear = () => {
		onChange(undefined);
	};

	if (options.length === 0) {
		return (
			<div className="text-center py-4 text-base-content/60 text-sm">
				No options available
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{/* Select Dropdown */}
			<div className="relative">
				<select
					className="select w-full pr-10"
					value={value || ""}
					onChange={(e) => handleChange(e.target.value)}
				>
					{allowEmpty && (
						<option value="">{placeholder}</option>
					)}
					{options.map((option) => (
						<option
							key={option.value}
							value={option.value}
							disabled={option.disabled}
						>
							{option.label}
						</option>
					))}
				</select>
				
				{/* Clear Button */}
				{showClear && value && (
					<button
						type="button"
						className="absolute right-8 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs btn-square"
						onClick={handleClear}
					>
						<X size={12} />
					</button>
				)}
			</div>

			{/* Selected Value Display */}
			{value && selectedOption && (
				<div className="flex items-center justify-between p-2 bg-base-200 rounded">
					<span className="text-sm">
						Selected: <span className="font-medium">{selectedOption.label}</span>
					</span>
					{showClear && (
						<button
							type="button"
							className="btn btn-xs btn-ghost btn-square"
							onClick={handleClear}
						>
							<X size={12} />
						</button>
					)}
				</div>
			)}
		</div>
	);
}