"use client";

import { X } from "lucide-react";

export interface CheckboxFilterOption {
	/**
	 * Unique value for the option
	 */
	value: string;
	/**
	 * Display label
	 */
	label: string;
	/**
	 * Optional count/badge to display
	 */
	count?: number;
	/**
	 * Whether option is disabled
	 */
	disabled?: boolean;
}

export interface CheckboxFilterProps {
	/**
	 * Available options
	 */
	options: CheckboxFilterOption[];
	/**
	 * Currently selected values
	 */
	selectedValues: string[];
	/**
	 * Callback when selection changes
	 */
	onChange: (selectedValues: string[]) => void;
	/**
	 * Maximum height before scrolling
	 */
	maxHeight?: string;
	/**
	 * Whether to show select all/none buttons
	 */
	showSelectAll?: boolean;
	/**
	 * Whether to show clear button for individual selections
	 */
	showClear?: boolean;
}

/**
 * Reusable checkbox filter component
 */
export function CheckboxFilter({
	options,
	selectedValues,
	onChange,
	maxHeight = "max-h-48",
	showSelectAll = false,
	showClear = true,
}: CheckboxFilterProps) {
	const handleToggle = (value: string) => {
		const newValues = selectedValues.includes(value)
			? selectedValues.filter(v => v !== value)
			: [...selectedValues, value];
		onChange(newValues);
	};

	const handleSelectAll = () => {
		const allValues = options.filter(opt => !opt.disabled).map(opt => opt.value);
		onChange(allValues);
	};

	const handleSelectNone = () => {
		onChange([]);
	};

	if (options.length === 0) {
		return (
			<div className="text-center py-4 text-base-content/60 text-sm">
				No options available
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Select All/None Controls */}
			{showSelectAll && (
				<div className="flex gap-2">
					<button
						type="button"
						className="btn btn-xs btn-outline"
						onClick={handleSelectAll}
						disabled={selectedValues.length === options.filter(opt => !opt.disabled).length}
					>
						Select All
					</button>
					<button
						type="button"
						className="btn btn-xs btn-outline"
						onClick={handleSelectNone}
						disabled={selectedValues.length === 0}
					>
						Clear
					</button>
				</div>
			)}

			{/* Selected Values Display */}
			{showClear && selectedValues.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{selectedValues.map((value) => {
						const option = options.find(opt => opt.value === value);
						return (
							<span
								key={value}
								className="badge badge-sm badge-primary gap-1"
							>
								{option?.label || value}
								<button
									type="button"
									className="btn btn-xs btn-ghost p-0 min-h-0 h-3 w-3"
									onClick={() => handleToggle(value)}
								>
									<X size={10} />
								</button>
							</span>
						);
					})}
				</div>
			)}

			{/* Options List */}
			<div className={`${maxHeight} overflow-y-auto space-y-2`}>
				{options.map((option) => {
					const isChecked = selectedValues.includes(option.value);
					return (
						<label
							key={option.value}
							className={`cursor-pointer flex items-center justify-between p-2 rounded hover:bg-base-100 ${
								option.disabled ? 'opacity-50 cursor-not-allowed' : ''
							}`}
						>
							<div className="flex items-center gap-3">
								<input
									type="checkbox"
									className="checkbox checkbox-sm"
									checked={isChecked}
									disabled={option.disabled}
									onChange={() => !option.disabled && handleToggle(option.value)}
								/>
								<span className="text-sm">{option.label}</span>
							</div>
							{option.count !== undefined && (
								<span className="badge badge-sm badge-neutral">
									{option.count}
								</span>
							)}
						</label>
					);
				})}
			</div>
		</div>
	);
}