"use client";

// HeroUI imports removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	Calendar,
	Clock,
	Download,
	Edit,
	ExternalLink,
	Eye,
	Filter,
	Mail,
	Plus,
	RefreshCw,
	Search,
	Shield,
	Trash2,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "~/lib/utils";

interface User {
	id: string;
	name: string;
	email: string;
	image?: string;
	status: "active" | "inactive" | "pending";
	lastLogin?: Date;
	createdAt: Date;
}

interface BrandRole {
	id: string;
	name: string;
	description: string;
	color: string;
	priority: number;
	isActive: boolean;
	userCount: number;
}

interface UserRoleAssignment {
	id: string;
	userId: string;
	roleId: string;
	assignedBy: string;
	assignedAt: Date;
	expiresAt?: Date;
	isActive: boolean;
	customPermissions: any;
	restrictions: any;
	user: User;
	role: BrandRole;
	assigner: User;
}

interface AssignmentFilters {
	role: string;
	status: string;
	assignedBy: string;
	expiring: boolean;
}

const STATUS_CONFIG = {
	active: { color: "success" as const, label: "Active" },
	inactive: { color: "default" as const, label: "Inactive" },
	pending: { color: "warning" as const, label: "Pending" },
	expired: { color: "error" as const, label: "Expired" },
};

