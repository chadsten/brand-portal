"use client";

import { useState } from "react";
import { PermissionMatrix } from "~/components/brand/PermissionMatrix";
import { RoleManagement } from "~/components/brand/RoleManagement";
import { UserRoleAssignment } from "~/components/brand/UserRoleAssignment";

export default function RolesPage() {
	const [selectedTab, setSelectedTab] = useState("roles");

	return (
		<div className="container mx-auto px-4 py-8">
			<div role="tablist" className="tabs tabs-bordered tabs-lg">
				<input
					type="radio"
					name="role_tabs"
					role="tab"
					className="tab"
					aria-label="Role Management"
					checked={selectedTab === "roles"}
					onChange={() => setSelectedTab("roles")}
				/>
				<div role="tabpanel" className="tab-content pt-6">
					{selectedTab === "roles" && <RoleManagement />}
				</div>

				<input
					type="radio"
					name="role_tabs"
					role="tab"
					className="tab"
					aria-label="User Assignments"
					checked={selectedTab === "assignments"}
					onChange={() => setSelectedTab("assignments")}
				/>
				<div role="tabpanel" className="tab-content pt-6">
					{selectedTab === "assignments" && <UserRoleAssignment />}
				</div>

				<input
					type="radio"
					name="role_tabs"
					role="tab"
					className="tab"
					aria-label="Permission Matrix"
					checked={selectedTab === "permissions"}
					onChange={() => setSelectedTab("permissions")}
				/>
				<div role="tabpanel" className="tab-content pt-6">
					{selectedTab === "permissions" && <PermissionMatrix />}
				</div>
			</div>
		</div>
	);
}