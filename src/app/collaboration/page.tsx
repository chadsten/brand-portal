"use client";

import { Eye, MessageSquare, Plus, Settings, Users, Video } from "lucide-react";
import { useState } from "react";
import { RealTimeCollaboration } from "~/components/collaboration/RealTimeCollaboration";

export default function CollaborationPage() {
	const [selectedTab, setSelectedTab] = useState("sessions");

	const renderTabContent = () => {
		switch (selectedTab) {
			case "sessions":
				return (
					<RealTimeCollaboration
						userId="current-user-1"
						onJoinSession={(sessionId) =>
							console.log("Joined session:", sessionId)
						}
						onLeaveSession={(sessionId) =>
							console.log("Left session:", sessionId)
						}
						onCreateSession={(session) =>
							console.log("Created session:", session)
						}
						onInviteUser={(sessionId, email) =>
							console.log("Invited user:", email, "to session:", sessionId)
						}
						onUpdatePermissions={(sessionId, permissions) =>
							console.log("Updated permissions:", permissions)
						}
					/>
				);
			case "meetings":
				return (
					<div className="space-y-6">
						<div className="card bg-base-100 shadow-xl">
							<div className="card-body py-12 text-center">
								<Video size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">Video Meetings</h3>
								<p className="text-base-content/60">
									Schedule and join video meetings with your team
								</p>
							</div>
						</div>
					</div>
				);
			case "reviews":
				return (
					<div className="space-y-6">
						<div className="card bg-base-100 shadow-xl">
							<div className="card-body py-12 text-center">
								<Eye size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">Asset Reviews</h3>
								<p className="text-base-content/60">
									Collaborate on asset reviews and approvals
								</p>
							</div>
						</div>
					</div>
				);
			case "settings":
				return (
					<div className="space-y-6">
						<div className="card bg-base-100 shadow-xl">
							<div className="card-body py-12 text-center">
								<Settings size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">
									Collaboration Settings
								</h3>
								<p className="text-base-content/60">
									Configure your collaboration preferences and permissions
								</p>
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="space-y-6">
				{/* Page Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Collaboration</h1>
						<p className="mt-2 text-base-content/60">
							Work together in real-time on assets, reviews, and projects
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button className="btn btn-sm">
							<Plus size={16} />
							New Session
						</button>
						<button className="btn btn-sm">
							<Settings size={16} />
							Settings
						</button>
					</div>
				</div>

				{/* Main Content */}
				<div className="w-full">
					<div role="tablist" className="tabs tabs-bordered">
						<input
							type="radio"
							name="collaboration-tabs"
							role="tab"
							className="tab"
							aria-label="Sessions"
							checked={selectedTab === "sessions"}
							onChange={() => setSelectedTab("sessions")}
						/>
						<div role="tabpanel" className="tab-content pt-6">
							{selectedTab === "sessions" && renderTabContent()}
						</div>

						<input
							type="radio"
							name="collaboration-tabs"
							role="tab"
							className="tab"
							aria-label="Meetings"
							checked={selectedTab === "meetings"}
							onChange={() => setSelectedTab("meetings")}
						/>
						<div role="tabpanel" className="tab-content pt-6">
							{selectedTab === "meetings" && renderTabContent()}
						</div>

						<input
							type="radio"
							name="collaboration-tabs"
							role="tab"
							className="tab"
							aria-label="Reviews"
							checked={selectedTab === "reviews"}
							onChange={() => setSelectedTab("reviews")}
						/>
						<div role="tabpanel" className="tab-content pt-6">
							{selectedTab === "reviews" && renderTabContent()}
						</div>

						<input
							type="radio"
							name="collaboration-tabs"
							role="tab"
							className="tab"
							aria-label="Settings"
							checked={selectedTab === "settings"}
							onChange={() => setSelectedTab("settings")}
						/>
						<div role="tabpanel" className="tab-content pt-6">
							{selectedTab === "settings" && renderTabContent()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
