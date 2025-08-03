"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useApp, useNotifications, useTheme } from "~/contexts";
import ErrorBoundary from "../common/ErrorBoundary";
import { BreadcrumbNavigation } from "../navigation/BreadcrumbNavigation";
import { MainNavigation } from "../navigation/MainNavigation";

interface AppLayoutProps {
	children: React.ReactNode;
	showBreadcrumbs?: boolean;
	showBackButton?: boolean;
	className?: string;
}

interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "admin" | "editor" | "reviewer" | "viewer";
	permissions: string[];
}

interface Notification {
	id: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	timestamp: Date;
	read: boolean;
	action?: {
		label: string;
		href: string;
	};
}

// Removed mock user data - now using real NextAuth session

const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		title: "Asset Approved",
		message: "Your brand logo has been approved by the marketing team",
		type: "success",
		timestamp: new Date(Date.now() - 10 * 60 * 1000),
		read: false,
		action: { label: "View Asset", href: "/assets/logo-1" },
	},
	{
		id: "2",
		title: "Collaboration Invite",
		message: "Mike Johnson invited you to review marketing campaign assets",
		type: "info",
		timestamp: new Date(Date.now() - 30 * 60 * 1000),
		read: false,
		action: { label: "Join Session", href: "/collaboration/session-1" },
	},
	{
		id: "3",
		title: "AI Tagging Complete",
		message: "Auto-tagging completed for 15 new uploaded assets",
		type: "success",
		timestamp: new Date(Date.now() - 45 * 60 * 1000),
		read: false,
		action: { label: "Review Tags", href: "/ai/tagging" },
	},
	{
		id: "4",
		title: "Weekly Report Ready",
		message: "Your weekly usage analytics report is now available",
		type: "info",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
		read: true,
		action: { label: "View Report", href: "/analytics/reports/weekly" },
	},
	{
		id: "5",
		title: "Storage Warning",
		message: "You're approaching 80% of your storage limit",
		type: "warning",
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
		read: true,
		action: { label: "Manage Storage", href: "/settings/storage" },
	},
];

export function AppLayout({
	children,
	showBreadcrumbs = true,
	showBackButton = false,
	className = "",
}: AppLayoutProps) {
	const { data: session, status } = useSession();
	const { state, markNotificationRead } = useApp();
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();

	// Use real session data
	const user = session?.user ? {
		id: session.user.id,
		name: session.user.name || "Unknown User",
		email: session.user.email || "",
		avatar: session.user.image || "/avatars/default.jpg",
		role: "admin" as const, // TODO: Get from database user roles
		permissions: ["read", "write", "admin", "approve"], // TODO: Get from database
	} : null;
	
	const notifications =
		state.notifications.length > 0 ? state.notifications : MOCK_NOTIFICATIONS;

	const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
		setTheme(newTheme);
	};

	const handleLogout = async () => {
		try {
			await signOut({ 
				callbackUrl: "/api/auth/signin",
				redirect: true 
			});
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleNotificationRead = (notificationId: string) => {
		markNotificationRead(notificationId);
	};

	const handleShare = (path: string) => {
		// In a real app, this might open a share dialog or copy to clipboard
		console.log("Sharing path:", path);
	};

	const handleBookmark = (path: string) => {
		// In a real app, this might save to user bookmarks
		console.log("Bookmarking path:", path);
	};

	const handleCopy = (path: string) => {
		// Show a toast notification that the link was copied
		console.log("Copied path:", path);
	};

	// Determine if we should show breadcrumbs based on the current route
	const shouldShowBreadcrumbs = showBreadcrumbs && pathname !== "/";

	return (
		<div className="min-h-screen bg-background">
			{/* Main Navigation */}
			<MainNavigation
				user={user}
				theme={theme}
				onThemeChange={handleThemeChange}
				onLogout={handleLogout}
				notifications={notifications}
				onNotificationRead={handleNotificationRead}
			/>

			{/* Breadcrumb Navigation */}
			{shouldShowBreadcrumbs && (
				<BreadcrumbNavigation
					showBackButton={showBackButton}
					onShare={handleShare}
					onBookmark={handleBookmark}
					onCopy={handleCopy}
				/>
			)}

			{/* Main Content */}
			<main className={`${className}`}>
				<ErrorBoundary showDetails={process.env.NODE_ENV === "development"}>
					{children}
				</ErrorBoundary>
			</main>

			{/* Footer (optional) */}
			<footer className="mt-auto border-divider border-t bg-content1">
				<div className="max-w-full px-4 py-6">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div className="flex items-center gap-4 text-default-500 text-small">
							<span>© 2025 Brand Portal. All rights reserved.</span>
						</div>
						<div className="flex items-center gap-4 text-small">
							<button className="text-default-500 transition-colors hover:text-foreground">
								Privacy Policy
							</button>
							<button className="text-default-500 transition-colors hover:text-foreground">
								Terms of Service
							</button>
							<button className="text-default-500 transition-colors hover:text-foreground">
								Help Center
							</button>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
