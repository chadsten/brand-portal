"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export interface SearchFilterProps {
	/**
	 * Current search value
	 */
	value: string;
	/**
	 * Callback when search value changes
	 */
	onChange: (value: string) => void;
	/**
	 * Placeholder text
	 */
	placeholder?: string;
	/**
	 * Debounce delay in milliseconds
	 */
	debounceMs?: number;
	/**
	 * Whether to show clear button
	 */
	showClear?: boolean;
}

/**
 * Reusable search filter component with debouncing
 */
export function SearchFilter({
	value,
	onChange,
	placeholder = "Search...",
	debounceMs = 300,
	showClear = true,
}: SearchFilterProps) {
	const [localValue, setLocalValue] = useState(value);
	const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

	// Update local value when prop value changes
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Handle input change with debouncing
	const handleInputChange = (newValue: string) => {
		setLocalValue(newValue);

		// Clear existing timeout
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		// Set new timeout
		const timeout = setTimeout(() => {
			onChange(newValue);
		}, debounceMs);
		
		setDebounceTimeout(timeout);
	};

	// Handle clear
	const handleClear = () => {
		setLocalValue("");
		onChange("");
		
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}
		};
	}, [debounceTimeout]);

	return (
		<div className="relative">
			<Search 
				size={16} 
				className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" 
			/>
			<input
				type="text"
				className={`input w-full pl-10 ${
					showClear && localValue ? "pr-10" : ""
				}`}
				placeholder={placeholder}
				value={localValue}
				onChange={(e) => handleInputChange(e.target.value)}
			/>
			{showClear && localValue && (
				<button
					type="button"
					className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs btn-square"
					onClick={handleClear}
				>
					<X size={12} />
				</button>
			)}
		</div>
	);
}