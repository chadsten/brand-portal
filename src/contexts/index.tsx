"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from "./AppContext";
import { ThemeProvider } from "./ThemeContext";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<SessionProvider>
			<ThemeProvider defaultTheme="system" storageKey="brand-portal-theme">
				<AppProvider>{children}</AppProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}

// Re-export all hooks for convenience
export {
	useApp,
	useAssets,
	useCollections,
	useError,
	useFilters,
	useLoading,
	useNotifications,
	useUI,
	useUser,
} from "./AppContext";
// Export ThemeConfig type from the component that defines it
export type { ThemeConfig } from "./ThemeContext";
export {
	getColorValue,
	setColorValue,
	themePresets,
	useResolvedTheme,
	useTheme,
	useThemeConfig,
} from "./ThemeContext";
