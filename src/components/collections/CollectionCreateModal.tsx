"use client";

import {
	Copy,
	Crown,
	Eye,
	EyeOff,
	ImageIcon,
	Palette,
	Sparkles,
	Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { BaseModal } from "../ui/BaseModal";

interface CollectionCreateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CreateCollectionForm {
	name: string;
	description: string;
	category: string;
	color: string;
	icon: string;
	isPublic: boolean;
	isTemplate: boolean;
	allowContributions: boolean;
	templateId?: string;
}

const COLLECTION_CATEGORIES = [
	{ key: "general", label: "General" },
	{ key: "marketing", label: "Marketing" },
	{ key: "brand", label: "Brand Assets" },
	{ key: "product", label: "Product" },
	{ key: "social", label: "Social Media" },
	{ key: "print", label: "Print Materials" },
	{ key: "web", label: "Web Assets" },
	{ key: "presentation", label: "Presentations" },
	{ key: "training", label: "Training" },
	{ key: "archive", label: "Archive" },
];

const PRESET_COLORS = [
	"#6366f1",
	"#8b5cf6",
	"#ec4899",
	"#f43f5e",
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
];

const COLLECTION_ICONS = [
	"📁",
	"🗂️",
	"📂",
	"🎨",
	"📸",
	"🖼️",
	"📱",
	"💻",
	"🎬",
	"📺",
	"🎵",
	"📄",
	"📊",
	"📈",
	"🏷️",
	"💼",
	"🎯",
	"⚡",
	"🌟",
	"💎",
];

export function CollectionCreateModal({
	isOpen,
	onClose,
	onSuccess,
}: CollectionCreateModalProps) {
	const [activeTab, setActiveTab] = useState("manual");
	const [form, setForm] = useState<CreateCollectionForm>({
		name: "",
		description: "",
		category: "general",
		color: PRESET_COLORS[0] || "#6366f1",
		icon: COLLECTION_ICONS[0] || "📁",
		isPublic: false,
		isTemplate: false,
		allowContributions: false,
	});
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");

	// API queries
	// TODO: Implement getCollectionTemplates endpoint
	const templates: any[] = [];
	const templatesLoading = false;

	// Mutations
	const createCollectionMutation = api.assetApi.createCollection.useMutation({
		onSuccess: () => {
			resetForm();
			onSuccess();
		},
		onError: (error) => {
			console.error("Failed to create collection:", error);
		},
	});

	const createFromTemplateMutation = {
		mutate: (params: any) => {
			console.log("Create collection from template:", params);
			resetForm();
			onSuccess();
		},
		isPending: false,
	};

	const resetForm = () => {
		setForm({
			name: "",
			description: "",
			category: "general",
			color: PRESET_COLORS[0] || "#6366f1",
			icon: COLLECTION_ICONS[0] || "📁",
			isPublic: false,
			isTemplate: false,
			allowContributions: false,
		});
		setSelectedTemplate("");
		setActiveTab("manual");
	};

	const handleSubmit = () => {
		if (!form.name.trim()) return;

		if (activeTab === "template" && selectedTemplate) {
			createFromTemplateMutation.mutate({
				templateId: selectedTemplate,
				name: form.name || "Untitled",
				description: form.description || "",
				isPublic: form.isPublic,
				allowContributions: form.allowContributions,
			});
		} else {
			createCollectionMutation.mutate({
				name: form.name || "Untitled",
				description: form.description || "",
				color: form.color,
				icon: form.icon,
				isPublic: form.isPublic,
				allowContributions: form.allowContributions,
				tags: [],
				metadata: {
					category: form.category,
				},
			});
		}
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const generateSlug = (name: string) => {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();
	};

	const isFormValid = form.name.trim().length > 0;
	const isPending =
		createCollectionMutation.isPending || createFromTemplateMutation.isPending;

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Create New Collection"
			size="md"
			contentClassName="h-5/6 overflow-y-auto"
		>

				<div>
					<div role="tablist" className="tabs tabs-box w-full mb-6">
						<button
							role="tab"
							className={`tab ${activeTab === "manual" ? "tab-active" : ""}`}
							onClick={() => setActiveTab("manual")}
						>
							Manual Setup
						</button>
						<button
							role="tab"
							className={`tab ${activeTab === "template" ? "tab-active" : ""}`}
							onClick={() => setActiveTab("template")}
						>
							From Template
						</button>
					</div>
					
					<div className="tab-content">
						{activeTab === "manual" && (
							<div className="space-y-6">
								{/* Basic Information */}
								<div className="space-y-4">
									<h3 className="font-semibold">Basic Information</h3>
									<div>
										<label className="label" htmlFor="collection-name">Collection Name *</label>
										<input
											id="collection-name"
											className="input"
											placeholder="Enter collection name"
											value={form.name}
											onChange={(e) => setForm({ ...form, name: e.target.value })}
										/>
									</div>
									<div>
										<label className="label" htmlFor="collection-description">Description</label>
										<textarea
											id="collection-description"
											className="textarea"
											placeholder="Describe your collection (optional)"
											value={form.description}
											onChange={(e) => setForm({ ...form, description: e.target.value })}
											rows={3}
										/>
									</div>
									<div>
										<label className="label" htmlFor="collection-category">Category</label>
										<select 
											id="collection-category"
											className="select"
											value={form.category}
											onChange={(e) => setForm({ ...form, category: e.target.value })}
										>
											{COLLECTION_CATEGORIES.map((category) => (
												<option key={category.key} value={category.key}>
													{category.label}
												</option>
											))}
										</select>
									</div>
									{form.name && (
										<div className="text-base-content/50 text-sm">
											Slug: {generateSlug(form.name)}
										</div>
									)}
								</div>

								<div className="divider"></div>

								{/* Appearance */}
								<div className="space-y-4">
									<h3 className="font-semibold">Appearance</h3>
									<div>
										<label className="mb-2 block font-medium text-sm">
											Color
										</label>
										<div className="flex flex-wrap gap-2">
											{PRESET_COLORS.map((color, index) => (
												<button
													key={index}
													onClick={() => setForm({ ...form, color })}
													className={`h-8 w-8 rounded-lg border-2 transition-all ${
														form.color === color
															? "border-base-content shadow-lg"
															: "border-base-300 hover:border-base-content/40"
													}`}
													style={{ backgroundColor: color }}
												/>
											))}
											<input
												type="color"
												value={form.color}
												onChange={(e) =>
													setForm({ ...form, color: e.target.value })
												}
												className="h-8 w-8 rounded-lg border-2 border-base-300"
											/>
										</div>
									</div>
									<div>
										<label className="mb-2 block font-medium text-sm">
											Icon
										</label>
										<div className="flex flex-wrap gap-2">
											{COLLECTION_ICONS.map((icon) => (
												<button
													key={icon}
													onClick={() => setForm({ ...form, icon })}
													className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-all ${
														form.icon === icon
															? "border-primary bg-primary/10"
															: "border-base-300 hover:border-base-content/40"
													}`}
												>
													{icon}
												</button>
											))}
										</div>
										<input
											className="input input-sm mt-2"
											placeholder="Or enter custom emoji/icon"
											value={form.icon}
											onChange={(e) => setForm({ ...form, icon: e.target.value })}
										/>
									</div>
								</div>

								<div className="divider"></div>

								{/* Settings */}
								<div className="space-y-4">
									<h3 className="font-semibold">Settings</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Eye size={16} className="text-base-content/40" />
												<div>
													<p className="font-medium text-sm">
														Public Collection
													</p>
													<p className="text-base-content/50 text-xs">
														Anyone in your organization can view this collection
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												className="toggle toggle-primary"
												checked={form.isPublic}
												onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
											/>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Users size={16} className="text-base-content/40" />
												<div>
													<p className="font-medium text-sm">
														Allow Contributions
													</p>
													<p className="text-base-content/50 text-xs">
														Other users can add assets to this collection
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												className="toggle toggle-primary"
												checked={form.allowContributions}
												onChange={(e) => setForm({ ...form, allowContributions: e.target.checked })}
											/>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Crown size={16} className="text-base-content/40" />
												<div>
													<p className="font-medium text-sm">
														Save as Template
													</p>
													<p className="text-base-content/50 text-xs">
														Others can use this collection as a template
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												className="toggle toggle-primary"
												checked={form.isTemplate}
												onChange={(e) => setForm({ ...form, isTemplate: e.target.checked })}
											/>
										</div>
									</div>
								</div>

								{/* Preview */}
								<div className="space-y-2">
									<h3 className="font-semibold">Preview</h3>
									<div className="card bg-base-100 shadow w-full max-w-xs">
										<div
											className="flex h-24 w-full items-center justify-center"
											style={{
												background: `linear-gradient(135deg, ${form.color}20, ${form.color}40)`,
											}}
										>
											<span className="text-2xl">{form.icon}</span>
										</div>
										<div className="card-body pt-3">
											<h4 className="font-semibold">
												{form.name || "Collection Name"}
											</h4>
											<p className="text-base-content/50 text-sm">
												{form.description || "No description"}
											</p>
											<div className="mt-2 flex gap-1">
												{form.isPublic ? (
													<div className="badge badge-success badge-sm gap-1">
														<Eye size={10} />
													</div>
												) : (
													<div className="badge badge-neutral badge-sm gap-1">
														<EyeOff size={10} />
													</div>
												)}
												{form.allowContributions && (
													<div className="badge badge-primary badge-sm gap-1">
														<Users size={10} />
													</div>
												)}
												{form.isTemplate && (
													<div className="badge badge-secondary badge-sm gap-1">
														<Crown size={10} />
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{activeTab === "template" && (
							<div className="space-y-6">
								{/* Template Selection */}
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Copy size={16} className="text-primary" />
										<h3 className="font-semibold">Choose Template</h3>
									</div>
									<p className="text-base-content/50 text-sm">
										Start with a pre-built collection template to get up and
										running quickly.
									</p>

									{templatesLoading ? (
										<div className="flex justify-center py-8">
											<span className="loading loading-spinner loading-lg"></span>
										</div>
									) : templates && templates.length > 0 ? (
										<div className="grid grid-cols-1 gap-3">
											{templates.map((template: any) => (
												<div
													key={template.id}
													className={`card bg-base-100 shadow cursor-pointer transition-all hover:shadow-lg ${
														selectedTemplate === template.id
															? "ring-2 ring-primary"
															: ""
													}`}
													onClick={() => setSelectedTemplate(template.id)}
												>
													<div className="card-body flex-row items-center gap-4 p-4">
														<div className="flex-shrink-0">
															{template.previewImage ? (
																<img
																	src={template.previewImage}
																	alt={template.name}
																	className="h-12 w-12 rounded-lg object-cover"
																/>
															) : (
																<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg">
																	<Sparkles
																		size={20}
																		className="text-primary"
																	/>
																</div>
															)}
														</div>
														<div className="flex-1">
															<h4 className="font-semibold">{template.name}</h4>
															<p className="text-base-content/50 text-sm">
																{template.description}
															</p>
															<div className="mt-1 flex items-center gap-2">
																<div className="badge badge-neutral badge-sm">
																	{template.category}
																</div>
																<span className="text-base-content/40 text-xs">
																	Used {template.usageCount} times
																</span>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="card bg-base-100 shadow">
											<div className="card-body py-8 text-center">
												<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
													<Copy size={24} className="text-base-content/40" />
												</div>
												<h3 className="mb-2 font-semibold text-lg">
													No templates available
												</h3>
												<p className="text-base-content/50 text-sm">
													No templates found for the selected category
												</p>
											</div>
										</div>
									)}
								</div>

								{selectedTemplate && (
									<>
										<div className="divider"></div>
										{/* Customization */}
										<div className="space-y-4">
											<h3 className="font-semibold">Customize</h3>
											<div>
												<label className="label" htmlFor="template-collection-name">Collection Name *</label>
												<input
													id="template-collection-name"
													className="input"
													placeholder="Enter collection name"
													value={form.name}
													onChange={(e) => setForm({ ...form, name: e.target.value })}
													required
												/>
											</div>
											<div>
												<label className="label" htmlFor="template-collection-description">Description</label>
												<textarea
													id="template-collection-description"
													className="textarea"
													placeholder="Customize description (optional)"
													value={form.description}
													onChange={(e) => setForm({ ...form, description: e.target.value })}
													rows={3}
												/>
											</div>
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-sm">
															Public Collection
														</p>
														<p className="text-base-content/50 text-xs">
															Anyone in your organization can view this
															collection
														</p>
													</div>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={form.isPublic}
														onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
													/>
												</div>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-sm">
															Allow Contributions
														</p>
														<p className="text-base-content/50 text-xs">
															Other users can add assets to this collection
														</p>
													</div>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={form.allowContributions}
														onChange={(e) => setForm({ ...form, allowContributions: e.target.checked })}
													/>
												</div>
											</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<button 
						className="btn btn-outline" 
						onClick={handleClose} 
						disabled={isPending}
					>
						Cancel
					</button>
					<button
						className={`btn btn-primary ${
							(!isFormValid || (activeTab === "template" && !selectedTemplate)) ? "btn-disabled" : ""
						}`}
						onClick={handleSubmit}
						disabled={
							!isFormValid || (activeTab === "template" && !selectedTemplate) || isPending
						}
					>
						{isPending ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : (
							activeTab === "template"
								? "Create from Template"
								: "Create Collection"
						)}
					</button>
				</div>
		</BaseModal>
	);
}