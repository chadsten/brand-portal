"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Copy,
	Download,
	Edit,
	Eye,
	Image as ImageIcon,
	Palette,
	Plus,
	Ruler,
	Settings,
	Share2,
	Trash2,
	Type,
	Upload,
	Users,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "~/lib/utils";
import { api } from "~/trpc/react";
import { BrandGuidelineEditor } from "./BrandGuidelineEditor";
import { ColorPalette } from "./ColorPalette";
import { LogoSection } from "./LogoSection";
import { TypographySection } from "./TypographySection";

interface BrandGuideline {
	id: string;
	name: string;
	description?: string;
	version: string;
	primaryColors: string[];
	secondaryColors: string[];
	fonts: any[];
	logoVariations: any[];
	colorRules: any;
	typographyRules: any;
	logoRules: any;
	spacingRules: any;
	isActive: boolean;
	enforceCompliance: boolean;
	autoApproval: boolean;
	tags: string[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	approvedAt?: Date;
	creator?: {
		id: string;
		name: string;
		image?: string;
	};
	approver?: {
		id: string;
		name: string;
		image?: string;
	};
	_count?: {
		approvals: number;
		violations: number;
	};
}

export function BrandGuidelinesManager() {
	const [selectedGuideline, setSelectedGuideline] = useState<string | null>(
		null,
	);
	const [viewMode, setViewMode] = useState<"overview" | "editor">("overview");
	const [searchQuery, setSearchQuery] = useState("");

	// Modal controls
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	
	const onCreateOpen = () => setIsCreateOpen(true);
	const onCreateClose = () => setIsCreateOpen(false);
	const onDetailOpen = () => setIsDetailOpen(true);
	const onDetailClose = () => setIsDetailOpen(false);

	// API queries - TODO: Implement these endpoints
	const guidelines: BrandGuideline[] = []; // Placeholder
	const isLoading = false;

	const handleCreateGuideline = () => {
		onCreateOpen();
	};

	const handleEditGuideline = (guidelineId: string) => {
		setSelectedGuideline(guidelineId);
		setViewMode("editor");
		onDetailOpen();
	};

	const handleViewGuideline = (guidelineId: string) => {
		setSelectedGuideline(guidelineId);
		setViewMode("overview");
		onDetailOpen();
	};

	const handleDeleteGuideline = (guidelineId: string) => {
		if (confirm("Are you sure you want to delete this brand guideline?")) {
			console.log("Delete guideline:", guidelineId);
		}
	};

	const handleDuplicateGuideline = (guidelineId: string) => {
		console.log("Duplicate guideline:", guidelineId);
	};

	const handleExportGuideline = (guidelineId: string) => {
		console.log("Export guideline:", guidelineId);
	};

	const filteredGuidelines = guidelines.filter(
		(guideline) =>
			guideline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			guideline.description?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Brand Guidelines</h1>
					<p className="text-base-content/60 text-sm">
						Manage your organization's brand standards and compliance rules
					</p>
				</div>
				<div className="flex gap-2">
					<button className="btn btn-outline gap-2">
						<Upload size={16} />
						Import
					</button>
					<button
						className="btn btn-primary gap-2"
						onClick={handleCreateGuideline}
					>
						<Plus size={16} />
						Create Guideline
					</button>
				</div>
			</div>

			{/* Search and Stats */}
			<div className="card bg-base-100 shadow">
				<div className="card-body gap-4">
					<div className="relative max-w-md">
						<Eye size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
						<input
							className="input input-bordered w-full pl-10"
							placeholder="Search brand guidelines..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{/* Quick Stats */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div className="card bg-base-100 shadow border border-base-300">
							<div className="card-body space-y-2 p-4">
								<div className="flex items-center gap-2">
									<CheckCircle size={16} className="text-success" />
									<span className="font-medium text-sm">
										Active Guidelines
									</span>
								</div>
								<p className="font-bold text-2xl">
									{guidelines.filter((g) => g.isActive).length}
								</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow border border-base-300">
							<div className="card-body space-y-2 p-4">
								<div className="flex items-center gap-2">
									<Clock size={16} className="text-warning" />
									<span className="font-medium text-sm">
										Pending Approvals
									</span>
								</div>
								<p className="font-bold text-2xl">
									{guidelines.reduce(
										(sum, g) => sum + (g._count?.approvals || 0),
										0,
									)}
								</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow border border-base-300">
							<div className="card-body space-y-2 p-4">
								<div className="flex items-center gap-2">
									<AlertTriangle size={16} className="text-error" />
									<span className="font-medium text-sm">Violations</span>
								</div>
								<p className="font-bold text-2xl">
									{guidelines.reduce(
										(sum, g) => sum + (g._count?.violations || 0),
										0,
									)}
								</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow border border-base-300">
							<div className="card-body space-y-2 p-4">
								<div className="flex items-center gap-2">
									<Users size={16} className="text-primary" />
									<span className="font-medium text-sm">
										Compliance Rate
									</span>
								</div>
								<p className="font-bold text-2xl">95%</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Guidelines List */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : filteredGuidelines.length === 0 ? (
				<div className="card bg-base-100 shadow">
					<div className="card-body py-12 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
							<Palette size={24} className="text-base-content/40" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">
							No brand guidelines found
						</h3>
						<p className="mb-4 text-base-content/60 text-sm">
							{searchQuery
								? "Try adjusting your search terms"
								: "Create your first brand guideline to get started"}
						</p>
						<button className="btn btn-primary" onClick={handleCreateGuideline}>
							Create Guideline
						</button>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{filteredGuidelines.map((guideline) => (
						<div key={guideline.id} className="card bg-base-100 shadow group">
							<div className="card-header flex justify-between p-4">
								<div className="flex items-center gap-3">
									<div
										className="flex h-10 w-10 items-center justify-center rounded-lg"
										style={{
											background: guideline.primaryColors[0]
												? `linear-gradient(135deg, ${guideline.primaryColors[0]}, ${guideline.primaryColors[1] || guideline.primaryColors[0]})`
												: "linear-gradient(135deg, #6366f1, #8b5cf6)",
										}}
									>
										<Palette size={20} className="text-white" />
									</div>
									<div>
										<h3 className="font-semibold">{guideline.name}</h3>
										<p className="text-base-content/60 text-sm">
											v{guideline.version}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-1">
									{guideline.isActive && (
										<span className="badge badge-success badge-sm">
											Active
										</span>
									)}
									{guideline.enforceCompliance && (
										<span className="badge badge-warning badge-sm">
											Enforced
										</span>
									)}
								</div>
							</div>

							<div className="card-body space-y-4 p-4 pt-0">
								{guideline.description && (
									<p className="line-clamp-2 text-base-content/70 text-sm">
										{guideline.description}
									</p>
								)}

								{/* Quick Preview */}
								<div className="space-y-3">
									{/* Colors */}
									{guideline.primaryColors.length > 0 && (
										<div>
											<p className="mb-1 font-medium text-base-content/60 text-xs">
												Colors
											</p>
											<div className="flex gap-1">
												{guideline.primaryColors
													.slice(0, 5)
													.map((color, index) => (
														<div
															key={index}
															className="h-6 w-6 rounded border border-base-300"
															style={{ backgroundColor: color }}
														/>
													))}
												{guideline.primaryColors.length > 5 && (
													<div className="flex h-6 w-6 items-center justify-center rounded bg-base-200 text-xs">
														+{guideline.primaryColors.length - 5}
													</div>
												)}
											</div>
										</div>
									)}

									{/* Fonts */}
									{guideline.fonts.length > 0 && (
										<div>
											<p className="mb-1 font-medium text-base-content/60 text-xs">
												Typography
											</p>
											<div className="flex flex-wrap gap-1">
												{guideline.fonts.slice(0, 2).map((font: any, index) => (
													<span key={index} className="badge badge-neutral badge-sm">
														{font.name || font.family}
													</span>
												))}
												{guideline.fonts.length > 2 && (
													<span className="badge badge-neutral badge-sm">
														+{guideline.fonts.length - 2}
													</span>
												)}
											</div>
										</div>
									)}
								</div>

								{/* Stats */}
								<div className="flex items-center justify-between text-base-content/60 text-sm">
									<div className="flex items-center gap-4">
										<span>{guideline._count?.approvals || 0} approvals</span>
										<span>{guideline._count?.violations || 0} violations</span>
									</div>
									<span>
										{formatDistanceToNow(new Date(guideline.updatedAt))} ago
									</span>
								</div>

								{/* Creator */}
								<div className="flex items-center gap-2">
									<div className="avatar">
										<div className="w-6 h-6 rounded-full">
											{guideline.creator?.image ? (
												<img src={guideline.creator.image} alt={guideline.creator.name} />
											) : (
												<div className="bg-base-300 flex items-center justify-center h-full w-full rounded-full">
													<span className="text-xs font-medium">
														{guideline.creator?.name?.charAt(0)?.toUpperCase()}
													</span>
												</div>
											)}
										</div>
									</div>
									<span className="text-base-content/60 text-sm">
										{guideline.creator?.name}
									</span>
									{guideline.approvedAt && (
										<span className="badge badge-success badge-sm">
											Approved
										</span>
									)}
								</div>

								{/* Actions */}
								<div className="flex gap-2">
									<button
										className="btn btn-sm btn-outline gap-2"
										onClick={() => handleViewGuideline(guideline.id)}
									>
										<Eye size={14} />
										View
									</button>
									<button
										className="btn btn-sm btn-outline gap-2"
										onClick={() => handleEditGuideline(guideline.id)}
									>
										<Edit size={14} />
										Edit
									</button>
									<button
										className="btn btn-sm btn-outline"
										onClick={() => handleDuplicateGuideline(guideline.id)}
									>
										<Copy size={14} />
									</button>
									<button
										className="btn btn-sm btn-outline"
										onClick={() => handleExportGuideline(guideline.id)}
									>
										<Download size={14} />
									</button>
									<button
										className="btn btn-sm btn-outline btn-error"
										onClick={() => handleDeleteGuideline(guideline.id)}
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create Modal */}
			<dialog className={`modal ${isCreateOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-2xl">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-bold text-lg">Create Brand Guideline</h3>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onCreateClose}>✕</button>
					</div>
					<div className="modal-body">
						<BrandGuidelineEditor
							onSave={(data) => {
								console.log("Create guideline:", data);
								onCreateClose();
							}}
							onCancel={onCreateClose}
						/>
					</div>
				</div>
				<div className="modal-backdrop" onClick={onCreateClose}></div>
			</dialog>

			{/* Detail Modal */}
			{selectedGuideline && (
				<dialog className={`modal ${isDetailOpen ? 'modal-open' : ''}`}>
					<div className="modal-box w-11/12 max-w-5xl h-5/6 overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">
								{viewMode === "editor" ? "Edit" : "View"} Brand Guideline
							</h3>
							<button className="btn btn-sm btn-circle btn-ghost" onClick={onDetailClose}>✕</button>
						</div>
						<div className="modal-body">
							{viewMode === "editor" ? (
								<BrandGuidelineEditor
									guidelineId={selectedGuideline}
									onSave={(data) => {
										console.log("Update guideline:", data);
										onDetailClose();
									}}
									onCancel={onDetailClose}
								/>
							) : (
								<div className="space-y-6">
									<p>Brand guideline overview - implement detailed view</p>
								</div>
							)}
						</div>
					</div>
					<div className="modal-backdrop" onClick={onDetailClose}></div>
				</dialog>
			)}
		</div>
	);
}
