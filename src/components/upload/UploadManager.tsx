"use client";

// Import removed - using native HTML and DaisyUI classes
import { List, Settings, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import FileDropzone, { type UploadFile } from "./FileDropzone";
import UploadProgress, {
	type UploadFileProgress,
	type UploadJob,
} from "./UploadProgress";

interface UploadManagerProps {
	onUploadComplete?: (files: UploadFile[]) => void;
	maxFiles?: number;
	maxSize?: number;
	acceptedFileTypes?: string[];
	className?: string;
}

export default function UploadManager({
	onUploadComplete,
	maxFiles = 50,
	maxSize = 100 * 1024 * 1024, // 100MB
	acceptedFileTypes,
	className = "",
}: UploadManagerProps) {
	const [activeTab, setActiveTab] = useState<string>("upload");
	const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
	const [isMinimized, setIsMinimized] = useState(false);

	// tRPC mutations for job management
	const cancelUpload = api.upload.cancelUpload.useMutation();
	const downloadAsset = api.download.generateUrl.useMutation();

	// Convert uploaded files to upload job
	const handleUploadProgress = useCallback((files: UploadFile[]) => {
		if (files.length === 0) return;

		const jobId = crypto.randomUUID();
		const jobName =
			files.length === 1 ? files[0]!.name : `${files.length} files`;

		const uploadFiles: UploadFileProgress[] = files.map((file) => ({
			id: file.id,
			name: file.name,
			size: file.size,
			uploadedSize:
				file.status === "completed"
					? file.size
					: Math.round(file.size * (file.progress / 100)),
			status: file.status as UploadFileProgress["status"],
			progress: file.progress,
			error: file.error,
			assetId: file.assetId,
			thumbnailUrl: file.preview,
		}));

		const totalSize = files.reduce((sum, file) => sum + file.size, 0);
		const uploadedSize = uploadFiles.reduce(
			(sum, file) => sum + file.uploadedSize,
			0,
		);
		const completedFiles = files.filter((f) => f.status === "completed").length;
		const failedFiles = files.filter((f) => f.status === "error").length;

		const jobStatus: UploadJob["status"] =
			failedFiles === files.length
				? "failed"
				: completedFiles === files.length
					? "completed"
					: files.some(
								(f) => f.status === "uploading" || f.status === "processing",
							)
						? "uploading"
						: "pending";

		const newJob: UploadJob = {
			id: jobId,
			name: jobName,
			totalFiles: files.length,
			completedFiles,
			failedFiles,
			totalSize,
			uploadedSize,
			status: jobStatus,
			startTime: new Date(),
			endTime:
				jobStatus === "completed" || jobStatus === "failed"
					? new Date()
					: undefined,
			files: uploadFiles,
		};

		setUploadJobs((prev) => {
			const existingIndex = prev.findIndex((job) =>
				job.files.some((f) => files.some((newFile) => newFile.id === f.id)),
			);

			if (existingIndex >= 0) {
				const updated = [...prev];
				updated[existingIndex] = newJob;
				return updated;
			} else {
				return [newJob, ...prev];
			}
		});

		// Auto-switch to progress tab when uploads start
		if (
			files.some((f) => f.status === "uploading" || f.status === "processing")
		) {
			setActiveTab("progress");
		}
	}, []);

	const handleUploadComplete = useCallback(
		(files: UploadFile[]) => {
			handleUploadProgress(files);
			onUploadComplete?.(files);
		},
		[handleUploadProgress, onUploadComplete],
	);

	const handleRetry = async (jobId: string, fileId?: string) => {
		try {
			const job = uploadJobs.find((j) => j.id === jobId);
			if (!job) return;

			// For now, just reset the status to pending
			// In a real implementation, you'd restart the upload process
			if (fileId) {
				setUploadJobs((prev) =>
					prev.map((j) =>
						j.id === jobId
							? {
									...j,
									files: j.files.map((f) =>
										f.id === fileId
											? { ...f, status: "pending" as const, progress: 0 }
											: f,
									),
								}
							: j,
					),
				);
			} else {
				setUploadJobs((prev) =>
					prev.map((j) =>
						j.id === jobId
							? {
									...j,
									status: "pending" as const,
									files: j.files.map((f) =>
										f.status === "failed"
											? { ...f, status: "pending" as const, progress: 0 }
											: f,
									),
								}
							: j,
					),
				);
			}
		} catch (error) {
			console.error("Retry failed:", error);
		}
	};

	const handleCancel = async (jobId: string) => {
		try {
			const job = uploadJobs.find((j) => j.id === jobId);
			if (!job) return;

			// Cancel all active uploads in the job
			const activeFiles = job.files.filter(
				(f) =>
					f.status === "uploading" ||
					f.status === "processing" ||
					f.status === "pending",
			);

			for (const file of activeFiles) {
				await cancelUpload.mutateAsync({ sessionId: file.id });
			}

			// Update job status
			setUploadJobs((prev) =>
				prev.map((j) =>
					j.id === jobId ? { ...j, status: "failed" as const } : j,
				),
			);
		} catch (error) {
			console.error("Cancel failed:", error);
		}
	};

	const handlePause = async (jobId: string) => {
		// Implement pause logic
		setUploadJobs((prev) =>
			prev.map((j) =>
				j.id === jobId ? { ...j, status: "paused" as const } : j,
			),
		);
	};

	const handleResume = async (jobId: string) => {
		// Implement resume logic
		setUploadJobs((prev) =>
			prev.map((j) =>
				j.id === jobId ? { ...j, status: "uploading" as const } : j,
			),
		);
	};

	const handleClear = (jobId: string) => {
		setUploadJobs((prev) => prev.filter((j) => j.id !== jobId));
	};

	const handleDownload = async (assetId: string) => {
		try {
			const result = await downloadAsset.mutateAsync({
				assetId,
				format: "original",
			});

			if (result.success && result.downloadUrl) {
				// Open download URL in new tab
				window.open(result.downloadUrl, "_blank");
			}
		} catch (error) {
			console.error("Download failed:", error);
		}
	};

	const clearCompletedJobs = () => {
		setUploadJobs((prev) =>
			prev.filter(
				(job) => job.status !== "completed" && job.status !== "failed",
			),
		);
	};

	const activeUploads = uploadJobs.filter(
		(job) => job.status === "uploading" || job.status === "processing",
	).length;

	const completedJobs = uploadJobs.filter(
		(job) => job.status === "completed",
	).length;
	const failedJobs = uploadJobs.filter((job) => job.status === "failed").length;

	if (isMinimized) {
		return (
			<div
				className={`card bg-base-100 shadow-lg fixed right-4 bottom-4 z-50 w-80 ${className}`}
			>
				<div className="card-body p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							<span className="font-semibold">Upload Manager</span>
							{activeUploads > 0 && (
								<span className="badge badge-primary">{activeUploads}</span>
							)}
						</div>
						<button
							className="btn btn-ghost btn-sm btn-square"
							onClick={() => setIsMinimized(false)}
						>
							<Upload className="h-4 w-4" />
						</button>
					</div>

					{activeUploads > 0 && (
						<div className="mt-2">
							<p className="text-base-content/60 text-sm">
								{activeUploads} active upload{activeUploads !== 1 ? "s" : ""}
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={`card bg-base-100 shadow mx-auto w-full max-w-4xl ${className}`}>
			<div className="card-header p-6 flex items-center justify-between border-b border-base-300">
				<h3 className="font-bold text-xl">Upload Manager</h3>
				<div className="flex items-center gap-2">
					{(completedJobs > 0 || failedJobs > 0) && (
						<button className="btn btn-outline btn-sm" onClick={clearCompletedJobs}>
							Clear Completed
						</button>
					)}
					<button
						className="btn btn-ghost btn-sm btn-square"
						onClick={() => setIsMinimized(true)}
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="card-body">
				<div role="tablist" className="tabs tabs-lifted">
					<input
						type="radio"
						name="upload_tabs"
						role="tab"
						className="tab"
						aria-label="Upload Files"
						checked={activeTab === "upload"}
						onChange={() => setActiveTab("upload")}
					/>
					<div role="tabpanel" className="tab-content p-6">
						<div className="flex items-center gap-2 mb-4">
							<Upload className="h-4 w-4" />
							<span className="font-medium">Upload Files</span>
						</div>
						<FileDropzone
							onUploadComplete={handleUploadComplete}
							onUploadProgress={handleUploadProgress}
							maxFiles={maxFiles}
							maxSize={maxSize}
							acceptedFileTypes={acceptedFileTypes}
						/>
					</div>

					<input
						type="radio"
						name="upload_tabs"
						role="tab"
						className="tab"
						aria-label="Progress"
						checked={activeTab === "progress"}
						onChange={() => setActiveTab("progress")}
					/>
					<div role="tabpanel" className="tab-content p-6">
						<div className="flex items-center gap-2 mb-4">
							<List className="h-4 w-4" />
							<span className="font-medium">Progress</span>
							{uploadJobs.length > 0 && (
								<span
									className={`badge badge-sm ${
										activeUploads > 0 ? "badge-primary" : "badge-outline"
									}`}
								>
									{uploadJobs.length}
								</span>
							)}
						</div>
						{uploadJobs.length > 0 ? (
							<UploadProgress
								jobs={uploadJobs}
								onRetry={handleRetry}
								onCancel={handleCancel}
								onPause={handlePause}
								onResume={handleResume}
								onClear={handleClear}
								onDownload={handleDownload}
							/>
						) : (
							<div className="py-12 text-center text-base-content/60">
								<List className="mx-auto mb-4 h-12 w-12 opacity-50" />
								<p>No upload jobs yet</p>
								<p className="text-sm">
									Upload some files to see progress here
							</p>
							</div>
						)}
					</div>

					<input
						type="radio"
						name="upload_tabs"
						role="tab"
						className="tab"
						aria-label="Settings"
						checked={activeTab === "settings"}
						onChange={() => setActiveTab("settings")}
					/>
					<div role="tabpanel" className="tab-content p-6">
						<div className="flex items-center gap-2 mb-4">
							<Settings className="h-4 w-4" />
							<span className="font-medium">Settings</span>
						</div>
						<div className="space-y-6">
							<div>
								<h4 className="mb-2 font-semibold">Upload Limits</h4>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-base-content/60">Max Files</p>
										<p className="font-medium">{maxFiles} files</p>
									</div>
									<div>
										<p className="text-base-content/60">Max File Size</p>
										<p className="font-medium">
											{Math.round(maxSize / (1024 * 1024))} MB
										</p>
									</div>
								</div>
							</div>

							<div>
								<h4 className="mb-2 font-semibold">Supported Formats</h4>
								<div className="flex flex-wrap gap-2">
									{acceptedFileTypes?.map((type) => (
										<span key={type} className="badge badge-outline badge-sm">
											{type}
										</span>
									)) || (
										<>
											<span className="badge badge-outline badge-sm">
												Images
											</span>
											<span className="badge badge-outline badge-sm">
												Videos
											</span>
											<span className="badge badge-outline badge-sm">
												Documents
											</span>
											<span className="badge badge-outline badge-sm">
												PDFs
											</span>
										</>
									)}
								</div>
							</div>

							<div>
								<h4 className="mb-2 font-semibold">Statistics</h4>
								<div className="grid grid-cols-3 gap-4 text-sm">
									<div>
										<p className="text-base-content/60">Total Jobs</p>
										<p className="font-medium">{uploadJobs.length}</p>
									</div>
									<div>
										<p className="text-base-content/60">Completed</p>
										<p className="font-medium text-success">{completedJobs}</p>
									</div>
									<div>
										<p className="text-base-content/60">Failed</p>
										<p className="font-medium text-error">{failedJobs}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
