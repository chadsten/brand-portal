import { lookup } from "mime-types";

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	fileType?: string;
	category?: string;
}

export interface TierLimits {
	maxFileSizeMB: number;
	maxStorageGB: number;
	allowedFileTypes: string[];
	maxFilesPerUpload: number;
}

const DEFAULT_TIER_LIMITS: TierLimits = {
	maxFileSizeMB: 50,
	maxStorageGB: 5,
	allowedFileTypes: ["image/*", "video/*", "application/pdf"],
	maxFilesPerUpload: 10,
};

// Supported file types by category
export const SUPPORTED_FILE_TYPES = {
	image: {
		types: [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/avif",
			"image/svg+xml",
			"image/bmp",
			"image/tiff",
		],
		extensions: [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".webp",
			".avif",
			".svg",
			".bmp",
			".tiff",
			".tif",
		],
	},
	video: {
		types: [
			"video/mp4",
			"video/quicktime",
			"video/avi",
			"video/webm",
			"video/ogg",
			"video/x-msvideo",
		],
		extensions: [".mp4", ".mov", ".avi", ".webm", ".ogv"],
	},
	document: {
		types: [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"text/plain",
			"text/csv",
		],
		extensions: [
			".pdf",
			".doc",
			".docx",
			".xls",
			".xlsx",
			".ppt",
			".pptx",
			".txt",
			".csv",
		],
	},
	design: {
		types: [
			"application/postscript", // .ai files
			"image/vnd.adobe.photoshop", // .psd files
			"application/x-sketch", // .sketch files
			"application/vnd.figma", // .fig files
			"image/x-eps",
		],
		extensions: [".ai", ".psd", ".sketch", ".fig", ".eps", ".indd"],
	},
	archive: {
		types: [
			"application/zip",
			"application/x-rar-compressed",
			"application/x-7z-compressed",
			"application/gzip",
		],
		extensions: [".zip", ".rar", ".7z", ".gz"],
	},
	font: {
		types: [
			"font/woff",
			"font/woff2",
			"font/ttf",
			"font/otf",
			"application/font-woff",
			"application/font-woff2",
			"application/x-font-ttf",
			"application/x-font-otf",
		],
		extensions: [".woff", ".woff2", ".ttf", ".otf"],
	},
} as const;

