"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useReducer } from "react";

// Types
interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "admin" | "editor" | "reviewer" | "viewer";
	permissions: string[];
	preferences: UserPreferences;
}

interface UserPreferences {
	theme: "light" | "dark" | "system";
	language: string;
	notifications: {
		email: boolean;
		push: boolean;
		inApp: boolean;
	};
	viewPreferences: {
		defaultView: "grid" | "list";
		itemsPerPage: number;
		showPreview: boolean;
	};
}

interface Asset {
	id: string;
	name: string;
	type: "image" | "video" | "audio" | "document";
	url: string;
	thumbnail?: string;
	size: number;
	format: string;
	tags: string[];
	collections: string[];
	metadata: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	status: "draft" | "approved" | "rejected" | "pending";
}

interface Collection {
	id: string;
	name: string;
	description: string;
	assetIds: string[];
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	isPublic: boolean;
	tags: string[];
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

interface AppState {
	user: User | null;
	assets: Asset[];
	collections: Collection[];
	notifications: Notification[];
	loading: {
		assets: boolean;
		collections: boolean;
		user: boolean;
	};
	error: string | null;
	filters: {
		search: string;
		tags: string[];
		type: string[];
		status: string[];
		dateRange: {
			start: Date | null;
			end: Date | null;
		};
	};
	ui: {
		sidebarOpen: boolean;
		view: "grid" | "list";
		selectedAssets: string[];
		currentCollection: string | null;
	};
}

// Action Types
type AppAction =
	| { type: "SET_USER"; payload: User }
	| { type: "UPDATE_USER_PREFERENCES"; payload: Partial<UserPreferences> }
	| {
			type: "SET_LOADING";
			payload: { key: keyof AppState["loading"]; value: boolean };
	  }
	| { type: "SET_ERROR"; payload: string | null }
	| { type: "SET_ASSETS"; payload: Asset[] }
	| { type: "ADD_ASSET"; payload: Asset }
	| { type: "UPDATE_ASSET"; payload: { id: string; updates: Partial<Asset> } }
	| { type: "DELETE_ASSET"; payload: string }
	| { type: "SET_COLLECTIONS"; payload: Collection[] }
	| { type: "ADD_COLLECTION"; payload: Collection }
	| {
			type: "UPDATE_COLLECTION";
			payload: { id: string; updates: Partial<Collection> };
	  }
	| { type: "DELETE_COLLECTION"; payload: string }
	| { type: "SET_NOTIFICATIONS"; payload: Notification[] }
	| { type: "ADD_NOTIFICATION"; payload: Notification }
	| { type: "MARK_NOTIFICATION_READ"; payload: string }
	| { type: "DELETE_NOTIFICATION"; payload: string }
	| { type: "SET_FILTERS"; payload: Partial<AppState["filters"]> }
	| { type: "CLEAR_FILTERS" }
	| { type: "SET_UI"; payload: Partial<AppState["ui"]> }
	| { type: "TOGGLE_SIDEBAR" }
	| { type: "SELECT_ASSETS"; payload: string[] }
	| { type: "CLEAR_SELECTION" };

// Initial State
const initialState: AppState = {
	user: null,
	assets: [],
	collections: [],
	notifications: [],
	loading: {
		assets: false,
		collections: false,
		user: false,
	},
	error: null,
	filters: {
		search: "",
		tags: [],
		type: [],
		status: [],
		dateRange: {
			start: null,
			end: null,
		},
	},
	ui: {
		sidebarOpen: false,
		view: "grid",
		selectedAssets: [],
		currentCollection: null,
	},
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_USER":
			return { ...state, user: action.payload };

		case "UPDATE_USER_PREFERENCES":
			if (!state.user) return state;
			return {
				...state,
				user: {
					...state.user,
					preferences: {
						...state.user.preferences,
						...action.payload,
					},
				},
			};

		case "SET_LOADING":
			return {
				...state,
				loading: {
					...state.loading,
					[action.payload.key]: action.payload.value,
				},
			};

		case "SET_ERROR":
			return { ...state, error: action.payload };

		case "SET_ASSETS":
			return { ...state, assets: action.payload };

		case "ADD_ASSET":
			return { ...state, assets: [...state.assets, action.payload] };

		case "UPDATE_ASSET":
			return {
				...state,
				assets: state.assets.map((asset) =>
					asset.id === action.payload.id
						? { ...asset, ...action.payload.updates }
						: asset,
				),
			};

		case "DELETE_ASSET":
			return {
				...state,
				assets: state.assets.filter((asset) => asset.id !== action.payload),
			};

		case "SET_COLLECTIONS":
			return { ...state, collections: action.payload };

		case "ADD_COLLECTION":
			return { ...state, collections: [...state.collections, action.payload] };

		case "UPDATE_COLLECTION":
			return {
				...state,
				collections: state.collections.map((collection) =>
					collection.id === action.payload.id
						? { ...collection, ...action.payload.updates }
						: collection,
				),
			};

		case "DELETE_COLLECTION":
			return {
				...state,
				collections: state.collections.filter(
					(collection) => collection.id !== action.payload,
				),
			};

		case "SET_NOTIFICATIONS":
			return { ...state, notifications: action.payload };

		case "ADD_NOTIFICATION":
			return {
				...state,
				notifications: [action.payload, ...state.notifications],
			};

		case "MARK_NOTIFICATION_READ":
			return {
				...state,
				notifications: state.notifications.map((notification) =>
					notification.id === action.payload
						? { ...notification, read: true }
						: notification,
				),
			};

		case "DELETE_NOTIFICATION":
			return {
				...state,
				notifications: state.notifications.filter(
					(notification) => notification.id !== action.payload,
				),
			};

		case "SET_FILTERS":
			return {
				...state,
				filters: {
					...state.filters,
					...action.payload,
				},
			};

		case "CLEAR_FILTERS":
			return {
				...state,
				filters: initialState.filters,
			};

		case "SET_UI":
			return {
				...state,
				ui: {
					...state.ui,
					...action.payload,
				},
			};

		case "TOGGLE_SIDEBAR":
			return {
				...state,
				ui: {
					...state.ui,
					sidebarOpen: !state.ui.sidebarOpen,
				},
			};

		case "SELECT_ASSETS":
			return {
				...state,
				ui: {
					...state.ui,
					selectedAssets: action.payload,
				},
			};

		case "CLEAR_SELECTION":
			return {
				...state,
				ui: {
					...state.ui,
					selectedAssets: [],
				},
			};

		default:
			return state;
	}
}

