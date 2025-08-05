"use client";

// HeroUI imports removed - using native HTML and DaisyUI classes
import {
	Download,
	Eye,
	Image as ImageIcon,
	Palette,
	Plus,
	Ruler,
	Save,
	Settings,
	Trash2,
	Type,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ColorPalette } from "./ColorPalette";
import { LogoSection } from "./LogoSection";
import { SpacingSection } from "./SpacingSection";
import { TypographySection } from "./TypographySection";

interface BrandGuidelineData {
	name: string;
	description: string;
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
}

interface BrandGuidelineEditorProps {
	guidelineId?: string;
	onSave: (data: BrandGuidelineData) => void;
	onCancel: () => void;
}

export function BrandGuidelineEditor({
	guidelineId,
	onSave,
	onCancel,
}: BrandGuidelineEditorProps) {
	const [formData, setFormData] = useState<BrandGuidelineData>({
		name: "",
		description: "",
		version: "1.0.0",
		primaryColors: ["#6366f1", "#8b5cf6"],
		secondaryColors: ["#ec4899", "#f59e0b", "#10b981"],
		fonts: [],
		logoVariations: [],
		colorRules: {
			primaryUsage: "Use primary colors for main brand elements",
			secondaryUsage: "Use secondary colors for accents and highlights",
			contrast: "Ensure minimum 4.5:1 contrast ratio for accessibility",
		},
		typographyRules: {
			headings: "Use primary font for headings",
			body: "Use secondary font for body text",
			sizes: "Follow modular scale: 12, 14, 16, 18, 24, 32, 48px",
		},
		logoRules: {
			clearSpace: "Maintain minimum clear space equal to logo height",
			minSize: "Never use logo smaller than 16px height",
			backgrounds: "Only use on approved background colors",
		},
		spacingRules: {
			baseUnit: 8,
			scale: [4, 8, 16, 24, 32, 48, 64, 96],
			description: "Use 8px grid system for consistent spacing",
		},
		isActive: true,
		enforceCompliance: false,
		autoApproval: false,
		tags: [],
	});

	const [currentTag, setCurrentTag] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState("basic");

	// Load existing guideline data if editing
	useEffect(() => {
		if (guidelineId) {
			// TODO: Load existing guideline data
			console.log("Load guideline:", guidelineId);
		}
	}, [guidelineId]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave(formData);
		} catch (error) {
			console.error("Error saving guideline:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddTag = () => {
		if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
			setFormData({
				...formData,
				tags: [...formData.tags, currentTag.trim()],
			});
			setCurrentTag("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setFormData({
			...formData,
			tags: formData.tags.filter((tag) => tag !== tagToRemove),
		});
	};

	const updateFormData = (updates: Partial<BrandGuidelineData>) => {
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	return (
		<div className="space-y-6">
			{/* Header Actions */}
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-xl">
					{guidelineId ? "Edit" : "Create"} Brand Guideline
				</h2>
				<div className="flex gap-2">
					<button
						className="btn btn-ghost gap-2"
						onClick={() => setIsPreviewOpen(true)}
					>
						<Eye size={16} />
						Preview
					</button>
					<button className="btn btn-ghost gap-2">
						<Download size={16} />
						Export
					</button>
					<button className="btn btn-ghost" onClick={onCancel}>
						Cancel
					</button>
					<button
						className={`btn btn-primary gap-2 ${isSaving ? 'loading' : ''}`}
						onClick={handleSave}
						disabled={isSaving}
					>
						{!isSaving && <Save size={16} />}
						Save
					</button>
				</div>
			</div>

			<div className="w-full">
				<div role="tablist" className="tabs tabs-bordered">
					<input 
						type="radio" 
						name="guideline-tabs" 
						role="tab" 
						className="tab" 
						aria-label="Basic Info"
						checked={selectedTab === "basic"}
						onChange={() => setSelectedTab("basic")}
					/>
					<div role="tabpanel" className="tab-content">
						{selectedTab === "basic" && (
							<div className="card bg-base-100 shadow">
								<div className="card-body space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="w-full">
									<label className="label" htmlFor="guideline-name">Guideline Name *</label>
									<input
										id="guideline-name"
										type="text"
										placeholder="Enter guideline name"
										className="input"
										value={formData.name}
										onChange={(e) => updateFormData({ name: e.target.value })}
										required
									/>
								</div>
								<div className="w-full">
									<label className="label" htmlFor="guideline-version">Version</label>
									<input
										id="guideline-version"
										type="text"
										placeholder="1.0.0"
										className="input"
										value={formData.version}
										onChange={(e) => updateFormData({ version: e.target.value })}
									/>
								</div>
							</div>

							<div className="w-full">
								<label className="label" htmlFor="guideline-description">Description</label>
								<textarea
									id="guideline-description"
									className="textarea"
									placeholder="Describe this brand guideline..."
									value={formData.description}
									onChange={(e) => updateFormData({ description: e.target.value })}
									rows={3}
								/>
							</div>

							{/* Tags */}
							<div className="space-y-2">
								<label className="label">
									<span className="label-text font-medium">Tags</span>
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										placeholder="Add tag"
										className="input flex-1"
										value={currentTag}
										onChange={(e) => setCurrentTag(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTag();
											}
										}}
									/>
									<button
										className="btn btn-primary btn-square"
										onClick={handleAddTag}
										disabled={!currentTag.trim()}
									>
										<Plus size={16} />
									</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{formData.tags.map((tag) => (
										<div key={tag} className="badge badge-outline gap-2">
											{tag}
											<button
												className="btn btn-xs btn-ghost btn-circle"
												onClick={() => handleRemoveTag(tag)}
											>
												<X size={12} />
											</button>
										</div>
									))}
								</div>
							</div>

							{/* Settings */}
							<div className="divider"></div>
							<div className="space-y-4">
								<h3 className="font-semibold text-lg">Settings</h3>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">Active Guideline</p>
											<p className="text-base-content/60 text-sm">
												Make this the active brand guideline
											</p>
										</div>
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={formData.isActive}
											onChange={(e) => updateFormData({ isActive: e.target.checked })}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">Enforce Compliance</p>
											<p className="text-base-content/60 text-sm">
												Automatically check assets against this guideline
											</p>
										</div>
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={formData.enforceCompliance}
											onChange={(e) => updateFormData({ enforceCompliance: e.target.checked })}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">Auto-approval</p>
											<p className="text-base-content/60 text-sm">
												Automatically approve compliant assets
											</p>
										</div>
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={formData.autoApproval}
											onChange={(e) => updateFormData({ autoApproval: e.target.checked })}
										/>
									</div>
								</div>
							</div>
								</div>
							</div>
						)}
					</div>

					<input 
						type="radio" 
						name="guideline-tabs" 
						role="tab" 
						className="tab" 
						aria-label="Colors"
						checked={selectedTab === "colors"}
						onChange={() => setSelectedTab("colors")}
					/>
					<div role="tabpanel" className="tab-content">
						{selectedTab === "colors" && (
							<ColorPalette
								primaryColors={formData.primaryColors}
								secondaryColors={formData.secondaryColors}
								colorRules={formData.colorRules}
								onChange={(colors) => updateFormData(colors)}
							/>
						)}
					</div>

					<input 
						type="radio" 
						name="guideline-tabs" 
						role="tab" 
						className="tab" 
						aria-label="Typography"
						checked={selectedTab === "typography"}
						onChange={() => setSelectedTab("typography")}
					/>
					<div role="tabpanel" className="tab-content">
						{selectedTab === "typography" && (
							<TypographySection
								fonts={formData.fonts}
								typographyRules={formData.typographyRules}
								onChange={(typography) => updateFormData(typography)}
							/>
						)}
					</div>

					<input 
						type="radio" 
						name="guideline-tabs" 
						role="tab" 
						className="tab" 
						aria-label="Logos"
						checked={selectedTab === "logos"}
						onChange={() => setSelectedTab("logos")}
					/>
					<div role="tabpanel" className="tab-content">
						{selectedTab === "logos" && (
							<LogoSection
								logoVariations={formData.logoVariations}
								logoRules={formData.logoRules}
								onChange={(logos) => updateFormData(logos)}
							/>
						)}
					</div>

					<input 
						type="radio" 
						name="guideline-tabs" 
						role="tab" 
						className="tab" 
						aria-label="Spacing"
						checked={selectedTab === "spacing"}
						onChange={() => setSelectedTab("spacing")}
					/>
					<div role="tabpanel" className="tab-content">
						{selectedTab === "spacing" && (
							<SpacingSection
								spacingRules={formData.spacingRules}
								onChange={(spacing) => updateFormData({ spacingRules: spacing })}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			<dialog className="modal" open={isPreviewOpen}>
				<div className="modal-box w-11/12 max-w-5xl h-5/6 overflow-y-auto">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-bold text-lg">Brand Guideline Preview</h3>
							<button 
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => setIsPreviewOpen(false)}
							>
								<X size={16} />
							</button>
						</div>
						<div className="space-y-6">
							{/* Basic Info Preview */}
							<div className="card bg-base-100 shadow">
								<div className="card-header px-6 py-4 border-b border-base-300">
									<h3 className="font-semibold text-lg">
										{formData.name || "Untitled Guideline"}
									</h3>
								</div>
								<div className="card-body">
									<p className="text-base-content/70">{formData.description}</p>
									<div className="mt-4 flex gap-2">
										<div className="badge badge-outline">
											v{formData.version}
										</div>
										{formData.isActive && (
											<div className="badge badge-success">
												Active
											</div>
										)}
										{formData.enforceCompliance && (
											<div className="badge badge-warning">
												Enforced
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Colors Preview */}
							<div className="card bg-base-100 shadow">
								<div className="card-header px-6 py-4 border-b border-base-300">
									<h3 className="flex items-center gap-2 font-semibold text-lg">
										<Palette size={20} />
										Color Palette
									</h3>
								</div>
								<div className="card-body space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Primary Colors</h4>
										<div className="flex gap-2">
											{formData.primaryColors.map((color, index) => (
												<div key={index} className="text-center">
													<div
														className="mb-1 h-16 w-16 rounded-lg border border-base-300"
														style={{ backgroundColor: color }}
													/>
													<p className="font-mono text-xs">{color}</p>
												</div>
											))}
										</div>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Secondary Colors</h4>
										<div className="flex gap-2">
											{formData.secondaryColors.map((color, index) => (
												<div key={index} className="text-center">
													<div
														className="mb-1 h-12 w-12 rounded-lg border border-base-300"
														style={{ backgroundColor: color }}
													/>
													<p className="font-mono text-xs">{color}</p>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* Typography Preview */}
							<div className="card bg-base-100 shadow">
								<div className="card-header px-6 py-4 border-b border-base-300">
									<h3 className="flex items-center gap-2 font-semibold text-lg">
										<Type size={20} />
										Typography
									</h3>
								</div>
								<div className="card-body">
									{formData.fonts.length > 0 ? (
										<div className="space-y-4">
											{formData.fonts.map((font: any, index) => (
												<div key={index}>
													<h4 className="font-medium">
														{font.name || font.family}
													</h4>
													<p className="text-base-content/60 text-sm">
														{font.usage}
													</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-base-content/60">No fonts defined</p>
									)}
								</div>
							</div>
						</div>
						<div className="modal-action">
							<button 
								className="btn"
								onClick={() => setIsPreviewOpen(false)}
							>
								Close
							</button>
						</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setIsPreviewOpen(false)}>close</button>
				</form>
			</dialog>
		</div>
	);
}
