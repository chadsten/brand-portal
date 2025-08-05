"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	Award,
	BarChart3,
	Calendar,
	Clock,
	Copy,
	Download,
	Edit,
	Eye,
	FileImage,
	FileSpreadsheet,
	FileText,
	Filter,
	Globe,
	LineChart,
	Mail,
	Pause,
	PieChart,
	Play,
	Plus,
	RefreshCw,
	Send,
	Settings,
	Share2,
	Smartphone,
	Target,
	Trash2,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";

interface ReportTemplate {
	id: string;
	name: string;
	description: string;
	category: "usage" | "performance" | "engagement" | "custom";
	type: "scheduled" | "on-demand";
	format: "pdf" | "csv" | "xlsx" | "html";
	metrics: string[];
	filters: any[];
	schedule?: {
		frequency: "daily" | "weekly" | "monthly" | "quarterly";
		time: string;
		recipients: string[];
	};
	createdAt: Date;
	lastRun?: Date;
	status: "active" | "inactive" | "draft";
	author: {
		id: string;
		name: string;
		avatar?: string;
	};
}

interface ReportingSystemProps {
	onCreateReport?: (report: Partial<ReportTemplate>) => void;
	onRunReport?: (reportId: string) => void;
	onScheduleReport?: (reportId: string, schedule: any) => void;
}

