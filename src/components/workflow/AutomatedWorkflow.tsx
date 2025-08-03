"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	AlertCircle,
	ArrowDown,
	ArrowRight,
	Bell,
	Calendar,
	CheckCircle,
	Clock,
	Copy,
	Download,
	Edit,
	Eye,
	FileText,
	Filter,
	GitBranch,
	Heart,
	Image as ImageIcon,
	Mail,
	MessageSquare,
	MoreVertical,
	Music,
	Pause,
	Play,
	Plus,
	Settings,
	Share2,
	Square,
	Tag,
	Target,
	Trash2,
	TrendingUp,
	Upload,
	Users,
	Video,
	Workflow,
	XCircle,
	Zap,
} from "lucide-react";
import { useState } from "react";

interface WorkflowStep {
	id: string;
	name: string;
	type: "trigger" | "condition" | "action";
	category:
		| "upload"
		| "approval"
		| "notification"
		| "tagging"
		| "processing"
		| "integration"
		| "publishing";
	config: {
		[key: string]: any;
	};
	position: {
		x: number;
		y: number;
	};
	connections: string[];
}

interface WorkflowDefinition {
	id: string;
	name: string;
	description: string;
	category:
		| "asset_management"
		| "approval"
		| "notification"
		| "publishing"
		| "backup";
	status: "active" | "inactive" | "draft";
	trigger: {
		type: "manual" | "schedule" | "event" | "webhook";
		config: any;
	};
	steps: WorkflowStep[];
	statistics: {
		totalRuns: number;
		successRate: number;
		lastRun?: Date;
		avgDuration: number;
	};
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		name: string;
		avatar?: string;
	};
}

interface WorkflowRun {
	id: string;
	workflowId: string;
	status: "running" | "completed" | "failed" | "cancelled";
	startTime: Date;
	endTime?: Date;
	duration?: number;
	currentStep?: string;
	progress: number;
	logs: {
		timestamp: Date;
		step: string;
		message: string;
		level: "info" | "warning" | "error";
	}[];
	input?: any;
	output?: any;
	error?: string;
}

interface AutomatedWorkflowProps {
	workflows?: WorkflowDefinition[];
	runs?: WorkflowRun[];
	onCreateWorkflow?: (workflow: Partial<WorkflowDefinition>) => void;
	onUpdateWorkflow?: (
		workflowId: string,
		updates: Partial<WorkflowDefinition>,
	) => void;
	onDeleteWorkflow?: (workflowId: string) => void;
	onRunWorkflow?: (workflowId: string, input?: any) => void;
	onStopWorkflow?: (runId: string) => void;
}

