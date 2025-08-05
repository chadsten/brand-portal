"use client";

import { useModal } from "~/hooks/useModal";
import {
	Bell,
	FolderOpen,
	Grid,
	Home,
	Image as ImageIcon,
	LogOut,
	Menu,
	Moon,
	Search,
	Settings,
	Shield,
	Sun,
	User,
	X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavigationItem {
	id: string;
	label: string;
	href: string;
	icon: React.ReactNode;
	children?: NavigationItem[];
	access?: "public" | "authenticated" | "admin";
}

interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "admin" | "editor" | "reviewer" | "viewer";
	permissions: string[];
}

interface MainNavigationProps {
	user?: User;
	theme?: "light" | "dark" | "system";
	onThemeChange?: (theme: "light" | "dark" | "system") => void;
	onLogout?: () => void;
	notifications?: Notification[];
	onNotificationRead?: (notificationId: string) => void;
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

const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		id: "browse-media",
		label: "Browse Media",
		href: "/assets",
		icon: <ImageIcon size={18} />,
		access: "authenticated",
		children: [
			{
				id: "assets",
				label: "Assets",
				href: "/assets",
				icon: <Grid size={16} />,
			},
			{
				id: "collections",
				label: "Collections",
				href: "/collections",
				icon: <FolderOpen size={16} />,
			},
		],
	},
	{
		id: "brand",
		label: "Brand",
		href: "/brand",
		icon: <Shield size={18} />,
		access: "authenticated",
	},
];

const MOCK_USER: User = {
	id: "1",
	name: "Sarah Chen",
	email: "sarah@company.com",
	avatar: "/avatars/sarah.jpg",
	role: "admin",
	permissions: ["read", "write", "admin", "approve"],
};

const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		title: "Asset Approved",
		message: "Your brand logo has been approved",
		type: "success",
		timestamp: new Date(Date.now() - 10 * 60 * 1000),
		read: false,
		action: { label: "View Asset", href: "/assets/logo-1" },
	},
	{
		id: "2",
		title: "Collaboration Invite",
		message: "Mike invited you to review marketing assets",
		type: "info",
		timestamp: new Date(Date.now() - 30 * 60 * 1000),
		read: false,
		action: { label: "Join Session", href: "/collaboration/session-1" },
	},
];