export function UserRoleAssignment() {
	const [selectedTab, setSelectedTab] = useState("assignments");
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<AssignmentFilters>({
		role: "",
		status: "",
		assignedBy: "",
		expiring: false,
	});
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [bulkRole, setBulkRole] = useState<string>("");

	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

	// Mock data
	const mockRoles: BrandRole[] = [
		{
			id: "admin",
			name: "Brand Administrator",
			description: "Full access to all brand management features",
			color: "#ef4444",
			priority: 100,
			isActive: true,
			userCount: 2,
		},
		{
			id: "manager",
			name: "Brand Manager",
			description: "Manage brand assets and guidelines with approval authority",
			color: "#3b82f6",
			priority: 80,
			isActive: true,
			userCount: 5,
		},
		{
			id: "creator",
			name: "Content Creator",
			description: "Create and submit brand assets for approval",
			color: "#22c55e",
			priority: 60,
			isActive: true,
			userCount: 12,
		},
		{
			id: "viewer",
			name: "Brand Viewer",
			description: "View and download approved brand assets",
			color: "#8b5cf6",
			priority: 40,
			isActive: true,
			userCount: 28,
		},
	];

	const mockUsers: User[] = [
		{
			id: "1",
			name: "Sarah Chen",
			email: "sarah@company.com",
			image: "/avatars/sarah.jpg",
			status: "active",
			lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
			createdAt: new Date("2024-01-15"),
		},
		{
			id: "2",
			name: "Mike Johnson",
			email: "mike@company.com",
			image: "/avatars/mike.jpg",
			status: "active",
			lastLogin: new Date(Date.now() - 30 * 60 * 1000),
			createdAt: new Date("2024-01-10"),
		},
		{
			id: "3",
			name: "Alex Rivera",
			email: "alex@company.com",
			image: "/avatars/alex.jpg",
			status: "inactive",
			lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date("2024-01-08"),
		},
		{
			id: "4",
			name: "Jordan Kim",
			email: "jordan@company.com",
			status: "pending",
			createdAt: new Date("2024-01-20"),
		},
	];

	const mockAssignments: UserRoleAssignment[] = [
		{
			id: "1",
			userId: "1",
			roleId: "admin",
			assignedBy: "2",
			assignedAt: new Date("2024-01-15"),
			isActive: true,
			customPermissions: {},
			restrictions: {},
			user: mockUsers[0]!,
			role: mockRoles[0]!,
			assigner: mockUsers[1]!,
		},
		{
			id: "2",
			userId: "2",
			roleId: "manager",
			assignedBy: "1",
			assignedAt: new Date("2024-01-16"),
			expiresAt: new Date("2024-06-16"),
			isActive: true,
			customPermissions: {},
			restrictions: {},
			user: mockUsers[1]!,
			role: mockRoles[1]!,
			assigner: mockUsers[0]!,
		},
	];

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<UserPlus size={24} />
						User Role Assignments
					</h1>
					<p className="text-base-content/60 text-sm">
						Manage user role assignments and permissions
					</p>
				</div>
				<div className="flex gap-2">
					<button className="btn btn-outline gap-2">
						<Download size={16} />
						Export
					</button>
					<button className="btn btn-outline gap-2">
						<RefreshCw size={16} />
						Sync Users
					</button>
					<button
						className={`btn btn-secondary gap-2 ${selectedUsers.length === 0 ? 'btn-disabled' : ''}`}
						onClick={() => setIsBulkModalOpen(true)}
						disabled={selectedUsers.length === 0}
					>
						<UserPlus size={16} />
						Bulk Assign ({selectedUsers.length})
					</button>
					<button
						className="btn btn-primary gap-2"
						onClick={() => setIsAssignModalOpen(true)}
					>
						<Plus size={16} />
						Assign Role
					</button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Shield size={16} className="text-primary" />
							<span className="font-medium text-sm">Total Assignments</span>
						</div>
						<p className="font-bold text-2xl">{mockAssignments.length}</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Clock size={16} className="text-warning" />
							<span className="font-medium text-sm">Expiring Soon</span>
						</div>
						<p className="font-bold text-2xl">1</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<AlertTriangle size={16} className="text-error" />
							<span className="font-medium text-sm">Expired</span>
						</div>
						<p className="font-bold text-2xl">0</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<UserPlus size={16} className="text-success" />
							<span className="font-medium text-sm">Unassigned Users</span>
						</div>
						<p className="font-bold text-2xl">2</p>
					</div>
				</div>
			</div>

			{/* Simplified content for demonstration */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h3 className="font-bold text-lg mb-4">Role Assignments</h3>
					<div className="space-y-4">
						{mockAssignments.map((assignment) => (
							<div key={assignment.id} className="flex items-center justify-between p-4 border border-base-300 rounded-lg">
								<div className="flex items-center gap-4">
									<div className="avatar">
										<div className="w-10 rounded-full">
											<img src={assignment.user.image || "/default-avatar.png"} alt={assignment.user.name} />
										</div>
									</div>
									<div>
										<p className="font-medium">{assignment.user.name}</p>
										<p className="text-base-content/60 text-sm">{assignment.user.email}</p>
									</div>
									<div className="badge badge-outline">
										{assignment.role.name}
									</div>
								</div>
								<div className="flex gap-2">
									<button className="btn btn-sm btn-outline">
										<Eye size={14} />
									</button>
									<button className="btn btn-sm btn-outline">
										<Edit size={14} />
									</button>
									<button className="btn btn-sm btn-outline btn-error">
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Simple modals */}
			<dialog className="modal" open={isAssignModalOpen}>
					<div className="modal-box">
						<h3 className="font-bold text-lg">Assign Role to User</h3>
						<div className="py-4 space-y-4">
							<select className="select w-full">
								<option>Select User</option>
								{mockUsers.map((user) => (
									<option key={user.id}>{user.name} ({user.email})</option>
								))}
							</select>
							<select className="select w-full">
								<option>Select Role</option>
								{mockRoles.map((role) => (
									<option key={role.id}>{role.name}</option>
								))}
							</select>
						</div>
						<div className="modal-action">
							<button className="btn" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
							<button className="btn btn-primary" onClick={() => setIsAssignModalOpen(false)}>Assign</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={() => setIsAssignModalOpen(false)}></div>
			</dialog>

			<dialog className="modal" open={isBulkModalOpen}>
					<div className="modal-box">
						<h3 className="font-bold text-lg">Bulk Assign Role</h3>
						<div className="py-4">
							<p className="mb-4">Assign a role to {selectedUsers.length} selected users</p>
							<select className="select w-full">
								<option>Select Role</option>
								{mockRoles.map((role) => (
									<option key={role.id}>{role.name}</option>
								))}
							</select>
						</div>
						<div className="modal-action">
							<button className="btn" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
							<button className="btn btn-primary" onClick={() => setIsBulkModalOpen(false)}>Assign</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={() => setIsBulkModalOpen(false)}></div>
			</dialog>
		</div>
	);
}