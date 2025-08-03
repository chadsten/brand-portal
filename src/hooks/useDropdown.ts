import { useCallback, useEffect, useRef, useState } from "react";

export interface DropdownState {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	onToggle: () => void;
	dropdownRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to replace HeroUI dropdown functionality
 * Provides state management and click-outside detection
 */
export function useDropdown(defaultOpen = false): DropdownState {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const onClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const onToggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Handle ESC key to close dropdown
	useEffect(() => {
		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscKey);
		}

		return () => {
			document.removeEventListener("keydown", handleEscKey);
		};
	}, [isOpen]);

	return {
		isOpen,
		onOpen,
		onClose,
		onToggle,
		dropdownRef,
	};
}

/**
 * Hook for keyboard navigation in dropdown menus
 */
export function useDropdownKeyboard(
	itemCount: number,
	onSelect?: (index: number) => void,
) {
	const [focusedIndex, setFocusedIndex] = useState(-1);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					setFocusedIndex((prev) => (prev + 1) % itemCount);
					break;
				case "ArrowUp":
					event.preventDefault();
					setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
					break;
				case "Enter":
				case " ":
					if (focusedIndex >= 0 && onSelect) {
						event.preventDefault();
						onSelect(focusedIndex);
					}
					break;
				case "Home":
					event.preventDefault();
					setFocusedIndex(0);
					break;
				case "End":
					event.preventDefault();
					setFocusedIndex(itemCount - 1);
					break;
			}
		},
		[focusedIndex, itemCount, onSelect],
	);

	const resetFocus = useCallback(() => {
		setFocusedIndex(-1);
	}, []);

	return {
		focusedIndex,
		handleKeyDown,
		resetFocus,
		setFocusedIndex,
	};
}