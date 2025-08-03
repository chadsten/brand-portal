"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	AlertCircle,
	Brain,
	Check,
	Clock,
	Download,
	Eye,
	FileText,
	Image as ImageIcon,
	Info,
	Music,
	Palette,
	Pause,
	Play,
	RefreshCw,
	Settings,
	Sparkles,
	Star,
	Tag,
	Target,
	TrendingUp,
	Upload,
	Video,
	X,
	Zap,
} from "lucide-react";
import { useState } from "react";

interface AssetTag {
	id: string;
	name: string;
	category: "object" | "color" | "style" | "mood" | "brand" | "technical";
	confidence: number;
	source: "ai" | "manual" | "auto";
	verified: boolean;
	createdAt: Date;
}

interface AssetAnalysis {
	id: string;
	name: string;
	type: "image" | "video" | "audio" | "document";
	url: string;
	analysis: {
		objects: string[];
		colors: string[];
		styles: string[];
		moods: string[];
		text: string[];
		faces: number;
		quality: number;
		composition: string;
		brand_elements: string[];
	};
	tags: AssetTag[];
	processing: {
		status: "pending" | "processing" | "completed" | "failed";
		progress: number;
		startTime?: Date;
		endTime?: Date;
		error?: string;
	};
	metadata: {
		size: string;
		dimensions?: string;
		duration?: string;
		format: string;
	};
}

interface AssetTaggingProps {
	assets?: AssetAnalysis[];
	onTagAssets?: (assetIds: string[]) => void;
	onApproveTag?: (assetId: string, tagId: string) => void;
	onRejectTag?: (assetId: string, tagId: string) => void;
	onUpdateSettings?: (settings: any) => void;
}

const MOCK_ASSETS: AssetAnalysis[] = [
	{
		id: "1",
		name: "Brand Logo Primary",
		type: "image",
		url: "/placeholder-1.jpg",
		analysis: {
			objects: ["logo", "text", "symbol"],
			colors: ["blue", "white", "gray"],
			styles: ["modern", "minimalist", "professional"],
			moods: ["confident", "trustworthy", "clean"],
			text: ["BRAND", "Company"],
			faces: 0,
			quality: 95,
			composition: "centered",
			brand_elements: ["primary_logo", "brand_colors"],
		},
		tags: [
			{
				id: "1",
				name: "logo",
				category: "brand",
				confidence: 98,
				source: "ai",
				verified: true,
				createdAt: new Date(),
			},
			{
				id: "2",
				name: "blue",
				category: "color",
				confidence: 95,
				source: "ai",
				verified: false,
				createdAt: new Date(),
			},
			{
				id: "3",
				name: "professional",
				category: "style",
				confidence: 92,
				source: "ai",
				verified: false,
				createdAt: new Date(),
			},
		],
		processing: {
			status: "completed",
			progress: 100,
			startTime: new Date(Date.now() - 120000),
			endTime: new Date(Date.now() - 60000),
		},
		metadata: {
			size: "2.4 MB",
			dimensions: "1920x1080",
			format: "PNG",
		},
	},
	{
		id: "2",
		name: "Product Photography",
		type: "image",
		url: "/placeholder-2.jpg",
		analysis: {
			objects: ["product", "background", "lighting"],
			colors: ["white", "silver", "black"],
			styles: ["commercial", "clean", "studio"],
			moods: ["premium", "elegant", "sophisticated"],
			text: [],
			faces: 0,
			quality: 88,
			composition: "rule_of_thirds",
			brand_elements: ["product_shot", "brand_style"],
		},
		tags: [
			{
				id: "4",
				name: "product",
				category: "object",
				confidence: 96,
				source: "ai",
				verified: false,
				createdAt: new Date(),
			},
			{
				id: "5",
				name: "premium",
				category: "mood",
				confidence: 89,
				source: "ai",
				verified: false,
				createdAt: new Date(),
			},
		],
		processing: {
			status: "processing",
			progress: 75,
			startTime: new Date(Date.now() - 30000),
		},
		metadata: {
			size: "8.1 MB",
			dimensions: "3840x2160",
			format: "JPEG",
		},
	},
	{
		id: "3",
		name: "Marketing Video",
		type: "video",
		url: "/placeholder-3.mp4",
		analysis: {
			objects: ["people", "products", "text_overlay"],
			colors: ["blue", "white", "orange"],
			styles: ["dynamic", "engaging", "corporate"],
			moods: ["energetic", "inspiring", "professional"],
			text: ["Innovation", "Quality", "Future"],
			faces: 3,
			quality: 91,
			composition: "dynamic",
			brand_elements: ["brand_colors", "logo_animation"],
		},
		tags: [
			{
				id: "6",
				name: "marketing",
				category: "brand",
				confidence: 94,
				source: "ai",
				verified: true,
				createdAt: new Date(),
			},
			{
				id: "7",
				name: "energetic",
				category: "mood",
				confidence: 87,
				source: "ai",
				verified: false,
				createdAt: new Date(),
			},
		],
		processing: {
			status: "completed",
			progress: 100,
			startTime: new Date(Date.now() - 300000),
			endTime: new Date(Date.now() - 180000),
		},
		metadata: {
			size: "124 MB",
			duration: "2:34",
			format: "MP4",
		},
	},
];

