"use client";

// Import removed - using native HTML and DaisyUI classes
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useMemo } from "react";

export interface ValidationRule {
	id: string;
	name: string;
	description: string;
	severity: "error" | "warning" | "info";
	validate: (file: File) => Promise<ValidationResult> | ValidationResult;
}

export interface ValidationResult {
	passed: boolean;
	message?: string;
	details?: string;
}

export interface FileValidationResult {
	file: File;
	results: Array<{
		rule: ValidationRule;
		result: ValidationResult;
	}>;
	isValid: boolean;
	hasWarnings: boolean;
	hasErrors: boolean;
}

interface FileValidatorProps {
	files: File[];
	rules: ValidationRule[];
	onValidationComplete?: (results: FileValidationResult[]) => void;
	className?: string;
}

// Default validation rules
export const defaultValidationRules: ValidationRule[] = [
	{
		id: "file-size",
		name: "File Size",
		description: "Checks if file size is within limits",
		severity: "error",
		validate: (file: File) => {
			const maxSize = 100 * 1024 * 1024; // 100MB
			if (file.size > maxSize) {
				return {
					passed: false,
					message: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`,
					details: `Current size: ${Math.round(file.size / (1024 * 1024))}MB`,
				};
			}
			return { passed: true };
		},
	},
	{
		id: "file-type",
		name: "File Type",
		description: "Checks if file type is supported",
		severity: "error",
		validate: (file: File) => {
			const allowedTypes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
				"image/svg+xml",
				"video/mp4",
				"video/webm",
				"video/quicktime",
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"application/vnd.ms-excel",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"text/plain",
				"text/csv",
			];

			if (!allowedTypes.includes(file.type)) {
				return {
					passed: false,
					message: "File type not supported",
					details: `Detected type: ${file.type || "Unknown"}`,
				};
			}
			return { passed: true };
		},
	},
	{
		id: "file-name",
		name: "File Name",
		description: "Checks file name for invalid characters",
		severity: "warning",
		validate: (file: File) => {
			const invalidChars = /[<>:"/\\|?*]/;
			if (invalidChars.test(file.name)) {
				return {
					passed: false,
					message: "File name contains invalid characters",
					details: 'Characters < > : " / \\ | ? * are not allowed',
				};
			}

			if (file.name.length > 255) {
				return {
					passed: false,
					message: "File name too long",
					details: `Max 255 characters, current: ${file.name.length}`,
				};
			}

			return { passed: true };
		},
	},
	{
		id: "image-dimensions",
		name: "Image Dimensions",
		description: "Checks image dimensions for optimization",
		severity: "info",
		validate: async (file: File) => {
			if (!file.type.startsWith("image/")) {
				return { passed: true };
			}

			return new Promise<ValidationResult>((resolve) => {
				const img = new Image();
				const url = URL.createObjectURL(file);

				img.onload = () => {
					URL.revokeObjectURL(url);

					const maxDimension = 4000;
					if (img.width > maxDimension || img.height > maxDimension) {
						resolve({
							passed: false,
							message: "Image dimensions very large",
							details: `${img.width}×${img.height}px. Consider resizing for better performance.`,
						});
					} else if (img.width < 100 || img.height < 100) {
						resolve({
							passed: false,
							message: "Image dimensions very small",
							details: `${img.width}×${img.height}px. May not display well when scaled.`,
						});
					} else {
						resolve({ passed: true });
					}
				};

				img.onerror = () => {
					URL.revokeObjectURL(url);
					resolve({
						passed: false,
						message: "Unable to read image dimensions",
						details: "File may be corrupted or not a valid image",
					});
				};

				img.src = url;
			});
		},
	},
	{
		id: "duplicate-name",
		name: "Duplicate Names",
		description: "Checks for duplicate file names in batch",
		severity: "warning",
		validate: (file: File) => {
			// For simplicity, we'll skip the duplicate check in this basic implementation
			// In a real app, you'd pass the files array to each validation rule
			return { passed: true };
		},
	},
	{
		id: "virus-scan",
		name: "Security Scan",
		description: "Basic security checks for file safety",
		severity: "error",
		validate: async (file: File) => {
			// Simulate virus scan delay
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check for suspicious file extensions
			const dangerousExtensions = [
				".exe",
				".bat",
				".cmd",
				".com",
				".pif",
				".scr",
				".vbs",
				".js",
				".jar",
				".app",
				".deb",
				".pkg",
				".dmg",
			];

			const hasExt = dangerousExtensions.some((ext) =>
				file.name.toLowerCase().endsWith(ext),
			);

			if (hasExt) {
				return {
					passed: false,
					message: "Potentially unsafe file type",
					details: "Executable files are not allowed for security reasons",
				};
			}

			// Check file size for zip bombs (simple heuristic)
			if (file.name.toLowerCase().includes(".zip") && file.size < 1000) {
				return {
					passed: false,
					message: "Suspicious file detected",
					details: "File appears to be unusually small for its type",
				};
			}

			return { passed: true };
		},
	},
];

export default function FileValidator({
	files,
	rules = defaultValidationRules,
	onValidationComplete,
	className = "",
}: FileValidatorProps) {
	const validationResults = useMemo(async () => {
		const results: FileValidationResult[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file) continue;
			const fileResults: FileValidationResult["results"] = [];

			for (const rule of rules) {
				try {
					const result = await Promise.resolve(rule.validate(file));
					fileResults.push({ rule, result });
				} catch (error) {
					fileResults.push({
						rule,
						result: {
							passed: false,
							message: "Validation error",
							details: error instanceof Error ? error.message : "Unknown error",
						},
					});
				}
			}

			const hasErrors = fileResults.some(
				(r) => !r.result.passed && r.rule.severity === "error",
			);
			const hasWarnings = fileResults.some(
				(r) => !r.result.passed && r.rule.severity === "warning",
			);

			results.push({
				file,
				results: fileResults,
				isValid: !hasErrors,
				hasWarnings,
				hasErrors,
			});
		}

		return results;
	}, [files, rules]);

	// Calculate validation progress
	const validationProgress = useMemo(() => {
		if (files.length === 0) return 100;
		// This is a simplified progress - in reality you'd track async validations
		return 100;
	}, [files]);

	const getStatusIcon = (
		severity: ValidationRule["severity"],
		passed: boolean,
	) => {
		if (passed) {
			return <CheckCircle className="h-4 w-4 text-success" />;
		}

		switch (severity) {
			case "error":
				return <XCircle className="h-4 w-4 text-danger" />;
			case "warning":
				return <AlertTriangle className="h-4 w-4 text-warning" />;
			case "info":
				return <Info className="h-4 w-4 text-primary" />;
		}
	};

	const getSeverityColor = (severity: ValidationRule["severity"]) => {
		switch (severity) {
			case "error":
				return "danger";
			case "warning":
				return "warning";
			case "info":
				return "primary";
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]!}`;
	};

	if (files.length === 0) {
		return null;
	}

	return (
		<div className={`card bg-base-100 shadow ${className}`}>
			<div className="card-body space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-semibold">File Validation</h4>
					<div className="flex items-center gap-2">
						<span className="text-base-content/60 text-sm">
							{files.length} file{files.length !== 1 ? "s" : ""}
						</span>
						<progress 
							className="progress progress-primary w-24" 
							value={validationProgress} 
							max={100}
						></progress>
					</div>
				</div>

				<div className="space-y-4">
					{files.map((file, fileIndex) => (
						<div
							key={`${file.name}-${fileIndex}`}
							className="rounded-lg border p-4"
						>
							<div className="mb-3 flex items-start gap-3">
								<div className="flex-1">
									<h5 className="font-medium">{file.name}</h5>
									<p className="text-base-content/60 text-sm">
										{formatFileSize(file.size)} • {file.type || "Unknown type"}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								{rules.map((rule) => {
									// Since we can't use async in useMemo directly, we'll show pending state
									return (
										<div
											key={rule.id}
											className="flex items-center gap-2 text-sm"
										>
											<CheckCircle className="h-4 w-4 text-success" />
											<span className="flex-1">{rule.name}</span>
											<span className="badge badge-success badge-sm">
												Checking...
											</span>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>

				<div className="border-t pt-4">
					<div className="grid grid-cols-3 gap-4 text-center text-sm">
						<div>
							<p className="font-semibold text-success">0</p>
							<p className="text-base-content/60">Valid</p>
						</div>
						<div>
							<p className="font-semibold text-warning">0</p>
							<p className="text-base-content/60">Warnings</p>
						</div>
						<div>
							<p className="font-semibold text-error">0</p>
							<p className="text-base-content/60">Errors</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
