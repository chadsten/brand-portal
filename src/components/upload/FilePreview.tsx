"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Archive,
	Download,
	Eye,
	File,
	FileText,
	Image as ImageIcon,
	Music,
	Play,
	Share2,
	Trash2,
	Video,
} from "lucide-react";
import { useState } from "react";

export interface FilePreviewData {
	id: string;
	name: string;
	size: number;
	mimeType: string;
	url: string;
	thumbnailUrl?: string;
	uploadedAt: Date;
	uploadedBy: string;
	status: "processing" | "ready" | "error";
	metadata?: {
		width?: number;
		height?: number;
		duration?: number;
		pages?: number;
		[key: string]: any;
	};
}

interface FilePreviewProps {
	file: FilePreviewData;
	onDownload?: (fileId: string) => void;
	onShare?: (fileId: string) => void;
	onDelete?: (fileId: string) => void;
	className?: string;
}

interface FilePreviewModalProps {
	file: FilePreviewData;
	isOpen: boolean;
	onClose: () => void;
	onDownload?: (fileId: string) => void;
	onShare?: (fileId: string) => void;
	onDelete?: (fileId: string) => void;
}

function FilePreviewModal({
	file,
	isOpen,
	onClose,
	onDownload,
	onShare,
	onDelete,
}: FilePreviewModalProps) {
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	const formatDuration = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
		}
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const renderPreview = () => {
		if (file.status === "processing") {
			return (
				<div className="flex h-96 items-center justify-center rounded-lg bg-base-200">
					<div className="text-center">
						<span className="loading loading-spinner loading-lg text-primary"></span>
						<p className="text-base-content/50">Processing file...</p>
					</div>
				</div>
			);
		}

		if (file.status === "error") {
			return (
				<div className="flex h-96 items-center justify-center rounded-lg bg-error/10">
					<div className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/20">
							<File className="h-6 w-6 text-error" />
						</div>
						<p className="text-error">Failed to process file</p>
					</div>
				</div>
			);
		}

		const isImage = file.mimeType.startsWith("image/");
		const isVideo = file.mimeType.startsWith("video/");
		const isPDF = file.mimeType === "application/pdf";

		if (isImage) {
			return (
				<div className="relative">
					<img
						src={file.url}
						alt={file.name}
						className="max-h-96 w-full object-contain"
					/>
					{file.metadata?.width && file.metadata?.height && (
						<span className="badge badge-sm badge-outline absolute bottom-2 left-2">
							{file.metadata.width} × {file.metadata.height}
						</span>
					)}
				</div>
			);
		}

		if (isVideo) {
			return (
				<div className="relative">
					<video
						src={file.url}
						poster={file.thumbnailUrl}
						controls
						className="max-h-96 w-full rounded-lg"
					>
						Your browser does not support the video tag.
					</video>
					{file.metadata?.duration && (
						<span className="badge badge-sm badge-outline absolute bottom-2 left-2">
							{formatDuration(file.metadata.duration)}
						</span>
					)}
				</div>
			);
		}

		if (isPDF) {
			return (
				<div className="relative h-96">
					<iframe
						src={`${file.url}#view=FitH`}
						className="h-full w-full rounded-lg border-0"
						title={file.name}
					/>
					{file.metadata?.pages && (
						<span className="badge badge-sm badge-outline absolute bottom-2 left-2">
							{file.metadata.pages} pages
						</span>
					)}
				</div>
			);
		}

		// Default file preview
		return (
			<div className="flex h-96 items-center justify-center rounded-lg bg-base-200">
				<div className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-300">
						<File className="h-8 w-8 text-base-content/50" />
					</div>
					<p className="text-base-content/50">Preview not available</p>
					<p className="text-base-content/40 text-sm">
						Click download to view file
					</p>
				</div>
			</div>
		);
	};

	return (
		<dialog className="modal" open={isOpen}>
			<div className="modal-box w-11/12 max-w-4xl h-5/6 overflow-y-auto">
				<div className="flex justify-between items-start mb-4">
					<div className="flex flex-col gap-1">
						<h3 className="truncate font-bold text-xl">{file.name}</h3>
						<div className="flex items-center gap-2 text-base-content/50 text-sm">
							<span>{formatFileSize(file.size)}</span>
							<span>•</span>
							<span>{file.mimeType}</span>
							<span>•</span>
							<span>Uploaded {file.uploadedAt.toLocaleDateString()}</span>
						</div>
					</div>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
				</div>

				<div className="py-4">
							{renderPreview()}

					{/* File Metadata */}
					<div className="mt-6 space-y-4">
						<h4 className="font-semibold">File Information</h4>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-base-content/50">Uploaded by</p>
								<p className="font-medium">{file.uploadedBy}</p>
							</div>
							<div>
								<p className="text-base-content/50">Upload date</p>
								<p className="font-medium">
									{file.uploadedAt.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-base-content/50">File size</p>
								<p className="font-medium">{formatFileSize(file.size)}</p>
							</div>
							<div>
								<p className="text-base-content/50">Format</p>
								<p className="font-medium">{file.mimeType}</p>
							</div>
						</div>
					</div>
				</div>

				<div className="modal-action">
					<button
						className="btn btn-error btn-outline"
						onClick={() => {
							onDelete?.(file.id);
							onClose();
						}}
					>
						<Trash2 className="h-4 w-4" />
						Delete
					</button>
					<button
						className="btn btn-primary btn-outline"
						onClick={() => onShare?.(file.id)}
					>
						<Share2 className="h-4 w-4" />
						Share
					</button>
					<button
						className="btn btn-primary"
						onClick={() => onDownload?.(file.id)}
					>
						<Download className="h-4 w-4" />
						Download
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose}></div>
		</dialog>
	);
}