const TAG_CATEGORIES = [
	{
		value: "object",
		label: "Objects",
		icon: <Eye size={16} />,
		color: "primary",
	},
	{
		value: "color",
		label: "Colors",
		icon: <Palette size={16} />,
		color: "secondary",
	},
	{
		value: "style",
		label: "Styles",
		icon: <Sparkles size={16} />,
		color: "success",
	},
	{ value: "mood", label: "Moods", icon: <Star size={16} />, color: "warning" },
	{ value: "brand", label: "Brand", icon: <Tag size={16} />, color: "danger" },
	{
		value: "technical",
		label: "Technical",
		icon: <Settings size={16} />,
		color: "default",
	},
];

export function AssetTagging({
	assets = MOCK_ASSETS,
	onTagAssets,
	onApproveTag,
	onRejectTag,
	onUpdateSettings,
}: AssetTaggingProps) {
	const [selectedTab, setSelectedTab] = useState("queue");
	const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
	const [processingAssets, setProcessingAssets] = useState<string[]>([]);
	const [selectedAsset, setSelectedAsset] = useState<AssetAnalysis | null>(
		null,
	);
	const [aiSettings, setAiSettings] = useState({
		confidenceThreshold: 80,
		autoApprove: false,
		enableObjects: true,
		enableColors: true,
		enableStyles: true,
		enableMoods: true,
		enableBrand: true,
		enableTechnical: false,
	});

	const {
		isOpen: isDetailModalOpen,
		onOpen: onDetailModalOpen,
		onClose: onDetailModalClose,
	} = useModal();

	const {
		isOpen: isSettingsModalOpen,
		onOpen: onSettingsModalOpen,
		onClose: onSettingsModalClose,
	} = useModal();

	const handleBulkTagging = () => {
		if (selectedAssets.length === 0) return;

		setProcessingAssets(selectedAssets);
		onTagAssets?.(selectedAssets);

		// Simulate processing
		setTimeout(() => {
			setProcessingAssets([]);
			setSelectedAssets([]);
		}, 3000);
	};

	const handleApproveTag = (assetId: string, tagId: string) => {
		onApproveTag?.(assetId, tagId);
	};

	const handleRejectTag = (assetId: string, tagId: string) => {
		onRejectTag?.(assetId, tagId);
	};

	const getFileIcon = (type: string) => {
		switch (type) {
			case "image":
				return <ImageIcon size={16} className="text-primary" />;
			case "video":
				return <Video size={16} className="text-success" />;
			case "audio":
				return <Music size={16} className="text-warning" />;
			case "document":
				return <FileText size={16} className="text-secondary" />;
			default:
				return <FileText size={16} className="text-default-400" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "success";
			case "processing":
				return "warning";
			case "failed":
				return "danger";
			case "pending":
				return "default";
			default:
				return "default";
		}
	};

	const getCategoryColor = (
		category: string,
	): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
		const cat = TAG_CATEGORIES.find((c) => c.value === category);
		return (
			(cat?.color as
				| "default"
				| "primary"
				| "secondary"
				| "success"
				| "warning"
				| "danger") || "default"
		);
	};

	const renderAssetCard = (asset: AssetAnalysis) => (
		<div
			key={asset.id}
			className={`card bg-base-100 shadow cursor-pointer transition-all hover:shadow-lg ${
				selectedAssets.includes(asset.id) ? "ring-2 ring-primary" : ""
			}`}
			onClick={() => {
				setSelectedAsset(asset);
				onDetailModalOpen();
			}}
		>
			<div className="card-header p-4 pb-2">
				<div className="flex w-full items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="relative">
							{getFileIcon(asset.type)}
							<span
								className={`badge badge-sm absolute -top-1 -right-1 ${
									getStatusColor(asset.processing.status) === "success" ? "badge-success" :
									getStatusColor(asset.processing.status) === "warning" ? "badge-warning" :
									getStatusColor(asset.processing.status) === "danger" ? "badge-error" :
									"badge-outline"
								}`}
							>
								{asset.processing.status}
							</span>
						</div>
						<div>
							<h4 className="font-medium">{asset.name}</h4>
							<p className="text-base-content/60 text-sm">
								{asset.metadata.format} • {asset.metadata.size}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="badge badge-primary badge-sm">
							{asset.tags.length} tags
						</span>
						<input
							type="checkbox"
							className="toggle toggle-sm toggle-primary"
							checked={selectedAssets.includes(asset.id)}
							onChange={(e) => {
								if (e.target.checked) {
									setSelectedAssets([...selectedAssets, asset.id]);
								} else {
									setSelectedAssets(
										selectedAssets.filter((id) => id !== asset.id),
									);
								}
							}}
						/>
					</div>
				</div>
			</div>
			<div className="card-body pt-0">
				<div className="space-y-3">
					{asset.processing.status === "processing" && (
						<div>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-sm">Processing...</span>
								<span className="text-sm">{asset.processing.progress}%</span>
							</div>
							<progress
								className="progress progress-primary w-full"
								value={asset.processing.progress}
								max={100}
							></progress>
						</div>
					)}

					{asset.processing.status === "completed" && (
						<div>
							<p className="mb-2 text-base-content/60 text-sm">Generated Tags</p>
							<div className="flex flex-wrap gap-1">
								{asset.tags.slice(0, 3).map((tag) => (
									<span
										key={tag.id}
										className={`badge badge-sm gap-1 ${
											getCategoryColor(tag.category) === "primary" ? "badge-primary" :
											getCategoryColor(tag.category) === "secondary" ? "badge-secondary" :
											getCategoryColor(tag.category) === "success" ? "badge-success" :
											getCategoryColor(tag.category) === "warning" ? "badge-warning" :
											getCategoryColor(tag.category) === "danger" ? "badge-error" :
											"badge-outline"
										}`}
									>
										{tag.name}
										{tag.verified ? (
											<Check size={10} className="text-success" />
										) : (
											<Clock size={10} className="text-warning" />
										)}
									</span>
								))}
								{asset.tags.length > 3 && (
									<span className="badge badge-sm badge-outline">
										+{asset.tags.length - 3} more
									</span>
								)}
							</div>
						</div>
					)}

					{asset.processing.status === "failed" && (
						<div className="flex items-center gap-2 text-error">
							<AlertCircle size={16} />
							<span className="text-sm">Processing failed</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	const renderAssetDetail = () => {
		if (!selectedAsset) return null;

		return (
			<dialog className={`modal ${isDetailModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-4xl">
					<div className="modal-header flex justify-between items-center mb-4">
						<div className="flex items-center gap-3">
							{getFileIcon(selectedAsset.type)}
							<div>
								<h3 className="font-semibold text-lg">{selectedAsset.name}</h3>
								<p className="text-base-content/60 text-sm">
									{selectedAsset.metadata.format} •{" "}
									{selectedAsset.metadata.size}
								</p>
							</div>
						</div>
					</div>
					<div className="modal-body">
						<div className="space-y-6">
							{/* AI Analysis Results */}
							<div className="card bg-base-100 shadow">
								<div className="card-header p-4 pb-2">
									<div className="flex items-center gap-2">
										<Brain size={20} className="text-primary" />
										<h4 className="font-semibold">AI Analysis</h4>
									</div>
								</div>
								<div className="card-body">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<p className="mb-2 text-base-content/60 text-sm">
												Objects Detected
											</p>
											<div className="flex flex-wrap gap-1">
												{selectedAsset.analysis.objects.map((obj, index) => (
													<span
														key={index}
														className="badge badge-primary badge-sm"
													>
														{obj}
													</span>
												))}
											</div>
										</div>
										<div>
											<p className="mb-2 text-base-content/60 text-sm">Colors</p>
											<div className="flex flex-wrap gap-1">
												{selectedAsset.analysis.colors.map((color, index) => (
													<span
														key={index}
														className="badge badge-secondary badge-sm"
													>
														{color}
													</span>
												))}
											</div>
										</div>
										<div>
											<p className="mb-2 text-base-content/60 text-sm">Styles</p>
											<div className="flex flex-wrap gap-1">
												{selectedAsset.analysis.styles.map((style, index) => (
													<span
														key={index}
														className="badge badge-success badge-sm"
													>
														{style}
													</span>
												))}
											</div>
										</div>
										<div>
											<p className="mb-2 text-base-content/60 text-sm">Moods</p>
											<div className="flex flex-wrap gap-1">
												{selectedAsset.analysis.moods.map((mood, index) => (
													<span
														key={index}
														className="badge badge-warning badge-sm"
													>
														{mood}
													</span>
												))}
											</div>
										</div>
									</div>
									<div className="divider my-4"></div>
									<div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
										<div>
											<p className="font-bold text-2xl text-primary">
												{selectedAsset.analysis.quality}%
											</p>
											<p className="text-base-content/60 text-sm">
												Quality Score
											</p>
										</div>
										<div>
											<p className="font-bold text-2xl text-success">
												{selectedAsset.analysis.faces}
											</p>
											<p className="text-base-content/60 text-sm">
												Faces Detected
											</p>
										</div>
										<div>
											<p className="font-bold text-2xl text-warning">
												{selectedAsset.analysis.composition}
											</p>
											<p className="text-base-content/60 text-sm">Composition</p>
										</div>
									</div>
								</div>
							</div>

							{/* Generated Tags */}
							<div className="card bg-base-100 shadow">
								<div className="card-header p-4 pb-2">
									<div className="flex w-full items-center justify-between">
										<div className="flex items-center gap-2">
											<Tag size={20} className="text-success" />
											<h4 className="font-semibold">Generated Tags</h4>
										</div>
										<span className="badge badge-primary badge-sm">
											{selectedAsset.tags.length} tags
										</span>
									</div>
								</div>
								<div className="card-body">
									<div className="space-y-4">
										{selectedAsset.tags.map((tag) => (
											<div
												key={tag.id}
												className="flex items-center justify-between rounded-lg bg-default-50 p-3"
											>
												<div className="flex items-center gap-3">
													<span
														className={`badge badge-sm ${
															getCategoryColor(tag.category) === "primary" ? "badge-primary" :
															getCategoryColor(tag.category) === "secondary" ? "badge-secondary" :
															getCategoryColor(tag.category) === "success" ? "badge-success" :
															getCategoryColor(tag.category) === "warning" ? "badge-warning" :
															getCategoryColor(tag.category) === "danger" ? "badge-error" :
															"badge-outline"
														}`}
													>
														{tag.name}
													</span>
													<div className="flex items-center gap-2">
														<progress
															className="progress progress-primary w-20"
															value={tag.confidence}
															max={100}
														></progress>
														<span className="text-base-content/60 text-sm">
															{tag.confidence}%
														</span>
													</div>
													<span
														className={`badge badge-sm ${
															tag.source === "ai" ? "badge-primary" : "badge-secondary"
														}`}
													>
														{tag.source}
													</span>
												</div>
												<div className="flex items-center gap-2">
													{tag.verified ? (
														<span className="badge badge-success badge-sm">
															Verified
														</span>
													) : (
														<div className="flex items-center gap-1">
															<div className="tooltip" data-tip="Approve tag">
																<button
																	className="btn btn-sm btn-square btn-success btn-outline"
																	onClick={() =>
																		handleApproveTag(selectedAsset.id, tag.id)
																	}
																>
																	<Check size={14} />
																</button>
															</div>
															<div className="tooltip" data-tip="Reject tag">
																<button
																	className="btn btn-sm btn-square btn-error btn-outline"
																	onClick={() =>
																		handleRejectTag(selectedAsset.id, tag.id)
																	}
																>
																	<X size={14} />
																</button>
															</div>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onDetailModalClose}>
							Close
						</button>
						<button className="btn btn-primary gap-2">
							<Download size={16} />
							Export Tags
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onDetailModalClose}>close</button>
				</form>
			</dialog>
		);
	};

	const renderSettingsModal = () => (
		<dialog className={`modal ${isSettingsModalOpen ? 'modal-open' : ''}`}>
			<div className="modal-box w-11/12 max-w-2xl">
				<div className="modal-header mb-4">
					<h3 className="font-semibold text-lg">AI Tagging Settings</h3>
				</div>
				<div className="modal-body">
					<div className="space-y-6">
						<div>
							<h4 className="mb-4 font-semibold">Confidence Threshold</h4>
							<div className="space-y-2">
								<input
									type="range"
									className="range range-primary w-full"
									value={aiSettings.confidenceThreshold}
									onChange={(e) =>
										setAiSettings({
											...aiSettings,
											confidenceThreshold: Number(e.target.value),
										})
									}
									min={50}
									max={100}
									step={5}
								/>
								<div className="flex justify-between text-base-content/60 text-sm">
									<span>50%</span>
									<span>Current: {aiSettings.confidenceThreshold}%</span>
									<span>100%</span>
								</div>
							</div>
						</div>

						<div>
							<h4 className="mb-4 font-semibold">Auto-Approval</h4>
							<label className="label cursor-pointer justify-start gap-2">
								<input
									type="checkbox"
									className="toggle toggle-primary"
									checked={aiSettings.autoApprove}
									onChange={(e) =>
										setAiSettings({
											...aiSettings,
											autoApprove: e.target.checked,
										})
									}
								/>
								<span className="label-text">Automatically approve high-confidence tags</span>
							</label>
						</div>

						<div>
							<h4 className="mb-4 font-semibold">Tag Categories</h4>
							<div className="space-y-3">
								{TAG_CATEGORIES.map((category) => (
									<div
										key={category.value}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											{category.icon}
											<span>{category.label}</span>
										</div>
										<input
											type="checkbox"
											className="toggle toggle-sm toggle-primary"
											checked={
												aiSettings[
													`enable${category.label}` as keyof typeof aiSettings
												] as boolean
											}
											onChange={(e) =>
												setAiSettings({
													...aiSettings,
													[`enable${category.label}`]: e.target.checked,
												})
											}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onSettingsModalClose}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						onClick={() => {
							onUpdateSettings?.(aiSettings);
							onSettingsModalClose();
						}}
					>
						Save Settings
					</button>
				</div>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onSettingsModalClose}>close</button>
			</form>
		</dialog>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-xl">
						<Brain size={24} className="text-primary" />
						AI Asset Tagging
					</h2>
					<p className="text-base-content/60 text-sm">
						Automatically generate and manage asset tags using AI
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="btn btn-outline gap-2"
						onClick={onSettingsModalOpen}
					>
						<Settings size={16} />
						Settings
					</button>
					<button
						className={`btn btn-primary gap-2 ${
							selectedAssets.length === 0 ? 'btn-disabled' : ''
						} ${processingAssets.length > 0 ? 'loading' : ''}`}
						onClick={handleBulkTagging}
						disabled={selectedAssets.length === 0}
					>
						{processingAssets.length === 0 && <Zap size={16} />}
						Tag Selected ({selectedAssets.length})
					</button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Upload size={24} className="mx-auto mb-2 text-primary" />
						<p className="font-bold text-2xl">{assets.length}</p>
						<p className="text-base-content/60 text-sm">Total Assets</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<RefreshCw size={24} className="mx-auto mb-2 text-warning" />
						<p className="font-bold text-2xl">
							{
								assets.filter((a) => a.processing.status === "processing")
									.length
							}
						</p>
						<p className="text-base-content/60 text-sm">Processing</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Check size={24} className="mx-auto mb-2 text-success" />
						<p className="font-bold text-2xl">
							{assets.filter((a) => a.processing.status === "completed").length}
						</p>
						<p className="text-base-content/60 text-sm">Completed</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Target size={24} className="mx-auto mb-2 text-secondary" />
						<p className="font-bold text-2xl">
							{Math.round(
								assets.reduce((sum, a) => sum + a.tags.length, 0) /
									assets.length,
							)}
						</p>
						<p className="text-base-content/60 text-sm">Avg Tags</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="w-full">
				<div className="tabs tabs-boxed mb-4">
					<button 
						className={`tab ${selectedTab === 'queue' ? 'tab-active' : ''}`}
						onClick={() => setSelectedTab('queue')}
					>
						Processing Queue
					</button>
					<button 
						className={`tab ${selectedTab === 'results' ? 'tab-active' : ''}`}
						onClick={() => setSelectedTab('results')}
					>
						Results
					</button>
					<button 
						className={`tab ${selectedTab === 'training' ? 'tab-active' : ''}`}
						onClick={() => setSelectedTab('training')}
					>
						Training Data
					</button>
				</div>
				
				{selectedTab === 'queue' && (
					<div className="space-y-4 pt-4">
						{selectedAssets.length > 0 && (
							<div className="card bg-base-100 shadow">
								<div className="card-body">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="badge badge-primary badge-sm">
												{selectedAssets.length} selected
											</span>
											<span className="text-base-content/60 text-sm">
												Ready for AI tagging
											</span>
										</div>
										<div className="flex items-center gap-2">
											<button
												className="btn btn-sm btn-outline"
												onClick={() => setSelectedAssets([])}
											>
												Clear Selection
											</button>
											<button
												className="btn btn-sm btn-primary gap-2"
												onClick={handleBulkTagging}
											>
												<Zap size={16} />
												Process Selected
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{assets.map(renderAssetCard)}
						</div>
					</div>
				)}

				{selectedTab === 'results' && (
					<div className="space-y-4 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<TrendingUp size={48} className="mx-auto mb-4 text-primary" />
								<h3 className="mb-2 font-semibold text-lg">Tagging Results</h3>
								<p className="text-base-content/60">
									View and analyze AI tagging performance and accuracy
								</p>
							</div>
						</div>
					</div>
				)}

				{selectedTab === 'training' && (
					<div className="space-y-4 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<Brain size={48} className="mx-auto mb-4 text-secondary" />
								<h3 className="mb-2 font-semibold text-lg">Training Data</h3>
								<p className="text-base-content/60">
									Manage training data to improve AI tagging accuracy
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Modals */}
			{renderAssetDetail()}
			{renderSettingsModal()}
		</div>
	);
}
