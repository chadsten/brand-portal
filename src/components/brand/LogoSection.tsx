"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	CheckCircle,
	Copy,
	Download,
	Edit,
	Eye,
	Image as ImageIcon,
	Plus,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";

interface LogoVariation {
	id: string;
	name: string;
	description: string;
	assetId?: string;
	assetUrl?: string;
	type:
		| "primary"
		| "secondary"
		| "icon"
		| "wordmark"
		| "monochrome"
		| "reversed";
	usageContext: string[];
	minSize: number; // in pixels
	backgroundColor: string[];
	fileFormats: string[];
	tags: string[];
}

interface LogoSectionProps {
	logoVariations: LogoVariation[];
	logoRules: any;
	onChange: (updates: {
		logoVariations?: LogoVariation[];
		logoRules?: any;
	}) => void;
}

const LOGO_TYPES = [
	{ value: "primary", label: "Primary Logo", description: "Main brand logo" },
	{
		value: "secondary",
		label: "Secondary Logo",
		description: "Alternative version",
	},
	{ value: "icon", label: "Icon/Symbol", description: "Logo mark only" },
	{ value: "wordmark", label: "Wordmark", description: "Text only version" },
	{
		value: "monochrome",
		label: "Monochrome",
		description: "Single color version",
	},
	{ value: "reversed", label: "Reversed", description: "For dark backgrounds" },
];

const USAGE_CONTEXTS = [
	"Web headers",
	"Business cards",
	"Email signatures",
	"Social media",
	"Print materials",
	"Merchandise",
	"Presentations",
	"Marketing materials",
	"Mobile apps",
	"Favicons",
];

const BACKGROUND_COLORS = [
	"#FFFFFF",
	"#000000",
	"#F5F5F5",
	"#1A1A1A",
	"#6366F1",
	"#8B5CF6",
	"#EC4899",
	"#F59E0B",
	"#10B981",
	"#06B6D4",
	"#EF4444",
];

