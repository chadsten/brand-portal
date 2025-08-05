"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	AlertCircle,
	Award,
	BarChart3,
	Bookmark,
	Calendar,
	Camera,
	CheckCircle,
	Clock,
	Download,
	Edit,
	Eye,
	FileImage,
	FolderOpen,
	Globe,
	Mail,
	MapPin,
	Phone,
	Settings,
	Share,
	Shield,
	Star,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";

interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: string;
	department: string;
	location: string;
	phone: string;
	website: string;
	bio: string;
	avatar: string;
	joinedAt: Date;
	lastActiveAt: Date;
	isActive: boolean;
	stats: {
		assetsUploaded: number;
		collectionsCreated: number;
		totalDownloads: number;
		totalViews: number;
		avgRating: number;
		storageUsed: number;
		storageLimit: number;
	};
	achievements: Array<{
		id: string;
		title: string;
		description: string;
		icon: string;
		earnedAt: Date;
		rarity: "common" | "rare" | "epic" | "legendary";
	}>;
	recentActivity: Array<{
		id: string;
		action: string;
		target: string;
		timestamp: Date;
		type: "upload" | "approval" | "download" | "collection" | "comment";
	}>;
	permissions: string[];
	preferences: {
		emailNotifications: boolean;
		pushNotifications: boolean;
		publicProfile: boolean;
		showActivity: boolean;
		showStats: boolean;
	};
}

const mockProfile: UserProfile = {
	id: "user-1",
	name: "Sarah Chen",
	email: "sarah.chen@company.com",
	role: "Creative Director",
	department: "Design & Creative",
	location: "San Francisco, CA",
	phone: "+1 (555) 123-4567",
	website: "https://sarahchen.design",
	bio: "Creative Director with 8+ years of experience in brand design and digital asset management. Passionate about creating cohesive brand experiences and leading creative teams to deliver exceptional results.",
	avatar: "/avatar-sarah.jpg",
	joinedAt: new Date("2022-01-15"),
	lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
	isActive: true,
	stats: {
		assetsUploaded: 247,
		collectionsCreated: 23,
		totalDownloads: 1842,
		totalViews: 5634,
		avgRating: 4.8,
		storageUsed: 2.4,
		storageLimit: 10,
	},
	achievements: [
		{
			id: "1",
			title: "Asset Master",
			description: "Uploaded 100+ assets",
			icon: "🏆",
			earnedAt: new Date("2023-06-15"),
			rarity: "epic",
		},
		{
			id: "2",
			title: "Collection Curator",
			description: "Created 20+ collections",
			icon: "📚",
			earnedAt: new Date("2023-08-22"),
			rarity: "rare",
		},
		{
			id: "3",
			title: "Top Contributor",
			description: "Most downloads this month",
			icon: "⭐",
			earnedAt: new Date("2023-11-30"),
			rarity: "legendary",
		},
		{
			id: "4",
			title: "Quality Assurance",
			description: "Maintain 4.5+ rating",
			icon: "✨",
			earnedAt: new Date("2023-09-10"),
			rarity: "rare",
		},
	],
	recentActivity: [
		{
			id: "1",
			action: "Uploaded",
			target: "Brand Logo V3.svg",
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
			type: "upload",
		},
		{
			id: "2",
			action: "Created collection",
			target: "Q4 Marketing Campaign",
			timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
			type: "collection",
		},
		{
			id: "3",
			action: "Approved",
			target: "Product Hero Image.jpg",
			timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
			type: "approval",
		},
		{
			id: "4",
			action: "Downloaded",
			target: "Brand Guidelines.pdf",
			timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
			type: "download",
		},
	],
	permissions: ["read", "write", "approve", "admin"],
	preferences: {
		emailNotifications: true,
		pushNotifications: true,
		publicProfile: true,
		showActivity: true,
		showStats: true,
	},
};

