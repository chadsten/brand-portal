"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	CheckCircle,
	Copy,
	Eye,
	Palette,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";

interface ColorPaletteProps {
	primaryColors: string[];
	secondaryColors: string[];
	colorRules: any;
	onChange: (updates: {
		primaryColors?: string[];
		secondaryColors?: string[];
		colorRules?: any;
	}) => void;
}

interface ColorInfo {
	hex: string;
	name: string;
	usage: string;
	contrast?: number;
	wcag?: string;
}

export function ColorPalette({
	primaryColors,
	secondaryColors,
	colorRules,
	onChange,
}: ColorPaletteProps) {
	const [newPrimaryColor, setNewPrimaryColor] = useState("#6366f1");
	const [newSecondaryColor, setNewSecondaryColor] = useState("#ec4899");
	const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);

	const [isColorDetailOpen, setIsColorDetailOpen] = useState(false);
	
	const onColorDetailOpen = () => setIsColorDetailOpen(true);
	const onColorDetailClose = () => setIsColorDetailOpen(false);

	// Calculate contrast ratio between two colors
	const calculateContrast = (color1: string, color2: string): number => {
		// Simplified contrast calculation - in real implementation use proper formula
		return Math.random() * 10 + 1; // Placeholder
	};

	const getWCAGRating = (contrast: number): string => {
		if (contrast >= 7) return "AAA";
		if (contrast >= 4.5) return "AA";
		if (contrast >= 3) return "AA Large";
		return "Fail";
	};

	const handleAddPrimaryColor = () => {
		if (newPrimaryColor && !primaryColors.includes(newPrimaryColor)) {
			onChange({
				primaryColors: [...primaryColors, newPrimaryColor],
			});
			setNewPrimaryColor("#6366f1");
		}
	};

	const handleRemovePrimaryColor = (colorToRemove: string) => {
		onChange({
			primaryColors: primaryColors.filter((color) => color !== colorToRemove),
		});
	};

	const handleAddSecondaryColor = () => {
		if (newSecondaryColor && !secondaryColors.includes(newSecondaryColor)) {
			onChange({
				secondaryColors: [...secondaryColors, newSecondaryColor],
			});
			setNewSecondaryColor("#ec4899");
		}
	};

	const handleRemoveSecondaryColor = (colorToRemove: string) => {
		onChange({
			secondaryColors: secondaryColors.filter(
				(color) => color !== colorToRemove,
			),
		});
	};

	const handleColorClick = (color: string, type: "primary" | "secondary") => {
		const contrastWithWhite = calculateContrast(color, "#FFFFFF");
		const contrastWithBlack = calculateContrast(color, "#000000");

		setSelectedColor({
			hex: color,
			name: `${type.charAt(0).toUpperCase() + type.slice(1)} Color`,
			usage:
				type === "primary" ? "Main brand elements" : "Accent and highlights",
			contrast: Math.max(contrastWithWhite, contrastWithBlack),
			wcag: getWCAGRating(Math.max(contrastWithWhite, contrastWithBlack)),
		});
		onColorDetailOpen();
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		// Could add toast notification here
	};

	const updateColorRules = (field: string, value: string) => {
		onChange({
			colorRules: {
				...colorRules,
				[field]: value,
			},
		});
	};

	return (
		<div className="space-y-6">
			{/* Primary Colors */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="flex items-center gap-2 font-semibold text-lg">
						<Palette size={20} />
						Primary Colors
					</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
						{primaryColors.map((color, index) => (
							<div key={index} className="group relative">
								<div
									className="h-20 w-full cursor-pointer rounded-lg border border-base-300 transition-transform hover:scale-105"
									style={{ backgroundColor: color }}
									onClick={() => handleColorClick(color, "primary")}
									title={`Click to view details: ${color}`}
								/>
								<div className="mt-2 flex items-center justify-between">
									<p className="font-mono text-sm">{color}</p>
									<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											className="btn btn-sm btn-outline btn-square"
											onClick={() => copyToClipboard(color)}
										>
											<Copy size={12} />
										</button>
										<button
											className="btn btn-sm btn-outline btn-error btn-square"
											onClick={() => handleRemovePrimaryColor(color)}
										>
											<Trash2 size={12} />
										</button>
									</div>
								</div>
							</div>
						))}

						{/* Add new color */}
						<div className="space-y-2">
							<input
								type="color"
								value={newPrimaryColor}
								onChange={(e) => setNewPrimaryColor(e.target.value)}
								className="h-20 w-full cursor-pointer rounded-lg border border-base-300"
							/>
							<button
								className="btn btn-sm btn-primary gap-2 w-full"
								onClick={handleAddPrimaryColor}
							>
								<Plus size={14} />
								Add
							</button>
						</div>
					</div>

					<div className="w-full">
						<label className="label" htmlFor="primary-usage-rules">Primary Color Usage Rules</label>
						<textarea
							id="primary-usage-rules"
							className="textarea"
							placeholder="Describe when and how to use primary colors..."
							value={colorRules.primaryUsage || ""}
							onChange={(e) => updateColorRules("primaryUsage", e.target.value)}
							rows={2}
						/>
					</div>
				</div>
			</div>

			{/* Secondary Colors */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Secondary Colors</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
						{secondaryColors.map((color, index) => (
							<div key={index} className="group relative">
								<div
									className="h-16 w-full cursor-pointer rounded-lg border border-base-300 transition-transform hover:scale-105"
									style={{ backgroundColor: color }}
									onClick={() => handleColorClick(color, "secondary")}
									title={`Click to view details: ${color}`}
								/>
								<div className="mt-2 flex items-center justify-between">
									<p className="font-mono text-sm">{color}</p>
									<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											className="btn btn-sm btn-outline btn-square"
											onClick={() => copyToClipboard(color)}
										>
											<Copy size={12} />
										</button>
										<button
											className="btn btn-sm btn-outline btn-error btn-square"
											onClick={() => handleRemoveSecondaryColor(color)}
										>
											<Trash2 size={12} />
										</button>
									</div>
								</div>
							</div>
						))}

						{/* Add new color */}
						<div className="space-y-2">
							<input
								type="color"
								value={newSecondaryColor}
								onChange={(e) => setNewSecondaryColor(e.target.value)}
								className="h-16 w-full cursor-pointer rounded-lg border border-base-300"
							/>
							<button
								className="btn btn-sm btn-primary gap-2 w-full"
								onClick={handleAddSecondaryColor}
							>
								<Plus size={14} />
								Add
							</button>
						</div>
					</div>

					<div className="w-full">
						<label className="label" htmlFor="secondary-usage-rules">Secondary Color Usage Rules</label>
						<textarea
							id="secondary-usage-rules"
							className="textarea"
							placeholder="Describe when and how to use secondary colors..."
							value={colorRules.secondaryUsage || ""}
							onChange={(e) => updateColorRules("secondaryUsage", e.target.value)}
							rows={2}
						/>
					</div>
				</div>
			</div>

			{/* Accessibility Guidelines */}
			<div className="card bg-base-100 shadow">
				<div className="card-header">
					<h3 className="font-semibold text-lg">Accessibility Guidelines</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="w-full">
						<label className="label" htmlFor="contrast-requirements">Contrast Requirements</label>
						<textarea
							id="contrast-requirements"
							className="textarea"
							placeholder="Specify minimum contrast ratios and accessibility requirements..."
							value={colorRules.contrast || ""}
							onChange={(e) => updateColorRules("contrast", e.target.value)}
							rows={3}
						/>
					</div>

					{/* Quick accessibility check */}
					<div className="space-y-2">
						<h4 className="font-medium">Color Combinations Check</h4>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{primaryColors.slice(0, 2).map((color, index) => {
								const contrastWhite = calculateContrast(color, "#FFFFFF");
								const contrastBlack = calculateContrast(color, "#000000");
								const wcagWhite = getWCAGRating(contrastWhite);
								const wcagBlack = getWCAGRating(contrastBlack);

								return (
									<div
										key={index}
										className="flex items-center gap-2 rounded border border-base-300 p-2"
									>
										<div
											className="h-8 w-8 rounded"
											style={{ backgroundColor: color }}
										/>
										<div className="flex-1">
											<p className="font-mono text-sm">{color}</p>
											<div className="flex gap-2">
												<span
													className={`badge badge-sm ${wcagWhite === "Fail" ? "badge-error" : "badge-success"}`}
												>
													White: {wcagWhite}
												</span>
												<span
													className={`badge badge-sm ${wcagBlack === "Fail" ? "badge-error" : "badge-success"}`}
												>
													Black: {wcagBlack}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Color Detail Modal */}
			<dialog className="modal" open={isColorDetailOpen}>
				<div className="modal-box w-11/12 max-w-lg">
					{selectedColor && (
						<>
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-bold text-lg">Color Details</h3>
								<button className="btn btn-sm btn-circle btn-ghost" onClick={onColorDetailClose}>✕</button>
							</div>
							<div className="modal-body">
								<div className="space-y-4">
									<div className="text-center">
										<div
											className="mx-auto mb-4 h-32 w-32 rounded-lg border border-base-300"
											style={{ backgroundColor: selectedColor.hex }}
										/>
										<h3 className="font-semibold text-lg">
											{selectedColor.name}
										</h3>
										<p className="font-mono text-2xl">{selectedColor.hex}</p>
									</div>

									<div className="space-y-2">
										<p>
											<strong>Usage:</strong> {selectedColor.usage}
										</p>
										{selectedColor.contrast && (
											<>
												<p>
													<strong>Max Contrast Ratio:</strong>{" "}
													{selectedColor.contrast.toFixed(2)}:1
												</p>
												<p>
													<strong>WCAG Rating:</strong>
													<span
														className={`badge badge-sm ml-2 ${
															selectedColor.wcag === "Fail"
																? "badge-error"
																: "badge-success"
														}`}
													>
														{selectedColor.wcag}
													</span>
												</p>
											</>
										)}
									</div>

									{/* Color variations */}
									<div className="space-y-2">
										<h4 className="font-medium">Variations</h4>
										<div className="grid grid-cols-5 gap-2">
											{[0.1, 0.3, 1, 0.7, 0.4].map((opacity, index) => (
												<div key={index} className="text-center">
													<div
														className="mb-1 h-12 w-full rounded border border-base-300"
														style={{
															backgroundColor: selectedColor.hex,
															opacity: opacity,
														}}
													/>
													<p className="text-xs">
														{Math.round(opacity * 100)}%
													</p>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
							<div className="modal-action">
								<button
									className="btn btn-outline gap-2"
									onClick={() => copyToClipboard(selectedColor.hex)}
								>
									<Copy size={16} />
									Copy Hex
								</button>
								<button className="btn" onClick={onColorDetailClose}>Close</button>
							</div>
						</>
					)}
				</div>
				<div className="modal-backdrop" onClick={onColorDetailClose}></div>
			</dialog>
		</div>
	);
}
