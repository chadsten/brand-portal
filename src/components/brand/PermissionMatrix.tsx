"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	Check,
	Crown,
	Download,
	Edit,
	Eye,
	Info,
	Lock,
	Settings,
	Shield,
	Star,
	Unlock,
	Upload,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";

interface Permission {
	id: string;
	category: string;
	name: string;
	description: string;
	level: "basic" | "advanced" | "admin";
	dependencies?: string[];
}

interface RolePermission {
	roleId: string;
	roleName: string;
	roleColor: string;
	permissions: Record<string, boolean>;
	priority: number;
}

const PERMISSION_CATEGORIES = {
	assets: "Asset Management",
	guidelines: "Brand Guidelines",
	approvals: "Approval Workflow",
	users: "User Management",
	system: "System Administration",
};

const PERMISSION_LEVELS = {
	basic: { color: "success" as const, icon: Eye, label: "Basic" },
	advanced: { color: "warning" as const, icon: Edit, label: "Advanced" },
	admin: { color: "danger" as const, icon: Crown, label: "Admin" },
};

const PERMISSIONS: Permission[] = [
	// Asset Management
	{
		id: "assets.read",
		category: "assets",
		name: "View Assets",
		description: "View asset library and details",
		level: "basic",
	},
	{
		id: "assets.download",
		category: "assets",
		name: "Download Assets",
		description: "Download approved assets",
		level: "basic",
	},
	{
		id: "assets.create",
		category: "assets",
		name: "Upload Assets",
		description: "Upload new assets to library",
		level: "advanced",
	},
	{
		id: "assets.update",
		category: "assets",
		name: "Edit Assets",
		description: "Modify existing asset metadata",
		level: "advanced",
	},
	{
		id: "assets.delete",
		category: "assets",
		name: "Delete Assets",
		description: "Remove assets from library",
		level: "admin",
		dependencies: ["assets.update"],
	},
	{
		id: "assets.approve",
		category: "assets",
		name: "Approve Assets",
		description: "Approve assets for publication",
		level: "admin",
	},
	{
		id: "assets.share",
		category: "assets",
		name: "Share Assets",
		description: "Share assets externally",
		level: "advanced",
	},

	// Brand Guidelines
	{
		id: "guidelines.read",
		category: "guidelines",
		name: "View Guidelines",
		description: "Access brand guidelines",
		level: "basic",
	},
	{
		id: "guidelines.create",
		category: "guidelines",
		name: "Create Guidelines",
		description: "Create new brand guidelines",
		level: "admin",
	},
	{
		id: "guidelines.update",
		category: "guidelines",
		name: "Edit Guidelines",
		description: "Modify existing guidelines",
		level: "admin",
	},
	{
		id: "guidelines.delete",
		category: "guidelines",
		name: "Delete Guidelines",
		description: "Remove brand guidelines",
		level: "admin",
		dependencies: ["guidelines.update"],
	},
	{
		id: "guidelines.approve",
		category: "guidelines",
		name: "Approve Guidelines",
		description: "Approve guideline changes",
		level: "admin",
	},
	{
		id: "guidelines.publish",
		category: "guidelines",
		name: "Publish Guidelines",
		description: "Make guidelines active",
		level: "admin",
		dependencies: ["guidelines.approve"],
	},

	// Approval Workflow
	{
		id: "approvals.submit",
		category: "approvals",
		name: "Submit for Approval",
		description: "Submit assets for approval",
		level: "basic",
	},
	{
		id: "approvals.review",
		category: "approvals",
		name: "Review Submissions",
		description: "Review submitted assets",
		level: "advanced",
	},
	{
		id: "approvals.approve",
		category: "approvals",
		name: "Approve/Reject",
		description: "Make approval decisions",
		level: "admin",
	},
	{
		id: "approvals.assign",
		category: "approvals",
		name: "Assign Reviewers",
		description: "Assign approval tasks",
		level: "admin",
	},
	{
		id: "approvals.override",
		category: "approvals",
		name: "Override Decisions",
		description: "Override approval decisions",
		level: "admin",
		dependencies: ["approvals.approve"],
	},

	// User Management
	{
		id: "users.view",
		category: "users",
		name: "View Users",
		description: "See user list and profiles",
		level: "basic",
	},
	{
		id: "users.invite",
		category: "users",
		name: "Invite Users",
		description: "Send user invitations",
		level: "advanced",
	},
	{
		id: "users.edit",
		category: "users",
		name: "Edit Users",
		description: "Modify user information",
		level: "admin",
	},
	{
		id: "users.delete",
		category: "users",
		name: "Remove Users",
		description: "Delete user accounts",
		level: "admin",
		dependencies: ["users.edit"],
	},
	{
		id: "users.assignRoles",
		category: "users",
		name: "Assign Roles",
		description: "Assign roles to users",
		level: "admin",
	},
	{
		id: "users.manageRoles",
		category: "users",
		name: "Manage Roles",
		description: "Create and edit roles",
		level: "admin",
		dependencies: ["users.assignRoles"],
	},

	// System Administration
	{
		id: "system.viewAnalytics",
		category: "system",
		name: "View Analytics",
		description: "Access usage analytics",
		level: "advanced",
	},
	{
		id: "system.manageSettings",
		category: "system",
		name: "System Settings",
		description: "Configure system settings",
		level: "admin",
	},
	{
		id: "system.accessLogs",
		category: "system",
		name: "Access Logs",
		description: "View system audit logs",
		level: "admin",
	},
	{
		id: "system.exportData",
		category: "system",
		name: "Export Data",
		description: "Export system data",
		level: "advanced",
	},
	{
		id: "system.manageIntegrations",
		category: "system",
		name: "Manage Integrations",
		description: "Configure external integrations",
		level: "admin",
		dependencies: ["system.manageSettings"],
	},
];