export function MainNavigation({
	user = MOCK_USER,
	theme = "light",
	onThemeChange,
	onLogout,
	notifications = MOCK_NOTIFICATIONS,
	onNotificationRead,
}: MainNavigationProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const pathname = usePathname();
	const router = useRouter();

	const {
		isOpen: isNotificationsOpen,
		onOpen: onNotificationsOpen,
		onClose: onNotificationsClose,
	} = useModal();

	const {
		isOpen: isQuickSearchOpen,
		onOpen: onQuickSearchOpen,
		onClose: onQuickSearchClose,
	} = useModal();

	const unreadNotifications = notifications.filter((n) => !n.read);

	const handleNavigation = (href: string) => {
		router.push(href);
		setIsMenuOpen(false);
	};

	const handleHomeNavigation = () => {
		if (user) {
			router.push("/dashboard");
		} else {
			router.push("/");
		}
		setIsMenuOpen(false);
	};

	const handleNotificationClick = (notification: Notification) => {
		if (!notification.read) {
			onNotificationRead?.(notification.id);
		}
		if (notification.action) {
			router.push(notification.action.href);
		}
		onNotificationsClose();
	};

	const handleQuickSearch = () => {
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
			setSearchQuery("");
			onQuickSearchClose();
		}
	};

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	const renderNavItem = (item: NavigationItem, isMobile = false) => {
		const active = isActive(item.href);
		const buttonClasses = `btn ${active ? "btn-primary" : "btn-ghost"} flex items-center gap-2 ${isMobile ? "w-full justify-start" : ""}`;

		if (item.children && item.children.length > 0) {
			return (
				<details>
					<summary className={buttonClasses}>
						{item.icon}
						<span>{item.label}</span>
					</summary>
					<ul>
						{item.children.map((child) => (
							<li key={child.id}>
								<a onClick={() => handleNavigation(child.href)} className="flex items-center gap-2">
									{child.icon}
									<span>{child.label}</span>
								</a>
							</li>
						))}
					</ul>
				</details>
			);
		}

		return (
			<button
				className={buttonClasses}
				onClick={() => handleNavigation(item.href)}
				type="button"
			>
				{item.icon}
				<span>{item.label}</span>
			</button>
		);
	};

	const renderQuickSearch = () => (
		<dialog className="modal" open={isQuickSearchOpen}>
			<div className="modal-box">
				<h3 className="font-semibold text-lg mb-4">Search</h3>
				<div className="space-y-4">
					<div className="relative">
						<Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
						<input
							className="input w-full pl-10"
							placeholder="Search assets, collections..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleQuickSearch();
								}
								if (e.key === "Escape") {
									onQuickSearchClose();
								}
							}}
							autoFocus
						/>
					</div>
				</div>
				<div className="modal-action">
					<button className="btn btn-outline" onClick={onQuickSearchClose}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						onClick={handleQuickSearch}
						disabled={!searchQuery.trim()}
					>
						Search
					</button>
				</div>
			</div>
		</dialog>
	);

	return (
		<>
			<div className="navbar bg-base-100 border-b border-base-300 w-full px-2 sm:px-4">
				{/* Mobile Menu Toggle */}
				<div className="navbar-start">
					<div className="dropdown lg:hidden">
						<label 
							tabIndex={0} 
							className="btn btn-square btn-ghost btn-sm"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							aria-label={isMenuOpen ? "Close menu" : "Open menu"}
						>
							{isMenuOpen ? <X size={18} /> : <Menu size={18} />}
						</label>
						{isMenuOpen && (
							<ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64">
								{/* Home link for mobile */}
								<li>
									<a onClick={handleHomeNavigation} className="flex items-center gap-2">
										<Home size={16} />
										Home
									</a>
								</li>
								{NAVIGATION_ITEMS.filter(item => !item.access || item.access === "public" || (item.access === "authenticated" && user)).map((item) => (
									<li key={item.id}>{renderNavItem(item, true)}</li>
								))}
								<div className="divider my-2"></div>
								{/* Search */}
								<li>
									<a onClick={onQuickSearchOpen} className="flex items-center gap-2">
										<Search size={16} />
										Search
									</a>
								</li>
								{/* Theme Toggle */}
								<li>
									<div className="flex w-full items-center justify-between px-3 py-2">
										<span className="text-sm">Dark Mode</span>
										<input 
											type="checkbox" 
											className="toggle toggle-sm"
											checked={theme === "dark"}
											onChange={(e) =>
												onThemeChange?.(e.target.checked ? "dark" : "light")
											}
										/>
									</div>
								</li>
								{user && (
									<>
										<div className="divider my-2"></div>
										<li>
											<a onClick={() => handleNavigation("/settings")} className="flex items-center gap-2">
												<Settings size={16} />
												Settings
											</a>
										</li>
										<li>
											<a onClick={onLogout} className="text-error flex items-center gap-2">
												<LogOut size={16} />
												Sign Out
											</a>
										</li>
									</>
								)}
							</ul>
						)}
					</div>

					{/* Brand/Logo */}
					<button
						className="btn btn-ghost normal-case text-lg sm:text-xl font-bold ml-2 lg:ml-0"
						onClick={handleHomeNavigation}
					>
						<Home size={20} className="lg:hidden" />
						<span className="hidden sm:inline">Brand Portal</span>
						<span className="sm:hidden">BP</span>
					</button>
				</div>

				{/* Desktop Navigation */}
				<div className="navbar-center hidden lg:flex">
					<ul className="menu menu-horizontal px-1 gap-1">
						{NAVIGATION_ITEMS.filter(item => !item.access || item.access === "public" || (item.access === "authenticated" && user)).map((item) => (
							<li key={item.id}>{renderNavItem(item)}</li>
						))}
					</ul>
				</div>

				{/* Right Side Actions */}
				<div className="navbar-end gap-1 sm:gap-2">
					{/* Search Box - Desktop */}
					<div className="relative hidden lg:block">
						<input
							type="text"
							placeholder="Search..."
							className="input input-sm w-48 xl:w-64 pr-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && searchQuery.trim()) {
									router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
									setSearchQuery("");
								}
							}}
						/>
						<Search size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/40" />
					</div>

					{/* Mobile Search Icon */}
					<button
						className="btn btn-ghost btn-circle btn-sm lg:hidden"
						onClick={onQuickSearchOpen}
						aria-label="Search"
					>
						<Search size={18} />
					</button>

					{/* Notifications */}
					<button
						className="btn btn-ghost btn-circle btn-sm relative"
						onClick={onNotificationsOpen}
						aria-label="Notifications"
					>
						<Bell size={18} />
						{unreadNotifications.length > 0 && (
							<span className="badge badge-error badge-xs absolute -top-1 -right-1">
								{unreadNotifications.length}
							</span>
						)}
					</button>

					{/* Theme Toggle */}
					<button
						className="btn btn-ghost btn-circle btn-sm hidden sm:flex"
						onClick={() =>
							onThemeChange?.(theme === "light" ? "dark" : "light")
						}
						aria-label="Toggle theme"
					>
						{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
					</button>

					{/* User Menu */}
					{user ? (
						<div className="dropdown dropdown-end">
							<label tabIndex={0} className="btn btn-ghost btn-circle btn-sm avatar">
								<div className="w-7 rounded-full">
									<img src={user.avatar} alt={user.name} />
								</div>
							</label>
							<ul className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
								<li>
									<a onClick={() => handleNavigation("/settings/profile")} className="flex flex-col items-start">
										<div className="flex items-center gap-2">
											<User size={16} />
											<span>{user.name}</span>
										</div>
										<span className="text-xs opacity-60">{user.email}</span>
									</a>
								</li>
								<li>
									<a onClick={() => handleNavigation("/settings")} className="flex items-center gap-2">
										<Settings size={16} />
										Settings
									</a>
								</li>
								<li>
									<a onClick={onLogout} className="text-error flex items-center gap-2">
										<LogOut size={16} />
										Sign Out
									</a>
								</li>
							</ul>
						</div>
					) : (
						<a
							className="link link-hover text-sm font-medium"
							href="/api/auth/signin"
						>
							Sign In
						</a>
					)}
				</div>
			</div>

			{/* Search Modal */}
			{renderQuickSearch()}
		</>
	);
}