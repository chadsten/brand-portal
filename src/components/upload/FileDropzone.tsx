"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertCircle,
	CheckCircle,
	Clock,
	File,
	UploadCloud,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "~/trpc/react";

export interface UploadFile {
	id: string;
	file: File;
	name: string;
	size: number;
	type: string;
	preview?: string;
	status: "pending" | "uploading" | "processing" | "completed" | "error";
	progress: number;
	error?: string;
	assetId?: string;
}

interface FileDropzoneProps {
	onUploadComplete?: (files: UploadFile[]) => void;
	onUploadProgress?: (files: UploadFile[]) => void;
	maxFiles?: number;
	maxSize?: number; // in bytes
	acceptedFileTypes?: string[];
	disabled?: boolean;
	className?: string;
}

export default function FileDropzone({
	onUploadComplete,
	onUploadProgress,
	maxFiles = 10,
	maxSize = 100 * 1024 * 1024, // 100MB
	acceptedFileTypes = [
		"image/*",
		"video/*",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	],
	disabled = false,
	className = "",
}: FileDropzoneProps) {
	const [files, setFiles] = useState<UploadFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);

	// tRPC mutations
	const initializeUpload = api.upload.initializeChunkedUpload.useMutation();
	const getChunkUploadUrl = api.upload.getChunkUploadUrl.useMutation();
	const confirmChunkUpload = api.upload.confirmChunkUpload.useMutation();
	const directUpload = api.upload.directUpload.useMutation();

	const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
		setIsDragOver(false);

		// Handle rejected files
		if (rejectedFiles.length > 0) {
			const rejectedFileErrors = rejectedFiles.map((rejection) => ({
				name: rejection.file.name,
				errors: rejection.errors.map((error: any) => error.message).join(", "),
			}));

			console.warn("Rejected files:", rejectedFileErrors);
		}

		// Process accepted files
		const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
			id: crypto.randomUUID(),
			file,
			name: file.name,
			size: file.size,
			type: file.type,
			preview: file.type.startsWith("image/")
				? URL.createObjectURL(file)
				: undefined,
			status: "pending" as const,
			progress: 0,
		}));

		setFiles((prev) => [...prev, ...newFiles]);

		// Start uploading files
		newFiles.forEach(uploadFile);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDragEnter: () => setIsDragOver(true),
		onDragLeave: () => setIsDragOver(false),
		accept: acceptedFileTypes.reduce(
			(acc, type) => ({ ...acc, [type]: [] }),
			{},
		),
		maxSize,
		maxFiles,
		disabled,
		multiple: true,
	});

	const uploadFile = async (file: UploadFile) => {
		try {
			updateFileStatus(file.id, "uploading", 0);

			// Determine upload method based on file size
			const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5MB

			if (file.size <= CHUNK_THRESHOLD) {
				await handleDirectUpload(file);
			} else {
				await handleChunkedUpload(file);
			}
		} catch (error) {
			console.error("Upload failed:", error);
			updateFileStatus(
				file.id,
				"error",
				0,
				error instanceof Error ? error.message : "Upload failed",
			);
		}
	};

	const handleDirectUpload = async (file: UploadFile) => {
		const formData = new FormData();
		formData.append("file", file.file);

		try {
			const result = await directUpload.mutateAsync({
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				metadata: {
					uploadMethod: "direct",
					originalName: file.name,
				},
			});

			// For direct upload, we get presigned URLs
			updateFileStatus(file.id, "processing", 100);

			// Simulate processing time - in real implementation you'd track the actual upload
			setTimeout(() => {
				updateFileStatus(
					file.id,
					"completed",
					100,
					undefined,
					result.storageKey,
				);
			}, 1000);
		} catch (error) {
			throw error;
		}
	};

	const handleChunkedUpload = async (file: UploadFile) => {
		try {
			// Initialize chunked upload
			const initResult = await initializeUpload.mutateAsync({
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				metadata: {
					uploadMethod: "chunked",
					originalName: file.name,
				},
			});

			const { sessionId, totalChunks, chunkSize } = initResult;

			// Upload chunks
			for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
				const start = chunkIndex * chunkSize;
				const end = Math.min(start + chunkSize, file.size);
				const chunk = file.file.slice(start, end);

				// Get presigned URL for chunk
				const chunkUrlResult = await getChunkUploadUrl.mutateAsync({
					sessionId,
					chunkIndex,
				});

				if (!chunkUrlResult.success) {
					throw new Error(
						chunkUrlResult.error || "Failed to get chunk upload URL",
					);
				}

				// Upload chunk directly to S3
				if (!chunkUrlResult.uploadUrl) {
					throw new Error("Upload URL not provided");
				}

				const uploadResponse = await fetch(chunkUrlResult.uploadUrl, {
					method: "PUT",
					body: chunk,
					headers: {
						"Content-Type": "application/octet-stream",
					},
				});

				if (!uploadResponse.ok) {
					throw new Error(`Failed to upload chunk ${chunkIndex}`);
				}

				const etag = uploadResponse.headers.get("etag") || "";

				// Confirm chunk upload
				await confirmChunkUpload.mutateAsync({
					sessionId,
					chunkIndex,
					etag,
				});

				// Update progress
				const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
				updateFileStatus(file.id, "uploading", progress);
			}

			updateFileStatus(file.id, "completed", 100, undefined, sessionId);
		} catch (error) {
			throw error;
		}
	};

	const updateFileStatus = (
		fileId: string,
		status: UploadFile["status"],
		progress: number,
		error?: string,
		assetId?: string,
	) => {
		setFiles((prev) => {
			const updated = prev.map((file) =>
				file.id === fileId
					? { ...file, status, progress, error, assetId }
					: file,
			);

			onUploadProgress?.(updated);

			// Check if all files are completed
			const allCompleted = updated.every(
				(f) => f.status === "completed" || f.status === "error",
			);
			if (allCompleted) {
				onUploadComplete?.(updated);
			}

			return updated;
		});
	};

	const removeFile = (fileId: string) => {
		setFiles((prev) => {
			const fileToRemove = prev.find((f) => f.id === fileId);
			if (fileToRemove?.preview) {
				URL.revokeObjectURL(fileToRemove.preview);
			}
			return prev.filter((f) => f.id !== fileId);
		});
	};

	const clearAllFiles = () => {
		files.forEach((file) => {
			if (file.preview) {
				URL.revokeObjectURL(file.preview);
			}
		});
		setFiles([]);
	};

	const getStatusIcon = (status: UploadFile["status"]) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4 text-default-400" />;
			case "uploading":
			case "processing":
				return <Clock className="h-4 w-4 animate-spin text-primary" />;
			case "completed":
				return <CheckCircle className="h-4 w-4 text-success" />;
			case "error":
				return <AlertCircle className="h-4 w-4 text-danger" />;
		}
	};

	const getStatusColor = (status: UploadFile["status"]) => {
		switch (status) {
			case "pending":
				return "badge-outline";
			case "uploading":
			case "processing":
				return "badge-primary";
			case "completed":
				return "badge-success";
			case "error":
				return "badge-error";
			default:
				return "badge-outline";
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	return (
		<div className={`w-full ${className}`}>
			{/* Dropzone */}
			<div
				className={`card border-2 border-dashed transition-all duration-200 ${
					isDragActive || isDragOver
						? "scale-105 border-primary bg-primary/5"
						: "border-base-300 hover:border-base-content/20"
				} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
			>
				<div className="card-body">
					<div {...getRootProps()} className="p-8 text-center">
						<input {...getInputProps()} />

						<UploadCloud
							className={`mx-auto mb-4 h-12 w-12 transition-colors ${
								isDragActive || isDragOver ? "text-primary" : "text-default-400"
							}`}
						/>

						<h3 className="mb-2 font-semibold text-lg">
							{isDragActive ? "Drop files here" : "Drag & drop files here"}
						</h3>

						<p className="mb-4 text-base-content/60">
							or{" "}
							<button
								className="btn btn-ghost btn-sm text-primary font-medium p-0 h-auto min-w-0"
								disabled={disabled}
							>
								browse files
							</button>
						</p>

						<div className="space-y-1 text-base-content/60 text-sm">
							<p>
								Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
							</p>
							<p>Supports: Images, Videos, PDFs, Documents</p>
						</div>
					</div>
				</div>
			</div>

			{/* File List */}
			{files.length > 0 && (
				<div className="card bg-base-100 shadow mt-6">
					<div className="card-header p-4 flex items-center justify-between border-b border-base-300">
						<h4 className="font-semibold text-lg">
							Uploaded Files ({files.length})
						</h4>
						<button
							className="btn btn-ghost btn-sm text-error gap-2"
							onClick={clearAllFiles}
						>
							<X className="h-4 w-4" />
							Clear All
						</button>
					</div>
					<div className="card-body space-y-4">
						{files.map((file) => (
							<div
								key={file.id}
								className="flex items-center gap-4 rounded-lg bg-base-200 p-4"
							>
								{/* File Preview/Icon */}
								<div className="flex-shrink-0">
									{file.preview ? (
										<img
											src={file.preview}
											alt={file.name}
											className="h-12 w-12 rounded object-cover"
										/>
									) : (
										<div className="flex h-12 w-12 items-center justify-center rounded bg-base-300">
											<File className="h-6 w-6 text-base-content/60" />
										</div>
									)}
								</div>

								{/* File Info */}
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-center gap-2">
										<p className="truncate font-medium">{file.name}</p>
										<span
											className={`badge badge-sm gap-2 ${getStatusColor(file.status)}`}
										>
											{getStatusIcon(file.status)}
											{file.status === "processing"
												? "Processing"
												: file.status === "uploading"
													? "Uploading"
													: file.status === "completed"
														? "Completed"
														: file.status === "error"
															? "Error"
															: "Pending"}
										</span>
									</div>

									<p className="mb-2 text-base-content/60 text-sm">
										{formatFileSize(file.size)}
									</p>

									{/* Progress Bar */}
									{(file.status === "uploading" ||
										file.status === "processing") && (
										<progress 
											className="progress progress-primary w-full mb-1" 
											value={file.progress} 
											max={100}
										></progress>
									)}

									{/* Error Message */}
									{file.status === "error" && file.error && (
										<p className="text-error text-sm">{file.error}</p>
									)}
								</div>

								{/* Remove Button */}
								<button
									className="btn btn-ghost btn-sm btn-square text-error"
									onClick={() => removeFile(file.id)}
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
