"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

// Types
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

export interface ThemeConfig {
	colors: {
		primary: string;
		secondary: string;
		success: string;
		warning: string;
		danger: string;
		background: string;
		foreground: string;
		content1: string;
		content2: string;
		content3: string;
		content4: string;
		default: string;
		divider: string;
	};
	spacing: {
		unit: number;
		small: string;
		medium: string;
		large: string;
	};
	borderRadius: {
		small: string;
		medium: string;
		large: string;
	};
	fontSize: {
		tiny: string;
		small: string;
		medium: string;
		large: string;
	};
}

interface ThemeContextType {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
	config: ThemeConfig;
	updateConfig: (config: Partial<ThemeConfig>) => void;
	resetConfig: () => void;
}

// Default theme configurations
const defaultLightConfig: ThemeConfig = {
	colors: {
		primary: "#0070f3",
		secondary: "#7c3aed",
		success: "#17c964",
		warning: "#f5a524",
		danger: "#f31260",
		background: "#ffffff",
		foreground: "#11181c",
		content1: "#ffffff",
		content2: "#f4f4f5",
		content3: "#e4e4e7",
		content4: "#d4d4d8",
		default: "#d4d4d8",
		divider: "#e4e4e7",
	},
	spacing: {
		unit: 4,
		small: "8px",
		medium: "16px",
		large: "24px",
	},
	borderRadius: {
		small: "8px",
		medium: "12px",
		large: "16px",
	},
	fontSize: {
		tiny: "0.75rem",
		small: "0.875rem",
		medium: "1rem",
		large: "1.125rem",
	},
};

const defaultDarkConfig: ThemeConfig = {
	colors: {
		primary: "#0070f3",
		secondary: "#7c3aed",
		success: "#17c964",
		warning: "#f5a524",
		danger: "#f31260",
		background: "#000000",
		foreground: "#ecedee",
		content1: "#18181b",
		content2: "#27272a",
		content3: "#3f3f46",
		content4: "#52525b",
		default: "#3f3f46",
		divider: "#27272a",
	},
	spacing: {
		unit: 4,
		small: "8px",
		medium: "16px",
		large: "24px",
	},
	borderRadius: {
		small: "8px",
		medium: "12px",
		large: "16px",
	},
	fontSize: {
		tiny: "0.75rem",
		small: "0.875rem",
		medium: "1rem",
		large: "1.125rem",
	},
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "theme",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
	const [config, setConfig] = useState<ThemeConfig>(defaultLightConfig);

	// Initialize theme from storage or system preference
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedTheme = localStorage.getItem(storageKey) as Theme | null;
			if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
				setThemeState(storedTheme);
			} else {
				// Detect system preference
				const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
					.matches
					? "dark"
					: "light";
				setThemeState(systemTheme);
			}
		}
	}, [storageKey]);

	// Update resolved theme based on current theme and system preference
	useEffect(() => {
		if (typeof window !== "undefined") {
			let newResolvedTheme: ResolvedTheme;

			if (theme === "system") {
				newResolvedTheme = window.matchMedia("(prefers-color-scheme: dark)")
					.matches
					? "dark"
					: "light";
			} else {
				newResolvedTheme = theme;
			}

			setResolvedTheme(newResolvedTheme);
			setConfig(
				newResolvedTheme === "dark" ? defaultDarkConfig : defaultLightConfig,
			);

			// Apply theme class to document
			const root = document.documentElement;
			root.classList.remove("light", "dark");
			root.classList.add(newResolvedTheme);

			// Apply CSS custom properties
			const themeConfig =
				newResolvedTheme === "dark" ? defaultDarkConfig : defaultLightConfig;
			Object.entries(themeConfig.colors).forEach(([key, value]) => {
				root.style.setProperty(`--color-${key}`, value);
			});
		}
	}, [theme]);

	// Listen for system theme changes when theme is set to "system"
	useEffect(() => {
		if (theme === "system" && typeof window !== "undefined") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

			const handleChange = () => {
				const newResolvedTheme = mediaQuery.matches ? "dark" : "light";
				setResolvedTheme(newResolvedTheme);
				setConfig(
					newResolvedTheme === "dark" ? defaultDarkConfig : defaultLightConfig,
				);

				// Apply theme class to document
				const root = document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(newResolvedTheme);

				// Apply CSS custom properties
				const themeConfig =
					newResolvedTheme === "dark" ? defaultDarkConfig : defaultLightConfig;
				Object.entries(themeConfig.colors).forEach(([key, value]) => {
					root.style.setProperty(`--color-${key}`, value);
				});
			};

			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		if (typeof window !== "undefined") {
			localStorage.setItem(storageKey, newTheme);
		}
	};

	const updateConfig = (newConfig: Partial<ThemeConfig>) => {
		const updatedConfig = {
			...config,
			...newConfig,
			colors: { ...config.colors, ...newConfig.colors },
			spacing: { ...config.spacing, ...newConfig.spacing },
			borderRadius: { ...config.borderRadius, ...newConfig.borderRadius },
			fontSize: { ...config.fontSize, ...newConfig.fontSize },
		};

		setConfig(updatedConfig);

		// Apply updated CSS custom properties
		if (typeof window !== "undefined") {
			const root = document.documentElement;
			if (newConfig.colors) {
				Object.entries(newConfig.colors).forEach(([key, value]) => {
					root.style.setProperty(`--color-${key}`, value);
				});
			}
		}
	};

	const resetConfig = () => {
		const defaultConfig =
			resolvedTheme === "dark" ? defaultDarkConfig : defaultLightConfig;
		setConfig(defaultConfig);

		// Reset CSS custom properties
		if (typeof window !== "undefined") {
			const root = document.documentElement;
			Object.entries(defaultConfig.colors).forEach(([key, value]) => {
				root.style.setProperty(`--color-${key}`, value);
			});
		}
	};

	const contextValue: ThemeContextType = {
		theme,
		resolvedTheme,
		setTheme,
		config,
		updateConfig,
		resetConfig,
	};

	return (
		<ThemeContext.Provider value={contextValue}>
			{children}
		</ThemeContext.Provider>
	);
}

