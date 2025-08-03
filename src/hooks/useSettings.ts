// Custom hook for managing application settings
// Provides persistent settings storage and validation

import { useCallback, useEffect, useState } from "react";

export interface UserSettings {
	profile: {
		name: string;
		email: string;
		bio: string;
		location: string;
		phone: string;
		website: string;
		avatar: string;
	};
	preferences: {
		theme: "light" | "dark" | "auto";
		language: string;
		timezone: string;
		dateFormat: string;
		currency: string;
		itemsPerPage: number;
		autoSave: boolean;
		soundEnabled: boolean;
		viewMode: "grid" | "list";
	};
	notifications: {
		email: {
			assetApproval: boolean;
			collectionUpdates: boolean;
			systemUpdates: boolean;
			weeklyReport: boolean;
			marketing: boolean;
		};
		push: {
			assetApproval: boolean;
			mentions: boolean;
			systemAlerts: boolean;
			realTime: boolean;
		};
		frequency: "immediate" | "daily" | "weekly" | "never";
	};
	privacy: {
		profileVisibility: "public" | "team" | "private";
		showEmail: boolean;
		showActivity: boolean;
		allowDirectMessages: boolean;
		dataCollection: boolean;
		analytics: boolean;
	};
	security: {
		twoFactorEnabled: boolean;
		sessionTimeout: number;
		loginNotifications: boolean;
		deviceTrust: boolean;
		passwordChangeRequired: boolean;
	};
	integrations: {
		slack: { enabled: boolean; webhook: string };
		teams: { enabled: boolean; webhook: string };
		dropbox: { enabled: boolean; accessToken: string };
		googleDrive: { enabled: boolean; accessToken: string };
	};
}

const DEFAULT_SETTINGS: UserSettings = {
	profile: {
		name: "Brand User",
		email: "user@company.com",
		bio: "",
		location: "",
		phone: "",
		website: "",
		avatar: "/default-avatar.jpg",
	},
	preferences: {
		theme: "auto",
		language: "en",
		timezone: "America/Los_Angeles",
		dateFormat: "MM/DD/YYYY",
		currency: "USD",
		itemsPerPage: 24,
		autoSave: true,
		soundEnabled: true,
		viewMode: "grid",
	},
	notifications: {
		email: {
			assetApproval: true,
			collectionUpdates: true,
			systemUpdates: false,
			weeklyReport: true,
			marketing: false,
		},
		push: {
			assetApproval: true,
			mentions: true,
			systemAlerts: true,
			realTime: false,
		},
		frequency: "immediate",
	},
	privacy: {
		profileVisibility: "team",
		showEmail: false,
		showActivity: true,
		allowDirectMessages: true,
		dataCollection: true,
		analytics: true,
	},
	security: {
		twoFactorEnabled: false,
		sessionTimeout: 8,
		loginNotifications: true,
		deviceTrust: true,
		passwordChangeRequired: false,
	},
	integrations: {
		slack: { enabled: false, webhook: "" },
		teams: { enabled: false, webhook: "" },
		dropbox: { enabled: false, accessToken: "" },
		googleDrive: { enabled: false, accessToken: "" },
	},
};

interface UseSettingsOptions {
	enablePersistence?: boolean;
	storageKey?: string;
	onSettingsChange?: (settings: UserSettings) => void;
}