const MOCK_REPORTS: ReportTemplate[] = [
	{
		id: "1",
		name: "Monthly Usage Report",
		description: "Comprehensive monthly usage statistics and trends",
		category: "usage",
		type: "scheduled",
		format: "pdf",
		metrics: ["Total Views", "Downloads", "Active Users", "Top Assets"],
		filters: [{ type: "dateRange", value: "last-month" }],
		schedule: {
			frequency: "monthly",
			time: "09:00",
			recipients: ["admin@company.com", "manager@company.com"],
		},
		createdAt: new Date("2024-01-15"),
		lastRun: new Date("2024-03-01"),
		status: "active",
		author: { id: "1", name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
	},
	{
		id: "2",
		name: "Asset Performance Analysis",
		description: "Detailed analysis of individual asset performance",
		category: "performance",
		type: "on-demand",
		format: "xlsx",
		metrics: ["Performance Score", "Engagement Rate", "Conversion Rate"],
		filters: [{ type: "category", value: "all" }],
		createdAt: new Date("2024-02-10"),
		lastRun: new Date("2024-03-08"),
		status: "active",
		author: { id: "2", name: "Mike Johnson", avatar: "/avatars/mike.jpg" },
	},
	{
		id: "3",
		name: "User Engagement Dashboard",
		description: "Weekly user engagement and behavior insights",
		category: "engagement",
		type: "scheduled",
		format: "html",
		metrics: ["Engagement Score", "Session Duration", "Feature Usage"],
		filters: [{ type: "department", value: "marketing" }],
		schedule: {
			frequency: "weekly",
			time: "08:00",
			recipients: ["hr@company.com"],
		},
		createdAt: new Date("2024-01-20"),
		lastRun: new Date("2024-03-04"),
		status: "active",
		author: { id: "3", name: "Alex Rivera", avatar: "/avatars/alex.jpg" },
	},
	{
		id: "4",
		name: "Brand Compliance Report",
		description: "Brand compliance and guideline adherence metrics",
		category: "custom",
		type: "on-demand",
		format: "pdf",
		metrics: ["Compliance Score", "Guideline Violations", "Approval Rate"],
		filters: [{ type: "assetType", value: "brand-assets" }],
		createdAt: new Date("2024-02-28"),
		status: "draft",
		author: { id: "4", name: "Emma Wilson", avatar: "/avatars/emma.jpg" },
	},
];

const REPORT_CATEGORIES = [
	{ value: "usage", label: "Usage Analytics" },
	{ value: "performance", label: "Performance Metrics" },
	{ value: "engagement", label: "User Engagement" },
	{ value: "custom", label: "Custom Reports" },
];

const REPORT_FORMATS = [
	{ value: "pdf", label: "PDF Document", icon: <FileText size={16} /> },
	{ value: "csv", label: "CSV File", icon: <FileSpreadsheet size={16} /> },
	{
		value: "xlsx",
		label: "Excel Spreadsheet",
		icon: <FileSpreadsheet size={16} />,
	},
	{ value: "html", label: "HTML Dashboard", icon: <Globe size={16} /> },
];

const DELIVERY_METHODS = [
	{ value: "email", label: "Email", icon: <Mail size={16} /> },
	{ value: "download", label: "Download", icon: <Download size={16} /> },
	{ value: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
];

const AVAILABLE_METRICS = [
	{ value: "total-views", label: "Total Views" },
	{ value: "total-downloads", label: "Total Downloads" },
	{ value: "active-users", label: "Active Users" },
	{ value: "engagement-score", label: "Engagement Score" },
	{ value: "performance-score", label: "Performance Score" },
	{ value: "conversion-rate", label: "Conversion Rate" },
	{ value: "top-assets", label: "Top Assets" },
	{ value: "user-activity", label: "User Activity" },
	{ value: "feature-usage", label: "Feature Usage" },
	{ value: "compliance-score", label: "Compliance Score" },
];

export function ReportingSystem({
	onCreateReport,
	onRunReport,
	onScheduleReport,
}: ReportingSystemProps) {
	const [selectedTab, setSelectedTab] = useState("templates");
	const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(
		null,
	);
	const [isCreating, setIsCreating] = useState(false);
	const [newReport, setNewReport] = useState<Partial<ReportTemplate>>({
		name: "",
		description: "",
		category: "usage",
		type: "on-demand",
		format: "pdf",
		metrics: [],
		filters: [],
		status: "draft",
	});

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const onCreateModalOpen = () => setIsCreateModalOpen(true);
	const onCreateModalClose = () => setIsCreateModalOpen(false);

	const [isRunModalOpen, setIsRunModalOpen] = useState(false);
	const onRunModalOpen = () => setIsRunModalOpen(true);
	const onRunModalClose = () => setIsRunModalOpen(false);

	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
	const onScheduleModalOpen = () => setIsScheduleModalOpen(true);
	const onScheduleModalClose = () => setIsScheduleModalOpen(false);

	const handleCreateReport = () => {
		setIsCreating(true);
		// Simulate API call
		setTimeout(() => {
			onCreateReport?.(newReport);
			setIsCreating(false);
			onCreateModalClose();
			setNewReport({
				name: "",
				description: "",
				category: "usage",
				type: "on-demand",
				format: "pdf",
				metrics: [],
				filters: [],
				status: "draft",
			});
		}, 2000);
	};

	const handleRunReport = (reportId: string) => {
		onRunReport?.(reportId);
		onRunModalClose();
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "success";
			case "inactive":
				return "default";
			case "draft":
				return "warning";
			default:
				return "default";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "usage":
				return "primary";
			case "performance":
				return "secondary";
			case "engagement":
				return "success";
			case "custom":
				return "warning";
			default:
				return "default";
		}
	};

	const renderCreateReportModal = () => (
		<dialog className="modal" open={isCreateModalOpen}>
			<div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-start mb-4">
					<h3 className="font-semibold text-lg">Create New Report</h3>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onCreateModalClose}>✕</button>
				</div>
				<div className="py-4">
					<div className="space-y-6">
						{/* Basic Info */}
						<div className="space-y-4">
							<h4 className="font-semibold">Basic Information</h4>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label className="label">
										<span className="label-text">Report Name</span>
									</label>
									<input
										type="text"
										className="input"
										placeholder="Enter report name"
										value={newReport.name || ""}
										onChange={(e) =>
											setNewReport({ ...newReport, name: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="label">
										<span className="label-text">Category</span>
									</label>
									<select
										className="select"
										value={newReport.category || "usage"}
										onChange={(e) =>
											setNewReport({
												...newReport,
												category: e.target.value as any,
											})
										}
									>
										{REPORT_CATEGORIES.map((cat) => (
											<option key={cat.value} value={cat.value}>
												{cat.label}
											</option>
										))}
									</select>
								</div>
							</div>
							<div>
								<label className="label" htmlFor="report-description">Description</label>
								<textarea
									id="report-description"
									className="textarea"
									placeholder="Describe what this report covers"
									value={newReport.description || ""}
									onChange={(e) =>
										setNewReport({ ...newReport, description: e.target.value })
									}
									rows={3}
								></textarea>
							</div>
						</div>

						{/* Report Type */}
						<div className="space-y-4">
							<h4 className="font-semibold">Report Configuration</h4>
							<div>
								<fieldset>
									<legend className="label">Report Type</legend>
									<div className="flex gap-4">
										<label className="cursor-pointer label">
											<input
												id="report-type-demand"
												type="radio"
												name="reportType"
												className="radio"
												value="on-demand"
												checked={newReport.type === "on-demand"}
												onChange={(e) =>
													setNewReport({ ...newReport, type: e.target.value as any })
												}
											/>
											<span className="label-text ml-2">On-Demand</span>
										</label>
										<label className="cursor-pointer label">
											<input
												id="report-type-scheduled"
												type="radio"
												name="reportType"
												className="radio"
												value="scheduled"
												checked={newReport.type === "scheduled"}
												onChange={(e) =>
													setNewReport({ ...newReport, type: e.target.value as any })
												}
											/>
											<span className="label-text ml-2">Scheduled</span>
										</label>
									</div>
								</fieldset>
							</div>
							<div>
								<label className="label" htmlFor="report-format">Format</label>
								<select
									id="report-format"
									className="select"
									value={newReport.format || "pdf"}
									onChange={(e) =>
										setNewReport({
											...newReport,
											format: e.target.value as any,
										})
									}
								>
									{REPORT_FORMATS.map((format) => (
										<option key={format.value} value={format.value}>
											{format.label}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Metrics */}
						<div className="space-y-4">
							<h4 className="font-semibold">Metrics to Include</h4>
							<fieldset>
								<legend className="label">Metrics to Include</legend>
								<div className="grid grid-cols-2 gap-2">
									{AVAILABLE_METRICS.map((metric) => (
										<label key={metric.value} className="cursor-pointer label">
											<input
												id={`metric-${metric.value}`}
												type="checkbox"
												className="checkbox"
												value={metric.value}
												checked={newReport.metrics?.includes(metric.value) || false}
												onChange={(e) => {
													const currentMetrics = newReport.metrics || [];
													if (e.target.checked) {
														setNewReport({ 
															...newReport, 
															metrics: [...currentMetrics, metric.value] 
														});
													} else {
														setNewReport({ 
															...newReport, 
															metrics: currentMetrics.filter(m => m !== metric.value) 
														});
													}
												}}
											/>
											<span className="label-text ml-2">{metric.label}</span>
										</label>
									))}
								</div>
							</fieldset>
						</div>

						{/* Scheduling (if scheduled) */}
						{newReport.type === "scheduled" && (
							<div className="space-y-4">
								<h4 className="font-semibold">Schedule Configuration</h4>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<label className="label" htmlFor="schedule-frequency">Frequency</label>
										<select id="schedule-frequency" className="select">
											<option value="">Select frequency</option>
											<option value="daily">Daily</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
											<option value="quarterly">Quarterly</option>
										</select>
									</div>
									<div>
										<label className="label" htmlFor="schedule-time">Time</label>
										<input 
											id="schedule-time"
											type="time" 
											className="input" 
											placeholder="HH:MM" 
										/>
									</div>
								</div>
								<div>
									<label className="label" htmlFor="schedule-recipients">Recipients</label>
									<input
										id="schedule-recipients"
										type="text"
										className="input"
										placeholder="Enter email addresses (comma separated)"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onCreateModalClose}>
						Cancel
					</button>
					<button
						className={`btn btn-primary ${
							isCreating ? "loading" : ""
						}`}
						onClick={handleCreateReport}
						disabled={!newReport.name || !newReport.metrics?.length || isCreating}
					>
						{isCreating ? "Creating..." : "Create Report"}
					</button>
				</div>
			</div>
		</dialog>
	);

	const renderRunReportModal = () => (
		<dialog className="modal" open={isRunModalOpen}>
			<div className="modal-box w-11/12 max-w-2xl">
				<div className="flex justify-between items-start mb-4">
					<h3 className="font-semibold text-lg">Run Report</h3>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onRunModalClose}>✕</button>
				</div>
				<div className="py-4">
					{selectedReport && (
						<div className="space-y-4">
							<div>
								<h4 className="font-semibold">{selectedReport.name}</h4>
								<p className="text-base-content/50 text-sm">
									{selectedReport.description}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-base-content/50 text-sm">Category</p>
									<span className={`badge badge-sm ${
										getCategoryColor(selectedReport.category) === "primary" ? "badge-primary" :
										getCategoryColor(selectedReport.category) === "secondary" ? "badge-secondary" :
										getCategoryColor(selectedReport.category) === "success" ? "badge-success" :
										getCategoryColor(selectedReport.category) === "warning" ? "badge-warning" :
										"badge-neutral"
									}`}>
										{selectedReport.category}
									</span>
								</div>
								<div>
									<p className="text-base-content/50 text-sm">Format</p>
									<p className="font-medium">
										{selectedReport.format.toUpperCase()}
									</p>
								</div>
							</div>

							<div>
								<p className="mb-2 text-base-content/50 text-sm">Metrics</p>
								<div className="flex flex-wrap gap-2">
									{selectedReport.metrics.map((metric) => (
										<span key={metric} className="badge badge-sm badge-outline">
											{metric}
										</span>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-base-content/50 text-sm">Delivery Method</p>
								<div className="flex gap-4">
									{DELIVERY_METHODS.map((method) => (
										<label key={method.value} className="cursor-pointer label">
											<input
												type="radio"
												name="deliveryMethod"
												className="radio"
												value={method.value}
												defaultChecked={method.value === "download"}
											/>
											<div className="flex items-center gap-2 ml-2">
												{method.icon}
												<span>{method.label}</span>
											</div>
										</label>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onRunModalClose}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						onClick={() => selectedReport && handleRunReport(selectedReport.id)}
					>
						<Play size={16} />
						Run Report
					</button>
				</div>
			</div>
		</dialog>
	);

	const renderReportTemplates = () => (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Report Templates</h3>
					<p className="text-base-content/50 text-sm">
						Manage and create report templates
					</p>
				</div>
				<button
					className="btn btn-primary"
					onClick={onCreateModalOpen}
				>
					<Plus size={16} />
					Create Report
				</button>
			</div>

			{/* Templates Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{MOCK_REPORTS.map((report) => (
					<div key={report.id} className="card bg-base-100 shadow transition-shadow hover:shadow-lg">
						<div className="card-header p-6 pb-2">
							<div className="flex w-full items-start justify-between">
								<div className="flex-1">
									<h4 className="font-semibold">{report.name}</h4>
									<p className="mt-1 text-base-content/50 text-sm">
										{report.description}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className={`badge badge-sm ${
										getCategoryColor(report.category) === "primary" ? "badge-primary" :
										getCategoryColor(report.category) === "secondary" ? "badge-secondary" :
										getCategoryColor(report.category) === "success" ? "badge-success" :
										getCategoryColor(report.category) === "warning" ? "badge-warning" :
										"badge-neutral"
									}`}>
										{report.category}
									</span>
									<span className={`badge badge-sm ${
										getStatusColor(report.status) === "success" ? "badge-success" :
										getStatusColor(report.status) === "warning" ? "badge-warning" :
										getStatusColor(report.status) === "danger" ? "badge-error" :
										"badge-neutral"
									}`}>
										{report.status}
									</span>
								</div>
							</div>
						</div>
						<div className="card-body pt-2">
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="flex items-center gap-1">
										{report.format === "pdf" && <FileText size={14} />}
										{report.format === "csv" && <FileSpreadsheet size={14} />}
										{report.format === "xlsx" && <FileSpreadsheet size={14} />}
										{report.format === "html" && <Globe size={14} />}
										<span className="text-sm">
											{report.format.toUpperCase()}
										</span>
									</div>
									<div className="flex items-center gap-1">
										{report.type === "scheduled" ? (
											<Calendar size={14} />
										) : (
											<Clock size={14} />
										)}
										<span className="text-sm">{report.type}</span>
									</div>
								</div>

								<div>
									<p className="mb-2 text-base-content/50 text-sm">Metrics</p>
									<div className="flex flex-wrap gap-1">
										{report.metrics.slice(0, 2).map((metric) => (
											<span key={metric} className="badge badge-sm badge-outline">
												{metric}
											</span>
										))}
										{report.metrics.length > 2 && (
											<span className="badge badge-sm badge-outline">
												+{report.metrics.length - 2} more
											</span>
										)}
									</div>
								</div>

								{report.lastRun && (
									<div className="flex items-center gap-1 text-base-content/50 text-sm">
										<Clock size={12} />
										<span>Last run: {report.lastRun.toLocaleDateString()}</span>
									</div>
								)}

								<div className="flex items-center gap-2 pt-2">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => {
											setSelectedReport(report);
											onRunModalOpen();
										}}
									>
										<Play size={14} />
										Run
									</button>
									<button className="btn btn-sm btn-square btn-ghost">
										<Edit size={14} />
									</button>
									<button className="btn btn-sm btn-square btn-ghost">
										<Copy size={14} />
									</button>
									<button className="btn btn-sm btn-square btn-error btn-outline">
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	const renderScheduledReports = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Scheduled Reports</h3>
					<p className="text-base-content/50 text-sm">
						Manage automated report schedules
					</p>
				</div>
			</div>

			<div className="card bg-base-100 shadow">
				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr>
								<th>REPORT</th>
								<th>SCHEDULE</th>
								<th>RECIPIENTS</th>
								<th>LAST RUN</th>
								<th>STATUS</th>
								<th>ACTIONS</th>
							</tr>
						</thead>
						<tbody>
							{MOCK_REPORTS.filter((r) => r.type === "scheduled").map(
								(report) => (
									<tr key={report.id}>
										<td>
											<div>
												<p className="font-medium">{report.name}</p>
												<p className="text-base-content/50 text-sm">
													{report.description}
												</p>
											</div>
										</td>
										<td>
											<div className="flex items-center gap-2">
												<div className="flex items-center gap-1">
													<Calendar size={14} />
													<span className="text-sm">
														{report.schedule?.frequency}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Clock size={14} />
													<span className="text-sm">
														{report.schedule?.time}
													</span>
												</div>
											</div>
										</td>
										<td>
											<div className="flex items-center gap-1">
												<Mail size={14} />
												<span className="text-sm">
													{report.schedule?.recipients.length} recipients
												</span>
											</div>
										</td>
										<td>
											{report.lastRun && (
												<span className="text-sm">
													{Math.floor(
														(Date.now() - report.lastRun.getTime()) /
															(1000 * 60 * 60 * 24),
													)}
													d ago
												</span>
											)}
										</td>
										<td>
											<div className="flex items-center gap-2">
												<span className={`badge badge-sm ${
													getStatusColor(report.status) === "success" ? "badge-success" :
													getStatusColor(report.status) === "warning" ? "badge-warning" :
													getStatusColor(report.status) === "danger" ? "badge-error" :
													"badge-neutral"
												}`}>
													{report.status}
												</span>
												{report.status === "active" && (
													<div className="flex items-center gap-1">
														<div className="h-2 w-2 animate-pulse rounded-full bg-success" />
														<span className="text-success text-xs">
															Running
														</span>
													</div>
												)}
											</div>
										</td>
										<td>
											<div className="flex items-center gap-1">
												<button className="btn btn-sm btn-square btn-ghost">
													<Pause size={14} />
												</button>
												<button className="btn btn-sm btn-square btn-ghost">
													<Edit size={14} />
												</button>
												<button className="btn btn-sm btn-square btn-ghost">
													<RefreshCw size={14} />
												</button>
											</div>
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">Reporting System</h2>
					<p className="text-base-content/50 text-sm">
						Create, schedule, and manage custom analytics reports
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button className="btn btn-sm btn-ghost">
						<Download size={16} />
						Export All
					</button>
					<button className="btn btn-sm btn-ghost">
						<Settings size={16} />
						Settings
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="w-full">
				<div className="tabs tabs-box mb-6">
					<button 
						className={`tab ${selectedTab === "templates" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("templates")}
					>
						Report Templates
					</button>
					<button 
						className={`tab ${selectedTab === "scheduled" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("scheduled")}
					>
						Scheduled Reports
					</button>
					<button 
						className={`tab ${selectedTab === "history" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("history")}
					>
						Report History
					</button>
				</div>

				{selectedTab === "templates" && (
					<div className="pt-4">
						{renderReportTemplates()}
					</div>
				)}

				{selectedTab === "scheduled" && (
					<div className="pt-4">
						{renderScheduledReports()}
					</div>
				)}

				{selectedTab === "history" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<Activity size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">Report History</h3>
								<p className="text-base-content/50">
									View and manage previously generated reports
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Modals */}
			{renderCreateReportModal()}
			{renderRunReportModal()}
		</div>
	);
}
