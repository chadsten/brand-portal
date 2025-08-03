"use client";

// Import removed - using native HTML and DaisyUI classes
import { Download, Edit, Eye, Plus, Trash2, Type, Upload } from "lucide-react";
import { useState } from "react";

interface FontDefinition {
	id: string;
	name: string;
	family: string;
	weights: number[];
	styles: string[];
	usage: string;
	fallbacks: string[];
	webFont?: {
		provider: string; // google, adobe, custom
		url?: string;
	};
}

interface TypographySectionProps {
	fonts: FontDefinition[];
	typographyRules: any;
	onChange: (updates: {
		fonts?: FontDefinition[];
		typographyRules?: any;
	}) => void;
}

const FONT_WEIGHTS = [
	{ value: 100, label: "Thin" },
	{ value: 200, label: "Extra Light" },
	{ value: 300, label: "Light" },
	{ value: 400, label: "Regular" },
	{ value: 500, label: "Medium" },
	{ value: 600, label: "Semi Bold" },
	{ value: 700, label: "Bold" },
	{ value: 800, label: "Extra Bold" },
	{ value: 900, label: "Black" },
];

const FONT_STYLES = ["normal", "italic", "oblique"];

const FONT_PROVIDERS = [
	{ value: "google", label: "Google Fonts" },
	{ value: "adobe", label: "Adobe Fonts" },
	{ value: "custom", label: "Custom/Self-hosted" },
];

const TYPOGRAPHY_SCALES = {
	"Minor Second": [1, 1.067, 1.138, 1.215, 1.296],
	"Major Second": [1, 1.125, 1.266, 1.424, 1.602],
	"Minor Third": [1, 1.2, 1.44, 1.728, 2.074],
	"Major Third": [1, 1.25, 1.563, 1.953, 2.441],
	"Perfect Fourth": [1, 1.333, 1.778, 2.369, 3.157],
	"Golden Ratio": [1, 1.618, 2.618, 4.236, 6.854],
};

