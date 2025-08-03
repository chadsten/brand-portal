"use client";

import {
	Avatar,
	Badge,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Divider,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Progress,
	Select,
	SelectItem,
	Spinner,
	Tab,
	Tabs,
	Textarea,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Edit,
	Eye,
	Filter,
	MessageSquare,
	Plus,
	RotateCcw,
	Search,
	Share2,
	Target,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "~/lib/utils";
import { api } from "~/trpc/react";

interface BrandApproval {
	id: string;
	assetId: string;
	guidelineId: string;
	status: "pending" | "approved" | "rejected" | "revision_required";
	priority: "low" | "normal" | "high" | "urgent";
	submittedBy: string;
	assignedTo?: string;
	reviewedBy?: string;
	complianceScore?: number;
	complianceReport: any;
	reviewNotes?: string;
	rejectionReason?: string;
	revisionRequests: any[];
	submittedAt: Date;
	assignedAt?: Date;
	reviewedAt?: Date;
	deadline?: Date;
	metadata: any;
	asset: {
		id: string;
		fileName: string;
		title: string;
		thumbnailKey?: string;
		fileType: string;
		fileSize: number;
	};
	guideline: {
		id: string;
		name: string;
		version: string;
	};
	submitter: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
	assignee?: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
	reviewer?: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
}

interface ApprovalFilters {
	status: string[];
	priority: string[];
	assignedTo: string;
	submittedBy: string;
	guideline: string;
	dateRange?: {
		from: Date;
		to: Date;
	};
}

const STATUS_CONFIG = {
	pending: { color: "warning" as const, icon: Clock, label: "Pending Review" },
	approved: { color: "success" as const, icon: CheckCircle, label: "Approved" },
	rejected: { color: "danger" as const, icon: XCircle, label: "Rejected" },
	revision_required: {
		color: "secondary" as const,
		icon: AlertTriangle,
		label: "Needs Revision",
	},
};

const PRIORITY_CONFIG = {
	low: { color: "default" as const, label: "Low" },
	normal: { color: "primary" as const, label: "Normal" },
	high: { color: "warning" as const, label: "High" },
	urgent: { color: "danger" as const, label: "Urgent" },
};

export function BrandApprovalWorkflow() {
	const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<ApprovalFilters>({
		status: [],
		priority: [],
		assignedTo: "",
		submittedBy: "",
		guideline: "",
	});

	// Modal controls
	const {
		isOpen: isDetailOpen,
		onOpen: onDetailOpen,
		onClose: onDetailClose,
	} = useDisclosure();
	const {
		isOpen: isReviewOpen,
		onOpen: onReviewOpen,
		onClose: onReviewClose,
	} = useDisclosure();

	// API queries - TODO: Implement these endpoints
	const approvals: BrandApproval[] = []; // Placeholder
	const isLoading = false;

	// Mock data for development
	const mockApprovals: BrandApproval[] = [
		{
			id: "1",
			assetId: "asset-1",
			guidelineId: "guideline-1",
			status: "pending",
			priority: "high",
			submittedBy: "user-1",
			assignedTo: "user-2",
			complianceScore: 85,
			complianceReport: {
				colorCompliance: true,
				typographyCompliance: false,
				logoCompliance: true,
				spacingCompliance: true,
			},
			revisionRequests: [],
			submittedAt: new Date("2024-01-15T10:00:00Z"),
			deadline: new Date("2024-01-20T17:00:00Z"),
			metadata: {},
			asset: {
				id: "asset-1",
				fileName: "brand-banner.png",
				title: "Marketing Banner",
				fileType: "image/png",
				fileSize: 2048000,
			},
			guideline: {
				id: "guideline-1",
				name: "Primary Brand Guidelines",
				version: "2.1.0",
			},
			submitter: {
				id: "user-1",
				name: "Sarah Chen",
				email: "sarah@company.com",
				image: "/avatars/sarah.jpg",
			},
			assignee: {
				id: "user-2",
				name: "Mike Johnson",
				email: "mike@company.com",
				image: "/avatars/mike.jpg",
			},
		},
		// Add more mock data as needed
	];

	const handleFilterChange = (newFilters: Partial<ApprovalFilters>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	};

	const handleApprovalSelect = (approvalId: string) => {
		setSelectedApproval(approvalId);
		onDetailOpen();
	};

	const handleStartReview = (approvalId: string) => {
		setSelectedApproval(approvalId);
		onReviewOpen();
	};

	const handleApprove = (approvalId: string, notes?: string) => {
		console.log("Approve approval:", approvalId, notes);
		// TODO: Implement API call
	};

	const handleReject = (approvalId: string, reason: string) => {
		console.log("Reject approval:", approvalId, reason);
		// TODO: Implement API call
	};

	const handleRequestRevision = (approvalId: string, requests: any[]) => {
		console.log("Request revision:", approvalId, requests);
		// TODO: Implement API call
	};

	const getStatusColor = (status: string) => {
		return (
			STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || "default"
		);
	};

	const getStatusIcon = (status: string) => {
		const StatusIcon =
			STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || Clock;
		return <StatusIcon size={16} />;
	};

	const getPriorityColor = (priority: string) => {
		return (
			PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.color ||
			"default"
		);
	};

	const getComplianceColor = (score?: number) => {
		if (!score) return "default";
		if (score >= 90) return "success";
		if (score >= 70) return "warning";
		return "danger";
	};

	const isOverdue = (deadline?: Date) => {
		return deadline && new Date() > deadline;
	};

	const filteredApprovals = (
		approvals.length > 0 ? approvals : mockApprovals
	).filter((approval) => {
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			if (
				!approval.asset.title.toLowerCase().includes(query) &&
				!approval.asset.fileName.toLowerCase().includes(query) &&
				!approval.submitter.name.toLowerCase().includes(query)
			) {
				return false;
			}
		}

		// Status filter
		if (
			filters.status.length > 0 &&
			!filters.status.includes(approval.status)
		) {
			return false;
		}

		// Priority filter
		if (
			filters.priority.length > 0 &&
			!filters.priority.includes(approval.priority)
		) {
			return false;
		}

		// Assignee filter
		if (filters.assignedTo && approval.assignedTo !== filters.assignedTo) {
			return false;
		}

		return true;
	});

	const getStatusCounts = () => {
		const counts = {
			pending: 0,
			approved: 0,
			rejected: 0,
			revision_required: 0,
			overdue: 0,
		};

		filteredApprovals.forEach((approval) => {
			counts[approval.status as keyof typeof counts]++;
			if (isOverdue(approval.deadline)) {
				counts.overdue++;
			}
		});

		return counts;
	};

	const statusCounts = getStatusCounts();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Brand Approval Workflow</h1>
					<p className="text-default-500 text-small">
						Review and approve brand assets for compliance
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="flat" startContent={<Download size={16} />}>
						Export Report
					</Button>
					<Button variant="flat" startContent={<Plus size={16} />}>
						Bulk Actions
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				<Card className="border border-default-200">
					<CardBody className="space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Clock size={16} className="text-warning" />
							<span className="font-medium text-small">Pending</span>
						</div>
						<p className="font-bold text-2xl">{statusCounts.pending}</p>
					</CardBody>
				</Card>
				<Card className="border border-default-200">
					<CardBody className="space-y-2 p-4">
						<div className="flex items-center gap-2">
							<CheckCircle size={16} className="text-success" />
							<span className="font-medium text-small">Approved</span>
						</div>
						<p className="font-bold text-2xl">{statusCounts.approved}</p>
					</CardBody>
				</Card>
				<Card className="border border-default-200">
					<CardBody className="space-y-2 p-4">
						<div className="flex items-center gap-2">
							<XCircle size={16} className="text-danger" />
							<span className="font-medium text-small">Rejected</span>
						</div>
						<p className="font-bold text-2xl">{statusCounts.rejected}</p>
					</CardBody>
				</Card>
				<Card className="border border-default-200">
					<CardBody className="space-y-2 p-4">
						<div className="flex items-center gap-2">
							<AlertTriangle size={16} className="text-secondary" />
							<span className="font-medium text-small">Revisions</span>
						</div>
						<p className="font-bold text-2xl">
							{statusCounts.revision_required}
						</p>
					</CardBody>
				</Card>
				<Card className="border border-default-200">
					<CardBody className="space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Target size={16} className="text-danger" />
							<span className="font-medium text-small">Overdue</span>
						</div>
						<p className="font-bold text-2xl text-danger">
							{statusCounts.overdue}
						</p>
					</CardBody>
				</Card>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardBody className="gap-4">
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<Input
							classNames={{
								base: "flex-1",
								inputWrapper: "h-10",
							}}
							placeholder="Search approvals..."
							startContent={<Search size={16} className="text-default-400" />}
							value={searchQuery}
							onValueChange={setSearchQuery}
						/>
						<div className="flex items-center gap-2">
							<Select
								aria-label="Filter by status"
								placeholder="Status"
								selectionMode="multiple"
								selectedKeys={filters.status}
								onSelectionChange={(keys) =>
									handleFilterChange({ status: Array.from(keys) as string[] })
								}
								className="w-32"
							>
								{Object.entries(STATUS_CONFIG).map(([key, config]) => (
									<SelectItem key={key}>{config.label}</SelectItem>
								))}
							</Select>
							<Select
								aria-label="Filter by priority"
								placeholder="Priority"
								selectionMode="multiple"
								selectedKeys={filters.priority}
								onSelectionChange={(keys) =>
									handleFilterChange({ priority: Array.from(keys) as string[] })
								}
								className="w-32"
							>
								{Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
									<SelectItem key={key}>{config.label}</SelectItem>
								))}
							</Select>
							<Button
								variant="flat"
								startContent={<RotateCcw size={16} />}
								onPress={() => {
									setSearchQuery("");
									setFilters({
										status: [],
										priority: [],
										assignedTo: "",
										submittedBy: "",
										guideline: "",
									});
								}}
							>
								Clear
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Approvals List */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner size="lg" />
				</div>
			) : filteredApprovals.length === 0 ? (
				<Card>
					<CardBody className="py-12 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
							<Clock size={24} className="text-default-400" />
						</div>
						<h3 className="mb-2 font-semibold text-large">
							No approvals found
						</h3>
						<p className="text-default-500 text-small">
							No brand approval requests match your current filters
						</p>
					</CardBody>
				</Card>
			) : (
				<div className="space-y-4">
					{filteredApprovals.map((approval) => (
						<Card
							key={approval.id}
							className="group transition-shadow hover:shadow-md"
						>
							<CardBody className="p-6">
								<div className="flex items-start justify-between">
									<div className="flex flex-1 items-start gap-4">
										{/* Asset Preview */}
										<div className="flex-shrink-0">
											<div className="flex h-16 w-16 items-center justify-center rounded-lg border border-default-200 bg-default-50">
												{approval.asset.thumbnailKey ? (
													<img
														src={`/api/assets/${approval.asset.id}/thumbnail`}
														alt={approval.asset.title}
														className="h-full w-full rounded-lg object-cover"
													/>
												) : (
													<Eye size={24} className="text-default-400" />
												)}
											</div>
										</div>

										{/* Content */}
										<div className="min-w-0 flex-1">
											<div className="mb-2 flex items-start justify-between">
												<div>
													<h3 className="truncate font-semibold text-lg">
														{approval.asset.title}
													</h3>
													<p className="text-default-500 text-small">
														{approval.asset.fileName}
													</p>
												</div>
												<div className="ml-4 flex items-center gap-2">
													<Chip
														size="sm"
														color={getStatusColor(approval.status)}
														variant="flat"
														startContent={getStatusIcon(approval.status)}
													>
														{
															STATUS_CONFIG[
																approval.status as keyof typeof STATUS_CONFIG
															]?.label
														}
													</Chip>
													<Chip
														size="sm"
														color={getPriorityColor(approval.priority)}
														variant="flat"
													>
														{
															PRIORITY_CONFIG[
																approval.priority as keyof typeof PRIORITY_CONFIG
															]?.label
														}
													</Chip>
													{isOverdue(approval.deadline) && (
														<Chip size="sm" color="danger" variant="flat">
															Overdue
														</Chip>
													)}
												</div>
											</div>

											{/* Details */}
											<div className="grid grid-cols-1 gap-4 text-small md:grid-cols-3">
												<div>
													<p className="mb-1 text-default-500">Submitter</p>
													<div className="flex items-center gap-2">
														<Avatar
															size="sm"
															src={approval.submitter.image}
															name={approval.submitter.name}
															className="h-6 w-6"
														/>
														<span>{approval.submitter.name}</span>
													</div>
												</div>
												<div>
													<p className="mb-1 text-default-500">Assignee</p>
													{approval.assignee ? (
														<div className="flex items-center gap-2">
															<Avatar
																size="sm"
																src={approval.assignee.image}
																name={approval.assignee.name}
																className="h-6 w-6"
															/>
															<span>{approval.assignee.name}</span>
														</div>
													) : (
														<span className="text-default-400">Unassigned</span>
													)}
												</div>
												<div>
													<p className="mb-1 text-default-500">Deadline</p>
													<div className="flex items-center gap-1">
														<Calendar size={12} />
														<span
															className={
																isOverdue(approval.deadline)
																	? "text-danger"
																	: ""
															}
														>
															{approval.deadline
																? formatDistanceToNow(approval.deadline)
																: "No deadline"}
														</span>
													</div>
												</div>
											</div>

											{/* Compliance Score */}
											{approval.complianceScore !== undefined && (
												<div className="mt-4">
													<div className="mb-2 flex items-center justify-between">
														<span className="font-medium text-small">
															Compliance Score
														</span>
														<span className="font-bold text-small">
															{approval.complianceScore}%
														</span>
													</div>
													<Progress
														value={approval.complianceScore}
														color={getComplianceColor(approval.complianceScore)}
														size="sm"
														className="max-w-md"
													/>
												</div>
											)}
										</div>
									</div>

									{/* Actions */}
									<div className="ml-4 flex gap-2">
										<Button
											size="sm"
											variant="flat"
											onPress={() => handleApprovalSelect(approval.id)}
										>
											<Eye size={14} />
											View
										</Button>
										{approval.status === "pending" && (
											<Button
												size="sm"
												color="primary"
												onPress={() => handleStartReview(approval.id)}
											>
												Review
											</Button>
										)}
									</div>
								</div>
							</CardBody>
						</Card>
					))}
				</div>
			)}

			{/* Detail Modal */}
			{selectedApproval && (
				<ApprovalDetailModal
					approvalId={selectedApproval}
					isOpen={isDetailOpen}
					onClose={() => {
						onDetailClose();
						setSelectedApproval(null);
					}}
				/>
			)}

			{/* Review Modal */}
			{selectedApproval && (
				<ApprovalReviewModal
					approvalId={selectedApproval}
					isOpen={isReviewOpen}
					onClose={() => {
						onReviewClose();
						setSelectedApproval(null);
					}}
					onApprove={handleApprove}
					onReject={handleReject}
					onRequestRevision={handleRequestRevision}
				/>
			)}
		</div>
	);
}

