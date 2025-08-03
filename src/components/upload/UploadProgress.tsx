"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	Check,
	Clock,
	Download,
	RefreshCw,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface UploadJob {
	id: string;
	name: string;
	totalFiles: number;
	completedFiles: number;
	failedFiles: number;
	totalSize: number;
	uploadedSize: number;
	status:
		| "pending"
		| "uploading"
		| "processing"
		| "completed"
		| "failed"
		| "paused";
	startTime: Date;
	endTime?: Date;
	estimatedTimeRemaining?: number;
	speed?: number; // bytes per second
	files: UploadFileProgress[];
}

export interface UploadFileProgress {
	id: string;
	name: string;
	size: number;
	uploadedSize: number;
	status: "pending" | "uploading" | "processing" | "completed" | "failed";
	progress: number;
	error?: string;
	thumbnailUrl?: string;
	assetId?: string;
}

interface UploadProgressProps {
	jobs: UploadJob[];
	onRetry?: (jobId: string, fileId?: string) => void;
	onCancel?: (jobId: string) => void;
	onPause?: (jobId: string) => void;
	onResume?: (jobId: string) => void;
	onClear?: (jobId: string) => void;
	onDownload?: (assetId: string) => void;
	className?: string;
}

export default function UploadProgress({
	jobs,
	onRetry,
	onCancel,
	onPause,
	onResume,
	onClear,
	onDownload,
	className = "",
}: UploadProgressProps) {
	const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

	const toggleJobExpanded = (jobId: string) => {
		setExpandedJobs((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(jobId)) {
				newSet.delete(jobId);
			} else {
				newSet.add(jobId);
			}
			return newSet;
		});
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	const formatDuration = (ms: number) => {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	};

	const formatSpeed = (bytesPerSecond: number) => {
		return `${formatFileSize(bytesPerSecond)}/s`;
	};

	const getJobProgress = (job: UploadJob) => {
		if (job.totalSize === 0) return 0;
		return Math.round((job.uploadedSize / job.totalSize) * 100);
	};

	const getJobStatusColor = (status: UploadJob["status"]) => {
		switch (status) {
			case "pending":
				return "default";
			case "uploading":
			case "processing":
				return "primary";
			case "completed":
				return "success";
			case "failed":
				return "danger";
			case "paused":
				return "warning";
			default:
				return "default";
		}
	};

	const getFileStatusIcon = (status: UploadFileProgress["status"]) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4" />;
			case "uploading":
			case "processing":
				return <span className="loading loading-spinner loading-sm"></span>;
			case "completed":
				return <Check className="h-4 w-4" />;
			case "failed":
				return <AlertTriangle className="h-4 w-4" />;
		}
	};

	const getEstimatedTime = (job: UploadJob) => {
		if (!job.speed || job.status !== "uploading") return null;

		const remainingBytes = job.totalSize - job.uploadedSize;
		const estimatedSeconds = remainingBytes / job.speed;

		return formatDuration(estimatedSeconds * 1000);
	};

	const getElapsedTime = (job: UploadJob) => {
		const endTime = job.endTime || new Date();
		return formatDuration(endTime.getTime() - job.startTime.getTime());
	};

	if (jobs.length === 0) {
		return null;
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{jobs.map((job) => (
				<div key={job.id} className="card bg-base-100 shadow w-full">
					<div
						className="card-header p-6 cursor-pointer transition-colors hover:bg-base-200"
						onClick={() => toggleJobExpanded(job.id)}
					>
						<div className="flex w-full items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="avatar placeholder">
									<div className="bg-base-300 text-base-content rounded-full w-8 h-8">
										<span className="text-xs">{job.totalFiles}</span>
									</div>
								</div>
								<div>
									<h4 className="font-semibold">{job.name}</h4>
									<p className="text-base-content/50 text-sm">
										{job.completedFiles} of {job.totalFiles} files •{" "}
										{formatFileSize(job.totalSize)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<span className={`badge badge-sm ${
									getJobStatusColor(job.status) === "success" ? "badge-success" :
									getJobStatusColor(job.status) === "warning" ? "badge-warning" :
									getJobStatusColor(job.status) === "danger" ? "badge-error" :
									getJobStatusColor(job.status) === "primary" ? "badge-primary" :
									"badge-neutral"
								}`}>
									{job.status}
								</span>

								{/* Action Buttons */}
								<div className="flex gap-1">
									{job.status === "uploading" && onPause && (
										<button
											className="btn btn-sm btn-square btn-ghost"
											onClick={() => onPause(job.id)}
										>
											<X className="h-4 w-4" />
										</button>
									)}

									{job.status === "paused" && onResume && (
										<button
											className="btn btn-sm btn-square btn-ghost"
											onClick={() => onResume(job.id)}
										>
											<RefreshCw className="h-4 w-4" />
										</button>
									)}

									{(job.status === "failed" || job.failedFiles > 0) &&
										onRetry && (
											<button
												className="btn btn-sm btn-square btn-warning btn-outline"
												onClick={() => onRetry(job.id)}
											>
												<RefreshCw className="h-4 w-4" />
											</button>
										)}

									{(job.status === "completed" || job.status === "failed") &&
										onClear && (
											<button
												className="btn btn-sm btn-square btn-error btn-outline"
												onClick={() => onClear(job.id)}
											>
												<X className="h-4 w-4" />
											</button>
										)}
								</div>
							</div>
						</div>

						{/* Overall Progress */}
						<div className="mt-3 w-full">
							<div className="mb-2 flex justify-between text-base-content/50 text-sm">
								<span>{getJobProgress(job)}% complete</span>
								<div className="flex gap-4">
									{job.speed && job.status === "uploading" && (
										<span>{formatSpeed(job.speed)}</span>
									)}
									{job.status === "uploading" && getEstimatedTime(job) && (
										<span>{getEstimatedTime(job)} remaining</span>
									)}
									{(job.status === "completed" || job.status === "failed") && (
										<span>{getElapsedTime(job)} total</span>
									)}
								</div>
							</div>
							<progress 
								className={`progress progress-sm ${
									getJobStatusColor(job.status) === "success" ? "progress-success" :
									getJobStatusColor(job.status) === "warning" ? "progress-warning" :
									getJobStatusColor(job.status) === "danger" ? "progress-error" :
									getJobStatusColor(job.status) === "primary" ? "progress-primary" :
									"progress-neutral"
								}`} 
								value={getJobProgress(job)} 
								max={100}
							></progress>
						</div>
					</div>

					{/* Expanded File Details */}
					{expandedJobs.has(job.id) && (
						<div className="card-body pt-0">
							<div className="divider mb-4"></div>

							<div className="space-y-3">
								{job.files.map((file) => (
									<div
										key={file.id}
										className="flex items-center gap-3 rounded-lg bg-base-200 p-3"
									>
										{/* File Thumbnail/Icon */}
										<div className="flex-shrink-0">
											<div className="avatar">
												<div className="w-8 rounded-full">
													{file.thumbnailUrl ? (
														<img src={file.thumbnailUrl} alt={file.name} />
													) : (
														<div className="bg-base-200 text-base-content flex items-center justify-center h-full">
															<span className="text-xs">📄</span>
														</div>
													)}
												</div>
											</div>
										</div>

										{/* File Info */}
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-center gap-2">
												<p className="truncate font-medium text-sm">
													{file.name}
												</p>
												<div className="flex items-center gap-1">
													{getFileStatusIcon(file.status)}
													<span className="text-base-content/50 text-xs">
														{file.status}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-4 text-base-content/50 text-xs">
												<span>{formatFileSize(file.size)}</span>
												{file.status === "uploading" && (
													<span>{file.progress}%</span>
												)}
											</div>

											{/* File Progress */}
											{(file.status === "uploading" ||
												file.status === "processing") && (
												<progress 
													className="progress progress-primary mt-2"
													value={file.progress}
													max={100}
												></progress>
											)}

											{/* Error Message */}
											{file.status === "failed" && file.error && (
												<p className="mt-1 text-error text-xs">{file.error}</p>
											)}
										</div>

										{/* File Actions */}
										<div className="flex gap-1">
											{file.status === "completed" &&
												file.assetId &&
												onDownload && (
													<button
														className="btn btn-sm btn-square btn-ghost"
														onClick={() => onDownload(file.assetId!)}
													>
														<Download className="h-4 w-4" />
													</button>
												)}

											{file.status === "failed" && onRetry && (
												<button
													className="btn btn-sm btn-square btn-ghost"
													onClick={() => onRetry(job.id, file.id)}
												>
													<RefreshCw className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
								))}
							</div>

							{/* Job Summary */}
							<div className="divider my-4"></div>

							<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div>
									<p className="text-base-content/50">Total Files</p>
									<p className="font-semibold">{job.totalFiles}</p>
								</div>
								<div>
									<p className="text-base-content/50">Completed</p>
									<p className="font-semibold text-success">
										{job.completedFiles}
									</p>
								</div>
								<div>
									<p className="text-base-content/50">Failed</p>
									<p className="font-semibold text-error">{job.failedFiles}</p>
								</div>
								<div>
									<p className="text-base-content/50">Total Size</p>
									<p className="font-semibold">
										{formatFileSize(job.totalSize)}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