const MOCK_WORKFLOWS: WorkflowDefinition[] = [
	{
		id: "1",
		name: "Auto Brand Compliance Check",
		description: "Automatically check uploaded assets for brand compliance",
		category: "asset_management",
		status: "active",
		trigger: {
			type: "event",
			config: {
				event: "asset_uploaded",
				filters: {
					type: ["image", "video"],
					size: { max: "100MB" },
				},
			},
		},
		steps: [
			{
				id: "step1",
				name: "Upload Trigger",
				type: "trigger",
				category: "upload",
				config: {},
				position: { x: 0, y: 0 },
				connections: ["step2"],
			},
			{
				id: "step2",
				name: "Check Brand Guidelines",
				type: "action",
				category: "processing",
				config: {
					guidelines: ["logo_placement", "color_palette", "font_usage"],
					threshold: 80,
				},
				position: { x: 1, y: 0 },
				connections: ["step3"],
			},
			{
				id: "step3",
				name: "Approval Decision",
				type: "condition",
				category: "approval",
				config: {
					conditions: [
						{
							field: "compliance_score",
							operator: ">=",
							value: 80,
						},
					],
				},
				position: { x: 2, y: 0 },
				connections: ["step4", "step5"],
			},
			{
				id: "step4",
				name: "Auto Approve",
				type: "action",
				category: "approval",
				config: {
					status: "approved",
					assignee: "system",
				},
				position: { x: 3, y: 0 },
				connections: [],
			},
			{
				id: "step5",
				name: "Request Manual Review",
				type: "action",
				category: "notification",
				config: {
					recipients: ["brand_manager", "creative_director"],
					template: "manual_review_required",
				},
				position: { x: 3, y: 1 },
				connections: [],
			},
		],
		statistics: {
			totalRuns: 247,
			successRate: 96.4,
			lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
			avgDuration: 12.5,
		},
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-02-20"),
		author: {
			id: "1",
			name: "Sarah Chen",
			avatar: "/avatars/sarah.jpg",
		},
	},
	{
		id: "2",
		name: "Social Media Publishing",
		description:
			"Automatically publish approved assets to social media platforms",
		category: "publishing",
		status: "active",
		trigger: {
			type: "manual",
			config: {},
		},
		steps: [
			{
				id: "step1",
				name: "Manual Trigger",
				type: "trigger",
				category: "upload",
				config: {},
				position: { x: 0, y: 0 },
				connections: ["step2"],
			},
			{
				id: "step2",
				name: "Resize for Platforms",
				type: "action",
				category: "processing",
				config: {
					formats: [
						{ platform: "instagram", size: "1080x1080" },
						{ platform: "twitter", size: "1200x675" },
						{ platform: "facebook", size: "1200x630" },
					],
				},
				position: { x: 1, y: 0 },
				connections: ["step3"],
			},
			{
				id: "step3",
				name: "Generate Captions",
				type: "action",
				category: "processing",
				config: {
					ai_generate: true,
					tone: "professional",
					include_hashtags: true,
				},
				position: { x: 2, y: 0 },
				connections: ["step4"],
			},
			{
				id: "step4",
				name: "Schedule Posts",
				type: "action",
				category: "publishing",
				config: {
					platforms: ["instagram", "twitter", "facebook"],
					schedule: "optimal_times",
				},
				position: { x: 3, y: 0 },
				connections: [],
			},
		],
		statistics: {
			totalRuns: 89,
			successRate: 94.4,
			lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
			avgDuration: 45.2,
		},
		createdAt: new Date("2024-02-01"),
		updatedAt: new Date("2024-02-28"),
		author: {
			id: "2",
			name: "Mike Johnson",
			avatar: "/avatars/mike.jpg",
		},
	},
	{
		id: "3",
		name: "Weekly Asset Backup",
		description: "Automatically backup all assets to cloud storage weekly",
		category: "backup",
		status: "active",
		trigger: {
			type: "schedule",
			config: {
				cron: "0 0 * * 0",
				timezone: "UTC",
			},
		},
		steps: [
			{
				id: "step1",
				name: "Schedule Trigger",
				type: "trigger",
				category: "upload",
				config: {},
				position: { x: 0, y: 0 },
				connections: ["step2"],
			},
			{
				id: "step2",
				name: "Collect Assets",
				type: "action",
				category: "processing",
				config: {
					filters: {
						updated_since: "last_backup",
						status: ["approved", "published"],
					},
				},
				position: { x: 1, y: 0 },
				connections: ["step3"],
			},
			{
				id: "step3",
				name: "Upload to Cloud",
				type: "action",
				category: "integration",
				config: {
					provider: "aws_s3",
					bucket: "brand-assets-backup",
					encryption: true,
				},
				position: { x: 2, y: 0 },
				connections: ["step4"],
			},
			{
				id: "step4",
				name: "Send Report",
				type: "action",
				category: "notification",
				config: {
					recipients: ["admin@company.com"],
					template: "backup_complete",
				},
				position: { x: 3, y: 0 },
				connections: [],
			},
		],
		statistics: {
			totalRuns: 12,
			successRate: 100,
			lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
			avgDuration: 324.8,
		},
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-15"),
		author: {
			id: "3",
			name: "Alex Rivera",
			avatar: "/avatars/alex.jpg",
		},
	},
];

