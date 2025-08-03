"use client";

import {
	Check,
	Download,
	Eye,
	Monitor,
	Moon,
	Paintbrush,
	Palette,
	RefreshCw,
	RotateCcw,
	Settings,
	Sun,
	Upload,
	X,
	Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import {
	type ThemeConfig,
	themePresets,
	useTheme,
	useThemeConfig,
} from "~/contexts";
import { useModal } from "~/hooks/useModal";

interface ThemeSettingsProps {
	onClose?: () => void;
}

interface ColorPreview {
	name: string;
	value: string;
	description: string;
}

export function ThemeSettings({ onClose }: ThemeSettingsProps) {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const { config, updateConfig, resetConfig } = useThemeConfig();
	const [selectedPreset, setSelectedPreset] = useState("default");
	const [customConfig, setCustomConfig] = useState<ThemeConfig>(config);
	const [previewMode, setPreviewMode] = useState(false);
	const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'spacing' | 'borders'>('general');

	const {
		isOpen: isImportModalOpen,
		onOpen: onImportModalOpen,
		onClose: onImportModalClose,
	} = useModal();

	const {
		isOpen: isExportModalOpen,
		onOpen: onExportModalOpen,
		onClose: onExportModalClose,
	} = useModal();

	const importModalRef = useRef<HTMLDialogElement>(null);
	const exportModalRef = useRef<HTMLDialogElement>(null);

	const [importData, setImportData] = useState("");
	const [exportData, setExportData] = useState("");

	const themeOptions = [
		{ value: "light", label: "Light", icon: <Sun size={16} /> },
		{ value: "dark", label: "Dark", icon: <Moon size={16} /> },
		{ value: "system", label: "System", icon: <Monitor size={16} /> },
	];

	const presetOptions = Object.keys(themePresets).map((key) => ({
		value: key,
		label: key.charAt(0).toUpperCase() + key.slice(1),
		config: themePresets[key as keyof typeof themePresets],
	}));

	const colorPreview: ColorPreview[] = [
		{
			name: "primary",
			value: customConfig.colors.primary,
			description: "Primary brand color",
		},
		{
			name: "secondary",
			value: customConfig.colors.secondary,
			description: "Secondary accent color",
		},
		{
			name: "success",
			value: customConfig.colors.success,
			description: "Success state color",
		},
		{
			name: "warning",
			value: customConfig.colors.warning,
			description: "Warning state color",
		},
		{
			name: "danger",
			value: customConfig.colors.danger,
			description: "Error state color",
		},
		{
			name: "background",
			value: customConfig.colors.background,
			description: "Main background",
		},
		{
			name: "foreground",
			value: customConfig.colors.foreground,
			description: "Text color",
		},
	];

	const handlePresetChange = (presetKey: string) => {
		setSelectedPreset(presetKey);
		const preset = themePresets[presetKey as keyof typeof themePresets];
		if (preset) {
			const newConfig = preset[resolvedTheme];
			setCustomConfig(newConfig);
			if (!previewMode) {
				updateConfig(newConfig);
			}
		}
	};

	const handleColorChange = (
		colorKey: keyof ThemeConfig["colors"],
		value: string,
	) => {
		const newConfig = {
			...customConfig,
			colors: {
				...customConfig.colors,
				[colorKey]: value,
			},
		};
		setCustomConfig(newConfig);
		if (!previewMode) {
			updateConfig({ colors: { ...customConfig.colors, [colorKey]: value } });
		}
	};

	const handleSpacingChange = (value: number) => {
		const newSpacing = {
			unit: value,
			small: `${value * 2}px`,
			medium: `${value * 4}px`,
			large: `${value * 6}px`,
		};
		const newConfig = { ...customConfig, spacing: newSpacing };
		setCustomConfig(newConfig);
		if (!previewMode) {
			updateConfig({ spacing: newSpacing });
		}
	};

	const handleBorderRadiusChange = (
		size: keyof ThemeConfig["borderRadius"],
		value: string,
	) => {
		const newConfig = {
			...customConfig,
			borderRadius: {
				...customConfig.borderRadius,
				[size]: value,
			},
		};
		setCustomConfig(newConfig);
		if (!previewMode) {
			updateConfig({
				borderRadius: { ...customConfig.borderRadius, [size]: value },
			});
		}
	};

	const applyPreview = () => {
		updateConfig(customConfig);
		setPreviewMode(false);
	};

	const cancelPreview = () => {
		setCustomConfig(config);
		setPreviewMode(false);
	};

	const handleReset = () => {
		resetConfig();
		setCustomConfig(config);
		setSelectedPreset("default");
		setPreviewMode(false);
	};

	const handleExport = () => {
		const exportConfig = {
			theme,
			config: customConfig,
			timestamp: new Date().toISOString(),
		};
		setExportData(JSON.stringify(exportConfig, null, 2));
		onExportModalOpen();
		exportModalRef.current?.showModal();
	};

	const handleImport = () => {
		try {
			const importedData = JSON.parse(importData);
			if (importedData.config && importedData.theme) {
				setTheme(importedData.theme);
				setCustomConfig(importedData.config);
				updateConfig(importedData.config);
				setImportData("");
				onImportModalClose();
				importModalRef.current?.close();
			}
		} catch (error) {
			console.error("Invalid theme data:", error);
		}
	};

	const downloadExport = () => {
		const blob = new Blob([exportData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `brand-portal-theme-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		onExportModalClose();
		exportModalRef.current?.close();
	};

	const openImportModal = () => {
		onImportModalOpen();
		importModalRef.current?.showModal();
	};

	const closeImportModal = () => {
		onImportModalClose();
		importModalRef.current?.close();
	};

	const closeExportModal = () => {
		onExportModalClose();
		exportModalRef.current?.close();
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-xl">
						<Palette size={24} className="text-primary" />
						Theme Customization
					</h2>
					<p className="text-default-500 text-small">
						Customize colors, spacing, and visual appearance
					</p>
				</div>
				<div className="flex items-center gap-2">
					{previewMode && (
						<>
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={cancelPreview}
							>
								<X size={16} />
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-primary btn-sm"
								onClick={applyPreview}
							>
								<Check size={16} />
								Apply
							</button>
						</>
					)}
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						onClick={handleExport}
					>
						<Download size={16} />
						Export
					</button>
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						onClick={openImportModal}
					>
						<Upload size={16} />
						Import
					</button>
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						onClick={handleReset}
					>
						<RotateCcw size={16} />
						Reset
					</button>
				</div>
			</div>

			{/* Preview Mode Banner */}
			{previewMode && (
				<div className="card bg-warning/10 border border-warning">
					<div className="card-body py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Eye size={16} className="text-warning" />
								<span className="font-medium text-sm">Preview Mode</span>
								<span className="badge badge-warning badge-sm">
									Changes not saved
								</span>
							</div>
							<div className="flex items-center gap-2">
								<button type="button" className="btn btn-ghost btn-sm" onClick={cancelPreview}>
									Cancel
								</button>
								<button type="button" className="btn btn-primary btn-sm" onClick={applyPreview}>
									Apply Changes
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="w-full">
				{/* Tab Navigation */}
				<div className="tabs tabs-bordered w-full mb-6">
					<button 
						type="button"
						className={`tab tab-lifted ${activeTab === 'general' ? 'tab-active' : ''}`}
						onClick={() => setActiveTab('general')}
					>
						General
					</button>
					<button 
						type="button"
						className={`tab tab-lifted ${activeTab === 'colors' ? 'tab-active' : ''}`}
						onClick={() => setActiveTab('colors')}
					>
						Colors
					</button>
					<button 
						type="button"
						className={`tab tab-lifted ${activeTab === 'spacing' ? 'tab-active' : ''}`}
						onClick={() => setActiveTab('spacing')}
					>
						Spacing
					</button>
					<button 
						type="button"
						className={`tab tab-lifted ${activeTab === 'borders' ? 'tab-active' : ''}`}
						onClick={() => setActiveTab('borders')}
					>
						Borders
					</button>
				</div>

				{/* Tab Content */}
				{activeTab === 'general' && (
					<div className="space-y-6 pt-4">
						{/* Theme Mode */}
						<div className="card bg-base-100 shadow-md">
							<div className="card-header p-4">
								<h3 className="card-title text-lg font-semibold">Theme Mode</h3>
							</div>
							<div className="card-body">
								<div className="space-y-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Theme</span>
										</label>
										<select
											className="select select-bordered w-full"
											value={theme}
											onChange={(e) => setTheme(e.target.value as any)}
										>
											{themeOptions.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
									<p className="text-sm text-base-content/70">
										Currently using:{" "}
										<span className="badge badge-ghost">{resolvedTheme}</span>
									</p>
								</div>
							</div>
						</div>

						{/* Presets */}
						<div className="card bg-base-100 shadow-md">
							<div className="card-header p-4">
								<h3 className="card-title text-lg font-semibold">Theme Presets</h3>
							</div>
							<div className="card-body">
								<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
									{presetOptions.map((preset) => (
										<button
											key={preset.value}
											type="button"
											className={`btn h-auto p-3 ${
												selectedPreset === preset.value 
													? "btn-primary" 
													: "btn-ghost"
											}`}
											onClick={() => handlePresetChange(preset.value)}
										>
											<div className="flex flex-col items-center gap-2">
												<div className="flex gap-1">
													<div
														className="h-3 w-3 rounded-full"
														style={{
															backgroundColor:
																preset.config[resolvedTheme].colors.primary,
														}}
													/>
													<div
														className="h-3 w-3 rounded-full"
														style={{
															backgroundColor:
																preset.config[resolvedTheme].colors.secondary,
														}}
													/>
													<div
														className="h-3 w-3 rounded-full"
														style={{
															backgroundColor:
																preset.config[resolvedTheme].colors.success,
														}}
													/>
												</div>
												<span className="text-sm">{preset.label}</span>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'colors' && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow-md">
							<div className="card-header p-4">
								<h3 className="card-title text-lg font-semibold">Color Palette</h3>
							</div>
							<div className="card-body">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{colorPreview.map((color) => (
										<div key={color.name} className="space-y-2">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium capitalize">{color.name}</p>
													<p className="text-base-content/70 text-sm">
														{color.description}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<div
														className="h-8 w-8 rounded border"
														style={{ backgroundColor: color.value }}
													/>
													<input
														type="text"
														className="input input-bordered input-sm w-24"
														value={color.value}
														onChange={(e) =>
															handleColorChange(
																color.name as keyof ThemeConfig["colors"],
																e.target.value,
															)
														}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'spacing' && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow-md">
							<div className="card-header p-4">
								<h3 className="card-title text-lg font-semibold">Spacing Scale</h3>
							</div>
							<div className="card-body">
								<div className="space-y-6">
									<div>
										<p className="mb-2 font-medium">Base Unit</p>
										<input
											type="range"
											min="2"
											max="8"
											step="1"
											value={customConfig.spacing.unit}
											onChange={(e) => handleSpacingChange(parseInt(e.target.value))}
											className="range range-primary w-full"
										/>
										<div className="mt-2 flex justify-between text-base-content/70 text-sm">
											<span>2px</span>
											<span>Current: {customConfig.spacing.unit}px</span>
											<span>8px</span>
										</div>
									</div>
									<div className="divider" />
									<div className="space-y-3">
										<p className="font-medium">Preview</p>
										<div className="space-y-2">
											<div className="flex items-center gap-4">
												<span className="w-16 text-sm">Small:</span>
												<div
													className="h-4 bg-primary"
													style={{ width: customConfig.spacing.small }}
												/>
												<span className="text-base-content/70 text-sm">
													{customConfig.spacing.small}
												</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="w-16 text-sm">Medium:</span>
												<div
													className="h-4 bg-primary"
													style={{ width: customConfig.spacing.medium }}
												/>
												<span className="text-base-content/70 text-sm">
													{customConfig.spacing.medium}
												</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="w-16 text-sm">Large:</span>
												<div
													className="h-4 bg-primary"
													style={{ width: customConfig.spacing.large }}
												/>
												<span className="text-base-content/70 text-sm">
													{customConfig.spacing.large}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'borders' && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow-md">
							<div className="card-header p-4">
								<h3 className="card-title text-lg font-semibold">Border Radius</h3>
							</div>
							<div className="card-body">
								<div className="space-y-4">
									{Object.entries(customConfig.borderRadius).map(
										([size, value]) => (
											<div
												key={size}
												className="flex items-center justify-between"
											>
												<div className="flex items-center gap-4">
													<span className="w-16 capitalize">{size}:</span>
													<div
														className="h-12 w-12 bg-primary"
														style={{ borderRadius: value }}
													/>
												</div>
												<input
													type="text"
													className="input input-bordered input-sm w-24"
													value={value}
													onChange={(e) =>
														handleBorderRadiusChange(
															size as keyof ThemeConfig["borderRadius"],
															e.target.value,
														)
													}
												/>
											</div>
										),
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Import Modal */}
			<dialog 
				ref={importModalRef} 
				className="modal"
				onClick={(e) => {
					if (e.target === importModalRef.current) {
						closeImportModal();
					}
				}}
			>
				<div className="modal-box">
					<div className="modal-header">
						<h3 className="font-bold text-lg">Import Theme</h3>
						<button 
							type="button"
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={closeImportModal}
						>
							✕
						</button>
					</div>
					<div className="modal-body py-4">
						<div className="space-y-4">
							<p className="text-base-content/70 text-sm">
								Paste your theme configuration JSON below:
							</p>
							<textarea
								className="textarea textarea-bordered h-32 w-full"
								placeholder='{"theme": "dark", "config": {...}}'
								value={importData}
								onChange={(e) => setImportData(e.target.value)}
							/>
						</div>
					</div>
					<div className="modal-action">
						<button 
							type="button" 
							className="btn btn-ghost" 
							onClick={closeImportModal}
						>
							Cancel
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleImport}
							disabled={!importData.trim()}
						>
							Import Theme
						</button>
					</div>
				</div>
			</dialog>

			{/* Export Modal */}
			<dialog 
				ref={exportModalRef} 
				className="modal"
				onClick={(e) => {
					if (e.target === exportModalRef.current) {
						closeExportModal();
					}
				}}
			>
				<div className="modal-box">
					<div className="modal-header">
						<h3 className="font-bold text-lg">Export Theme</h3>
						<button 
							type="button"
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={closeExportModal}
						>
							✕
						</button>
					</div>
					<div className="modal-body py-4">
						<div className="space-y-4">
							<p className="text-base-content/70 text-sm">
								Copy the configuration below or download as a file:
							</p>
							<textarea
								className="textarea textarea-bordered h-32 w-full"
								readOnly
								value={JSON.stringify({ theme, config: customConfig }, null, 2)}
								onClick={(e) => (e.target as HTMLTextAreaElement).select()}
							/>
						</div>
					</div>
					<div className="modal-action">
						<button 
							type="button" 
							className="btn btn-ghost" 
							onClick={closeExportModal}
						>
							Close
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={downloadExport}
						>
							<Download size={16} />
							Download File
						</button>
					</div>
				</div>
			</dialog>
		</div>
	);
}
