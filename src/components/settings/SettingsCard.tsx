"use client";

// HeroUI components replaced with native HTML elements and DaisyUI classes
import {
	AlertCircle,
	CheckCircle,
	ChevronRight,
	Clock,
	ExternalLink,
	Shield,
} from "lucide-react";
import type { ReactNode } from "react";

interface SettingsCardProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	children?: ReactNode;
	status?: "success" | "warning" | "danger" | "default";
	isExpandable?: boolean;
	isExpanded?: boolean;
	onToggleExpanded?: () => void;
	actions?: ReactNode;
	footer?: ReactNode;
	className?: string;
}

export function SettingsCard({
	title,
	description,
	icon,
	children,
	status = "default",
	isExpandable = false,
	isExpanded = false,
	onToggleExpanded,
	actions,
	footer,
	className,
}: SettingsCardProps) {
	const statusColors = {
		success: "border-success",
		warning: "border-warning",
		danger: "border-error",
		default: "border-base-300",
	};

	const statusIcons = {
		success: <CheckCircle className="text-success" size={16} />,
		warning: <AlertCircle className="text-warning" size={16} />,
		danger: <AlertCircle className="text-error" size={16} />,
		default: null,
	};

	return (
		<div className={`card bg-base-100 shadow border-2 ${statusColors[status]} ${className}`}>
			<div
				className={`card-header p-4 ${isExpandable ? "cursor-pointer hover:bg-base-200" : ""}`}
				onClick={isExpandable ? onToggleExpanded : undefined}
			>
				<div className="flex w-full items-center justify-between">
					<div className="flex items-center gap-3">
						{icon && (
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200">
								{icon}
							</div>
						)}
						<div>
							<div className="flex items-center gap-2">
								<h4 className="font-semibold">{title}</h4>
								{statusIcons[status]}
							</div>
							{description && (
								<p className="text-base-content/60 text-sm">{description}</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						{actions}
						{isExpandable && (
							<ChevronRight
								size={16}
								className={`text-base-content/40 transition-transform ${
									isExpanded ? "rotate-90" : ""
								}`}
							/>
						)}
					</div>
				</div>
			</div>
			{((children && !isExpandable) ||
				(children && isExpandable && isExpanded)) && (
				<div className="card-body pt-0">
					{children}
					{footer && (
						<>
							<div className="divider my-4"></div>
							{footer}
						</>
					)}
				</div>
			)}
		</div>
	);
}

interface SettingsToggleProps {
	label: string;
	description?: string;
	isSelected: boolean;
	onValueChange: (value: boolean) => void;
	isDisabled?: boolean;
	startContent?: ReactNode;
	endContent?: ReactNode;
	status?: "success" | "warning" | "danger" | "default";
}

export function SettingsToggle({
	label,
	description,
	isSelected,
	onValueChange,
	isDisabled = false,
	startContent,
	endContent,
	status = "default",
}: SettingsToggleProps) {
	const statusChips = {
		success: (
			<span className="badge badge-sm badge-success">
				Enabled
			</span>
		),
		warning: (
			<span className="badge badge-sm badge-warning">
				Limited
			</span>
		),
		danger: (
			<span className="badge badge-sm badge-error">
				Disabled
			</span>
		),
		default: null,
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<p className="font-medium">{label}</p>
					{status !== "default" && statusChips[status]}
				</div>
				{description && (
					<p className="mt-1 text-base-content/60 text-sm">{description}</p>
				)}
			</div>
			<input
				type="checkbox"
				className="toggle toggle-primary"
				checked={isSelected}
				onChange={(e) => onValueChange(e.target.checked)}
				disabled={isDisabled}
			/>
		</div>
	);
}

interface SettingsActionProps {
	label: string;
	description?: string;
	buttonText: string;
	onAction: () => void;
	icon?: ReactNode;
	variant?:
		| "solid"
		| "bordered"
		| "light"
		| "flat"
		| "faded"
		| "shadow"
		| "ghost";
	color?:
		| "default"
		| "primary"
		| "secondary"
		| "success"
		| "warning"
		| "danger";
	isLoading?: boolean;
	isDisabled?: boolean;
	showExternalIcon?: boolean;
}

export function SettingsAction({
	label,
	description,
	buttonText,
	onAction,
	icon,
	variant = "flat",
	color = "default",
	isLoading = false,
	isDisabled = false,
	showExternalIcon = false,
}: SettingsActionProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<p className="font-medium">{label}</p>
				{description && (
					<p className="text-base-content/60 text-sm">{description}</p>
				)}
			</div>
			<button
				className={`btn ${
					variant === "bordered" ? "btn-outline" :
					variant === "light" || variant === "flat" ? "btn-ghost" :
					variant === "shadow" ? "shadow-lg" :
					""
				} ${
					color === "primary" ? "btn-primary" :
					color === "secondary" ? "btn-secondary" :
					color === "success" ? "btn-success" :
					color === "warning" ? "btn-warning" :
					color === "danger" ? "btn-error" :
					""
				} ${
					isLoading ? "loading" : ""
				}`}
				onClick={onAction}
				disabled={isLoading || isDisabled}
			>
				{icon && !isLoading && <span>{icon}</span>}
				{buttonText}
				{showExternalIcon && <ExternalLink size={16} />}
			</button>
		</div>
	);
}

interface SecurityIndicatorProps {
	score: number;
	className?: string;
}

export function SecurityIndicator({
	score,
	className,
}: SecurityIndicatorProps) {
	const getScoreColor = (score: number) => {
		if (score >= 80) return "success";
		if (score >= 60) return "warning";
		return "danger";
	};

	const getScoreText = (score: number) => {
		if (score >= 80) return "Strong";
		if (score >= 60) return "Good";
		if (score >= 40) return "Fair";
		return "Weak";
	};

	const color = getScoreColor(score);

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Shield className={`text-${color}`} size={16} />
			<div className="flex items-center gap-2">
				<span className="font-medium text-sm">
					Security: {getScoreText(score)}
				</span>
				<span className={`badge badge-sm ${
					color === "success" ? "badge-success" :
					color === "warning" ? "badge-warning" :
					color === "danger" ? "badge-error" :
					"badge-outline"
				}`}>
					{score}%
				</span>
			</div>
		</div>
	);
}

interface IntegrationStatusProps {
	name: string;
	isConnected: boolean;
	lastSync?: Date;
	error?: string;
	onConnect?: () => void;
	onDisconnect?: () => void;
	icon?: ReactNode;
}

export function IntegrationStatus({
	name,
	isConnected,
	lastSync,
	error,
	onConnect,
	onDisconnect,
	icon,
}: IntegrationStatusProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				{icon && (
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-200">
						{icon}
					</div>
				)}
				<div>
					<div className="flex items-center gap-2">
						<p className="font-medium">{name}</p>
						{isConnected ? (
							<span className="badge badge-sm badge-success">
								Connected
							</span>
						) : (
							<span className="badge badge-sm badge-outline">
								Not Connected
							</span>
						)}
					</div>
					{error ? (
						<p className="text-error text-sm">{error}</p>
					) : lastSync ? (
						<p className="text-base-content/60 text-sm">
							Last sync: {lastSync.toLocaleDateString()}
						</p>
					) : null}
				</div>
			</div>
			<div className="flex items-center gap-2">
				{isConnected ? (
					<button
						className="btn btn-sm btn-ghost btn-error"
						onClick={onDisconnect}
					>
						Disconnect
					</button>
				) : (
					<button className="btn btn-sm btn-ghost btn-primary" onClick={onConnect}>
						Connect
					</button>
				)}
			</div>
		</div>
	);
}