const MOCK_RUNS: WorkflowRun[] = [
	{
		id: "1",
		workflowId: "1",
		status: "completed",
		startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
		endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 1000),
		duration: 15,
		progress: 100,
		logs: [
			{
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
				step: "Upload Trigger",
				message: "Asset uploaded: brand-logo-v2.png",
				level: "info",
			},
			{
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 1000),
				step: "Check Brand Guidelines",
				message: "Compliance score: 92%",
				level: "info",
			},
			{
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 1000),
				step: "Approval Decision",
				message: "Condition met: compliance_score >= 80",
				level: "info",
			},
			{
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 1000),
				step: "Auto Approve",
				message: "Asset automatically approved",
				level: "info",
			},
		],
		input: {
			asset_id: "asset-123",
			asset_name: "brand-logo-v2.png",
		},
		output: {
			status: "approved",
			compliance_score: 92,
		},
	},
	{
		id: "2",
		workflowId: "2",
		status: "running",
		startTime: new Date(Date.now() - 5 * 60 * 1000),
		currentStep: "Generate Captions",
		progress: 60,
		logs: [
			{
				timestamp: new Date(Date.now() - 5 * 60 * 1000),
				step: "Manual Trigger",
				message: "Workflow started manually",
				level: "info",
			},
			{
				timestamp: new Date(Date.now() - 4 * 60 * 1000),
				step: "Resize for Platforms",
				message: "Generated 3 format variants",
				level: "info",
			},
			{
				timestamp: new Date(Date.now() - 2 * 60 * 1000),
				step: "Generate Captions",
				message: "AI caption generation in progress...",
				level: "info",
			},
		],
		input: {
			asset_id: "asset-456",
			platforms: ["instagram", "twitter", "facebook"],
		},
	},
];

const WORKFLOW_CATEGORIES = [
	{
		value: "asset_management",
		label: "Asset Management",
		icon: <FileText size={16} />,
	},
	{ value: "approval", label: "Approval", icon: <CheckCircle size={16} /> },
	{ value: "notification", label: "Notification", icon: <Bell size={16} /> },
	{ value: "publishing", label: "Publishing", icon: <Share2 size={16} /> },
	{ value: "backup", label: "Backup", icon: <Download size={16} /> },
];

const TRIGGER_TYPES = [
	{
		value: "manual",
		label: "Manual",
		description: "Triggered manually by users",
	},
	{
		value: "schedule",
		label: "Schedule",
		description: "Triggered on a schedule",
	},
	{ value: "event", label: "Event", description: "Triggered by system events" },
	{
		value: "webhook",
		label: "Webhook",
		description: "Triggered by external webhooks",
	},
];

const STEP_TYPES = [
	{ value: "trigger", label: "Trigger", icon: <Zap size={16} /> },
	{ value: "condition", label: "Condition", icon: <GitBranch size={16} /> },
	{ value: "action", label: "Action", icon: <Target size={16} /> },
];

// Helper function to get category colors
const getCategoryColor = (category: string): "primary" | "secondary" | "success" | "warning" | "default" => {
	switch (category) {
		case "asset_management":
		case "upload":
			return "primary";
		case "approval":
			return "warning";
		case "notification":
		case "publishing":
			return "success";
		case "backup":
		case "processing":
			return "secondary";
		default:
			return "default";
	}
};

