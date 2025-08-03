import { useCallback, useState } from "react";

export interface ModalState {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	onToggle: () => void;
}

/**
 * Hook to replace HeroUI's useDisclosure for modal management
 * Provides simple state management for modal visibility
 */
export function useModal(defaultOpen = false): ModalState {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const onClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const onToggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	return {
		isOpen,
		onOpen,
		onClose,
		onToggle,
	};
}

/**
 * Hook for DaisyUI dialog element integration
 * Provides ref and helper functions for native dialog API
 */
export function useDialogModal() {
	const [isOpen, setIsOpen] = useState(false);

	const showModal = useCallback((dialogRef: React.RefObject<HTMLDialogElement>) => {
		if (dialogRef.current) {
			dialogRef.current.showModal();
			setIsOpen(true);
		}
	}, []);

	const closeModal = useCallback((dialogRef: React.RefObject<HTMLDialogElement>) => {
		if (dialogRef.current) {
			dialogRef.current.close();
			setIsOpen(false);
		}
	}, []);

	const handleBackdropClick = useCallback(
		(
			event: React.MouseEvent<HTMLDialogElement>,
			dialogRef: React.RefObject<HTMLDialogElement>,
		) => {
			if (event.target === dialogRef.current) {
				closeModal(dialogRef);
			}
		},
		[closeModal],
	);

	return {
		isOpen,
		showModal,
		closeModal,
		handleBackdropClick,
	};
}