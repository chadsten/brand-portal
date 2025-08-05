"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	Check,
	Copy,
	Crown,
	Download,
	Edit,
	Eye,
	Plus,
	Settings,
	Shield,
	Star,
	Trash2,
	Upload,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";

interface BrandRole {
	id: string;
	name: string;
	description: string;
	color: string;
	icon?: string;
	permissions: RolePermissions;
	priority: number;
	isBuiltIn: boolean;
	isActive: boolean;
	maxUsers?: number;
	userCount: number;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

interface RolePermissions {
	// Asset permissions
	assets: {
		create: boolean;
		read: boolean;
		update: boolean;
		delete: boolean;
		approve: boolean;
		download: boolean;
		share: boolean;
	};
	// Brand guidelines permissions
	guidelines: {
		create: boolean;
		read: boolean;
		update: boolean;
		delete: boolean;
		approve: boolean;
		publish: boolean;
	};
	// Approval workflow permissions
	approvals: {
		submit: boolean;
		review: boolean;
		approve: boolean;
		reject: boolean;
		assign: boolean;
		override: boolean;
	};
	// User management permissions
	users: {
		invite: boolean;
		view: boolean;
		edit: boolean;
		delete: boolean;
		assignRoles: boolean;
		manageRoles: boolean;
	};
	// System permissions
	system: {
		viewAnalytics: boolean;
		manageSettings: boolean;
		accessLogs: boolean;
		exportData: boolean;
		manageIntegrations: boolean;
	};
}

interface UserRoleAssignment {
	id: string;
	userId: string;
	roleId: string;
	assignedBy: string;
	assignedAt: Date;
	expiresAt?: Date;
	isActive: boolean;
	customPermissions: Partial<RolePermissions>;
	restrictions: any;
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
	role: BrandRole;
	assigner: {
		id: string;
		name: string;
		email: string;
	};
}

const DEFAULT_PERMISSIONS: RolePermissions = {
	assets: {
		create: false,
		read: false,
		update: false,
		delete: false,
		approve: false,
		download: false,
		share: false,
	},
	guidelines: {
		create: false,
		read: false,
		update: false,
		delete: false,
		approve: false,
		publish: false,
	},
	approvals: {
		submit: false,
		review: false,
		approve: false,
		reject: false,
		assign: false,
		override: false,
	},
	users: {
		invite: false,
		view: false,
		edit: false,
		delete: false,
		assignRoles: false,
		manageRoles: false,
	},
	system: {
		viewAnalytics: false,
		manageSettings: false,
		accessLogs: false,
		exportData: false,
		manageIntegrations: false,
	},
};

const PERMISSION_LABELS = {
	assets: "Asset Management",
	guidelines: "Brand Guidelines",
	approvals: "Approval Workflow",
	users: "User Management",
	system: "System Administration",
};

const ROLE_COLORS = [
	"#ef4444", // red
	"#f97316", // orange
	"#eab308", // yellow
	"#22c55e", // green
	"#06b6d4", // cyan
	"#3b82f6", // blue
	"#8b5cf6", // violet
	"#ec4899", // pink
];

export function RoleManagement() {
	const [selectedTab, setSelectedTab] = useState("roles");
	const [editingRole, setEditingRole] = useState<BrandRole | null>(null);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
	
	const onRoleModalOpen = () => setIsRoleModalOpen(true);
	const onRoleModalClose = () => setIsRoleModalOpen(false);

	// Mock data - would be replaced with API calls
	const mockRoles: BrandRole[] = [
		{
			id: "admin",
			name: "Brand Administrator",
			description: "Full access to all brand management features",
			color: "#ef4444",
			icon: "crown",
			permissions: {
				assets: {
					create: true,
					read: true,
					update: true,
					delete: true,
					approve: true,
					download: true,
					share: true,
				},
				guidelines: {
					create: true,
					read: true,
					update: true,
					delete: true,
					approve: true,
					publish: true,
				},
				approvals: {
					submit: true,
					review: true,
					approve: true,
					reject: true,
					assign: true,
					override: true,
				},
				users: {
					invite: true,
					view: true,
					edit: true,
					delete: true,
					assignRoles: true,
					manageRoles: true,
				},
				system: {
					viewAnalytics: true,
					manageSettings: true,
					accessLogs: true,
					exportData: true,
					manageIntegrations: true,
				},
			},
			priority: 100,
			isBuiltIn: true,
			isActive: true,
			userCount: 2,
			createdBy: "system",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		},
		{
			id: "manager",
			name: "Brand Manager",
			description: "Manage brand assets and guidelines with approval authority",
			color: "#3b82f6",
			icon: "star",
			permissions: {
				assets: {
					create: true,
					read: true,
					update: true,
					delete: false,
					approve: true,
					download: true,
					share: true,
				},
				guidelines: {
					create: true,
					read: true,
					update: true,
					delete: false,
					approve: true,
					publish: false,
				},
				approvals: {
					submit: true,
					review: true,
					approve: true,
					reject: true,
					assign: true,
					override: false,
				},
				users: {
					invite: false,
					view: true,
					edit: false,
					delete: false,
					assignRoles: false,
					manageRoles: false,
				},
				system: {
					viewAnalytics: true,
					manageSettings: false,
					accessLogs: false,
					exportData: true,
					manageIntegrations: false,
				},
			},
			priority: 80,
			isBuiltIn: true,
			isActive: true,
			userCount: 5,
			createdBy: "system",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		},
		{
			id: "creator",
			name: "Content Creator",
			description: "Create and submit brand assets for approval",
			color: "#22c55e",
			icon: "plus",
			permissions: {
				assets: {
					create: true,
					read: true,
					update: true,
					delete: false,
					approve: false,
					download: true,
					share: false,
				},
				guidelines: {
					create: false,
					read: true,
					update: false,
					delete: false,
					approve: false,
					publish: false,
				},
				approvals: {
					submit: true,
					review: false,
					approve: false,
					reject: false,
					assign: false,
					override: false,
				},
				users: {
					invite: false,
					view: true,
					edit: false,
					delete: false,
					assignRoles: false,
					manageRoles: false,
				},
				system: {
					viewAnalytics: false,
					manageSettings: false,
					accessLogs: false,
					exportData: false,
					manageIntegrations: false,
				},
			},
			priority: 60,
			isBuiltIn: true,
			isActive: true,
			userCount: 12,
			createdBy: "system",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		},
		{
			id: "viewer",
			name: "Brand Viewer",
			description: "View and download approved brand assets",
			color: "#8b5cf6",
			icon: "eye",
			permissions: {
				assets: {
					create: false,
					read: true,
					update: false,
					delete: false,
					approve: false,
					download: true,
					share: false,
				},
				guidelines: {
					create: false,
					read: true,
					update: false,
					delete: false,
					approve: false,
					publish: false,
				},
				approvals: {
					submit: false,
					review: false,
					approve: false,
					reject: false,
					assign: false,
					override: false,
				},
				users: {
					invite: false,
					view: false,
					edit: false,
					delete: false,
					assignRoles: false,
					manageRoles: false,
				},
				system: {
					viewAnalytics: false,
					manageSettings: false,
					accessLogs: false,
					exportData: false,
					manageIntegrations: false,
				},
			},
			priority: 40,
			isBuiltIn: true,
			isActive: true,
			userCount: 28,
			createdBy: "system",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		},
	];

	const handleCreateRole = () => {
		setEditingRole({
			id: "",
			name: "",
			description: "",
			color: ROLE_COLORS[0]!,
			permissions: { ...DEFAULT_PERMISSIONS },
			priority: 50,
			isBuiltIn: false,
			isActive: true,
			userCount: 0,
			createdBy: "current-user",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		setIsCreatingNew(true);
		onRoleModalOpen();
	};

	const handleEditRole = (role: BrandRole) => {
		setEditingRole({ ...role });
		setIsCreatingNew(false);
		onRoleModalOpen();
	};

	const handleSaveRole = () => {
		if (!editingRole) return;

		console.log(isCreatingNew ? "Creating" : "Updating", "role:", editingRole);
		// TODO: Implement API call

		setEditingRole(null);
		onRoleModalClose();
	};

	const handleDeleteRole = (roleId: string) => {
		if (
			confirm(
				"Are you sure you want to delete this role? This will affect all users assigned to this role.",
			)
		) {
			console.log("Deleting role:", roleId);
			// TODO: Implement API call
		}
	};

	const updatePermission = (
		category: keyof RolePermissions,
		permission: string,
		value: boolean,
	) => {
		if (!editingRole) return;

		setEditingRole({
			...editingRole,
			permissions: {
				...editingRole.permissions,
				[category]: {
					...editingRole.permissions[category],
					[permission]: value,
				},
			},
		});
	};

	const getRoleIcon = (iconName?: string) => {
		switch (iconName) {
			case "crown":
				return <Crown size={16} />;
			case "star":
				return <Star size={16} />;
			case "plus":
				return <Plus size={16} />;
			case "eye":
				return <Eye size={16} />;
			default:
				return <Shield size={16} />;
		}
	};

	const getPermissionCount = (permissions: RolePermissions) => {
		let total = 0;
		let granted = 0;

		Object.values(permissions).forEach((category) => {
			Object.values(category).forEach((permission) => {
				total++;
				if (permission) granted++;
			});
		});

		return { granted, total };
	};

	const filteredRoles = mockRoles.filter(
		(role) =>
			role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			role.description.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<Shield size={24} />
						Role & Permission Management
					</h1>
					<p className="text-base-content/60 text-sm">
						Manage user roles and permissions for brand portal access
					</p>
				</div>
				<div className="flex gap-2">
					<button className="btn btn-outline gap-2">
						<Download size={16} />
						Export Roles
					</button>
					<button className="btn btn-outline gap-2">
						<Upload size={16} />
						Import Roles
					</button>
					<button
						className="btn btn-primary gap-2"
						onClick={handleCreateRole}
					>
						<Plus size={16} />
						Create Role
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div role="tablist" className="tabs tabs-box w-full">
				<button
					role="tab"
					className={`tab ${selectedTab === "roles" ? "tab-active" : ""}`}
					onClick={() => setSelectedTab("roles")}
				>
					Roles
				</button>
				<button
					role="tab"
					className={`tab ${selectedTab === "assignments" ? "tab-active" : ""}`}
					onClick={() => setSelectedTab("assignments")}
				>
					User Assignments
				</button>
			</div>
			
			<div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
				{selectedTab === "roles" && (
					<div className="space-y-6">
					{/* Search */}
					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="relative max-w-md">
								<Settings size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
								<input
									className="input w-full pl-10"
									placeholder="Search roles..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Roles Grid */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredRoles.map((role) => {
							const permissionStats = getPermissionCount(role.permissions);
							const permissionPercentage =
								(permissionStats.granted / permissionStats.total) * 100;

							return (
								<div
									key={role.id}
									className="card bg-base-100 shadow border border-base-300 transition-shadow hover:shadow-md"
								>
									<div className="card-header pb-2">
										<div className="flex w-full items-start justify-between">
											<div className="flex items-center gap-3">
												<div
													className="flex items-center justify-center rounded-lg p-2"
													style={{ backgroundColor: `${role.color}20` }}
												>
													<div style={{ color: role.color }}>
														{getRoleIcon(role.icon)}
													</div>
												</div>
												<div>
													<h3 className="flex items-center gap-2 font-semibold">
														{role.name}
														{role.isBuiltIn && (
															<span className="badge badge-warning badge-sm">
																Built-in
															</span>
														)}
													</h3>
													<p className="text-base-content/60 text-sm">
														{role.userCount} users
													</p>
												</div>
											</div>
											<div className="flex gap-1">
												<button
													className="btn btn-sm btn-outline btn-square"
													onClick={() => handleEditRole(role)}
												>
													<Edit size={14} />
												</button>
												{!role.isBuiltIn && (
													<button
														className="btn btn-sm btn-outline btn-error btn-square"
														onClick={() => handleDeleteRole(role.id)}
													>
														<Trash2 size={14} />
													</button>
												)}
											</div>
										</div>
									</div>
									<div className="card-body space-y-4">
										<p className="text-base-content/70 text-sm">
											{role.description}
										</p>

										{/* Permission Summary */}
										<div>
											<div className="mb-2 flex items-center justify-between">
												<span className="font-medium text-sm">
													Permissions
												</span>
												<span className="text-base-content/60 text-sm">
													{permissionStats.granted}/{permissionStats.total}
												</span>
											</div>
											<progress
												className={`progress progress-sm w-full ${
													permissionPercentage > 75
														? "progress-error"
														: permissionPercentage > 50
															? "progress-warning"
															: "progress-success"
												}`}
												value={permissionPercentage}
												max="100"
											></progress>
										</div>

										{/* Quick Actions */}
										<div className="flex gap-2">
											<button
												className="btn btn-sm btn-outline gap-2"
												onClick={() => {
													const newRole = {
														...role,
														id: "",
														name: `${role.name} Copy`,
														isBuiltIn: false,
														userCount: 0,
													};
													setEditingRole(newRole);
													setIsCreatingNew(true);
													onRoleModalOpen();
												}}
											>
												<Copy size={12} />
												Duplicate
											</button>
											<button
												className={`btn btn-sm btn-outline gap-2 ${!role.isActive ? 'btn-disabled' : ''}`}
												disabled={!role.isActive}
											>
												<Users size={12} />
												Assign Users
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
					</div>
				)}
				
				{selectedTab === "assignments" && (
					<div className="card bg-base-100 shadow">
						<div className="card-body py-12 text-center">
							<Users size={48} className="mx-auto mb-4 text-base-content/30" />
							<h3 className="mb-2 font-semibold text-lg">
								User Role Assignments
							</h3>
							<p className="mb-4 text-base-content/60">
								Manage which users have which roles
							</p>
							<button className="btn btn-primary">Manage User Assignments</button>
						</div>
					</div>
				)}
			</div>

			{/* Role Edit Modal */}
			<dialog className="modal" open={isRoleModalOpen}>
				<div className="modal-box w-11/12 max-w-4xl h-5/6 overflow-y-auto">
					{editingRole && (
						<>
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-bold text-lg">
									{isCreatingNew ? "Create" : "Edit"} Role
								</h3>
								<button className="btn btn-sm btn-circle btn-ghost" onClick={onRoleModalClose}>✕</button>
							</div>
							<div className="modal-body space-y-6">
								{/* Basic Information */}
								<div className="card bg-base-100 shadow border border-base-300">
									<div className="card-header">
										<h4 className="font-medium">Basic Information</h4>
									</div>
									<div className="card-body space-y-4">
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="w-full">
												<label className="label" htmlFor="role-name">Role Name</label>
												<input
													id="role-name"
													className="input"
													placeholder="e.g., Brand Manager"
													value={editingRole.name}
													onChange={(e) =>
														setEditingRole({ ...editingRole, name: e.target.value })
													}
													required
												/>
											</div>
											<div className="space-y-2">
												<label className="font-medium text-sm">
													Role Color
												</label>
												<div className="flex gap-2">
													{ROLE_COLORS.map((color) => (
														<button
															key={color}
															className={`h-8 w-8 rounded-full border-2 ${
																editingRole.color === color
																	? "scale-110 border-base-content"
																	: "border-base-300"
															}`}
															style={{ backgroundColor: color }}
															onClick={() =>
																setEditingRole({ ...editingRole, color })
															}
														/>
													))}
												</div>
											</div>
										</div>

										<div className="w-full">
											<label className="label" htmlFor="role-description">Description</label>
											<textarea
												id="role-description"
												className="textarea"
												placeholder="Describe the role's purpose and responsibilities..."
												value={editingRole.description}
												onChange={(e) =>
													setEditingRole({ ...editingRole, description: e.target.value })
												}
												rows={3}
											/>
										</div>

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<label className="font-medium text-sm">
													Priority Level
												</label>
												<input
													type="range"
													min="0"
													max="100"
													step="10"
													value={editingRole.priority}
													onChange={(e) =>
														setEditingRole({
															...editingRole,
															priority: Number(e.target.value),
														})
													}
													className="range range-primary"
												/>
												<p className="text-base-content/60 text-sm">
													Priority: {editingRole.priority} (Higher = More
													Authority)
												</p>
											</div>

											<div className="space-y-2">
												<label className="font-medium text-sm">
													Settings
												</label>
												<div className="space-y-2">
													<div className="w-full">
														<label className="cursor-pointer label" htmlFor="active-role">
															<span className="label-text">Active Role</span>
															<input
																id="active-role"
																type="checkbox"
																className="toggle toggle-primary"
																checked={editingRole.isActive}
																onChange={(e) =>
																	setEditingRole({
																		...editingRole,
																		isActive: e.target.checked,
																	})
																}
															/>
														</label>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Permissions */}
								<div className="card bg-base-100 shadow border border-base-300">
									<div className="card-header">
										<h4 className="font-medium">Permissions</h4>
									</div>
									<div className="card-body">
										<div className="space-y-6">
											{Object.entries(PERMISSION_LABELS).map(
												([category, label]) => (
													<div key={category} className="space-y-3">
														<h5 className="flex items-center gap-2 font-medium">
															{category === "assets" && <Upload size={16} />}
															{category === "guidelines" && (
																<Settings size={16} />
															)}
															{category === "approvals" && <Check size={16} />}
															{category === "users" && <Users size={16} />}
															{category === "system" && <Shield size={16} />}
															{label}
														</h5>
														<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
															{Object.entries(
																editingRole.permissions[
																	category as keyof RolePermissions
																],
															).map(([permission, value]) => (
																<div key={permission} className="w-full">
																	<label className="cursor-pointer label" htmlFor={`${category}-${permission}`}>
																		<span className="label-text text-sm capitalize">
																			{permission
																				.replace(/([A-Z])/g, " $1")
																				.toLowerCase()}
																		</span>
																		<input
																			id={`${category}-${permission}`}
																			type="checkbox"
																			className="toggle toggle-primary"
																			checked={value}
																			onChange={(e) =>
																				updatePermission(
																					category as keyof RolePermissions,
																					permission,
																					e.target.checked,
																				)
																			}
																		/>
																	</label>
																</div>
															))}
														</div>
													</div>
												),
											)}
										</div>
									</div>
								</div>
							</div>
							<div className="modal-action">
								<button className="btn btn-outline" onClick={onRoleModalClose}>
									Cancel
								</button>
								<button
									className="btn btn-primary"
									onClick={handleSaveRole}
									disabled={!editingRole.name.trim()}
								>
									{isCreatingNew ? "Create" : "Save"} Role
								</button>
							</div>
						</>
					)}
				</div>
				<div className="modal-backdrop" onClick={onRoleModalClose}></div>
			</dialog>
		</div>
	);
}
