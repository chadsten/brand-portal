"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface BaseFilterState {
	query?: string;
	[key: string]: any;
}

export interface UseUrlFiltersOptions<T extends BaseFilterState> {
	/**
	 * Default filter values
	 */
	defaultFilters: T;
	/**
	 * Custom serializers for complex filter types
	 */
	serializers?: {
		[K in keyof T]?: {
			serialize: (value: T[K]) => string;
			deserialize: (value: string) => T[K];
		};
	};
	/**
	 * Debounce delay for URL updates (default: 300ms)
	 */
	debounceMs?: number;
}

/**
 * Hook for managing filter state synchronized with URL search params
 */
export function useUrlFilters<T extends BaseFilterState>({
	defaultFilters,
	serializers = {},
	debounceMs = 300,
}: UseUrlFiltersOptions<T>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [filters, setFilters] = useState<T>(defaultFilters);
	const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

	// Use refs to maintain stable references and prevent infinite re-renders
	const defaultFiltersRef = useRef(defaultFilters);
	const serializersRef = useRef(serializers);
	
	// Update refs when props change
	useEffect(() => {
		defaultFiltersRef.current = defaultFilters;
		serializersRef.current = serializers;
	}, [defaultFilters, serializers]);

	// Initialize filters from URL on mount - only depend on searchParams
	useEffect(() => {
		const urlFilters = { ...defaultFiltersRef.current };
		
		for (const [key, value] of searchParams.entries()) {
			if (key in defaultFiltersRef.current) {
				const serializer = serializersRef.current[key as keyof T];
				if (serializer) {
					try {
						urlFilters[key as keyof T] = serializer.deserialize(value);
					} catch (error) {
						console.warn(`Failed to deserialize filter ${key}:`, error);
					}
				} else {
					// Default deserializers
					if (key.endsWith('[]') || Array.isArray(defaultFiltersRef.current[key as keyof T])) {
						// Handle arrays
						const arrayKey = key.replace('[]', '') as keyof T;
						const existingArray = urlFilters[arrayKey] as any[] || [];
						if (!existingArray.includes(value)) {
							(urlFilters[arrayKey] as any) = [...existingArray, value];
						}
					} else if (value === 'true' || value === 'false') {
						// Handle booleans
						(urlFilters[key as keyof T] as any) = value === 'true';
					} else if (!isNaN(Number(value))) {
						// Handle numbers
						(urlFilters[key as keyof T] as any) = Number(value);
					} else {
						// Handle strings
						(urlFilters[key as keyof T] as any) = value;
					}
				}
			}
		}
		
		setFilters(urlFilters);
	}, [searchParams]); // Only depend on searchParams to prevent infinite loops

	// Update URL when filters change
	const updateUrl = useCallback(
		(newFilters: T) => {
			const params = new URLSearchParams();
			
			Object.entries(newFilters).forEach(([key, value]) => {
				if (value === undefined || value === null || value === '' || 
					(Array.isArray(value) && value.length === 0)) {
					return; // Skip empty values
				}

				const serializer = serializersRef.current[key as keyof T];
				if (serializer) {
					try {
						params.set(key, serializer.serialize(value));
					} catch (error) {
						console.warn(`Failed to serialize filter ${key}:`, error);
					}
				} else {
					// Default serializers
					if (Array.isArray(value)) {
						value.forEach((item) => params.append(`${key}[]`, String(item)));
					} else if (typeof value === 'object' && value !== null) {
						// Handle objects (like date ranges)
						params.set(key, JSON.stringify(value));
					} else {
						params.set(key, String(value));
					}
				}
			});

			const queryString = params.toString();
			const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
			
			router.replace(newUrl, { scroll: false });
		},
		[pathname, router] // Removed serializers from dependencies to prevent re-renders
	);

	// Use ref for updateUrl to avoid dependency issues
	const updateUrlRef = useRef(updateUrl);
	useEffect(() => {
		updateUrlRef.current = updateUrl;
	}, [updateUrl]);

	// Debounced filter update
	const updateFilters = useCallback(
		(newFilters: Partial<T> | ((prev: T) => T)) => {
			setFilters(prev => {
				const updatedFilters = typeof newFilters === 'function' 
					? newFilters(prev)
					: { ...prev, ...newFilters };
				
				// Clear existing timeout
				setDebounceTimeout(currentTimeout => {
					if (currentTimeout) {
						clearTimeout(currentTimeout);
					}

					// Set new timeout
					const timeout = setTimeout(() => {
						updateUrlRef.current(updatedFilters);
					}, debounceMs);
					
					return timeout;
				});
				
				return updatedFilters;
			});
		},
		[debounceMs]
	);

	// Clear all filters
	const clearFilters = useCallback(() => {
		setFilters(defaultFiltersRef.current);
		updateUrlRef.current(defaultFiltersRef.current);
	}, []); // No dependencies needed

	// Get active filter count
	const getActiveFilterCount = useCallback(() => {
		let count = 0;
		Object.entries(filters).forEach(([key, value]) => {
			if (key === 'query') return; // Don't count search query
			
			if (Array.isArray(value) && value.length > 0) count++;
			else if (value !== undefined && value !== null && value !== '' && 
					value !== defaultFiltersRef.current[key as keyof T]) count++;
		});
		return count;
	}, [filters]); // Removed defaultFilters from dependencies

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}
		};
	}, [debounceTimeout]);

	return {
		filters,
		updateFilters,
		clearFilters,
		activeFilterCount: getActiveFilterCount(),
	};
}