export function AutomatedWorkflow({
	workflows = MOCK_WORKFLOWS,
	runs = MOCK_RUNS,
	onCreateWorkflow,
	onUpdateWorkflow,
	onDeleteWorkflow,
	onRunWorkflow,
	onStopWorkflow,
}: AutomatedWorkflowProps) {
	const [selectedTab, setSelectedTab] = useState("workflows");
	const [selectedWorkflow, setSelectedWorkflow] =
		useState<WorkflowDefinition | null>(null);
	const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [newWorkflow, setNewWorkflow] = useState<Partial<WorkflowDefinition>>({
		name: "",
		description: "",
		category: "asset_management",
		status: "draft",
		trigger: {
			type: "manual",
			config: {},
		},
		steps: [],
	});

	const {
		isOpen: isCreateModalOpen,
		onOpen: onCreateModalOpen,
		onClose: onCreateModalClose,
	} = useModal();

	const {
		isOpen: isDetailModalOpen,
		onOpen: onDetailModalOpen,
		onClose: onDetailModalClose,
	} = useModal();

	const {
		isOpen: isRunModalOpen,
		onOpen: onRunModalOpen,
		onClose: onRunModalClose,
	} = useModal();

	const handleCreateWorkflow = () => {
		setIsCreating(true);
		setTimeout(() => {
			onCreateWorkflow?.(newWorkflow);
			setIsCreating(false);
			onCreateModalClose();
			setNewWorkflow({
				name: "",
				description: "",
				category: "asset_management",
				status: "draft",
				trigger: {
					type: "manual",
					config: {},
				},
				steps: [],
			});
		}, 2000);
	};

	const handleRunWorkflow = (workflowId: string) => {
		onRunWorkflow?.(workflowId);
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
			case "completed":
				return "success";
			case "running":
				return "primary";
			case "failed":
				return "danger";
			case "cancelled":
				return "default";
			default:
				return "default";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "asset_management":
				return "primary";
			case "approval":
				return "success";
			case "notification":
				return "warning";
			case "publishing":
				return "secondary";
			case "backup":
				return "default";
			default:
				return "default";
		}
	};

	const renderWorkflowCard = (workflow: WorkflowDefinition) => (
		<div key={workflow.id} className="card bg-base-100 shadow transition-shadow hover:shadow-lg">
			<div className="card-body pb-2">
				<div className="flex w-full items-start justify-between">
					<div className="flex-1">
						<div className="mb-2 flex items-center gap-2">
							<h4 className="font-semibold">{workflow.name}</h4>
							<span
								className={`badge badge-sm ${
									getStatusColor(workflow.status) === "success" ? "badge-success" :
									getStatusColor(workflow.status) === "warning" ? "badge-warning" :
									getStatusColor(workflow.status) === "danger" ? "badge-error" :
									getStatusColor(workflow.status) === "primary" ? "badge-primary" :
									"badge-outline"
								}`}
							>
								{workflow.status}
							</span>
						</div>
						<p className="text-default-500 text-small">
							{workflow.description}
						</p>
					</div>
					<div className="dropdown dropdown-end">
						<button 
							tabIndex={0} 
							role="button" 
							className="btn btn-ghost btn-sm"
						>
							<MoreVertical size={16} />
						</button>
						<ul 
							tabIndex={0} 
							className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
						>
							<li>
								<button
									onClick={() => {
										setSelectedWorkflow(workflow);
										onDetailModalOpen();
									}}
								>
									<Eye size={16} />
									View Details
								</button>
							</li>
							<li>
								<button>
									<Edit size={16} />
									Edit
								</button>
							</li>
							<li>
								<button>
									<Copy size={16} />
									Duplicate
								</button>
							</li>
							<li>
								<button
									className="text-error"
									onClick={() => onDeleteWorkflow?.(workflow.id)}
								>
									<Trash2 size={16} />
									Delete
								</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div className="card-body pt-0">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<span
							className={`badge badge-sm ${
								getCategoryColor(workflow.category) === "primary" ? "badge-primary" :
								getCategoryColor(workflow.category) === "success" ? "badge-success" :
								getCategoryColor(workflow.category) === "warning" ? "badge-warning" :
								getCategoryColor(workflow.category) === "secondary" ? "badge-secondary" :
								"badge-outline"
							}`}
						>
							{workflow.category.replace("_", " ")}
						</span>
						<div className="flex items-center gap-1">
							<Clock size={12} className="text-default-400" />
							<span className="text-default-500 text-small">
								{workflow.trigger.type}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-4 text-small">
						<div className="flex items-center gap-1">
							<Play size={12} />
							<span>{workflow.statistics.totalRuns} runs</span>
						</div>
						<div className="flex items-center gap-1">
							<TrendingUp size={12} />
							<span>{workflow.statistics.successRate}% success</span>
						</div>
					</div>

					{workflow.statistics.lastRun && (
						<div className="flex items-center gap-1 text-default-500 text-small">
							<Clock size={12} />
							<span>
								Last run:{" "}
								{Math.floor(
									(Date.now() - workflow.statistics.lastRun.getTime()) /
										(1000 * 60 * 60),
								)}
								h ago
							</span>
						</div>
					)}

					<div className="flex items-center gap-2 pt-2">
						<button
							className="btn btn-sm btn-primary"
							onClick={() => {
								setSelectedWorkflow(workflow);
								onRunModalOpen();
							}}
						>
							<Play size={14} />
							Run
						</button>
						<button
							className="btn btn-sm btn-ghost"
							onClick={() => {
								setSelectedWorkflow(workflow);
								onDetailModalOpen();
							}}
						>
							View
						</button>
						{workflow.status === "active" && (
							<button
								className="btn btn-sm btn-ghost"
								onClick={() =>
									onUpdateWorkflow?.(workflow.id, { status: "inactive" })
								}
							>
								<Pause size={14} />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const renderRunCard = (run: WorkflowRun) => {
		const workflow = workflows.find((w) => w.id === run.workflowId);
		const duration =
			run.duration || (Date.now() - run.startTime.getTime()) / 1000;

		return (
			<div key={run.id} className="card bg-base-100 shadow transition-shadow hover:shadow-md">
				<div className="card-body">
					<div className="mb-4 flex items-start justify-between">
						<div>
							<h4 className="font-medium">{workflow?.name}</h4>
							<p className="text-default-500 text-small">Run ID: {run.id}</p>
						</div>
						<div className="flex items-center gap-2">
							<span
								className={`badge badge-sm ${
									getStatusColor(run.status) === "success" ? "badge-success" :
									getStatusColor(run.status) === "warning" ? "badge-warning" :
									getStatusColor(run.status) === "danger" ? "badge-error" :
									getStatusColor(run.status) === "primary" ? "badge-primary" :
									"badge-outline"
								}`}
							>
								{run.status}
							</span>
							{run.status === "running" && (
								<button
									className="btn btn-sm btn-ghost text-error"
									onClick={() => onStopWorkflow?.(run.id)}
								>
									<Square size={14} />
								</button>
							)}
						</div>
					</div>

					{run.status === "running" && (
						<div className="mb-4">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-small">Progress</span>
								<span className="text-small">{run.progress}%</span>
							</div>
							<progress className="progress progress-primary w-full" value={run.progress} max="100"></progress>
							{run.currentStep && (
								<p className="mt-1 text-default-500 text-small">
									Current: {run.currentStep}
								</p>
							)}
						</div>
					)}

					<div className="flex items-center gap-4 text-default-500 text-small">
						<div className="flex items-center gap-1">
							<Clock size={12} />
							<span>{duration.toFixed(1)}s</span>
						</div>
						<div className="flex items-center gap-1">
							<Calendar size={12} />
							<span>{run.startTime.toLocaleTimeString()}</span>
						</div>
						{run.logs.length > 0 && (
							<div className="flex items-center gap-1">
								<MessageSquare size={12} />
								<span>{run.logs.length} logs</span>
							</div>
						)}
					</div>

					{run.error && (
						<div className="mt-3 rounded-lg bg-danger-50 p-2">
							<div className="flex items-center gap-2">
								<AlertCircle size={14} className="text-danger" />
								<span className="text-danger text-small">{run.error}</span>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	const renderCreateWorkflowModal = () => (
		<dialog className={`modal ${isCreateModalOpen ? 'modal-open' : ''}`}>
			<div className="modal-box w-11/12 max-w-5xl">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold text-lg">Create New Workflow</h3>
					<button
						className="btn btn-sm btn-circle btn-ghost"
						onClick={onCreateModalClose}
					>
						✕
					</button>
				</div>
				<div className="modal-body">
					<div className="space-y-6">
						<div className="space-y-4">
							<h4 className="font-semibold">Basic Information</h4>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="form-control w-full">
									<label className="label">
										<span className="label-text">Workflow Name</span>
									</label>
									<input
										type="text"
										placeholder="Enter workflow name"
										className="input input-bordered w-full"
										value={newWorkflow.name || ''}
										onChange={(e) =>
											setNewWorkflow({ ...newWorkflow, name: e.target.value })
										}
									/>
								</div>
								<div className="form-control w-full">
									<label className="label">
										<span className="label-text">Category</span>
									</label>
									<select
										className="select select-bordered w-full"
										value={newWorkflow.category || 'asset_management'}
										onChange={(e) =>
											setNewWorkflow({
												...newWorkflow,
												category: e.target.value as any,
											})
										}
									>
										{WORKFLOW_CATEGORIES.map((cat) => (
											<option key={cat.value} value={cat.value}>
												{cat.label}
											</option>
										))}
									</select>
								</div>
							</div>
							<div className="form-control w-full">
								<label className="label">
									<span className="label-text">Description</span>
								</label>
								<textarea
									className="textarea textarea-bordered w-full"
									placeholder="Describe what this workflow does"
									value={newWorkflow.description || ''}
									onChange={(e) =>
										setNewWorkflow({ ...newWorkflow, description: e.target.value })
									}
									rows={3}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold">Trigger Configuration</h4>
							<div className="form-control w-full">
								<label className="label">
									<span className="label-text">Trigger Type</span>
								</label>
								<select
									className="select select-bordered w-full"
									value={newWorkflow.trigger?.type || 'manual'}
									onChange={(e) =>
										setNewWorkflow({
											...newWorkflow,
											trigger: {
												...newWorkflow.trigger!,
												type: e.target.value as any,
											},
										})
									}
								>
									{TRIGGER_TYPES.map((trigger) => (
										<option key={trigger.value} value={trigger.value}>
											{trigger.label} - {trigger.description}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold">Workflow Steps</h4>
							<div className="rounded-lg bg-default-50 p-4 text-center">
								<Workflow size={48} className="mx-auto mb-2 text-default-300" />
								<p className="text-default-500 text-small">
									Use the visual workflow editor to add steps
								</p>
								<button className="btn btn-sm btn-primary mt-2">
									<Plus size={16} />
									Add Step
								</button>
							</div>
						</div>
					</div>
				</div>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onCreateModalClose}>
						Cancel
					</button>
					<button
						className={`btn btn-primary ${isCreating ? 'loading' : ''}`}
						onClick={handleCreateWorkflow}
						disabled={!newWorkflow.name || isCreating}
					>
						{isCreating ? 'Creating...' : 'Create Workflow'}
					</button>
				</div>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onCreateModalClose}>close</button>
			</form>
		</dialog>
	);

	const renderWorkflowDetailModal = () => (
		<dialog className={`modal ${isDetailModalOpen ? 'modal-open' : ''}`}>
			<div className="modal-box w-11/12 max-w-7xl">
				{selectedWorkflow && (
					<>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<Workflow size={24} className="text-primary" />
								<div>
									<h3 className="font-semibold text-lg">
										{selectedWorkflow.name}
									</h3>
									<p className="text-default-500 text-small">
										{selectedWorkflow.description}
									</p>
								</div>
							</div>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={onDetailModalClose}
							>
								✕
							</button>
						</div>
						<div className="modal-body">
							<div className="space-y-6">
								{/* Workflow Info */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<p className="mb-1 text-default-500 text-small">Category</p>
										<span
											className={`badge badge-sm ${
												getCategoryColor(selectedWorkflow.category) === "primary" ? "badge-primary" :
												getCategoryColor(selectedWorkflow.category) === "success" ? "badge-success" :
												getCategoryColor(selectedWorkflow.category) === "warning" ? "badge-warning" :
												getCategoryColor(selectedWorkflow.category) === "secondary" ? "badge-secondary" :
												"badge-outline"
											}`}
										>
											{selectedWorkflow.category.replace("_", " ")}
										</span>
									</div>
									<div>
										<p className="mb-1 text-default-500 text-small">Status</p>
										<span
											className={`badge badge-sm ${
												getStatusColor(selectedWorkflow.status) === "success" ? "badge-success" :
												getStatusColor(selectedWorkflow.status) === "warning" ? "badge-warning" :
												getStatusColor(selectedWorkflow.status) === "danger" ? "badge-error" :
												getStatusColor(selectedWorkflow.status) === "primary" ? "badge-primary" :
												"badge-outline"
											}`}
										>
											{selectedWorkflow.status}
										</span>
									</div>
									<div>
										<p className="mb-1 text-default-500 text-small">Trigger</p>
										<p className="font-medium">
											{selectedWorkflow.trigger.type}
										</p>
									</div>
									<div>
										<p className="mb-1 text-default-500 text-small">Steps</p>
										<p className="font-medium">
											{selectedWorkflow.steps.length}
										</p>
									</div>
								</div>

								{/* Statistics */}
								<div>
									<h4 className="mb-4 font-semibold">Statistics</h4>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<Play size={20} className="mx-auto mb-2 text-primary" />
												<p className="font-bold text-lg">
													{selectedWorkflow.statistics.totalRuns}
												</p>
												<p className="text-default-500 text-small">
													Total Runs
												</p>
											</div>
										</div>
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<TrendingUp
													size={20}
													className="mx-auto mb-2 text-success"
												/>
												<p className="font-bold text-lg">
													{selectedWorkflow.statistics.successRate}%
												</p>
												<p className="text-default-500 text-small">
													Success Rate
												</p>
											</div>
										</div>
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<Clock
													size={20}
													className="mx-auto mb-2 text-warning"
												/>
												<p className="font-bold text-lg">
													{selectedWorkflow.statistics.avgDuration}s
												</p>
												<p className="text-default-500 text-small">
													Avg Duration
												</p>
											</div>
										</div>
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<Calendar
													size={20}
													className="mx-auto mb-2 text-secondary"
												/>
												<p className="font-bold text-lg">
													{selectedWorkflow.statistics.lastRun
														? Math.floor(
																(Date.now() -
																	selectedWorkflow.statistics.lastRun.getTime()) /
																	(1000 * 60 * 60),
															) + "h"
														: "Never"}
												</p>
												<p className="text-default-500 text-small">Last Run</p>
											</div>
										</div>
									</div>
								</div>

								{/* Workflow Steps */}
								<div>
									<h4 className="mb-4 font-semibold">Workflow Steps</h4>
									<div className="space-y-3">
										{selectedWorkflow.steps.map((step, index) => (
											<div
												key={step.id}
												className="flex items-center gap-3 rounded-lg bg-default-50 p-3"
											>
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
													<span className="font-bold text-primary text-small">
														{index + 1}
													</span>
												</div>
												<div className="flex-1">
													<div className="mb-1 flex items-center gap-2">
														<p className="font-medium">{step.name}</p>
														<span className="badge badge-sm badge-primary">
															{step.type}
														</span>
													</div>
													<p className="text-default-500 text-small">
														{step.category.replace("_", " ")}
													</p>
												</div>
												{index < selectedWorkflow.steps.length - 1 && (
													<ArrowRight size={16} className="text-default-400" />
												)}
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="modal-action">
							<button className="btn btn-ghost" onClick={onDetailModalClose}>
								Close
							</button>
							<button
								className="btn btn-primary"
								onClick={() => {
									setSelectedWorkflow(selectedWorkflow);
									onDetailModalClose();
									onRunModalOpen();
								}}
							>
								<Play size={16} />
								Run Workflow
							</button>
						</div>
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onDetailModalClose}>close</button>
			</form>
		</dialog>
	);

	const renderRunWorkflowModal = () => (
		<dialog className={`modal ${isRunModalOpen ? 'modal-open' : ''}`}>
			<div className="modal-box">
				{selectedWorkflow && (
					<>
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-lg">Run Workflow</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={onRunModalClose}
							>
								✕
							</button>
						</div>
						<div className="modal-body">
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold">{selectedWorkflow.name}</h4>
									<p className="text-default-500 text-small">
										{selectedWorkflow.description}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-default-500 text-small">Category</p>
										<span
											className={`badge badge-sm ${
												getCategoryColor(selectedWorkflow.category) === "primary" ? "badge-primary" :
												getCategoryColor(selectedWorkflow.category) === "success" ? "badge-success" :
												getCategoryColor(selectedWorkflow.category) === "warning" ? "badge-warning" :
												getCategoryColor(selectedWorkflow.category) === "secondary" ? "badge-secondary" :
												"badge-outline"
											}`}
										>
											{selectedWorkflow.category.replace("_", " ")}
										</span>
									</div>
									<div>
										<p className="text-default-500 text-small">Steps</p>
										<p className="font-medium">
											{selectedWorkflow.steps.length}
										</p>
									</div>
								</div>

								<div>
									<p className="mb-2 text-default-500 text-small">
										Estimated Duration
									</p>
									<p className="font-medium">
										{selectedWorkflow.statistics.avgDuration}s
									</p>
								</div>

								<div className="rounded-lg bg-primary-50 p-3">
									<div className="flex items-start gap-2">
										<Clock size={16} className="mt-0.5 text-primary" />
										<div>
											<p className="font-medium text-small">Ready to Run</p>
											<p className="text-default-600 text-tiny">
												This workflow will be executed immediately
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-action">
							<button className="btn btn-ghost" onClick={onRunModalClose}>
								Cancel
							</button>
							<button
								className="btn btn-primary"
								onClick={() => handleRunWorkflow(selectedWorkflow.id)}
							>
								<Play size={16} />
								Run Now
							</button>
						</div>
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onRunModalClose}>close</button>
			</form>
		</dialog>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-xl">
						<Workflow size={24} className="text-primary" />
						Automated Workflows
					</h2>
					<p className="text-default-500 text-small">
						Create and manage automated workflows for your brand portal
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button className="btn btn-ghost">
						<Settings size={16} />
						Settings
					</button>
					<button
						className="btn btn-primary"
						onClick={onCreateModalOpen}
					>
						<Plus size={16} />
						Create Workflow
					</button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Workflow size={24} className="mx-auto mb-2 text-primary" />
						<p className="font-bold text-2xl">{workflows.length}</p>
						<p className="text-default-500 text-small">Total Workflows</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<CheckCircle size={24} className="mx-auto mb-2 text-success" />
						<p className="font-bold text-2xl">
							{workflows.filter((w) => w.status === "active").length}
						</p>
						<p className="text-default-500 text-small">Active</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Play size={24} className="mx-auto mb-2 text-warning" />
						<p className="font-bold text-2xl">
							{runs.filter((r) => r.status === "running").length}
						</p>
						<p className="text-default-500 text-small">Running</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<TrendingUp size={24} className="mx-auto mb-2 text-secondary" />
						<p className="font-bold text-2xl">
							{Math.round(
								workflows.reduce(
									(sum, w) => sum + w.statistics.successRate,
									0,
								) / workflows.length,
							)}
							%
						</p>
						<p className="text-default-500 text-small">Avg Success Rate</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="w-full">
				<div role="tablist" className="tabs tabs-bordered w-full">
					<input
						type="radio"
						name="workflow_tabs"
						role="tab"
						className="tab"
						aria-label="Workflows"
						checked={selectedTab === "workflows"}
						onChange={() => setSelectedTab("workflows")}
					/>
					<div role="tabpanel" className="tab-content space-y-4 pt-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{workflows.map(renderWorkflowCard)}
						</div>
					</div>

					<input
						type="radio"
						name="workflow_tabs"
						role="tab"
						className="tab"
						aria-label="Recent Runs"
						checked={selectedTab === "runs"}
						onChange={() => setSelectedTab("runs")}
					/>
					<div role="tabpanel" className="tab-content space-y-4 pt-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{runs.map(renderRunCard)}
						</div>
					</div>

					<input
						type="radio"
						name="workflow_tabs"
						role="tab"
						className="tab"
						aria-label="Templates"
						checked={selectedTab === "templates"}
						onChange={() => setSelectedTab("templates")}
					/>
					<div role="tabpanel" className="tab-content space-y-4 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<FileText size={48} className="mx-auto mb-4 text-default-300" />
								<h3 className="mb-2 font-semibold text-lg">
									Workflow Templates
								</h3>
								<p className="text-default-500">
									Pre-built workflow templates for common use cases
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			{renderCreateWorkflowModal()}
			{renderWorkflowDetailModal()}
			{renderRunWorkflowModal()}
		</div>
	);
}
