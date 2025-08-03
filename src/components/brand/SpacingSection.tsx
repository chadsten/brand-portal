"use client";

// HeroUI imports removed - using native HTML and DaisyUI classes
import { Copy, Grid, Plus, Ruler, Square, Trash2 } from "lucide-react";
import { useState } from "react";

interface SpacingRule {
	baseUnit: number;
	scale: number[];
	description: string;
	customSizes?: { [key: string]: number };
	breakpoints?: { [key: string]: { multiplier: number } };
}

interface SpacingSectionProps {
	spacingRules: SpacingRule;
	onChange: (spacingRules: SpacingRule) => void;
}

const SPACING_PRESETS = {
	"8px Grid": {
		baseUnit: 8,
		scale: [4, 8, 16, 24, 32, 48, 64, 96, 128],
		description: "Standard 8px grid system for consistent spacing",
	},
	"4px Grid": {
		baseUnit: 4,
		scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
		description: "Tight 4px grid for precise control",
	},
	"Golden Ratio": {
		baseUnit: 16,
		scale: [8, 13, 21, 34, 55, 89, 144],
		description: "Spacing based on golden ratio progression",
	},
	"Major Third": {
		baseUnit: 16,
		scale: [8, 16, 20, 25, 31, 39, 49, 61],
		description: "Musical scale based spacing system",
	},
	"Perfect Fourth": {
		baseUnit: 16,
		scale: [6, 8, 12, 16, 21, 28, 37, 49],
		description: "Harmonic progression spacing",
	},
};

const SPACING_CATEGORIES = [
	{
		key: "xs",
		label: "Extra Small",
		description: "Tight spacing for dense layouts",
	},
	{ key: "sm", label: "Small", description: "Compact spacing" },
	{ key: "md", label: "Medium", description: "Standard spacing" },
	{ key: "lg", label: "Large", description: "Generous spacing" },
	{ key: "xl", label: "Extra Large", description: "Maximum spacing" },
];

const BREAKPOINTS = {
	mobile: { label: "Mobile", maxWidth: 768 },
	tablet: { label: "Tablet", maxWidth: 1024 },
	desktop: { label: "Desktop", maxWidth: 1440 },
	wide: { label: "Wide", maxWidth: 1920 },
};