export function getFileCategory(mimeType: string): string {
	for (const [category, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
		if ((config.types as readonly string[]).includes(mimeType)) {
			return category;
		}
	}
	return "other";
}

export function getMimeTypeFromExtension(fileName: string): string | null {
	return lookup(fileName) || null;
}

export function validateFileType(
	fileName: string,
	mimeType: string,
	allowedTypes: string[] = [],
): FileValidationResult {
	const detectedMimeType = getMimeTypeFromExtension(fileName);
	const fileExtension = fileName.toLowerCase().split(".").pop();

	// Check if mime type matches file extension
	if (detectedMimeType && detectedMimeType !== mimeType) {
		return {
			isValid: false,
			error: `File extension does not match content type. Expected: ${detectedMimeType}, Got: ${mimeType}`,
		};
	}

	const category = getFileCategory(mimeType);

	// If no specific allowed types, check against supported types
	if (allowedTypes.length === 0) {
		const isSupported = Object.values(SUPPORTED_FILE_TYPES).some((config) =>
			(config.types as readonly string[]).includes(mimeType),
		);

		if (!isSupported) {
			return {
				isValid: false,
				error: `Unsupported file type: ${mimeType}`,
			};
		}
	} else {
		// Check against specific allowed types (can include wildcards)
		const isAllowed = allowedTypes.some((allowedType) => {
			if (allowedType.includes("*")) {
				const [category] = allowedType.split("/");
				return mimeType.startsWith(`${category}/`);
			}
			return allowedType === mimeType;
		});

		if (!isAllowed) {
			return {
				isValid: false,
				error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
			};
		}
	}

	return {
		isValid: true,
		fileType: mimeType,
		category,
	};
}

export function validateFileSize(
	fileSize: number,
	maxSizeMB: number,
): FileValidationResult {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;

	if (fileSize > maxSizeBytes) {
		return {
			isValid: false,
			error: `File size exceeds limit. Maximum: ${maxSizeMB}MB, Got: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
		};
	}

	return { isValid: true };
}

export function validateFileName(fileName: string): FileValidationResult {
	// Check for invalid characters
	const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
	if (invalidChars.test(fileName)) {
		return {
			isValid: false,
			error: "File name contains invalid characters",
		};
	}

	// Check length
	if (fileName.length > 255) {
		return {
			isValid: false,
			error: "File name is too long (maximum 255 characters)",
		};
	}

	// Check for reserved names (Windows)
	const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
	if (reservedNames.test(fileName)) {
		return {
			isValid: false,
			error: "File name uses a reserved system name",
		};
	}

	// Must have an extension
	if (!fileName.includes(".") || fileName.endsWith(".")) {
		return {
			isValid: false,
			error: "File must have a valid extension",
		};
	}

	return { isValid: true };
}

export function sanitizeFileName(fileName: string): string {
	// Remove invalid characters
	let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

	// Limit length
	if (sanitized.length > 255) {
		const extension = sanitized.split(".").pop();
		const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf("."));
		const maxNameLength = 255 - (extension?.length || 0) - 1;
		sanitized = `${nameWithoutExt.slice(0, maxNameLength)}.${extension}`;
	}

	return sanitized;
}

export function checkStorageQuota(
	currentStorageBytes: number,
	fileSize: number,
	maxStorageGB: number,
): FileValidationResult {
	const maxStorageBytes = maxStorageGB * 1024 * 1024 * 1024;
	const newTotal = currentStorageBytes + fileSize;

	if (newTotal > maxStorageBytes) {
		const remainingMB = (
			(maxStorageBytes - currentStorageBytes) /
			1024 /
			1024
		).toFixed(2);
		return {
			isValid: false,
			error: `Storage quota exceeded. Remaining: ${remainingMB}MB`,
		};
	}

	return { isValid: true };
}

export function validateBulkUpload(
	files: Array<{ name: string; size: number; type: string }>,
	tierLimits: TierLimits = DEFAULT_TIER_LIMITS,
): {
	isValid: boolean;
	errors: string[];
	validFiles: number;
	totalSize: number;
} {
	const errors: string[] = [];
	let validFiles = 0;
	let totalSize = 0;

	// Check file count
	if (files.length > tierLimits.maxFilesPerUpload) {
		errors.push(
			`Too many files. Maximum: ${tierLimits.maxFilesPerUpload}, Got: ${files.length}`,
		);
	}

	// Validate each file
	for (const file of files) {
		let fileValid = true;

		// Validate file name
		const nameValidation = validateFileName(file.name);
		if (!nameValidation.isValid) {
			errors.push(`${file.name}: ${nameValidation.error}`);
			fileValid = false;
		}

		// Validate file type
		const typeValidation = validateFileType(
			file.name,
			file.type,
			tierLimits.allowedFileTypes,
		);
		if (!typeValidation.isValid) {
			errors.push(`${file.name}: ${typeValidation.error}`);
			fileValid = false;
		}

		// Validate file size
		const sizeValidation = validateFileSize(
			file.size,
			tierLimits.maxFileSizeMB,
		);
		if (!sizeValidation.isValid) {
			errors.push(`${file.name}: ${sizeValidation.error}`);
			fileValid = false;
		}

		if (fileValid) {
			validFiles++;
			totalSize += file.size;
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		validFiles,
		totalSize,
	};
}

export function getFileTypeIcon(mimeType: string): string {
	const category = getFileCategory(mimeType);

	const iconMap: Record<string, string> = {
		image: "🖼️",
		video: "🎥",
		document: "📄",
		design: "🎨",
		archive: "📦",
		font: "🔤",
		other: "📁",
	};

	return iconMap[category] || iconMap.other!;
}

export function formatFileSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export { DEFAULT_TIER_LIMITS };
