import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return (
		parseFloat((bytes / k ** i).toFixed(dm)) + " " + (sizes[i] || "Unknown")
	);
}

/**
 * Format distance to now
 */
export function formatDistanceToNow(
	date: Date,
	options?: { addSuffix?: boolean },
): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return options?.addSuffix ? "just now" : "0 minutes";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		const suffix = options?.addSuffix ? " ago" : "";
		return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}${suffix}`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		const suffix = options?.addSuffix ? " ago" : "";
		return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}${suffix}`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		const suffix = options?.addSuffix ? " ago" : "";
		return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}${suffix}`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		const suffix = options?.addSuffix ? " ago" : "";
		return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}${suffix}`;
	}

	const diffInYears = Math.floor(diffInMonths / 12);
	const suffix = options?.addSuffix ? " ago" : "";
	return `${diffInYears} year${diffInYears !== 1 ? "s" : ""}${suffix}`;
}

/**
 * Format file type to display name
 */
export function formatFileType(mimeType: string): string {
	const typeMap: Record<string, string> = {
		"image/jpeg": "JPEG Image",
		"image/png": "PNG Image",
		"image/gif": "GIF Image",
		"image/webp": "WebP Image",
		"image/svg+xml": "SVG Image",
		"video/mp4": "MP4 Video",
		"video/avi": "AVI Video",
		"video/mov": "MOV Video",
		"video/webm": "WebM Video",
		"audio/mp3": "MP3 Audio",
		"audio/wav": "WAV Audio",
		"audio/aac": "AAC Audio",
		"audio/ogg": "OGG Audio",
		"application/pdf": "PDF Document",
		"application/msword": "Word Document",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
			"Word Document",
		"application/vnd.ms-excel": "Excel Spreadsheet",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
			"Excel Spreadsheet",
		"application/vnd.ms-powerpoint": "PowerPoint Presentation",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation":
			"PowerPoint Presentation",
		"text/plain": "Text File",
		"text/csv": "CSV File",
		"application/zip": "ZIP Archive",
		"application/x-rar-compressed": "RAR Archive",
		"application/x-7z-compressed": "7Z Archive",
	};

	return (
		typeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "Unknown"
	);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generate a random color
 */
export function generateRandomColor(): string {
	const colors = [
		"#FF6B6B",
		"#4ECDC4",
		"#45B7D1",
		"#96CEB4",
		"#FFEAA7",
		"#DDA0DD",
		"#98D8C8",
		"#F7DC6F",
		"#BB8FCE",
		"#85C1E9",
		"#F8C471",
		"#82E0AA",
		"#F1948A",
		"#85C1E9",
		"#D7DBDD",
	];
	return colors[Math.floor(Math.random() * colors.length)] || "#000000";
}

export function getRandomColor(): string {
	const colors = [
		"#6366f1",
		"#8b5cf6",
		"#ec4899",
		"#f43f5e",
		"#ef4444",
		"#f97316",
		"#f59e0b",
		"#eab308",
		"#84cc16",
		"#22c55e",
		"#10b981",
		"#06b6d4",
		"#0ea5e9",
		"#3b82f6",
		"#6366f1",
	];
	return colors[Math.floor(Math.random() * colors.length)] || "#6366f1";
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Check if string is valid UUID
 */
export function isValidUUID(str: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
}

/**
 * Convert string to slug
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^\w\s-]/g, "") // Remove special characters
		.replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
	return str.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
	);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
	return num.toLocaleString();
}

/**
 * Parse color palette from dominant colors
 */
export function parseColorPalette(colors: any[]): string[] {
	if (!Array.isArray(colors)) return [];

	return colors
		.filter((color) => typeof color === "string" && color.startsWith("#"))
		.slice(0, 5); // Limit to 5 colors
}

/**
 * Get contrast color (black or white) for background
 */
export function getContrastColor(backgroundColor: string): string {
	// Remove # if present
	const color = backgroundColor.replace("#", "");

	// Convert to RGB
	const r = parseInt(color.substr(0, 2), 16);
	const g = parseInt(color.substr(2, 2), 16);
	const b = parseInt(color.substr(4, 2), 16);

	// Calculate relative luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