export function LogoSection({
	logoVariations,
	logoRules,
	onChange,
}: LogoSectionProps) {
	const [editingLogo, setEditingLogo] = useState<LogoVariation | null>(null);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previewBackground, setPreviewBackground] = useState("#FFFFFF");

	const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	
	const onLogoModalOpen = () => setIsLogoModalOpen(true);
	const onLogoModalClose = () => setIsLogoModalOpen(false);
	const onUploadModalOpen = () => setIsUploadModalOpen(true);
	const onUploadModalClose = () => setIsUploadModalOpen(false);

	const handleAddLogo = () => {
		setEditingLogo({
			id: crypto.randomUUID(),
			name: "",
			description: "",
			type: "primary",
			usageContext: [],
			minSize: 16,
			backgroundColor: ["#FFFFFF"],
			fileFormats: ["SVG", "PNG"],
			tags: [],
		});
		setIsCreatingNew(true);
		onLogoModalOpen();
	};

	const handleEditLogo = (logo: LogoVariation) => {
		setEditingLogo(logo);
		setIsCreatingNew(false);
		onLogoModalOpen();
	};

	const handleSaveLogo = () => {
		if (!editingLogo) return;

		if (isCreatingNew) {
			onChange({
				logoVariations: [...logoVariations, editingLogo],
			});
		} else {
			onChange({
				logoVariations: logoVariations.map((l) =>
					l.id === editingLogo.id ? editingLogo : l,
				),
			});
		}

		setEditingLogo(null);
		onLogoModalClose();
	};

	const handleDeleteLogo = (logoId: string) => {
		if (confirm("Are you sure you want to delete this logo variation?")) {
			onChange({
				logoVariations: logoVariations.filter((l) => l.id !== logoId),
			});
		}
	};

	const handleUploadLogo = () => {
		onUploadModalOpen();
		// Simulate upload progress
		let progress = 0;
		const interval = setInterval(() => {
			progress += 10;
			setUploadProgress(progress);
			if (progress >= 100) {
				clearInterval(interval);
				setTimeout(() => {
					onUploadModalClose();
					setUploadProgress(0);
				}, 500);
			}
		}, 200);
	};

	const updateLogoRules = (field: string, value: any) => {
		onChange({
			logoRules: {
				...logoRules,
				[field]: value,
			},
		});
	};

	const getLogoTypeInfo = (type: string) => {
		return LOGO_TYPES.find((t) => t.value === type) || LOGO_TYPES[0]!;
	};

	const renderLogoPreview = (logo: LogoVariation) => {
		// This would normally show the actual logo image
		// For now, showing a placeholder with logo info
		return (
			<div
				className="flex h-32 items-center justify-center rounded-lg border-2 border-base-300 border-dashed"
				style={{ backgroundColor: previewBackground }}
			>
				{logo.assetUrl ? (
					<img
						src={logo.assetUrl}
						alt={logo.name}
						className="max-h-24 max-w-24 object-contain"
					/>
				) : (
					<div className="text-center">
						<ImageIcon size={32} className="mx-auto mb-2 text-base-content/40" />
						<p className="text-base-content/60 text-sm">
							{logo.name || "Logo Preview"}
						</p>
						<p className="text-base-content/40 text-xs">
							{getLogoTypeInfo(logo.type)?.label}
						</p>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-6">
			{/* Logo Variations */}
			<div className="card bg-base-100 shadow">
				<div className="card-header flex justify-between p-4">
					<h3 className="flex items-center gap-2 font-semibold text-lg">
						<ImageIcon size={20} />
						Logo Variations
					</h3>
					<div className="flex gap-2">
						<button
							className="btn btn-outline gap-2"
							onClick={handleUploadLogo}
						>
							<Upload size={16} />
							Upload
						</button>
						<button
							className="btn btn-primary gap-2"
							onClick={handleAddLogo}
						>
							<Plus size={16} />
							Add Variation
						</button>
					</div>
				</div>
				<div className="card-body">
					{logoVariations.length === 0 ? (
						<div className="py-8 text-center">
							<ImageIcon size={48} className="mx-auto mb-4 text-base-content/30" />
							<p className="mb-4 text-base-content/60">
								No logo variations defined yet
							</p>
							<button className="btn btn-primary" onClick={handleAddLogo}>
								Add Your First Logo
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{logoVariations.map((logo) => (
								<div key={logo.id} className="card bg-base-100 shadow border border-base-300">
									<div className="card-body space-y-4">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-semibold">{logo.name}</h4>
												<span
													className={`badge badge-sm ${
														logo.type === "primary" ? "badge-primary" : "badge-neutral"
													}`}
												>
													{getLogoTypeInfo(logo.type)?.label}
												</span>
											</div>
											<div className="flex gap-1">
												<button
													className="btn btn-sm btn-outline btn-square"
													onClick={() => handleEditLogo(logo)}
												>
													<Edit size={14} />
												</button>
												<button
													className="btn btn-sm btn-outline btn-error btn-square"
													onClick={() => handleDeleteLogo(logo.id)}
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>

										{/* Logo Preview */}
										{renderLogoPreview(logo)}

										{/* Logo Info */}
										<div className="space-y-2">
											<p className="text-base-content/70 text-sm">
												{logo.description}
											</p>

											<div>
												<p className="mb-1 font-medium text-base-content/60 text-xs">
													Usage Context
												</p>
												<div className="flex flex-wrap gap-1">
													{logo.usageContext.slice(0, 3).map((context) => (
														<span key={context} className="badge badge-sm badge-outline">
															{context}
														</span>
													))}
													{logo.usageContext.length > 3 && (
														<span className="badge badge-sm badge-neutral">
															+{logo.usageContext.length - 3}
														</span>
													)}
												</div>
											</div>

											<div className="flex justify-between text-base-content/60 text-sm">
												<span>Min size: {logo.minSize}px</span>
												<span>{logo.fileFormats.join(", ")}</span>
											</div>

											{/* Background compatibility */}
											<div>
												<p className="mb-1 font-medium text-base-content/60 text-xs">
													Backgrounds
												</p>
												<div className="flex gap-1">
													{logo.backgroundColor
														.slice(0, 4)
														.map((color, index) => (
															<div
																key={index}
																className="h-4 w-4 rounded-sm border border-base-300"
																style={{ backgroundColor: color }}
																title={color}
															/>
														))}
													{logo.backgroundColor.length > 4 && (
														<div className="flex h-4 w-4 items-center justify-center rounded-sm bg-base-200 text-xs">
															+{logo.backgroundColor.length - 4}
														</div>
													)}
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className="flex gap-2">
											<button className="btn btn-sm btn-outline gap-2 flex-1">
												<Download size={12} />
												Download
											</button>
											<button className="btn btn-sm btn-outline btn-square">
												<Copy size={12} />
											</button>
											<button className="btn btn-sm btn-outline btn-square">
												<Eye size={12} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Logo Usage Rules */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Logo Usage Rules</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="w-full">
						<label className="label" htmlFor="clear-space-guidelines">Clear Space Guidelines</label>
						<textarea
							id="clear-space-guidelines"
							className="textarea"
							placeholder="Define minimum clear space around the logo..."
							value={logoRules.clearSpace || ""}
							onChange={(e) => updateLogoRules("clearSpace", e.target.value)}
							rows={2}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="w-full">
							<label className="label" htmlFor="logo-min-size">Minimum Size (px)</label>
							<input
								id="logo-min-size"
								className="input"
								type="number"
								placeholder="16"
								value={logoRules.minSize?.toString() || ""}
								onChange={(e) =>
									updateLogoRules("minSize", parseInt(e.target.value) || 16)
								}
							/>
						</div>
						<div className="w-full">
							<label className="label" htmlFor="logo-max-size">Maximum Size (px)</label>
							<input
								id="logo-max-size"
								className="input"
								type="number"
								placeholder="1000"
								value={logoRules.maxSize?.toString() || ""}
								onChange={(e) =>
									updateLogoRules("maxSize", parseInt(e.target.value) || 1000)
								}
							/>
						</div>
					</div>

					<div className="w-full">
						<label className="label" htmlFor="background-usage">Background Usage</label>
						<textarea
							id="background-usage"
							className="textarea"
							placeholder="Specify approved backgrounds and color combinations..."
							value={logoRules.backgrounds || ""}
							onChange={(e) => updateLogoRules("backgrounds", e.target.value)}
							rows={2}
						/>
					</div>

					<div className="w-full">
						<label className="label" htmlFor="prohibited-usage">Prohibited Usage</label>
						<textarea
							id="prohibited-usage"
							className="textarea"
							placeholder="List what should NOT be done with the logo..."
							value={logoRules.prohibited || ""}
							onChange={(e) => updateLogoRules("prohibited", e.target.value)}
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Logo Preview Tool */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Logo Preview Tool</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="flex items-center gap-4">
						<span className="font-medium text-sm">Background:</span>
						<div className="flex gap-2">
							{BACKGROUND_COLORS.map((color) => (
								<button
									key={color}
									onClick={() => setPreviewBackground(color)}
									className={`h-8 w-8 rounded border-2 transition-all ${
										previewBackground === color
											? "border-primary shadow-lg"
											: "border-base-300 hover:border-base-content/40"
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>

					{/* Preview Grid */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{logoVariations.slice(0, 4).map((logo) => (
							<div key={logo.id} className="space-y-2">
								<p className="font-medium text-sm">{logo.name}</p>
								{renderLogoPreview(logo)}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Logo Modal */}
			<dialog className="modal" open={isLogoModalOpen}>
				<div className="modal-box w-11/12 max-w-2xl">
					{editingLogo && (
						<>
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-bold text-lg">
									{isCreatingNew ? "Add" : "Edit"} Logo Variation
								</h3>
								<button className="btn btn-sm btn-circle btn-ghost" onClick={onLogoModalClose}>✕</button>
							</div>
							<div className="modal-body space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="w-full">
										<label className="label" htmlFor="logo-name">Logo Name</label>
										<input
											id="logo-name"
											className="input"
											placeholder="e.g., Primary Logo"
											value={editingLogo.name}
											onChange={(e) =>
												setEditingLogo({ ...editingLogo, name: e.target.value })
											}
										/>
									</div>
									<div className="w-full">
										<label className="label" htmlFor="logo-type">Logo Type</label>
										<select
											id="logo-type"
											className="select"
											value={editingLogo.type}
											onChange={(e) => {
												setEditingLogo({ ...editingLogo, type: e.target.value as any });
											}}
										>
											{LOGO_TYPES.map((type) => (
												<option key={type.value} value={type.value}>
													{type.label} - {type.description}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="w-full">
									<label className="label" htmlFor="logo-description">Description</label>
									<textarea
										id="logo-description"
										className="textarea"
										placeholder="Describe this logo variation..."
										value={editingLogo.description}
										onChange={(e) =>
											setEditingLogo({ ...editingLogo, description: e.target.value })
										}
										rows={2}
									/>
								</div>

								{/* Usage Context */}
								<div>
									<label className="mb-2 block font-medium text-sm">
										Usage Context
									</label>
									<div className="grid grid-cols-2 gap-2">
										{USAGE_CONTEXTS.map((context) => (
											<label
												key={context}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="checkbox"
													className="checkbox"
													checked={editingLogo.usageContext.includes(context)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditingLogo({
																...editingLogo,
																usageContext: [
																	...editingLogo.usageContext,
																	context,
																],
															});
														} else {
															setEditingLogo({
																...editingLogo,
																usageContext: editingLogo.usageContext.filter(
																	(c) => c !== context,
																),
															});
														}
													}}
												/>
												<span className="text-sm">{context}</span>
											</label>
										))}
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="w-full">
										<label className="label" htmlFor="logo-variation-min-size">Minimum Size (px)</label>
										<input
											id="logo-variation-min-size"
											className="input"
											type="number"
											value={editingLogo.minSize.toString()}
											onChange={(e) =>
												setEditingLogo({
													...editingLogo,
													minSize: parseInt(e.target.value) || 16,
												})
											}
										/>
									</div>
									<div className="w-full">
										<label className="label" htmlFor="file-formats">File Formats</label>
										<input
											id="file-formats"
											className="input"
											placeholder="SVG, PNG, JPG"
											value={editingLogo.fileFormats.join(", ")}
											onChange={(e) =>
												setEditingLogo({
													...editingLogo,
													fileFormats: e.target.value
														.split(",")
														.map((f) => f.trim())
														.filter(Boolean),
												})
											}
										/>
									</div>
								</div>

								{/* Background Colors */}
								<div>
									<label className="mb-2 block font-medium text-sm">
										Approved Backgrounds
									</label>
									<div className="grid grid-cols-4 gap-2">
										{BACKGROUND_COLORS.map((color) => (
											<label
												key={color}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="checkbox"
													className="checkbox"
													checked={editingLogo.backgroundColor.includes(color)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditingLogo({
																...editingLogo,
																backgroundColor: [
																	...editingLogo.backgroundColor,
																	color,
																],
															});
														} else {
															setEditingLogo({
																...editingLogo,
																backgroundColor:
																	editingLogo.backgroundColor.filter(
																		(c) => c !== color,
																	),
															});
														}
													}}
												/>
												<div
													className="h-6 w-6 rounded border border-base-300"
													style={{ backgroundColor: color }}
												/>
											</label>
										))}
									</div>
								</div>

								{/* Preview */}
								<div className="card bg-base-100 shadow border border-base-300">
									<div className="card-header">
										<h4 className="font-medium">Preview</h4>
									</div>
									<div className="card-body">{renderLogoPreview(editingLogo)}</div>
								</div>
							</div>
							<div className="modal-action">
								<button className="btn btn-outline" onClick={onLogoModalClose}>
									Cancel
								</button>
								<button className="btn btn-primary" onClick={handleSaveLogo}>
									Save Logo
								</button>
							</div>
						</>
					)}
				</div>
				<div className="modal-backdrop" onClick={onLogoModalClose}></div>
			</dialog>

			{/* Upload Modal */}
			<dialog className="modal" open={isUploadModalOpen}>
				<div className="modal-box">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-bold text-lg">Upload Logo</h3>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onUploadModalClose}>✕</button>
					</div>
					<div className="modal-body">
						{uploadProgress > 0 ? (
							<div className="space-y-4">
								<p>Uploading logo...</p>
								<progress
									className="progress progress-primary w-full"
									value={uploadProgress}
									max="100"
								></progress>
								<p className="text-center text-sm">{uploadProgress}%</p>
							</div>
						) : (
							<div className="space-y-4">
								<div className="rounded-lg border-2 border-base-300 border-dashed p-8 text-center">
									<Upload size={48} className="mx-auto mb-4 text-base-content/40" />
									<p className="mb-2 text-base-content/70">
										Drop your logo files here
									</p>
									<p className="text-base-content/60 text-sm">
										SVG, PNG, JPG up to 10MB
									</p>
									<button className="btn btn-primary mt-4">
										Browse Files
									</button>
								</div>
							</div>
						)}
					</div>
					{uploadProgress === 0 && (
						<div className="modal-action">
							<button className="btn btn-outline" onClick={onUploadModalClose}>
								Cancel
							</button>
						</div>
					)}
				</div>
				<div className="modal-backdrop" onClick={onUploadModalClose}></div>
			</dialog>
		</div>
	);
}