export const useSettings = (options: UseSettingsOptions = {}) => {
	const {
		enablePersistence = true,
		storageKey = "brandPortalSettings",
		onSettingsChange,
	} = options;

	const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load settings from storage on mount
	useEffect(() => {
		const loadSettings = () => {
			try {
				if (!enablePersistence) {
					setIsLoading(false);
					return;
				}

				const stored = localStorage.getItem(storageKey);
				if (stored) {
					const parsedSettings = JSON.parse(stored);
					// Merge with defaults to ensure all properties exist
					const mergedSettings = mergeWithDefaults(
						parsedSettings,
						DEFAULT_SETTINGS,
					);
					setSettingsState(mergedSettings);
				}
			} catch (error) {
				console.error("Failed to load settings:", error);
				setError("Failed to load settings");
			} finally {
				setIsLoading(false);
			}
		};

		loadSettings();
	}, [enablePersistence, storageKey]);

	// Merge loaded settings with defaults to handle schema changes
	const mergeWithDefaults = (
		loaded: any,
		defaults: UserSettings,
	): UserSettings => {
		const merged = { ...defaults };

		Object.keys(defaults).forEach((key) => {
			if (loaded[key] && typeof loaded[key] === "object") {
				merged[key as keyof UserSettings] = {
					...(defaults[key as keyof UserSettings] as any),
					...(loaded[key] as any),
				};
			} else if (loaded[key] !== undefined) {
				(merged as any)[key] = loaded[key];
			}
		});

		return merged;
	};

	// Save settings to storage
	const saveToStorage = useCallback(
		(newSettings: UserSettings) => {
			if (!enablePersistence) return;

			try {
				localStorage.setItem(storageKey, JSON.stringify(newSettings));
			} catch (error) {
				console.error("Failed to save settings:", error);
				setError("Failed to save settings");
			}
		},
		[enablePersistence, storageKey],
	);

	// Update settings
	const setSettings = useCallback(
		(newSettings: UserSettings | ((prev: UserSettings) => UserSettings)) => {
			const updatedSettings =
				typeof newSettings === "function" ? newSettings(settings) : newSettings;

			setSettingsState(updatedSettings);
			setHasUnsavedChanges(true);

			// Auto-save if enabled
			if (updatedSettings.preferences.autoSave) {
				saveToStorage(updatedSettings);
				setHasUnsavedChanges(false);
			}

			// Call change handler
			onSettingsChange?.(updatedSettings);
		},
		[settings, saveToStorage, onSettingsChange],
	);

	// Update a specific section of settings
	const updateSettings = useCallback(
		(section: keyof UserSettings, field: string, value: any) => {
			setSettings((prev) => ({
				...prev,
				[section]: {
					...prev[section],
					[field]: value,
				},
			}));
		},
		[setSettings],
	);

	// Update nested settings (e.g., notifications.email.assetApproval)
	const updateNestedSettings = useCallback(
		(
			section: keyof UserSettings,
			subsection: string,
			field: string,
			value: any,
		) => {
			setSettings((prev) => ({
				...prev,
				[section]: {
					...prev[section],
					[subsection]: {
						...(prev[section] as any)[subsection],
						[field]: value,
					},
				},
			}));
		},
		[setSettings],
	);

	// Manually save settings
	const saveSettings = useCallback(async () => {
		try {
			setError(null);

			// Simulate API call for demo
			await new Promise((resolve) => setTimeout(resolve, 1000));

			saveToStorage(settings);
			setHasUnsavedChanges(false);

			return { success: true };
		} catch (error) {
			setError("Failed to save settings");
			return { success: false, error: "Failed to save settings" };
		}
	}, [settings, saveToStorage]);

	// Reset settings to defaults
	const resetSettings = useCallback(() => {
		setSettingsState(DEFAULT_SETTINGS);
		setHasUnsavedChanges(true);

		if (DEFAULT_SETTINGS.preferences.autoSave) {
			saveToStorage(DEFAULT_SETTINGS);
			setHasUnsavedChanges(false);
		}
	}, [saveToStorage]);

	// Export settings as JSON
	const exportSettings = useCallback(() => {
		const dataStr = JSON.stringify(settings, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `brand-portal-settings-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [settings]);

	// Import settings from JSON
	const importSettings = useCallback(
		(file: File): Promise<{ success: boolean; error?: string }> => {
			return new Promise((resolve) => {
				const reader = new FileReader();

				reader.onload = (e) => {
					try {
						const content = e.target?.result as string;
						const importedSettings = JSON.parse(content);

						// Validate and merge with defaults
						const validatedSettings = mergeWithDefaults(
							importedSettings,
							DEFAULT_SETTINGS,
						);
						setSettings(validatedSettings);

						resolve({ success: true });
					} catch (error) {
						resolve({ success: false, error: "Invalid settings file" });
					}
				};

				reader.onerror = () => {
					resolve({ success: false, error: "Failed to read file" });
				};

				reader.readAsText(file);
			});
		},
		[setSettings],
	);

	// Get setting value by path (e.g., 'preferences.theme')
	const getSetting = useCallback(
		(path: string) => {
			return path.split(".").reduce((obj, key) => obj?.[key], settings as any);
		},
		[settings],
	);

	// Validate settings
	const validateSettings = useCallback(
		(settingsToValidate: UserSettings): string[] => {
			const errors: string[] = [];

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (
				settingsToValidate.profile.email &&
				!emailRegex.test(settingsToValidate.profile.email)
			) {
				errors.push("Invalid email format");
			}

			// Validate phone format (basic)
			const phoneRegex = /^[+]?[\d\s\-()]+$/;
			if (
				settingsToValidate.profile.phone &&
				!phoneRegex.test(settingsToValidate.profile.phone)
			) {
				errors.push("Invalid phone format");
			}

			// Validate website URL
			if (settingsToValidate.profile.website) {
				try {
					new URL(settingsToValidate.profile.website);
				} catch {
					errors.push("Invalid website URL");
				}
			}

			// Validate webhook URLs
			if (
				settingsToValidate.integrations.slack.enabled &&
				settingsToValidate.integrations.slack.webhook
			) {
				try {
					const url = new URL(settingsToValidate.integrations.slack.webhook);
					if (!url.hostname.includes("slack.com")) {
						errors.push("Invalid Slack webhook URL");
					}
				} catch {
					errors.push("Invalid Slack webhook URL");
				}
			}

			return errors;
		},
		[],
	);

	// Get computed settings (derived values)
	const computedSettings = {
		isDarkMode:
			settings.preferences.theme === "dark" ||
			(settings.preferences.theme === "auto" &&
				window.matchMedia?.("(prefers-color-scheme: dark)").matches),
		isNotificationEnabled:
			Object.values(settings.notifications.email).some(Boolean) ||
			Object.values(settings.notifications.push).some(Boolean),
		hasIntegrations: Object.values(settings.integrations).some(
			(integration) => integration.enabled,
		),
		securityScore: calculateSecurityScore(settings.security),
	};

	return {
		// State
		settings,
		isLoading,
		hasUnsavedChanges,
		error,
		computedSettings,

		// Actions
		setSettings,
		updateSettings,
		updateNestedSettings,
		saveSettings,
		resetSettings,
		exportSettings,
		importSettings,
		getSetting,
		validateSettings,

		// Utility
		clearError: () => setError(null),
	};
};

// Helper function to calculate security score
function calculateSecurityScore(security: UserSettings["security"]): number {
	let score = 0;

	if (security.twoFactorEnabled) score += 30;
	if (security.loginNotifications) score += 20;
	if (security.deviceTrust) score += 15;
	if (security.sessionTimeout <= 8) score += 20;
	if (!security.passwordChangeRequired) score += 15;

	return Math.min(score, 100);
}
