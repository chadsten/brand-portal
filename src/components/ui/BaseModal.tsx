"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export interface BaseModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	closable?: boolean;
	className?: string;
	contentClassName?: string;
}

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-2xl",
	lg: "max-w-4xl",
	xl: "max-w-7xl",
	full: "max-w-none w-full h-full",
};

export function BaseModal({
	isOpen,
	onClose,
	children,
	title,
	size = "lg",
	closable = true,
	className = "",
	contentClassName = "",
}: BaseModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (isOpen) {
			dialog.showModal();
		} else {
			dialog.close();
		}
	}, [isOpen]);

	const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
		if (e.target === dialogRef.current && closable) {
			onClose();
		}
	};

	const handleClose = () => {
		if (closable) {
			onClose();
		}
	};

	return (
		<dialog
			ref={dialogRef}
			className={`modal ${className}`}
			onClick={handleBackdropClick}
			onClose={handleClose}
		>
			<div className={`modal-box w-11/12 ${sizeClasses[size]} ${size === "full" ? "h-5/6" : ""} ${contentClassName}`}>
				{/* Header with title and close button */}
				{(title || closable) && (
					<div className="flex items-center justify-between mb-4">
						{title && <h2 className="font-bold text-xl">{title}</h2>}
						{closable && (
							<form method="dialog">
								<button
									type="button"
									className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
									onClick={handleClose}
								>
									<X size={16} />
								</button>
							</form>
						)}
					</div>
				)}

				{/* Content */}
				<div className={title || closable ? "" : "pt-0"}>
					{children}
				</div>
			</div>

			{/* Backdrop for closing modal */}
			{closable && (
				<form method="dialog" className="modal-backdrop">
					<button type="button" onClick={handleClose}>close</button>
				</form>
			)}
		</dialog>
	);
}