// Context
interface AppContextType {
	state: AppState;
	dispatch: React.Dispatch<AppAction>;
	// Helper functions
	setUser: (user: User) => void;
	updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
	setLoading: (key: keyof AppState["loading"], value: boolean) => void;
	setError: (error: string | null) => void;
	addAsset: (asset: Asset) => void;
	updateAsset: (id: string, updates: Partial<Asset>) => void;
	deleteAsset: (id: string) => void;
	addCollection: (collection: Collection) => void;
	updateCollection: (id: string, updates: Partial<Collection>) => void;
	deleteCollection: (id: string) => void;
	addNotification: (notification: Notification) => void;
	markNotificationRead: (id: string) => void;
	deleteNotification: (id: string) => void;
	setFilters: (filters: Partial<AppState["filters"]>) => void;
	clearFilters: () => void;
	setView: (view: "grid" | "list") => void;
	selectAssets: (assetIds: string[]) => void;
	clearSelection: () => void;
	toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
	children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
	const [state, dispatch] = useReducer(appReducer, initialState);

	// Helper functions
	const setUser = (user: User) => dispatch({ type: "SET_USER", payload: user });

	const updateUserPreferences = (preferences: Partial<UserPreferences>) =>
		dispatch({ type: "UPDATE_USER_PREFERENCES", payload: preferences });

	const setLoading = (key: keyof AppState["loading"], value: boolean) =>
		dispatch({ type: "SET_LOADING", payload: { key, value } });

	const setError = (error: string | null) =>
		dispatch({ type: "SET_ERROR", payload: error });

	const addAsset = (asset: Asset) =>
		dispatch({ type: "ADD_ASSET", payload: asset });

	const updateAsset = (id: string, updates: Partial<Asset>) =>
		dispatch({ type: "UPDATE_ASSET", payload: { id, updates } });

	const deleteAsset = (id: string) =>
		dispatch({ type: "DELETE_ASSET", payload: id });

	const addCollection = (collection: Collection) =>
		dispatch({ type: "ADD_COLLECTION", payload: collection });

	const updateCollection = (id: string, updates: Partial<Collection>) =>
		dispatch({ type: "UPDATE_COLLECTION", payload: { id, updates } });

	const deleteCollection = (id: string) =>
		dispatch({ type: "DELETE_COLLECTION", payload: id });

	const addNotification = (notification: Notification) =>
		dispatch({ type: "ADD_NOTIFICATION", payload: notification });

	const markNotificationRead = (id: string) =>
		dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });

	const deleteNotification = (id: string) =>
		dispatch({ type: "DELETE_NOTIFICATION", payload: id });

	const setFilters = (filters: Partial<AppState["filters"]>) =>
		dispatch({ type: "SET_FILTERS", payload: filters });

	const clearFilters = () => dispatch({ type: "CLEAR_FILTERS" });

	const setView = (view: "grid" | "list") =>
		dispatch({ type: "SET_UI", payload: { view } });

	const selectAssets = (assetIds: string[]) =>
		dispatch({ type: "SELECT_ASSETS", payload: assetIds });

	const clearSelection = () => dispatch({ type: "CLEAR_SELECTION" });

	const toggleSidebar = () => dispatch({ type: "TOGGLE_SIDEBAR" });

	const contextValue: AppContextType = {
		state,
		dispatch,
		setUser,
		updateUserPreferences,
		setLoading,
		setError,
		addAsset,
		updateAsset,
		deleteAsset,
		addCollection,
		updateCollection,
		deleteCollection,
		addNotification,
		markNotificationRead,
		deleteNotification,
		setFilters,
		clearFilters,
		setView,
		selectAssets,
		clearSelection,
		toggleSidebar,
	};

	return (
		<AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
	);
}

// Custom Hook
export function useApp() {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
}

// Selector hooks for performance
export function useUser() {
	const { state } = useApp();
	return state.user;
}

export function useAssets() {
	const { state } = useApp();
	return state.assets;
}

export function useCollections() {
	const { state } = useApp();
	return state.collections;
}

export function useNotifications() {
	const { state } = useApp();
	return state.notifications;
}

export function useFilters() {
	const { state } = useApp();
	return state.filters;
}

export function useUI() {
	const { state } = useApp();
	return state.ui;
}

export function useLoading() {
	const { state } = useApp();
	return state.loading;
}

export function useError() {
	const { state } = useApp();
	return state.error;
}
