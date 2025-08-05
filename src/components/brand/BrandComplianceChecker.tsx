"use client";
import {
	AlertTriangle,
	CheckCircle,
	Download,
	Eye,
	FileText,
	Image as ImageIcon,
	Info,
	Palette,
	RefreshCw,
	Ruler,
	Settings,
	Type,
	XCircle,
	Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface ComplianceCheck {
	id: string;
	name: string;
	category: "color" | "typography" | "logo" | "spacing" | "general";
	status: "pass" | "fail" | "warning" | "info";
	score: number;
	message: string;
	details?: string;
	suggestion?: string;
	autoFixable?: boolean;
}

interface ComplianceReport {
	assetId: string;
	guidelineId: string;
	overallScore: number;
	checks: ComplianceCheck[];
	generatedAt: Date;
	executionTime: number;
	metadata: {
		assetType: string;
		fileSize: number;
		dimensions?: { width: number; height: number };
		colorCount?: number;
		fontCount?: number;
	};
}

interface BrandComplianceCheckerProps {
	assetId?: string;
	guidelineId?: string;
	onComplianceChange?: (report: ComplianceReport) => void;
}

const CATEGORY_CONFIG = {
	color: {
		icon: Palette,
		label: "Color Compliance",
		description: "Brand color usage and accessibility",
		color: "primary" as const,
	},
	typography: {
		icon: Type,
		label: "Typography",
		description: "Font usage and text formatting",
		color: "secondary" as const,
	},
	logo: {
		icon: ImageIcon,
		label: "Logo Usage",
		description: "Logo placement and sizing rules",
		color: "success" as const,
	},
	spacing: {
		icon: Ruler,
		label: "Spacing & Layout",
		description: "Grid system and spacing compliance",
		color: "warning" as const,
	},
	general: {
		icon: FileText,
		label: "General Rules",
		description: "File format and technical requirements",
		color: "default" as const,
	},
};

const STATUS_CONFIG = {
	pass: { color: "success" as const, icon: CheckCircle, label: "Passed" },
	fail: { color: "danger" as const, icon: XCircle, label: "Failed" },
	warning: { color: "warning" as const, icon: AlertTriangle, label: "Warning" },
	info: { color: "default" as const, icon: Info, label: "Info" },
};

export function BrandComplianceChecker({
	assetId,
	guidelineId,
	onComplianceChange,
}: BrandComplianceCheckerProps) {
	const [isChecking, setIsChecking] = useState(false);
	const [report, setReport] = useState<ComplianceReport | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [autoFixEnabled, setAutoFixEnabled] = useState(true);

	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const onDetailOpen = () => setIsDetailOpen(true);
	const onDetailClose = () => setIsDetailOpen(false);
	const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(
		null,
	);

	// Mock compliance report for demonstration
	const mockReport: ComplianceReport = {
		assetId: assetId || "mock-asset",
		guidelineId: guidelineId || "mock-guideline",
		overallScore: 78,
		generatedAt: new Date(),
		executionTime: 1240,
		metadata: {
			assetType: "image/png",
			fileSize: 2048000,
			dimensions: { width: 1920, height: 1080 },
			colorCount: 8,
			fontCount: 2,
		},
		checks: [
			{
				id: "color-primary",
				name: "Primary Color Usage",
				category: "color",
				status: "pass",
				score: 100,
				message: "Primary brand colors used correctly",
				details:
					"All primary colors match the brand palette within acceptable tolerance (±2 ΔE).",
			},
			{
				id: "color-contrast",
				name: "Color Contrast Ratio",
				category: "color",
				status: "warning",
				score: 65,
				message: "Some text may not meet WCAG AA standards",
				details:
					"Contrast ratio of 3.8:1 found on secondary text. WCAG AA requires 4.5:1.",
				suggestion: "Increase text color darkness or use a lighter background",
				autoFixable: true,
			},
			{
				id: "typography-font",
				name: "Font Family Compliance",
				category: "typography",
				status: "fail",
				score: 0,
				message: "Unauthorized font detected",
				details:
					"Arial detected in body text. Brand guidelines specify using Inter or Helvetica.",
				suggestion: "Replace Arial with Inter or Helvetica Neue",
				autoFixable: true,
			},
			{
				id: "typography-hierarchy",
				name: "Typography Hierarchy",
				category: "typography",
				status: "pass",
				score: 90,
				message: "Proper heading hierarchy maintained",
				details:
					"H1, H2, H3 tags used in correct order with appropriate size scaling.",
			},
			{
				id: "logo-clearspace",
				name: "Logo Clear Space",
				category: "logo",
				status: "fail",
				score: 20,
				message: "Insufficient clear space around logo",
				details:
					"Logo has only 8px clear space. Brand guidelines require minimum 24px.",
				suggestion: "Increase padding around logo to 24px minimum",
				autoFixable: true,
			},
			{
				id: "logo-size",
				name: "Logo Minimum Size",
				category: "logo",
				status: "pass",
				score: 100,
				message: "Logo meets minimum size requirements",
				details:
					"Logo height is 32px, exceeding the minimum requirement of 16px.",
			},
			{
				id: "spacing-grid",
				name: "Grid System Alignment",
				category: "spacing",
				status: "warning",
				score: 75,
				message: "Some elements not aligned to 8px grid",
				details: "3 elements found with non-grid-aligned positioning.",
				suggestion: "Align elements to 8px baseline grid",
				autoFixable: true,
			},
			{
				id: "file-format",
				name: "File Format Compliance",
				category: "general",
				status: "pass",
				score: 100,
				message: "Approved file format",
				details: "PNG format is approved for web graphics in brand guidelines.",
			},
			{
				id: "file-size",
				name: "File Size Optimization",
				category: "general",
				status: "info",
				score: 85,
				message: "File could be optimized",
				details:
					"Current size: 2MB. Could be reduced to ~1.2MB with optimization.",
				suggestion: "Use image compression tools to reduce file size",
				autoFixable: true,
			},
		],
	};

	useEffect(() => {
		if (assetId && guidelineId) {
			runComplianceCheck();
		}
	}, [assetId, guidelineId]);

	const runComplianceCheck = async () => {
		setIsChecking(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setReport(mockReport);
		onComplianceChange?.(mockReport);
		setIsChecking(false);
	};

	const handleAutoFix = async (checkId: string) => {
		console.log("Auto-fixing check:", checkId);
		// TODO: Implement auto-fix functionality

		// Simulate auto-fix
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Update the check status
		if (report) {
			const updatedChecks = report.checks.map((check) =>
				check.id === checkId
					? {
							...check,
							status: "pass" as const,
							score: 100,
							message: "Auto-fixed successfully",
						}
					: check,
			);

			const newScore = Math.round(
				updatedChecks.reduce((sum, check) => sum + check.score, 0) /
					updatedChecks.length,
			);

			const updatedReport = {
				...report,
				checks: updatedChecks,
				overallScore: newScore,
				generatedAt: new Date(),
			};

			setReport(updatedReport);
			onComplianceChange?.(updatedReport);
		}
	};

	const handleViewDetails = (check: ComplianceCheck) => {
		setSelectedCheck(check);
		onDetailOpen();
	};

	const getScoreColor = (score: number) => {
		if (score >= 90) return "success";
		if (score >= 70) return "warning";
		return "danger";
	};

	const getCategoryChecks = (category: string) => {
		if (!report) return [];
		if (category === "all") return report.checks;
		return report.checks.filter((check) => check.category === category);
	};

	const getCategoryScore = (category: string) => {
		const checks = getCategoryChecks(category);
		if (checks.length === 0) return 0;
		return Math.round(
			checks.reduce((sum, check) => sum + check.score, 0) / checks.length,
		);
	};

	const getStatusCounts = () => {
		if (!report) return { pass: 0, fail: 0, warning: 0, info: 0 };

		const counts = { pass: 0, fail: 0, warning: 0, info: 0 };
		report.checks.forEach((check) => {
			counts[check.status]++;
		});
		return counts;
	};

	const statusCounts = getStatusCounts();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">Brand Compliance Checker</h2>
					<p className="text-default-500 text-small">
						Automated brand guideline compliance analysis
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="flat" startContent={<Settings size={16} />}>
						Configure
					</Button>
					<Button
						color="primary"
						startContent={<RefreshCw size={16} />}
						onPress={runComplianceCheck}
						isLoading={isChecking}
						isDisabled={!assetId || !guidelineId}
					>
						{isChecking ? "Analyzing..." : "Run Check"}
					</Button>
				</div>
			</div>

			{/* Overall Score */}
			{report && (
				<Card>
					<CardBody className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-lg">
									Overall Compliance Score
								</h3>
								<p className="text-default-500 text-small">
									Last checked {report.generatedAt.toLocaleString()}
								</p>
							</div>
							<div className="text-right">
								<p
									className={`font-bold text-3xl text-${getScoreColor(report.overallScore)}`}
								>
									{report.overallScore}%
								</p>
								<p className="text-default-500 text-small">
									{report.executionTime}ms execution time
								</p>
							</div>
						</div>

						<Progress
							value={report.overallScore}
							color={getScoreColor(report.overallScore)}
							size="lg"
							showValueLabel
						/>

						{/* Status Summary */}
						<div className="grid grid-cols-4 gap-4">
							{Object.entries(statusCounts).map(([status, count]) => {
								const config =
									STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
								const StatusIcon = config.icon;
								return (
									<div key={status} className="flex items-center gap-2">
										<StatusIcon size={16} className={`text-${config.color}`} />
										<span className="text-small">
											{count} {config.label}
										</span>
									</div>
								);
							})}
						</div>

						{/* Quick Actions */}
						<div className="flex gap-2">
							<Button
								size="sm"
								color="primary"
								startContent={<Zap size={14} />}
								onPress={() => {
									// Auto-fix all fixable issues
									const fixableChecks = report.checks.filter(
										(check) => check.autoFixable && check.status !== "pass",
									);
									fixableChecks.forEach((check) => handleAutoFix(check.id));
								}}
								isDisabled={
									!report.checks.some(
										(check) => check.autoFixable && check.status !== "pass",
									)
								}
							>
								Auto-Fix All (
								{
									report.checks.filter(
										(check) => check.autoFixable && check.status !== "pass",
									).length
								}
								)
							</Button>
							<Button
								size="sm"
								variant="flat"
								startContent={<Download size={14} />}
							>
								Export Report
							</Button>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Category Breakdown */}
			{report && (
				<Card>
					<CardHeader>
						<h3 className="font-semibold text-lg">Compliance Breakdown</h3>
					</CardHeader>
					<CardBody>
						<Tabs
							selectedKey={selectedCategory}
							onSelectionChange={(key) => setSelectedCategory(key as string)}
							className="w-full"
						>
							<Tab key="all" title="All Checks">
								<div className="space-y-4">
									{Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
										const categoryChecks = getCategoryChecks(category);
										const categoryScore = getCategoryScore(category);
										const CategoryIcon = config.icon;

										return (
											<Card
												key={category}
												className="border border-default-200"
											>
												<CardBody className="space-y-3">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<CategoryIcon
																size={20}
																className={`text-${config.color}`}
															/>
															<div>
																<h4 className="font-medium">{config.label}</h4>
																<p className="text-default-500 text-small">
																	{config.description}
																</p>
															</div>
														</div>
														<div className="text-right">
															<p
																className={`font-bold text-xl text-${getScoreColor(categoryScore)}`}
															>
																{categoryScore}%
															</p>
															<p className="text-default-500 text-small">
																{categoryChecks.length} checks
															</p>
														</div>
													</div>
													<Progress
														value={categoryScore}
														color={getScoreColor(categoryScore)}
														size="sm"
													/>
												</CardBody>
											</Card>
										);
									})}
								</div>
							</Tab>

							{Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
								<Tab key={category} title={config.label}>
									<div className="space-y-3">
										{getCategoryChecks(category).map((check) => {
											const StatusIcon = STATUS_CONFIG[check.status].icon;
											return (
												<Card
													key={check.id}
													className="border border-default-200"
												>
													<CardBody className="space-y-3">
														<div className="flex items-start justify-between">
															<div className="flex flex-1 items-start gap-3">
																<StatusIcon
																	size={20}
																	className={`text-${STATUS_CONFIG[check.status].color} mt-0.5`}
																/>
																<div className="flex-1">
																	<h5 className="font-medium">{check.name}</h5>
																	<p className="text-default-600 text-small">
																		{check.message}
																	</p>
																	{check.suggestion && (
																		<p className="mt-1 text-primary text-small">
																			💡 {check.suggestion}
																		</p>
																	)}
																</div>
															</div>
															<div className="ml-4 flex items-center gap-2">
																<Chip
																	size="sm"
																	color={getScoreColor(check.score)}
																	variant="flat"
																>
																	{check.score}%
																</Chip>
																<Button
																	size="sm"
																	variant="flat"
																	onPress={() => handleViewDetails(check)}
																>
																	<Eye size={12} />
																</Button>
																{check.autoFixable &&
																	check.status !== "pass" && (
																		<Button
																			size="sm"
																			color="primary"
																			onPress={() => handleAutoFix(check.id)}
																		>
																			<Zap size={12} />
																			Fix
																		</Button>
																	)}
															</div>
														</div>
													</CardBody>
												</Card>
											);
										})}
									</div>
								</Tab>
							))}
						</Tabs>
					</CardBody>
				</Card>
			)}

			{/* Asset Requirements */}
			{!assetId || !guidelineId ? (
				<Card>
					<CardBody className="py-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
							<FileText size={24} className="text-default-400" />
						</div>
						<h3 className="mb-2 font-semibold text-large">
							Ready to Check Compliance
						</h3>
						<p className="mb-4 text-default-500 text-small">
							Select an asset and brand guideline to run compliance analysis
						</p>
						<div className="flex justify-center gap-4">
							<Select placeholder="Select Asset" className="w-48">
								<SelectItem key="asset1">Marketing Banner</SelectItem>
								<SelectItem key="asset2">Product Photo</SelectItem>
							</Select>
							<Select placeholder="Select Guideline" className="w-48">
								<SelectItem key="guide1">Primary Brand Guidelines</SelectItem>
								<SelectItem key="guide2">Secondary Guidelines</SelectItem>
							</Select>
						</div>
					</CardBody>
				</Card>
			) : null}

			{/* Detail Modal */}
			<Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
				<ModalContent>
					{selectedCheck && (
						<>
							<ModalHeader>
								<div className="flex items-center gap-2">
									{React.createElement(
										STATUS_CONFIG[selectedCheck.status].icon,
										{
											size: 20,
											className: `text-${STATUS_CONFIG[selectedCheck.status].color}`,
										},
									)}
									{selectedCheck.name}
								</div>
							</ModalHeader>
							<ModalBody className="space-y-4">
								<div>
									<h4 className="mb-2 font-medium">Status</h4>
									<Chip
										color={STATUS_CONFIG[selectedCheck.status].color}
										variant="flat"
									>
										{STATUS_CONFIG[selectedCheck.status].label} -{" "}
										{selectedCheck.score}%
									</Chip>
								</div>

								<div>
									<h4 className="mb-2 font-medium">Message</h4>
									<p className="text-default-600">{selectedCheck.message}</p>
								</div>

								{selectedCheck.details && (
									<div>
										<h4 className="mb-2 font-medium">Details</h4>
										<p className="text-default-600 text-small">
											{selectedCheck.details}
										</p>
									</div>
								)}

								{selectedCheck.suggestion && (
									<div>
										<h4 className="mb-2 font-medium">Suggestion</h4>
										<p className="text-primary text-small">
											{selectedCheck.suggestion}
										</p>
									</div>
								)}
							</ModalBody>
							<ModalFooter>
								<Button variant="flat" onPress={onDetailClose}>
									Close
								</Button>
								{selectedCheck.autoFixable &&
									selectedCheck.status !== "pass" && (
										<Button
											color="primary"
											startContent={<Zap size={16} />}
											onPress={() => {
												handleAutoFix(selectedCheck.id);
												onDetailClose();
											}}
										>
											Auto-Fix
										</Button>
									)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