// Placeholder components for modals
function ApprovalDetailModal({
	approvalId,
	isOpen,
	onClose,
}: {
	approvalId: string;
	isOpen: boolean;
	onClose: () => void;
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="4xl">
			<ModalContent>
				<ModalHeader>Approval Details</ModalHeader>
				<ModalBody>
					<p>Detailed view for approval {approvalId}</p>
					{/* TODO: Implement detailed approval view */}
				</ModalBody>
				<ModalFooter>
					<Button onPress={onClose}>Close</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

function ApprovalReviewModal({
	approvalId,
	isOpen,
	onClose,
	onApprove,
	onReject,
	onRequestRevision,
}: {
	approvalId: string;
	isOpen: boolean;
	onClose: () => void;
	onApprove: (id: string, notes?: string) => void;
	onReject: (id: string, reason: string) => void;
	onRequestRevision: (id: string, requests: any[]) => void;
}) {
	const [reviewNotes, setReviewNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="2xl">
			<ModalContent>
				<ModalHeader>Review Approval</ModalHeader>
				<ModalBody className="space-y-4">
					<p>Review approval {approvalId}</p>
					<Textarea
						label="Review Notes"
						placeholder="Add your review comments..."
						value={reviewNotes}
						onValueChange={setReviewNotes}
						rows={4}
					/>
					{/* TODO: Implement detailed review interface */}
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancel
					</Button>
					<Button
						color="danger"
						onPress={() => {
							onReject(approvalId, rejectionReason || reviewNotes);
							onClose();
						}}
					>
						Reject
					</Button>
					<Button
						color="success"
						onPress={() => {
							onApprove(approvalId, reviewNotes);
							onClose();
						}}
					>
						Approve
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