export function SpacingSection({
	spacingRules,
	onChange,
}: SpacingSectionProps) {
	const [selectedPreset, setSelectedPreset] = useState("");
	const [customSpacingName, setCustomSpacingName] = useState("");
	const [customSpacingValue, setCustomSpacingValue] = useState(16);
	const [selectedBreakpoint, setSelectedBreakpoint] = useState("desktop");

	const handlePresetChange = (presetName: string) => {
		const preset = SPACING_PRESETS[presetName as keyof typeof SPACING_PRESETS];
		if (preset) {
			onChange({
				...spacingRules,
				...preset,
			});
			setSelectedPreset(presetName);
		}
	};

	const handleBaseUnitChange = (value: number) => {
		const newScale = spacingRules.scale.map((size) => {
			const ratio = size / spacingRules.baseUnit;
			return Math.round(value * ratio);
		});

		onChange({
			...spacingRules,
			baseUnit: value,
			scale: newScale,
		});
	};

	const handleScaleChange = (index: number, value: number) => {
		const newScale = [...spacingRules.scale];
		newScale[index] = value;
		onChange({
			...spacingRules,
			scale: newScale,
		});
	};

	const addCustomSpacing = () => {
		if (!customSpacingName.trim()) return;

		onChange({
			...spacingRules,
			customSizes: {
				...spacingRules.customSizes,
				[customSpacingName]: customSpacingValue,
			},
		});

		setCustomSpacingName("");
		setCustomSpacingValue(16);
	};

	const removeCustomSpacing = (name: string) => {
		const newCustomSizes = { ...spacingRules.customSizes };
		delete newCustomSizes[name];
		onChange({
			...spacingRules,
			customSizes: newCustomSizes,
		});
	};

	const updateBreakpointMultiplier = (
		breakpoint: string,
		multiplier: number,
	) => {
		onChange({
			...spacingRules,
			breakpoints: {
				...spacingRules.breakpoints,
				[breakpoint]: { multiplier },
			},
		});
	};

	const generateCSS = () => {
		let css = ":root {\n";

		// Base spacing variables
		spacingRules.scale.forEach((size, index) => {
			css += `  --spacing-${index + 1}: ${size}px;\n`;
		});

		// Custom spacing variables
		if (spacingRules.customSizes) {
			Object.entries(spacingRules.customSizes).forEach(([name, value]) => {
				css += `  --spacing-${name}: ${value}px;\n`;
			});
		}

		css += "}\n\n";

		// Utility classes
		css += "/* Spacing utility classes */\n";
		spacingRules.scale.forEach((size, index) => {
			const token = index + 1;
			css += `.m-${token} { margin: ${size}px; }\n`;
			css += `.p-${token} { padding: ${size}px; }\n`;
			css += `.mt-${token} { margin-top: ${size}px; }\n`;
			css += `.mb-${token} { margin-bottom: ${size}px; }\n`;
			css += `.ml-${token} { margin-left: ${size}px; }\n`;
			css += `.mr-${token} { margin-right: ${size}px; }\n`;
			css += `.pt-${token} { padding-top: ${size}px; }\n`;
			css += `.pb-${token} { padding-bottom: ${size}px; }\n`;
			css += `.pl-${token} { padding-left: ${size}px; }\n`;
			css += `.pr-${token} { padding-right: ${size}px; }\n`;
		});

		return css;
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const renderSpacingPreview = () => {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{spacingRules.scale.slice(0, 9).map((size, index) => (
						<div key={index} className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">{index + 1}</span>
								<span className="text-base-content/60 text-sm">{size}px</span>
							</div>
							<div
								className="rounded border border-primary/20 bg-primary/10"
								style={{
									height: `${Math.min(size, 64)}px`,
									width: "100%",
								}}
							/>
							<div className="text-center">
								<div
									className="badge badge-outline cursor-pointer"
									onClick={() => copyToClipboard(`${size}px`)}
								>
									{size}px
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			{/* Spacing System Overview */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="flex items-center gap-2 font-semibold text-lg">
						<Ruler size={20} />
						Spacing System
					</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="form-control">
							<label className="label">
								<span className="label-text">System Preset</span>
							</label>
							<select 
								className="select select-bordered"
								value={selectedPreset}
								onChange={(e) => handlePresetChange(e.target.value)}
							>
								<option value="">Choose a spacing system</option>
								{Object.entries(SPACING_PRESETS).map(([key, preset]) => (
									<option key={key} value={key}>
										{key} - {preset.description}
									</option>
								))}
							</select>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Base Unit (px)</span>
							</label>
							<input
								type="range"
								min="2"
								max="16"
								step="1"
								value={spacingRules.baseUnit}
								onChange={(e) => handleBaseUnitChange(parseInt(e.target.value))}
								className="range range-sm"
							/>
							<div className="text-center mt-1">
								<span className="text-base-content/60 text-sm">
									{spacingRules.baseUnit}px
								</span>
							</div>
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">System Description</span>
						</label>
						<textarea
							className="textarea textarea-bordered"
							placeholder="Describe your spacing system philosophy..."
							value={spacingRules.description}
							onChange={(e) => onChange({ ...spacingRules, description: e.target.value })}
							rows={2}
						/>
					</div>
				</div>
			</div>

			{/* Spacing Scale */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="font-semibold text-lg">Spacing Scale</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{spacingRules.scale.map((size, index) => (
							<div key={index} className="form-control">
								<label className="label">
									<span className="label-text">Token {index + 1}</span>
								</label>
								<div className="relative">
									<input
										type="number"
										value={size.toString()}
										onChange={(e) => handleScaleChange(index, parseInt(e.target.value) || 0)}
										className="input input-bordered pr-10"
									/>
									<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-sm">
										px
									</span>
								</div>
							</div>
						))}
					</div>

					<div className="flex gap-2">
						<button
							className="btn btn-sm btn-outline gap-2"
							onClick={() => {
								const newSize =
									(spacingRules.scale[spacingRules.scale.length - 1] || 16) *
									1.5;
								onChange({
									...spacingRules,
									scale: [...spacingRules.scale, Math.round(newSize)],
								});
							}}
						>
							<Plus size={14} />
							Add Size
						</button>
						<button
							className="btn btn-sm btn-outline gap-2"
							onClick={() => {
								if (spacingRules.scale.length > 1) {
									onChange({
										...spacingRules,
										scale: spacingRules.scale.slice(0, -1),
									});
								}
							}}
							disabled={spacingRules.scale.length <= 1}
						>
							<Trash2 size={14} />
							Remove Last
						</button>
					</div>
				</div>
			</div>

			{/* Visual Preview */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="font-semibold text-lg">Visual Preview</h3>
				</div>
				<div className="card-body">{renderSpacingPreview()}</div>
			</div>

			{/* Custom Spacing */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="font-semibold text-lg">Custom Spacing</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="flex gap-2">
						<input
							type="text"
							placeholder="Name (e.g., 'section')"
							value={customSpacingName}
							onChange={(e) => setCustomSpacingName(e.target.value)}
							className="input input-bordered flex-1"
						/>
						<div className="relative w-32">
							<input
								type="number"
								placeholder="Value"
								value={customSpacingValue.toString()}
								onChange={(e) => setCustomSpacingValue(parseInt(e.target.value) || 0)}
								className="input input-bordered pr-10 w-full"
							/>
							<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-sm">
								px
							</span>
						</div>
						<button
							className="btn btn-primary"
							onClick={addCustomSpacing}
							disabled={!customSpacingName.trim()}
						>
							Add
						</button>
					</div>

					{spacingRules.customSizes &&
						Object.keys(spacingRules.customSizes).length > 0 && (
							<div className="space-y-2">
								<h4 className="font-medium">Custom Sizes</h4>
								<div className="flex flex-wrap gap-2">
									{Object.entries(spacingRules.customSizes).map(
										([name, value]) => (
											<div key={name} className="badge badge-outline gap-2">
												{name}: {value}px
												<button
													className="btn btn-xs btn-ghost btn-circle"
													onClick={() => removeCustomSpacing(name)}
												>
													<Trash2 size={10} />
												</button>
											</div>
										),
									)}
								</div>
							</div>
						)}
				</div>
			</div>

			{/* Responsive Spacing */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="font-semibold text-lg">Responsive Multipliers</h3>
				</div>
				<div className="card-body space-y-4">
					<p className="text-base-content/60 text-sm">
						Adjust spacing for different screen sizes by applying multipliers
					</p>

					{Object.entries(BREAKPOINTS).map(([key, breakpoint]) => (
						<div key={key} className="flex items-center gap-4">
							<div className="w-20">
								<p className="font-medium text-sm">{breakpoint.label}</p>
								<p className="text-base-content/60 text-xs">
									≤{breakpoint.maxWidth}px
								</p>
							</div>
							<div className="flex-1">
								<input
									type="range"
									min="0.5"
									max="2"
									step="0.1"
									value={spacingRules.breakpoints?.[key]?.multiplier || 1}
									onChange={(e) => updateBreakpointMultiplier(key, parseFloat(e.target.value))}
									className="range range-sm max-w-md"
								/>
							</div>
							<div className="w-16 text-right">
								<span className="text-sm">
									{(spacingRules.breakpoints?.[key]?.multiplier || 1).toFixed(1)}x
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* CSS Output */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300 flex justify-between items-center">
					<h3 className="font-semibold text-lg">CSS Variables & Utilities</h3>
					<button
						className="btn btn-sm btn-outline gap-2"
						onClick={() => copyToClipboard(generateCSS())}
					>
						<Copy size={14} />
						Copy CSS
					</button>
				</div>
				<div className="card-body">
					<pre className="max-h-64 overflow-auto rounded-lg bg-base-200 p-4 text-sm">
						{generateCSS()}
					</pre>
				</div>
			</div>

			{/* Usage Examples */}
			<div className="card bg-base-100 shadow">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="font-semibold text-lg">Usage Examples</h3>
				</div>
				<div className="card-body space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<h4 className="mb-2 font-medium">CSS Custom Properties</h4>
							<pre className="rounded bg-base-200 p-3 text-sm">
								{`.card {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}`}
							</pre>
						</div>
						<div>
							<h4 className="mb-2 font-medium">Utility Classes</h4>
							<pre className="rounded bg-base-200 p-3 text-sm">
								{`<div class="p-4 mb-6">
  <h2 class="mb-3">Title</h2>
  <p class="mb-2">Content</p>
</div>`}
							</pre>
						</div>
					</div>

					<div>
						<h4 className="mb-2 font-medium">Component Examples</h4>
						<div className="space-y-3 rounded-lg border border-base-300 p-4">
							<div className="rounded bg-primary/10 p-4">
								<h5 className="mb-2 font-medium">Card Component</h5>
								<p className="mb-3 text-base-content/70 text-sm">
									This card uses spacing-4 for padding and spacing-3 for element
									separation.
								</p>
								<button className="btn btn-sm">Action</button>
							</div>
							<div className="rounded bg-secondary/10 p-6">
								<h5 className="mb-4 font-medium">Section Component</h5>
								<p className="text-base-content/70 text-sm">
									This section uses spacing-6 for larger padding to create clear
									visual hierarchy.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