export function PermissionMatrix() {
	const [selectedTab, setSelectedTab] = useState("matrix");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedLevel, setSelectedLevel] = useState("all");
	const [comparisonRoles, setComparisonRoles] = useState<string[]>([]);

	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	
	const onTemplateModalOpen = () => setIsTemplateModalOpen(true);
	const onTemplateModalClose = () => setIsTemplateModalOpen(false);

	// Mock role data
	const mockRoles: RolePermission[] = [
		{
			roleId: "admin",
			roleName: "Brand Administrator",
			roleColor: "#ef4444",
			priority: 100,
			permissions: Object.fromEntries(PERMISSIONS.map((p) => [p.id, true])),
		},
		{
			roleId: "manager",
			roleName: "Brand Manager",
			roleColor: "#3b82f6",
			priority: 80,
			permissions: {
				"assets.read": true,
				"assets.download": true,
				"assets.create": true,
				"assets.update": true,
				"assets.approve": true,
				"assets.share": true,
				"guidelines.read": true,
				"guidelines.create": true,
				"guidelines.update": true,
				"guidelines.approve": true,
				"approvals.submit": true,
				"approvals.review": true,
				"approvals.approve": true,
				"approvals.assign": true,
				"users.view": true,
				"system.viewAnalytics": true,
				"system.exportData": true,
			},
		},
		{
			roleId: "creator",
			roleName: "Content Creator",
			roleColor: "#22c55e",
			priority: 60,
			permissions: {
				"assets.read": true,
				"assets.download": true,
				"assets.create": true,
				"assets.update": true,
				"assets.share": false,
				"guidelines.read": true,
				"approvals.submit": true,
				"users.view": true,
			},
		},
		{
			roleId: "viewer",
			roleName: "Brand Viewer",
			roleColor: "#8b5cf6",
			priority: 40,
			permissions: {
				"assets.read": true,
				"assets.download": true,
				"guidelines.read": true,
				"approvals.submit": false,
			},
		},
	];

	const filteredPermissions = PERMISSIONS.filter((permission) => {
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			if (
				!permission.name.toLowerCase().includes(query) &&
				!permission.description.toLowerCase().includes(query)
			) {
				return false;
			}
		}

		// Category filter
		if (
			selectedCategory !== "all" &&
			permission.category !== selectedCategory
		) {
			return false;
		}

		// Level filter
		if (selectedLevel !== "all" && permission.level !== selectedLevel) {
			return false;
		}

		return true;
	});

	const getPermissionIcon = (permission: Permission) => {
		const config = PERMISSION_LEVELS[permission.level];
		const IconComponent = config.icon;
		return <IconComponent size={14} className={`text-${config.color}`} />;
	};

	const hasPermission = (roleId: string, permissionId: string) => {
		const role = mockRoles.find((r) => r.roleId === roleId);
		return role?.permissions[permissionId] ?? false;
	};

	const getPermissionCoverage = (roleId: string) => {
		const role = mockRoles.find((r) => r.roleId === roleId);
		if (!role) return { granted: 0, total: 0, percentage: 0 };

		const granted = Object.values(role.permissions).filter(Boolean).length;
		const total = PERMISSIONS.length;
		const percentage = Math.round((granted / total) * 100);

		return { granted, total, percentage };
	};

	const getConflicts = () => {
		const conflicts: Array<{
			permission: string;
			roles: string[];
			level: string;
		}> = [];

		PERMISSIONS.forEach((permission) => {
			const rolesWithPermission = mockRoles.filter((role) =>
				hasPermission(role.roleId, permission.id),
			);

			if (permission.level === "admin" && rolesWithPermission.length > 2) {
				conflicts.push({
					permission: permission.name,
					roles: rolesWithPermission.map((r) => r.roleName),
					level: "High",
				});
			}
		});

		return conflicts;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<Shield size={24} />
						Permission Matrix
					</h1>
					<p className="text-base-content/50 text-sm">
						Visualize and manage role permissions across the system
					</p>
				</div>
				<div className="flex gap-2">
					<button className="btn btn-outline gap-2">
						<Download size={16} />
						Export Matrix
					</button>
					<button className="btn btn-outline gap-2">
						<Upload size={16} />
						Import Template
					</button>
					<button
						className="btn btn-primary gap-2"
						onClick={onTemplateModalOpen}
					>
						<Settings size={16} />
						Create Template
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="tabs tabs-boxed w-full">
				<input
					type="radio"
					name="permission_tabs"
					className="tab"
					aria-label="Permission Matrix"
					checked={selectedTab === "matrix"}
					onChange={() => setSelectedTab("matrix")}
				/>
				<input
					type="radio"
					name="permission_tabs"
					className="tab"
					aria-label="Analysis"
					checked={selectedTab === "analysis"}
					onChange={() => setSelectedTab("analysis")}
				/>
			</div>
			
			<div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
				{selectedTab === "matrix" && (
					<div className="space-y-4">
					{/* Filters */}
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<div className="flex flex-col gap-4 md:flex-row md:items-center">
									<div className="relative flex-1">
										<Shield size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
										<input
											className="input input-bordered w-full pl-10"
											placeholder="Search permissions..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
									</div>
									<div className="flex gap-2">
										<select
											className="select select-bordered w-48"
											value={selectedCategory}
											onChange={(e) => setSelectedCategory(e.target.value)}
										>
											<option value="all">All Categories</option>
											{Object.entries(PERMISSION_CATEGORIES).map(
												([key, label]) => (
													<option key={key} value={key}>{label}</option>
												),
											)}
										</select>
										<select
											className="select select-bordered w-48"
											value={selectedLevel}
											onChange={(e) => setSelectedLevel(e.target.value)}
										>
											<option value="all">All Levels</option>
											{Object.entries(PERMISSION_LEVELS).map(
												([key, config]) => (
													<option key={key} value={key}>{config.label}</option>
												),
											)}
										</select>
									</div>
								</div>
							</div>
						</div>

						{/* Permission Matrix Table */}
						<div className="card bg-base-100 shadow">
							<div className="overflow-x-auto">
								<table className="table w-full">
									<thead>
										<tr>
											<th className="w-1/3">PERMISSION</th>
											<th className="min-w-32 text-center">
												{mockRoles[0] ? (
													<div className="flex flex-col items-center gap-1">
														<span
															className="badge badge-sm"
															style={{
																backgroundColor: `${mockRoles[0].roleColor}20`,
																color: mockRoles[0].roleColor,
															}}
														>
															{mockRoles[0].roleName}
														</span>
														<span className="text-base-content/40 text-xs">
															{
																getPermissionCoverage(mockRoles[0].roleId)
																	.percentage
															}
															%
														</span>
													</div>
												) : (
													"Role 1"
												)}
											</th>
											<th className="min-w-32 text-center">
												{mockRoles[1] ? (
													<div className="flex flex-col items-center gap-1">
														<span
															className="badge badge-sm"
															style={{
																backgroundColor: `${mockRoles[1].roleColor}20`,
																color: mockRoles[1].roleColor,
															}}
														>
															{mockRoles[1].roleName}
														</span>
														<span className="text-base-content/40 text-xs">
															{
																getPermissionCoverage(mockRoles[1].roleId)
																	.percentage
															}
															%
														</span>
													</div>
												) : (
													"Role 2"
												)}
											</th>
										<th className="min-w-32 text-center">
											{mockRoles[2] ? (
												<div className="flex flex-col items-center gap-1">
													<span
														className="badge badge-sm"
														style={{
															backgroundColor: `${mockRoles[2].roleColor}20`,
															color: mockRoles[2].roleColor,
														}}
													>
														{mockRoles[2].roleName}
													</span>
													<span className="text-base-content/40 text-xs">
														{
															getPermissionCoverage(mockRoles[2].roleId)
																.percentage
														}
														%
													</span>
												</div>
											) : (
												"Role 3"
											)}
										</th>
										<th className="min-w-32 text-center">
											{mockRoles[3] ? (
												<div className="flex flex-col items-center gap-1">
													<span
														className="badge badge-sm"
														style={{
															backgroundColor: `${mockRoles[3].roleColor}20`,
															color: mockRoles[3].roleColor,
														}}
													>
														{mockRoles[3].roleName}
													</span>
													<span className="text-base-content/40 text-xs">
														{
															getPermissionCoverage(mockRoles[3].roleId)
																.percentage
														}
														%
													</span>
												</div>
											) : (
												"Role 4"
											)}
										</th>
								</tr>
							</thead>
							<tbody>
								{filteredPermissions.map((permission) => (
									<tr key={permission.id}>
										<td>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														{getPermissionIcon(permission)}
														<span className="font-medium">
															{permission.name}
														</span>
														{permission.dependencies && (
															<Lock 
																size={12} 
																className="text-warning" 
																title={`Requires: ${permission.dependencies.join(", ")}`}
															/>
														)}
													</div>
													<p className="text-base-content/50 text-sm">
														{permission.description}
													</p>
													<div className="flex items-center gap-2">
														<span className={`badge badge-sm ${
															PERMISSION_LEVELS[permission.level].color === "success" ? "badge-success" :
															PERMISSION_LEVELS[permission.level].color === "warning" ? "badge-warning" :
															PERMISSION_LEVELS[permission.level].color === "danger" ? "badge-error" :
															"badge-neutral"
														}`}>
															{PERMISSION_LEVELS[permission.level].label}
														</span>
														<span className="badge badge-sm badge-neutral">
															{
																PERMISSION_CATEGORIES[
																	permission.category as keyof typeof PERMISSION_CATEGORIES
																]
															}
														</span>
													</div>
												</div>
											</td>
											<td>
												<div className="flex items-center justify-center">
													{hasPermission(
														mockRoles[0]?.roleId || "",
														permission.id,
													) ? (
														<div className="text-success" title="Permission granted">
															<Check size={16} />
														</div>
													) : (
														<div className="text-base-content/30" title="Permission denied">
															<X size={16} />
														</div>
													)}
												</div>
											</td>
											<td>
												<div className="flex items-center justify-center">
													{hasPermission(
														mockRoles[1]?.roleId || "",
														permission.id,
													) ? (
														<div className="text-success" title="Permission granted">
															<Check size={16} />
														</div>
													) : (
														<div className="text-base-content/30" title="Permission denied">
															<X size={16} />
														</div>
													)}
												</div>
											</td>
											<td>
												<div className="flex items-center justify-center">
													{hasPermission(
														mockRoles[2]?.roleId || "",
														permission.id,
													) ? (
														<div className="text-success" title="Permission granted">
															<Check size={16} />
														</div>
													) : (
														<div className="text-base-content/30" title="Permission denied">
															<X size={16} />
														</div>
													)}
												</div>
											</td>
											<td>
												<div className="flex items-center justify-center">
													{hasPermission(
														mockRoles[3]?.roleId || "",
														permission.id,
													) ? (
														<div className="text-success" title="Permission granted">
															<Check size={16} />
														</div>
													) : (
														<div className="text-base-content/30" title="Permission denied">
															<X size={16} />
														</div>
													)}
												</div>
											</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
						</div>
					)}
				
				{selectedTab === "analysis" && (
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Role Coverage */}
						<div className="card bg-base-100 shadow">
							<div className="card-header">
								<h3 className="font-semibold">Role Permission Coverage</h3>
							</div>
							<div className="card-body space-y-4">
								{mockRoles.map((role) => {
									const coverage = getPermissionCoverage(role.roleId);
									return (
										<div key={role.roleId} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="h-3 w-3 rounded-full"
														style={{ backgroundColor: role.roleColor }}
													/>
													<span className="font-medium">{role.roleName}</span>
												</div>
												<span className="text-base-content/50 text-sm">
													{coverage.granted}/{coverage.total} permissions
												</span>
											</div>
											<div className="h-2 w-full rounded-full bg-default-200">
												<div
													className="h-2 rounded-full"
													style={{
														backgroundColor: role.roleColor,
														width: `${coverage.percentage}%`,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Permission Distribution */}
						<div className="card bg-base-100 shadow">
							<div className="card-header">
								<h3 className="font-semibold">Permission by Category</h3>
							</div>
							<div className="card-body space-y-4">
								{Object.entries(PERMISSION_CATEGORIES).map(
									([category, label]) => {
										const categoryPermissions = PERMISSIONS.filter(
											(p) => p.category === category,
										);
										const totalRoles = mockRoles.length;
										const totalAssignments = mockRoles.reduce(
											(acc, role) =>
												acc +
												categoryPermissions.filter((p) =>
													hasPermission(role.roleId, p.id),
												).length,
											0,
										);
										const maxPossible = categoryPermissions.length * totalRoles;
										const percentage = Math.round(
											(totalAssignments / maxPossible) * 100,
										);

										return (
											<div key={category} className="space-y-2">
												<div className="flex items-center justify-between">
													<span className="font-medium">{label}</span>
													<span className="text-base-content/50 text-sm">
														{totalAssignments}/{maxPossible} assignments
													</span>
												</div>
												<div className="h-2 w-full rounded-full bg-default-200">
													<div
														className="h-2 rounded-full bg-primary"
														style={{ width: `${percentage}%` }}
													/>
												</div>
											</div>
										);
									},
								)}
							</div>
						</div>

						{/* Security Insights */}
						<div className="card bg-base-100 shadow">
							<div className="card-header">
								<h3 className="font-semibold">Security Insights</h3>
							</div>
							<div className="card-body space-y-4">
								<div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-3">
									<AlertTriangle size={16} className="mt-0.5 text-warning" />
									<div>
										<p className="font-medium text-sm">
											Over-privileged Roles
										</p>
										<p className="text-base-content/50 text-xs">
											{
												mockRoles.filter(
													(r) =>
														getPermissionCoverage(r.roleId).percentage > 75,
												).length
											}{" "}
											roles have extensive permissions
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 p-3">
									<Check size={16} className="mt-0.5 text-success" />
									<div>
										<p className="font-medium text-sm">
											Principle of Least Privilege
										</p>
										<p className="text-base-content/50 text-xs">
											{
												mockRoles.filter(
													(r) =>
														getPermissionCoverage(r.roleId).percentage < 50,
												).length
											}{" "}
											roles follow minimal access principles
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3">
									<X size={16} className="mt-0.5 text-danger" />
									<div>
										<p className="font-medium text-sm">Dependency Issues</p>
										<p className="text-base-content/50 text-xs">
											{PERMISSIONS.filter((p) => p.dependencies?.length).length}{" "}
											permissions have dependencies to review
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Recommendations */}
						<div className="card bg-base-100 shadow">
							<div className="card-header">
								<h3 className="font-semibold">Recommendations</h3>
							</div>
							<div className="card-body space-y-3">
								<div className="flex items-start gap-3">
									<Info size={16} className="mt-0.5 text-primary" />
									<div>
										<p className="font-medium text-sm">
											Review Admin Permissions
										</p>
										<p className="text-base-content/50 text-xs">
											Consider splitting admin role into specialized roles
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Star size={16} className="mt-0.5 text-secondary" />
									<div>
										<p className="font-medium text-sm">
											Create Reviewer Role
										</p>
										<p className="text-base-content/50 text-xs">
											Add dedicated role for approval workflow management
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Unlock size={16} className="mt-0.5 text-warning" />
									<div>
										<p className="font-medium text-sm">Temporary Access</p>
										<p className="text-base-content/50 text-xs">
											Implement time-based permissions for enhanced security
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Template Modal */}
			<dialog className={`modal ${isTemplateModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-2xl">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-bold text-lg">Create Permission Template</h3>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onTemplateModalClose}>✕</button>
					</div>
					<div className="modal-body space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Template Name</span>
							</label>
							<input
								className="input input-bordered"
								placeholder="e.g., Marketing Team Template"
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Base Role</span>
							</label>
							<select className="select select-bordered">
								<option value="">Start from existing role</option>
								{mockRoles.map((role) => (
									<option key={role.roleId} value={role.roleId}>{role.roleName}</option>
								))}
							</select>
						</div>

						<div className="space-y-3">
							<h4 className="font-medium">Quick Templates</h4>
							<div className="grid grid-cols-2 gap-2">
								<button className="btn btn-sm btn-outline">
									Read-Only Access
								</button>
								<button className="btn btn-sm btn-outline">
									Content Creator
								</button>
								<button className="btn btn-sm btn-outline">
									Approval Manager
								</button>
								<button className="btn btn-sm btn-outline">
									Full Administrator
								</button>
							</div>
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-outline" onClick={onTemplateModalClose}>
							Cancel
						</button>
						<button className="btn btn-primary" onClick={onTemplateModalClose}>
							Create Template
						</button>
					</div>
				</div>
				<div className="modal-backdrop" onClick={onTemplateModalClose}></div>
			</dialog>
		</div>
	);
}