export function TypographySection({
	fonts,
	typographyRules,
	onChange,
}: TypographySectionProps) {
	const [editingFont, setEditingFont] = useState<FontDefinition | null>(null);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [selectedScale, setSelectedScale] = useState("Major Third");
	const [baseSize, setBaseSize] = useState(16);

	const [isFontModalOpen, setIsFontModalOpen] = useState(false);
	
	const onFontModalOpen = () => setIsFontModalOpen(true);
	const onFontModalClose = () => setIsFontModalOpen(false);

	const handleAddFont = () => {
		setEditingFont({
			id: crypto.randomUUID(),
			name: "",
			family: "",
			weights: [400],
			styles: ["normal"],
			usage: "",
			fallbacks: ["sans-serif"],
		});
		setIsCreatingNew(true);
		onFontModalOpen();
	};

	const handleEditFont = (font: FontDefinition) => {
		setEditingFont(font);
		setIsCreatingNew(false);
		onFontModalOpen();
	};

	const handleSaveFont = () => {
		if (!editingFont) return;

		if (isCreatingNew) {
			onChange({
				fonts: [...fonts, editingFont],
			});
		} else {
			onChange({
				fonts: fonts.map((f) => (f.id === editingFont.id ? editingFont : f)),
			});
		}

		setEditingFont(null);
		onFontModalClose();
	};

	const handleDeleteFont = (fontId: string) => {
		if (confirm("Are you sure you want to delete this font?")) {
			onChange({
				fonts: fonts.filter((f) => f.id !== fontId),
			});
		}
	};

	const updateTypographyRules = (field: string, value: any) => {
		onChange({
			typographyRules: {
				...typographyRules,
				[field]: value,
			},
		});
	};

	const generateTypeScale = () => {
		const scale =
			TYPOGRAPHY_SCALES[selectedScale as keyof typeof TYPOGRAPHY_SCALES];
		const sizes = scale.map((ratio) => Math.round(baseSize * ratio));

		updateTypographyRules("typeScale", {
			base: baseSize,
			scale: selectedScale,
			sizes: sizes,
			labels: ["Body", "H4", "H3", "H2", "H1"],
		});
	};

	const renderFontPreview = (font: FontDefinition) => {
		const fontFamily = font.family || font.name;
		return (
			<div
				style={{
					fontFamily: `${fontFamily}, ${font.fallbacks.join(", ")}`,
					fontWeight: font.weights[0] || 400,
				}}
			>
				<p className="mb-2 text-2xl">The quick brown fox</p>
				<p className="text-base">jumps over the lazy dog</p>
				<p className="text-base-content/50 text-sm">
					ABCDEFGHIJKLMNOPQRSTUVWXYZ
				</p>
				<p className="text-base-content/50 text-sm">
					abcdefghijklmnopqrstuvwxyz
				</p>
				<p className="text-base-content/50 text-sm">0123456789</p>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			{/* Font Library */}
			<div className="card bg-base-100 shadow">
				<div className="card-header flex justify-between">
					<h3 className="flex items-center gap-2 font-semibold text-lg">
						<Type size={20} />
						Font Library
					</h3>
					<button
						className="btn btn-primary gap-2"
						onClick={handleAddFont}
					>
						<Plus size={16} />
						Add Font
					</button>
				</div>
				<div className="card-body">
					{fonts.length === 0 ? (
						<div className="py-8 text-center">
							<Type size={48} className="mx-auto mb-4 text-base-content/30" />
							<p className="mb-4 text-base-content/60">No fonts defined yet</p>
							<button className="btn btn-primary" onClick={handleAddFont}>
								Add Your First Font
							</button>
						</div>
					) : (
						<div className="space-y-4">
							{fonts.map((font) => (
								<div key={font.id} className="card bg-base-100 shadow border border-base-300">
									<div className="card-body space-y-4">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-semibold">{font.name}</h4>
												<p className="text-base-content/50 text-sm">
													{font.family}
												</p>
												<p className="text-base-content/60 text-sm">
													{font.usage}
												</p>
											</div>
											<div className="flex gap-2">
												<button
													className="btn btn-sm btn-outline btn-square"
													onClick={() => handleEditFont(font)}
												>
													<Edit size={14} />
												</button>
												<button
													className="btn btn-sm btn-outline btn-error btn-square"
													onClick={() => handleDeleteFont(font.id)}
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>

										{/* Font weights and styles */}
										<div className="flex gap-4">
											<div>
												<p className="mb-1 font-medium text-sm">Weights</p>
												<div className="flex flex-wrap gap-1">
													{font.weights.map((weight) => (
														<span key={weight} className="badge badge-sm badge-neutral">
															{weight}
														</span>
													))}
												</div>
											</div>
											<div>
												<p className="mb-1 font-medium text-sm">Styles</p>
												<div className="flex flex-wrap gap-1">
													{font.styles.map((style) => (
														<span key={style} className="badge badge-sm badge-neutral">
															{style}
														</span>
													))}
												</div>
											</div>
										</div>

										{/* Font preview */}
										<div className="rounded-lg border border-base-300 p-4">
											{renderFontPreview(font)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Typography Scale */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Typography Scale</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Scale Type</span>
							</label>
							<select
								className="select select-bordered"
								value={selectedScale}
								onChange={(e) => setSelectedScale(e.target.value)}
							>
								{Object.keys(TYPOGRAPHY_SCALES).map((scale) => (
									<option key={scale} value={scale}>{scale}</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="font-medium text-sm">Base Size (px)</label>
							<input
								type="range"
								min="12"
								max="24"
								step="1"
								value={baseSize}
								onChange={(e) => setBaseSize(Number(e.target.value))}
								className="range range-primary"
							/>
							<p className="text-base-content/60 text-sm">{baseSize}px</p>
						</div>

						<div className="flex items-end">
							<button
								className="btn btn-primary w-full"
								onClick={generateTypeScale}
							>
								Generate Scale
							</button>
						</div>
					</div>

					{/* Scale Preview */}
					{typographyRules.typeScale && (
						<div className="rounded-lg border border-base-300 p-4">
							<h4 className="mb-4 font-medium">Type Scale Preview</h4>
							<div className="space-y-2">
								{typographyRules.typeScale.sizes.map(
									(size: number, index: number) => (
										<div key={index} className="flex items-center gap-4">
											<span className="w-12 text-base-content/60 text-sm">
												{typographyRules.typeScale.labels[index]}
											</span>
											<span
												style={{ fontSize: `${size}px` }}
												className="font-medium"
											>
												The quick brown fox
											</span>
											<span className="text-base-content/40 text-sm">
												{size}px
											</span>
										</div>
									),
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Typography Rules */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Usage Guidelines</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">Heading Guidelines</span>
						</label>
						<textarea
							className="textarea textarea-bordered"
							placeholder="Specify rules for headings (H1-H6)..."
							value={typographyRules.headings || ""}
							onChange={(e) => updateTypographyRules("headings", e.target.value)}
							rows={3}
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Body Text Guidelines</span>
						</label>
						<textarea
							className="textarea textarea-bordered"
							placeholder="Specify rules for body text, paragraphs, etc..."
							value={typographyRules.body || ""}
							onChange={(e) => updateTypographyRules("body", e.target.value)}
							rows={3}
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Special Typography</span>
						</label>
						<textarea
							className="textarea textarea-bordered"
							placeholder="Rules for captions, labels, quotes, etc..."
							value={typographyRules.special || ""}
							onChange={(e) => updateTypographyRules("special", e.target.value)}
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Font Modal */}
			<dialog className={`modal ${isFontModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-2xl">
					{editingFont && (
						<>
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-bold text-lg">{isCreatingNew ? "Add" : "Edit"} Font</h3>
								<button className="btn btn-sm btn-circle btn-ghost" onClick={onFontModalClose}>✕</button>
							</div>
							<div className="modal-body space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Font Name</span>
										</label>
										<input
											className="input input-bordered"
											placeholder="e.g., Primary Sans"
											value={editingFont.name}
											onChange={(e) =>
												setEditingFont({ ...editingFont, name: e.target.value })
											}
										/>
									</div>
									<div className="form-control">
										<label className="label">
											<span className="label-text">Font Family</span>
										</label>
										<input
											className="input input-bordered"
											placeholder="e.g., Inter, Helvetica"
											value={editingFont.family}
											onChange={(e) =>
												setEditingFont({ ...editingFont, family: e.target.value })
											}
										/>
									</div>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Usage Description</span>
									</label>
									<textarea
										className="textarea textarea-bordered"
										placeholder="Describe when and how to use this font..."
										value={editingFont.usage}
										onChange={(e) =>
											setEditingFont({ ...editingFont, usage: e.target.value })
										}
										rows={2}
									/>
								</div>

								{/* Font Weights */}
								<div>
									<label className="mb-2 block font-medium text-sm">
										Font Weights
									</label>
									<div className="grid grid-cols-3 gap-2">
										{FONT_WEIGHTS.map((weight) => (
											<label
												key={weight.value}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="checkbox"
													checked={editingFont.weights.includes(weight.value)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditingFont({
																...editingFont,
																weights: [
																	...editingFont.weights,
																	weight.value,
																].sort(),
															});
														} else {
															setEditingFont({
																...editingFont,
																weights: editingFont.weights.filter(
																	(w) => w !== weight.value,
																),
															});
														}
													}}
												/>
												<span className="text-sm">{weight.label}</span>
											</label>
										))}
									</div>
								</div>

								{/* Font Styles */}
								<div>
									<label className="mb-2 block font-medium text-sm">
										Font Styles
									</label>
									<div className="flex gap-4">
										{FONT_STYLES.map((style) => (
											<label
												key={style}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="checkbox"
													checked={editingFont.styles.includes(style)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditingFont({
																...editingFont,
																styles: [...editingFont.styles, style],
															});
														} else {
															setEditingFont({
																...editingFont,
																styles: editingFont.styles.filter(
																	(s) => s !== style,
																),
															});
														}
													}}
												/>
												<span className="text-sm capitalize">{style}</span>
											</label>
										))}
									</div>
								</div>

								{/* Fallback Fonts */}
								<div className="form-control">
									<label className="label">
										<span className="label-text">Fallback Fonts</span>
									</label>
									<input
										className="input input-bordered"
										placeholder="sans-serif, Arial, Helvetica"
										value={editingFont.fallbacks.join(", ")}
										onChange={(e) =>
											setEditingFont({
												...editingFont,
												fallbacks: e.target.value
													.split(",")
													.map((f) => f.trim())
													.filter(Boolean),
											})
										}
									/>
								</div>

								{/* Web Font Settings */}
								<div className="card bg-base-100 shadow border border-base-300">
									<div className="card-header">
										<h4 className="font-medium">Web Font Settings</h4>
									</div>
									<div className="card-body space-y-3">
										<div className="form-control">
											<label className="label">
												<span className="label-text">Font Provider</span>
											</label>
											<select
												className="select select-bordered"
												value={editingFont.webFont?.provider || ""}
												onChange={(e) => {
													setEditingFont({
														...editingFont,
														webFont: { ...editingFont.webFont, provider: e.target.value },
													});
												}}
											>
												{FONT_PROVIDERS.map((provider) => (
													<option key={provider.value} value={provider.value}>
														{provider.label}
													</option>
												))}
											</select>
										</div>

										{editingFont.webFont?.provider === "custom" && (
											<div className="form-control">
												<label className="label">
													<span className="label-text">Font URL</span>
												</label>
												<input
													className="input input-bordered"
													placeholder="https://..."
													value={editingFont.webFont?.url || ""}
													onChange={(e) =>
														setEditingFont({
															...editingFont,
															webFont: {
																provider:
																	editingFont.webFont?.provider || "custom",
																url: e.target.value,
															},
														})
													}
												/>
											</div>
										)}
									</div>
								</div>

								{/* Preview */}
								<div className="card bg-base-100 shadow border border-base-300">
									<div className="card-header">
										<h4 className="font-medium">Preview</h4>
									</div>
									<div className="card-body">{renderFontPreview(editingFont)}</div>
								</div>
							</div>
							<div className="modal-action">
								<button className="btn btn-outline" onClick={onFontModalClose}>
									Cancel
								</button>
								<button className="btn btn-primary" onClick={handleSaveFont}>
									Save Font
								</button>
							</div>
						</>
					)}
				</div>
				<div className="modal-backdrop" onClick={onFontModalClose}></div>
			</dialog>
		</div>
	);
}