export default function FilePreview({
	file,
	onDownload,
	onShare,
	onDelete,
	className = "",
}: FilePreviewProps) {
	const [isOpen, setIsOpen] = useState(false);
	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);

	const getFileIcon = (mimeType: string) => {
		if (mimeType.startsWith("image/")) return <ImageIcon className="h-6 w-6" />;
		if (mimeType.startsWith("video/")) return <Video className="h-6 w-6" />;
		if (mimeType.startsWith("audio/")) return <Music className="h-6 w-6" />;
		if (mimeType === "application/pdf") return <FileText className="h-6 w-6" />;
		if (mimeType.includes("zip") || mimeType.includes("archive"))
			return <Archive className="h-6 w-6" />;
		return <File className="h-6 w-6" />;
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	const getStatusColor = (status: FilePreviewData["status"]) => {
		switch (status) {
			case "processing":
				return "warning";
			case "ready":
				return "success";
			case "error":
				return "danger";
		}
	};

	return (
		<>
			<div
				className={`card bg-base-100 shadow hover:shadow-lg cursor-pointer transition-shadow ${className}`}
			>
				<div className="card-body p-4">
					<div className="flex items-start gap-3">
						{/* File Thumbnail/Icon */}
						<div className="flex-shrink-0">
							{file.thumbnailUrl ? (
								<div className="avatar">
									<div className="w-14 h-14 rounded-lg">
										<img
											src={file.thumbnailUrl}
											alt={file.name}
										/>
									</div>
								</div>
							) : (
								<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-base-200">
									{getFileIcon(file.mimeType)}
								</div>
							)}
						</div>

						{/* File Info */}
						<div className="min-w-0 flex-1">
							<div className="mb-2 flex items-start justify-between">
								<h4 className="truncate font-semibold">{file.name}</h4>
								<span className={`badge badge-sm ${
									getStatusColor(file.status) === "success" ? "badge-success" :
									getStatusColor(file.status) === "warning" ? "badge-warning" :
									getStatusColor(file.status) === "danger" ? "badge-error" :
									"badge-neutral"
								}`}>
									{file.status}
								</span>
							</div>

							<div className="space-y-1 text-base-content/50 text-sm">
								<p>
									{formatFileSize(file.size)} • {file.mimeType}
								</p>
								<p>Uploaded {file.uploadedAt.toLocaleDateString()}</p>
								{file.metadata?.width && file.metadata?.height && (
									<p>
										{file.metadata.width} × {file.metadata.height}
									</p>
								)}
							</div>

							{/* Actions */}
							<div className="mt-3 flex items-center gap-1">
								<button
									className="btn btn-sm btn-ghost"
									onClick={onOpen}
								>
									<Eye className="h-4 w-4" />
									Preview
								</button>

								{file.status === "ready" && (
									<>
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => onDownload?.(file.id)}
										>
											<Download className="h-4 w-4" />
											Download
										</button>
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => onShare?.(file.id)}
										>
											<Share2 className="h-4 w-4" />
											Share
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<FilePreviewModal
				file={file}
				isOpen={isOpen}
				onClose={onClose}
				onDownload={onDownload}
				onShare={onShare}
				onDelete={onDelete}
			/>
		</>
	);
}