export default function ProfilePage() {
	const [profile, setProfile] = useState<UserProfile>(mockProfile);
	const [selectedTab, setSelectedTab] = useState("overview");
	const [isEditing, setIsEditing] = useState(false);

	const getRarityColor = (rarity: string) => {
		switch (rarity) {
			case "legendary":
				return "badge-warning";
			case "epic":
				return "badge-secondary";
			case "rare":
				return "badge-primary";
			case "common":
				return "badge-neutral";
			default:
				return "badge-neutral";
		}
	};

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "upload":
				return <FileImage size={16} className="text-primary" />;
			case "collection":
				return <FolderOpen size={16} className="text-secondary" />;
			case "approval":
				return <CheckCircle size={16} className="text-success" />;
			case "download":
				return <Download size={16} className="text-warning" />;
			case "comment":
				return <Activity size={16} className="text-base-content/60" />;
			default:
				return <Activity size={16} className="text-base-content/60" />;
		}
	};

	const formatTimestamp = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (hours < 1) return "Just now";
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return timestamp.toLocaleDateString();
	};

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Profile Header */}
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<div className="flex flex-col gap-6 md:flex-row">
							<div className="flex flex-col items-center md:items-start">
								<div className="relative">
									<div className="avatar">
										<div className="w-32 rounded-full">
											{profile.avatar ? (
												<img src={profile.avatar} alt={profile.name} />
											) : (
												<div className="flex h-32 w-32 items-center justify-center rounded-full bg-base-300">
													<span className="text-base-content text-4xl font-medium">
														{profile.name?.charAt(0)?.toUpperCase() || 'U'}
													</span>
												</div>
											)}
										</div>
									</div>
									<div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-base-100 ${
										profile.isActive ? "bg-success" : "bg-warning"
									}`}>
										{profile.isActive ? (
											<CheckCircle size={16} className="text-success-content p-1" />
										) : (
											<AlertCircle size={16} className="text-warning-content p-1" />
										)}
									</div>
									<button className="btn btn-primary btn-sm absolute -bottom-2 -right-2">
										<Camera size={14} />
									</button>
								</div>
								<div className="mt-4 text-center md:text-left">
									<div className="flex items-center justify-center gap-2 md:justify-start">
										<span className={`badge badge-sm ${
											profile.isActive ? "badge-success" : "badge-warning"
										}`}>
											{profile.isActive ? "Active" : "Away"}
										</span>
										<span className="text-base-content/60 text-sm">
											Last seen {formatTimestamp(profile.lastActiveAt)}
										</span>
									</div>
								</div>
							</div>

							<div className="flex-1">
								<div className="mb-4 flex items-start justify-between">
									<div>
										<h1 className="font-bold text-3xl">{profile.name}</h1>
										<p className="text-base-content/80 text-xl">{profile.role}</p>
										<p className="text-base-content/60">{profile.department}</p>
									</div>
									<div className="flex items-center gap-2">
										<button className="btn btn-outline gap-2">
											<Share size={16} />
											Share Profile
										</button>
										<button
											className="btn btn-primary gap-2"
											onClick={() => setIsEditing(!isEditing)}
										>
											<Edit size={16} />
											{isEditing ? "Save" : "Edit Profile"}
										</button>
									</div>
								</div>

								<p className="mb-4 text-base-content/80">{profile.bio}</p>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="flex items-center gap-2">
										<Mail size={16} className="text-base-content/40" />
										<span className="text-sm">{profile.email}</span>
									</div>
									<div className="flex items-center gap-2">
										<Phone size={16} className="text-base-content/40" />
										<span className="text-sm">{profile.phone}</span>
									</div>
									<div className="flex items-center gap-2">
										<MapPin size={16} className="text-base-content/40" />
										<span className="text-sm">{profile.location}</span>
									</div>
									<div className="flex items-center gap-2">
										<Globe size={16} className="text-base-content/40" />
										<span className="text-sm">{profile.website}</span>
									</div>
								</div>

								<div className="mt-4 flex items-center gap-2">
									<Calendar size={16} className="text-base-content/40" />
									<span className="text-sm">
										Joined {profile.joinedAt.toLocaleDateString()}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<FileImage className="mx-auto mb-2 text-primary" size={24} />
							<div className="font-bold text-xl">
								{profile.stats.assetsUploaded}
							</div>
							<div className="text-base-content/60 text-sm">Assets</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<FolderOpen className="mx-auto mb-2 text-secondary" size={24} />
							<div className="font-bold text-xl">
								{profile.stats.collectionsCreated}
							</div>
							<div className="text-base-content/60 text-sm">Collections</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<Download className="mx-auto mb-2 text-success" size={24} />
							<div className="font-bold text-xl">
								{profile.stats.totalDownloads}
							</div>
							<div className="text-base-content/60 text-sm">Downloads</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<Eye className="mx-auto mb-2 text-warning" size={24} />
							<div className="font-bold text-xl">
								{profile.stats.totalViews}
							</div>
							<div className="text-base-content/60 text-sm">Views</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<Star className="mx-auto mb-2 text-error" size={24} />
							<div className="font-bold text-xl">{profile.stats.avgRating}</div>
							<div className="text-base-content/60 text-sm">Avg Rating</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<BarChart3 className="mx-auto mb-2 text-base-content/60" size={24} />
							<div className="font-bold text-xl">
								{(
									(profile.stats.storageUsed / profile.stats.storageLimit) *
									100
								).toFixed(0)}
								%
							</div>
							<div className="text-base-content/60 text-sm">Storage</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="profile_tabs"
								role="tab"
								className="tab"
								aria-label="Overview"
								checked={selectedTab === "overview"}
								onChange={() => setSelectedTab("overview")}
							/>
							<input
								type="radio"
								name="profile_tabs"
								role="tab"
								className="tab"
								aria-label="Achievements"
								checked={selectedTab === "achievements"}
								onChange={() => setSelectedTab("achievements")}
							/>
							<input
								type="radio"
								name="profile_tabs"
								role="tab"
								className="tab"
								aria-label="Analytics"
								checked={selectedTab === "analytics"}
								onChange={() => setSelectedTab("analytics")}
							/>
							<input
								type="radio"
								name="profile_tabs"
								role="tab"
								className="tab"
								aria-label="Settings"
								checked={selectedTab === "settings"}
								onChange={() => setSelectedTab("settings")}
							/>

							{/* Overview Tab */}
							{selectedTab === "overview" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{/* Storage Usage */}
									<div>
										<div className="mb-3 flex items-center justify-between">
											<h3 className="font-semibold text-lg">Storage Usage</h3>
											<span className="text-base-content/60 text-sm">
												{profile.stats.storageUsed} GB of{" "}
												{profile.stats.storageLimit} GB
											</span>
										</div>
										<progress
											className={`progress w-full mb-2 ${
												profile.stats.storageUsed / profile.stats.storageLimit > 0.8
													? "progress-error"
													: "progress-primary"
											}`}
											value={
												(profile.stats.storageUsed / profile.stats.storageLimit) * 100
											}
											max="100"
										></progress>
										<p className="text-base-content/60 text-sm">
											{profile.stats.storageLimit - profile.stats.storageUsed}{" "}
											GB remaining
										</p>
									</div>

									<div className="divider"></div>

									{/* Recent Activity */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Recent Activity
										</h3>
										<div className="space-y-3">
											{profile.recentActivity.map((activity) => (
												<div
													key={activity.id}
													className="flex items-center gap-3"
												>
													{getActivityIcon(activity.type)}
													<div className="flex-1">
														<p className="text-sm">
															<span className="font-medium">
																{activity.action}
															</span>{" "}
															<span className="text-base-content/80">
																{activity.target}
															</span>
														</p>
														<p className="text-base-content/60 text-xs">
															{formatTimestamp(activity.timestamp)}
														</p>
													</div>
												</div>
											))}
										</div>
										<button className="btn btn-outline btn-sm mt-4 w-full">
											View All Activity
										</button>
									</div>
								</div>
							)}

							{/* Achievements Tab */}
							{selectedTab === "achievements" && (
								<div role="tabpanel" className="tab-content p-6">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{profile.achievements.map((achievement) => (
											<div key={achievement.id} className="card border border-base-300 bg-base-100">
												<div className="card-body">
													<div className="flex items-center gap-3">
														<div className="text-2xl">{achievement.icon}</div>
														<div className="flex-1">
															<div className="mb-1 flex items-center gap-2">
																<h4 className="font-semibold">
																	{achievement.title}
																</h4>
																<span className={`badge badge-sm ${getRarityColor(achievement.rarity)}`}>
																	{achievement.rarity}
																</span>
															</div>
															<p className="mb-2 text-base-content/80 text-sm">
																{achievement.description}
															</p>
															<p className="text-base-content/60 text-xs">
																Earned{" "}
																{achievement.earnedAt.toLocaleDateString()}
															</p>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Analytics Tab */}
							{selectedTab === "analytics" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{/* Performance Chart Placeholder */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Performance Overview
										</h3>
										<div className="flex h-64 items-center justify-center rounded-lg bg-base-200">
											<div className="text-center">
												<TrendingUp
													className="mx-auto mb-2 text-base-content/40"
													size={32}
												/>
												<p className="text-base-content/60 text-sm">
													Performance chart
												</p>
												<p className="text-base-content/40 text-xs">
													Monthly downloads and views trend
												</p>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Top Assets */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Top Performing Assets
										</h3>
										<div className="overflow-x-auto">
											<table className="table table-zebra">
												<thead>
													<tr>
														<th>ASSET</th>
														<th>DOWNLOADS</th>
														<th>VIEWS</th>
														<th>RATING</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>Brand Logo V2.svg</td>
														<td>342</td>
														<td>1,234</td>
														<td>4.9</td>
													</tr>
													<tr>
														<td>Product Hero Image.jpg</td>
														<td>298</td>
														<td>892</td>
														<td>4.7</td>
													</tr>
													<tr>
														<td>Marketing Video.mp4</td>
														<td>256</td>
														<td>743</td>
														<td>4.8</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{/* Settings Tab */}
							{selectedTab === "settings" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{isEditing ? (
										<div className="space-y-6">
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<div>
													<label className="label" htmlFor="full-name">Full Name</label>
													<input
														id="full-name"
														className="input w-full"
														value={profile.name}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																name: e.target.value,
															}))
														}
													/>
												</div>
												<div>
													<label className="label" htmlFor="email">Email</label>
													<input
														id="email"
														className="input w-full"
														value={profile.email}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																email: e.target.value,
															}))
														}
													/>
												</div>
												<div>
													<label className="label" htmlFor="phone">Phone</label>
													<input
														id="phone"
														className="input w-full"
														value={profile.phone}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																phone: e.target.value,
															}))
														}
													/>
												</div>
												<div>
													<label className="label" htmlFor="location">Location</label>
													<input
														id="location"
														className="input w-full"
														value={profile.location}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																location: e.target.value,
															}))
														}
													/>
												</div>
												<div className="md:col-span-2">
													<label className="label" htmlFor="website">Website</label>
													<input
														id="website"
														className="input w-full"
														value={profile.website}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																website: e.target.value,
															}))
														}
													/>
												</div>
											</div>
											<div>
												<label className="label" htmlFor="bio">Bio</label>
												<textarea
													id="bio"
													className="textarea w-full h-24"
													value={profile.bio}
													onChange={(e) =>
														setProfile((prev) => ({
															...prev,
															bio: e.target.value,
														}))
													}
												/>
											</div>
										</div>
									) : (
										<div>
											<h3 className="mb-4 font-semibold text-lg">
												Privacy & Preferences
											</h3>
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium">Public Profile</p>
														<p className="text-base-content/60 text-sm">
															Allow others to see your profile
														</p>
													</div>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={profile.preferences.publicProfile}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																preferences: {
																	...prev.preferences,
																	publicProfile: e.target.checked,
																},
															}))
														}
													/>
												</div>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium">Show Activity</p>
														<p className="text-base-content/60 text-sm">
															Display your recent activity
														</p>
													</div>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={profile.preferences.showActivity}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																preferences: {
																	...prev.preferences,
																	showActivity: e.target.checked,
																},
															}))
														}
													/>
												</div>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium">Show Statistics</p>
														<p className="text-base-content/60 text-sm">
															Display your usage statistics
														</p>
													</div>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={profile.preferences.showStats}
														onChange={(e) =>
															setProfile((prev) => ({
																...prev,
																preferences: {
																	...prev.preferences,
																	showStats: e.target.checked,
																},
															}))
														}
													/>
												</div>
											</div>
										</div>
									)}

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Account Actions
										</h3>
										<div className="space-y-3">
											<button className="btn btn-outline gap-2">
												<Download size={16} />
												Export Profile Data
											</button>
											<button className="btn btn-outline gap-2">
												<Settings size={16} />
												Advanced Settings
											</button>
											<button className="btn btn-outline btn-error gap-2">
												<Shield size={16} />
												Deactivate Account
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}