// Custom hook
export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

// Utility hooks
export function useResolvedTheme() {
	const { resolvedTheme } = useTheme();
	return resolvedTheme;
}

export function useThemeConfig() {
	const { config, updateConfig, resetConfig } = useTheme();
	return { config, updateConfig, resetConfig };
}

// Color utility functions
export function getColorValue(color: keyof ThemeConfig["colors"]) {
	if (typeof window !== "undefined") {
		return getComputedStyle(document.documentElement).getPropertyValue(
			`--color-${color}`,
		);
	}
	return "";
}

export function setColorValue(
	color: keyof ThemeConfig["colors"],
	value: string,
) {
	if (typeof window !== "undefined") {
		document.documentElement.style.setProperty(`--color-${color}`, value);
	}
}

// Theme presets
export const themePresets = {
	default: {
		light: defaultLightConfig,
		dark: defaultDarkConfig,
	},
	ocean: {
		light: {
			...defaultLightConfig,
			colors: {
				...defaultLightConfig.colors,
				primary: "#0ea5e9",
				secondary: "#06b6d4",
			},
		},
		dark: {
			...defaultDarkConfig,
			colors: {
				...defaultDarkConfig.colors,
				primary: "#0ea5e9",
				secondary: "#06b6d4",
			},
		},
	},
	forest: {
		light: {
			...defaultLightConfig,
			colors: {
				...defaultLightConfig.colors,
				primary: "#059669",
				secondary: "#10b981",
			},
		},
		dark: {
			...defaultDarkConfig,
			colors: {
				...defaultDarkConfig.colors,
				primary: "#059669",
				secondary: "#10b981",
			},
		},
	},
	sunset: {
		light: {
			...defaultLightConfig,
			colors: {
				...defaultLightConfig.colors,
				primary: "#ea580c",
				secondary: "#f59e0b",
			},
		},
		dark: {
			...defaultDarkConfig,
			colors: {
				...defaultDarkConfig.colors,
				primary: "#ea580c",
				secondary: "#f59e0b",
			},
		},
	},
	purple: {
		light: {
			...defaultLightConfig,
			colors: {
				...defaultLightConfig.colors,
				primary: "#8b5cf6",
				secondary: "#a855f7",
			},
		},
		dark: {
			...defaultDarkConfig,
			colors: {
				...defaultDarkConfig.colors,
				primary: "#8b5cf6",
				secondary: "#a855f7",
			},
		},
	},
};
