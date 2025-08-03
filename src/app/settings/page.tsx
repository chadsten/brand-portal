"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	Bell,
	Calendar,
	Camera,
	Clock,
	Database,
	Download,
	Eye,
	EyeOff,
	Globe,
	Key,
	Lock,
	Mail,
	MapPin,
	Monitor,
	Moon,
	Palette,
	Phone,
	RefreshCw,
	Save,
	Shield,
	Smartphone,
	Sun,
	Trash2,
	Unlock,
	Upload,
	User,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";

interface UserSettings {
	profile: {
		name: string;
		email: string;
		bio: string;
		location: string;
		phone: string;
		website: string;
		avatar: string;
	};
	preferences: {
		theme: "light" | "dark" | "auto";
		language: string;
		timezone: string;
		dateFormat: string;
		currency: string;
		itemsPerPage: number;
		autoSave: boolean;
		soundEnabled: boolean;
		viewMode: "grid" | "list";
	};
	notifications: {
		email: {
			assetApproval: boolean;
			collectionUpdates: boolean;
			systemUpdates: boolean;
			weeklyReport: boolean;
			marketing: boolean;
		};
		push: {
			assetApproval: boolean;
			mentions: boolean;
			systemAlerts: boolean;
			realTime: boolean;
		};
		frequency: "immediate" | "daily" | "weekly" | "never";
	};
	privacy: {
		profileVisibility: "public" | "team" | "private";
		showEmail: boolean;
		showActivity: boolean;
		allowDirectMessages: boolean;
		dataCollection: boolean;
		analytics: boolean;
	};
	security: {
		twoFactorEnabled: boolean;
		sessionTimeout: number;
		loginNotifications: boolean;
		deviceTrust: boolean;
		passwordChangeRequired: boolean;
	};
	integrations: {
		slack: { enabled: boolean; webhook: string };
		teams: { enabled: boolean; webhook: string };
		dropbox: { enabled: boolean; accessToken: string };
		googleDrive: { enabled: boolean; accessToken: string };
	};
}

const defaultSettings: UserSettings = {
	profile: {
		name: "Sarah Chen",
		email: "sarah.chen@company.com",
		bio: "Creative Director passionate about brand consistency and innovative design solutions.",
		location: "San Francisco, CA",
		phone: "+1 (555) 123-4567",
		website: "https://sarahchen.design",
		avatar: "/avatar-sarah.jpg",
	},
	preferences: {
		theme: "auto",
		language: "en",
		timezone: "America/Los_Angeles",
		dateFormat: "MM/DD/YYYY",
		currency: "USD",
		itemsPerPage: 24,
		autoSave: true,
		soundEnabled: true,
		viewMode: "grid",
	},
	notifications: {
		email: {
			assetApproval: true,
			collectionUpdates: true,
			systemUpdates: false,
			weeklyReport: true,
			marketing: false,
		},
		push: {
			assetApproval: true,
			mentions: true,
			systemAlerts: true,
			realTime: false,
		},
		frequency: "immediate",
	},
	privacy: {
		profileVisibility: "team",
		showEmail: false,
		showActivity: true,
		allowDirectMessages: true,
		dataCollection: true,
		analytics: true,
	},
	security: {
		twoFactorEnabled: true,
		sessionTimeout: 8,
		loginNotifications: true,
		deviceTrust: true,
		passwordChangeRequired: false,
	},
	integrations: {
		slack: { enabled: true, webhook: "https://hooks.slack.com/..." },
		teams: { enabled: false, webhook: "" },
		dropbox: {
			enabled: true,
			accessToken:
				"•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
		},
		googleDrive: { enabled: false, accessToken: "" },
	},
};

export default function SettingsPage() {
	const [settings, setSettings] = useState<UserSettings>(defaultSettings);
	const [selectedTab, setSelectedTab] = useState("profile");
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const updateSettings = (
		section: keyof UserSettings,
		field: string,
		value: any,
	) => {
		setSettings((prev) => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: value,
			},
		}));
		setHasUnsavedChanges(true);
	};

	const updateNestedSettings = (
		section: keyof UserSettings,
		subsection: string,
		field: string,
		value: any,
	) => {
		setSettings((prev) => ({
			...prev,
			[section]: {
				...prev[section],
				[subsection]: {
					...(prev[section] as any)[subsection],
					[field]: value,
				},
			},
		}));
		setHasUnsavedChanges(true);
	};

	const handleSave = async () => {
		setIsSaving(true);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));
		setHasUnsavedChanges(false);
		setIsSaving(false);
	};

	const handleReset = () => {
		setSettings(defaultSettings);
		setHasUnsavedChanges(false);
	};

	const handleDeleteAccount = () => {
		setIsDeleteModalOpen(true);
	};

	const exportSettings = () => {
		const dataStr = JSON.stringify(settings, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "brand-portal-settings.json";
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-3xl">Settings</h1>
						<p className="mt-1 text-base-content/60">
							Manage your account preferences and application settings.
						</p>
					</div>
					<div className="flex items-center gap-3">
						{hasUnsavedChanges && (
							<div className="relative">
								<span className="badge badge-warning badge-sm">
									Unsaved Changes
								</span>
								<div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warning animate-pulse"></div>
							</div>
						)}
						<button
							className={`btn btn-outline gap-2 ${!hasUnsavedChanges ? 'btn-disabled' : ''}`}
							onClick={handleReset}
							disabled={!hasUnsavedChanges}
						>
							<RefreshCw size={16} />
							Reset
						</button>
						<button
							className={`btn btn-primary gap-2 ${!hasUnsavedChanges ? 'btn-disabled' : ''} ${isSaving ? 'loading' : ''}`}
							onClick={handleSave}
							disabled={!hasUnsavedChanges || isSaving}
						>
							{isSaving ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								<Save size={16} />
							)}
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>

				{/* Settings Content */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Profile"
								checked={selectedTab === "profile"}
								onChange={() => setSelectedTab("profile")}
							/>
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Preferences"
								checked={selectedTab === "preferences"}
								onChange={() => setSelectedTab("preferences")}
							/>
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Notifications"
								checked={selectedTab === "notifications"}
								onChange={() => setSelectedTab("notifications")}
							/>
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Privacy"
								checked={selectedTab === "privacy"}
								onChange={() => setSelectedTab("privacy")}
							/>
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Security"
								checked={selectedTab === "security"}
								onChange={() => setSelectedTab("security")}
							/>
							<input
								type="radio"
								name="settings_tabs"
								role="tab"
								className="tab"
								aria-label="Integrations"
								checked={selectedTab === "integrations"}
								onChange={() => setSelectedTab("integrations")}
							/>

							{/* Profile Settings */}
							{selectedTab === "profile" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div className="flex items-center gap-6">
										<div className="relative">
											<div className="avatar">
												<div className="w-24 rounded-full">
													{settings.profile.avatar ? (
														<img src={settings.profile.avatar} alt={settings.profile.name} />
													) : (
														<div className="flex h-24 w-24 items-center justify-center rounded-full bg-base-300">
															<span className="text-base-content text-2xl font-medium">
																{settings.profile.name?.charAt(0)?.toUpperCase() || 'U'}
															</span>
														</div>
													)}
												</div>
											</div>
											<button className="btn btn-primary btn-sm absolute -bottom-1 -right-1">
												<Camera size={14} />
											</button>
										</div>
										<div className="space-y-2">
											<h3 className="font-semibold text-lg">
												{settings.profile.name}
											</h3>
											<p className="text-base-content/60">
												{settings.profile.email}
											</p>
											<button className="btn btn-outline btn-sm">
												Change Photo
											</button>
										</div>
									</div>

									<div className="divider"></div>

									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<label className="label">
												<span className="label-text">Full Name</span>
											</label>
											<div className="relative">
												<input
													className="input input-bordered w-full pl-10"
													value={settings.profile.name}
													onChange={(e) =>
														updateSettings("profile", "name", e.target.value)
													}
												/>
												<User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
										<div>
											<label className="label">
												<span className="label-text">Email Address</span>
											</label>
											<div className="relative">
												<input
													type="email"
													className="input input-bordered w-full pl-10"
													value={settings.profile.email}
													onChange={(e) =>
														updateSettings("profile", "email", e.target.value)
													}
												/>
												<Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
										<div>
											<label className="label">
												<span className="label-text">Phone Number</span>
											</label>
											<div className="relative">
												<input
													className="input input-bordered w-full pl-10"
													value={settings.profile.phone}
													onChange={(e) =>
														updateSettings("profile", "phone", e.target.value)
													}
												/>
												<Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
										<div>
											<label className="label">
												<span className="label-text">Location</span>
											</label>
											<div className="relative">
												<input
													className="input input-bordered w-full pl-10"
													value={settings.profile.location}
													onChange={(e) =>
														updateSettings("profile", "location", e.target.value)
													}
												/>
												<MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
										<div className="md:col-span-2">
											<label className="label">
												<span className="label-text">Website</span>
											</label>
											<div className="relative">
												<input
													className="input input-bordered w-full pl-10"
													value={settings.profile.website}
													onChange={(e) =>
														updateSettings("profile", "website", e.target.value)
													}
												/>
												<Globe size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
									</div>

									<div>
										<label className="label">
											<span className="label-text">Bio</span>
										</label>
										<textarea
											className="textarea textarea-bordered w-full h-24"
											value={settings.profile.bio}
											onChange={(e) =>
												updateSettings("profile", "bio", e.target.value)
											}
											placeholder="Tell us about yourself..."
										/>
									</div>
								</div>
							)}

							{/* Preferences */}
							{selectedTab === "preferences" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div>
										<h3 className="mb-4 font-semibold text-lg">Appearance</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<label className="label">
													<span className="label-text">Theme</span>
												</label>
												<div className="relative">
													<select
														className="select select-bordered w-full pl-10"
														value={settings.preferences.theme}
														onChange={(e) =>
															updateSettings(
																"preferences",
																"theme",
																e.target.value,
															)
														}
													>
														<option value="light">Light</option>
														<option value="dark">Dark</option>
														<option value="auto">Auto</option>
													</select>
													{settings.preferences.theme === "dark" ? (
														<Moon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
													) : (
														<Sun size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
													)}
												</div>
											</div>
											<div>
												<label className="label">
													<span className="label-text">View Mode</span>
												</label>
												<select
													className="select select-bordered w-full"
													value={settings.preferences.viewMode}
													onChange={(e) =>
														updateSettings(
															"preferences",
															"viewMode",
															e.target.value,
														)
													}
												>
													<option value="grid">Grid View</option>
													<option value="list">List View</option>
												</select>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">Localization</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<label className="label">
													<span className="label-text">Language</span>
												</label>
												<select
													className="select select-bordered w-full"
													value={settings.preferences.language}
													onChange={(e) =>
														updateSettings(
															"preferences",
															"language",
															e.target.value,
														)
													}
												>
													<option value="en">English</option>
													<option value="es">Español</option>
													<option value="fr">Français</option>
													<option value="de">Deutsch</option>
													<option value="ja">日本語</option>
												</select>
											</div>
											<div>
												<label className="label">
													<span className="label-text">Timezone</span>
												</label>
												<div className="relative">
													<select
														className="select select-bordered w-full pl-10"
														value={settings.preferences.timezone}
														onChange={(e) =>
															updateSettings(
																"preferences",
																"timezone",
																e.target.value,
															)
														}
													>
														<option value="America/Los_Angeles">Pacific Time (PT)</option>
														<option value="America/Denver">Mountain Time (MT)</option>
														<option value="America/Chicago">Central Time (CT)</option>
														<option value="America/New_York">Eastern Time (ET)</option>
														<option value="UTC">UTC</option>
													</select>
													<Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
												</div>
											</div>
											<div>
												<label className="label">
													<span className="label-text">Date Format</span>
												</label>
												<div className="relative">
													<select
														className="select select-bordered w-full pl-10"
														value={settings.preferences.dateFormat}
														onChange={(e) =>
															updateSettings(
																"preferences",
																"dateFormat",
																e.target.value,
															)
														}
													>
														<option value="MM/DD/YYYY">MM/DD/YYYY</option>
														<option value="DD/MM/YYYY">DD/MM/YYYY</option>
														<option value="YYYY-MM-DD">YYYY-MM-DD</option>
													</select>
													<Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
												</div>
											</div>
											<div>
												<label className="label">
													<span className="label-text">Currency</span>
												</label>
												<select
													className="select select-bordered w-full"
													value={settings.preferences.currency}
													onChange={(e) =>
														updateSettings(
															"preferences",
															"currency",
															e.target.value,
														)
													}
												>
													<option value="USD">USD ($)</option>
													<option value="EUR">EUR (€)</option>
													<option value="GBP">GBP (£)</option>
													<option value="JPY">JPY (¥)</option>
												</select>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">Interface</h3>
										<div className="space-y-4">
											<div>
												<label className="label">
													<span className="label-text">Items per page: {settings.preferences.itemsPerPage}</span>
												</label>
												<input
													type="range"
													min="12"
													max="48"
													step="12"
													value={settings.preferences.itemsPerPage}
													onChange={(e) =>
														updateSettings(
															"preferences",
															"itemsPerPage",
															parseInt(e.target.value),
														)
													}
													className="range range-primary max-w-md"
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Auto Save</p>
													<p className="text-base-content/60 text-sm">
														Automatically save changes
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.preferences.autoSave}
													onChange={(e) =>
														updateSettings("preferences", "autoSave", e.target.checked)
													}
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Sound Effects</p>
													<p className="text-base-content/60 text-sm">
														Play sounds for notifications
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.preferences.soundEnabled}
													onChange={(e) =>
														updateSettings("preferences", "soundEnabled", e.target.checked)
													}
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Notifications */}
							{selectedTab === "notifications" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Email Notifications
										</h3>
										<div className="space-y-4">
											{Object.entries(settings.notifications.email).map(
												([key, value]) => (
													<div
														key={key}
														className="flex items-center justify-between"
													>
														<div>
															<p className="font-medium">
																{key
																	.replace(/([A-Z])/g, " $1")
																	.replace(/^./, (str) => str.toUpperCase())}
															</p>
															<p className="text-base-content/60 text-sm">
																{key === "assetApproval" &&
																	"Get notified when assets need approval"}
																{key === "collectionUpdates" &&
																	"Updates to collections you follow"}
																{key === "systemUpdates" &&
																	"System maintenance and updates"}
																{key === "weeklyReport" &&
																	"Weekly usage and activity report"}
																{key === "marketing" &&
																	"Product updates and marketing emails"}
															</p>
														</div>
														<input
															type="checkbox"
															className="toggle toggle-primary"
															checked={value}
															onChange={(e) =>
																updateNestedSettings(
																	"notifications",
																	"email",
																	key,
																	e.target.checked,
																)
															}
														/>
													</div>
												),
											)}
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Push Notifications
										</h3>
										<div className="space-y-4">
											{Object.entries(settings.notifications.push).map(
												([key, value]) => (
													<div
														key={key}
														className="flex items-center justify-between"
													>
														<div>
															<p className="font-medium">
																{key
																	.replace(/([A-Z])/g, " $1")
																	.replace(/^./, (str) => str.toUpperCase())}
															</p>
															<p className="text-base-content/60 text-sm">
																{key === "assetApproval" &&
																	"Push notifications for approval requests"}
																{key === "mentions" &&
																	"When someone mentions you"}
																{key === "systemAlerts" &&
																	"Critical system alerts"}
																{key === "realTime" &&
																	"Real-time activity updates"}
															</p>
														</div>
														<input
															type="checkbox"
															className="toggle toggle-primary"
															checked={value}
															onChange={(e) =>
																updateNestedSettings(
																	"notifications",
																	"push",
																	key,
																	e.target.checked,
																)
															}
														/>
													</div>
												),
											)}
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Notification Frequency
										</h3>
										<div>
											<label className="label">
												<span className="label-text">How often do you want to receive notifications?</span>
											</label>
											<div className="relative">
												<select
													className="select select-bordered w-full pl-10"
													value={settings.notifications.frequency}
													onChange={(e) =>
														updateSettings(
															"notifications",
															"frequency",
															e.target.value,
														)
													}
												>
													<option value="immediate">Immediate</option>
													<option value="daily">Daily Digest</option>
													<option value="weekly">Weekly Summary</option>
													<option value="never">Never</option>
												</select>
												<Bell size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Privacy */}
							{selectedTab === "privacy" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Profile Visibility
										</h3>
										<div>
											<label className="label">
												<span className="label-text">Who can see your profile?</span>
											</label>
											<div className="relative">
												<select
													className="select select-bordered w-full pl-10"
													value={settings.privacy.profileVisibility}
													onChange={(e) =>
														updateSettings(
															"privacy",
															"profileVisibility",
															e.target.value,
														)
													}
												>
													<option value="public">Everyone</option>
													<option value="team">Team Members Only</option>
													<option value="private">Private</option>
												</select>
												<Eye size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Information Sharing
										</h3>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Show Email Address</p>
													<p className="text-base-content/60 text-sm">
														Allow others to see your email
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.privacy.showEmail}
													onChange={(e) =>
														updateSettings("privacy", "showEmail", e.target.checked)
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
													checked={settings.privacy.showActivity}
													onChange={(e) =>
														updateSettings("privacy", "showActivity", e.target.checked)
													}
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Allow Direct Messages</p>
													<p className="text-base-content/60 text-sm">
														Let team members send you messages
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.privacy.allowDirectMessages}
													onChange={(e) =>
														updateSettings(
															"privacy",
															"allowDirectMessages",
															e.target.checked,
														)
													}
												/>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Data & Analytics
										</h3>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Data Collection</p>
													<p className="text-base-content/60 text-sm">
														Help improve our service
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.privacy.dataCollection}
													onChange={(e) =>
														updateSettings("privacy", "dataCollection", e.target.checked)
													}
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Usage Analytics</p>
													<p className="text-base-content/60 text-sm">
														Track usage for insights
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.privacy.analytics}
													onChange={(e) =>
														updateSettings("privacy", "analytics", e.target.checked)
													}
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Security */}
							{selectedTab === "security" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Authentication
										</h3>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">
														Two-Factor Authentication
													</p>
													<p className="text-base-content/60 text-sm">
														Add an extra layer of security
														{settings.security.twoFactorEnabled && (
															<span className="badge badge-success badge-sm ml-2">
																Enabled
															</span>
														)}
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.security.twoFactorEnabled}
													onChange={(e) =>
														updateSettings(
															"security",
															"twoFactorEnabled",
															e.target.checked,
														)
													}
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Login Notifications</p>
													<p className="text-base-content/60 text-sm">
														Get notified of new sign-ins
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.security.loginNotifications}
													onChange={(e) =>
														updateSettings(
															"security",
															"loginNotifications",
															e.target.checked,
														)
													}
												/>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">Device Trust</p>
													<p className="text-base-content/60 text-sm">
														Remember trusted devices
													</p>
												</div>
												<input
													type="checkbox"
													className="toggle toggle-primary"
													checked={settings.security.deviceTrust}
													onChange={(e) =>
														updateSettings("security", "deviceTrust", e.target.checked)
													}
												/>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Session Management
										</h3>
										<div className="space-y-4">
											<div>
												<label className="label">
													<span className="label-text">Session timeout: {settings.security.sessionTimeout} hours</span>
												</label>
												<input
													type="range"
													min="1"
													max="24"
													step="1"
													value={settings.security.sessionTimeout}
													onChange={(e) =>
														updateSettings(
															"security",
															"sessionTimeout",
															parseInt(e.target.value),
														)
													}
													className="range range-primary max-w-md"
												/>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Password & Access
										</h3>
										<div className="space-y-4">
											<button className="btn btn-primary btn-outline gap-2">
												<Key size={16} />
												Change Password
											</button>
											<button className="btn btn-outline gap-2">
												<Download size={16} />
												Download Account Data
											</button>
											<button className="btn btn-outline gap-2">
												<Eye size={16} />
												View Active Sessions
											</button>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-error text-lg">
											Danger Zone
										</h3>
										<div className="space-y-4">
											<div className="card border border-error bg-error/5">
												<div className="card-body">
													<div className="flex items-center justify-between">
														<div>
															<p className="font-medium text-error">
																Delete Account
															</p>
															<p className="text-base-content/60 text-sm">
																Permanently delete your account and all data
															</p>
														</div>
														<button
															className="btn btn-error btn-outline gap-2"
															onClick={handleDeleteAccount}
														>
															<Trash2 size={16} />
															Delete Account
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Integrations */}
							{selectedTab === "integrations" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Communication
										</h3>
										<div className="space-y-4">
											{/* Slack Integration */}
											<div className="card bg-base-100 shadow">
												<div className="card-body">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]">
																<span className="font-bold text-sm text-white">
																	S
																</span>
															</div>
															<div>
																<p className="font-medium">Slack</p>
																<p className="text-base-content/60 text-sm">
																	Get notifications in your Slack channels
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															{settings.integrations.slack.enabled && (
																<span className="badge badge-success badge-sm">
																	Connected
																</span>
															)}
															<input
																type="checkbox"
																className="toggle toggle-primary"
																checked={settings.integrations.slack.enabled}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"slack",
																		"enabled",
																		e.target.checked,
																	)
																}
															/>
														</div>
													</div>
													{settings.integrations.slack.enabled && (
														<div className="mt-4">
															<label className="label">
																<span className="label-text">Webhook URL</span>
															</label>
															<input
																className="input input-bordered input-sm w-full"
																value={settings.integrations.slack.webhook}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"slack",
																		"webhook",
																		e.target.value,
																	)
																}
																placeholder="https://hooks.slack.com/..."
															/>
														</div>
													)}
												</div>
											</div>

											{/* Teams Integration */}
											<div className="card bg-base-100 shadow">
												<div className="card-body">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6264A7]">
																<span className="font-bold text-sm text-white">
																	T
																</span>
															</div>
															<div>
																<p className="font-medium">Microsoft Teams</p>
																<p className="text-base-content/60 text-sm">
																	Send updates to Teams channels
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															{settings.integrations.teams.enabled && (
																<span className="badge badge-success badge-sm">
																	Connected
																</span>
															)}
															<input
																type="checkbox"
																className="toggle toggle-primary"
																checked={settings.integrations.teams.enabled}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"teams",
																		"enabled",
																		e.target.checked,
																	)
																}
															/>
														</div>
													</div>
													{settings.integrations.teams.enabled && (
														<div className="mt-4">
															<label className="label">
																<span className="label-text">Webhook URL</span>
															</label>
															<input
																className="input input-bordered input-sm w-full"
																value={settings.integrations.teams.webhook}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"teams",
																		"webhook",
																		e.target.value,
																	)
																}
																placeholder="https://outlook.office.com/webhook/..."
															/>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Cloud Storage
										</h3>
										<div className="space-y-4">
											{/* Dropbox Integration */}
											<div className="card bg-base-100 shadow">
												<div className="card-body">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0061FF]">
																<span className="font-bold text-sm text-white">
																	D
																</span>
															</div>
															<div>
																<p className="font-medium">Dropbox</p>
																<p className="text-base-content/60 text-sm">
																	Sync assets with your Dropbox account
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															{settings.integrations.dropbox.enabled && (
																<span className="badge badge-success badge-sm">
																	Connected
																</span>
															)}
															<input
																type="checkbox"
																className="toggle toggle-primary"
																checked={settings.integrations.dropbox.enabled}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"dropbox",
																		"enabled",
																		e.target.checked,
																	)
																}
															/>
														</div>
													</div>
													{settings.integrations.dropbox.enabled && (
														<div className="mt-4">
															<label className="label">
																<span className="label-text">Access Token</span>
															</label>
															<div className="relative">
																<input
																	type={showPassword ? "text" : "password"}
																	className="input input-bordered input-sm w-full pr-10"
																	value={settings.integrations.dropbox.accessToken}
																	onChange={(e) =>
																		updateNestedSettings(
																			"integrations",
																			"dropbox",
																			"accessToken",
																			e.target.value,
																		)
																	}
																/>
																<button
																	className="btn btn-sm btn-ghost absolute right-1 top-1/2 transform -translate-y-1/2"
																	onClick={() => setShowPassword(!showPassword)}
																>
																	{showPassword ? (
																		<EyeOff size={16} />
																	) : (
																		<Eye size={16} />
																	)}
																</button>
															</div>
														</div>
													)}
												</div>
											</div>

											{/* Google Drive Integration */}
											<div className="card bg-base-100 shadow">
												<div className="card-body">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285F4]">
																<span className="font-bold text-sm text-white">
																	G
																</span>
															</div>
															<div>
																<p className="font-medium">Google Drive</p>
																<p className="text-base-content/60 text-sm">
																	Store and sync files with Google Drive
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															{settings.integrations.googleDrive.enabled && (
																<span className="badge badge-success badge-sm">
																	Connected
																</span>
															)}
															<input
																type="checkbox"
																className="toggle toggle-primary"
																checked={settings.integrations.googleDrive.enabled}
																onChange={(e) =>
																	updateNestedSettings(
																		"integrations",
																		"googleDrive",
																		"enabled",
																		e.target.checked,
																	)
																}
															/>
														</div>
													</div>
													{settings.integrations.googleDrive.enabled && (
														<div className="mt-4">
															<button className="btn btn-primary btn-outline btn-sm">
																Authorize Google Drive
															</button>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Settings Management
										</h3>
										<div className="flex gap-3">
											<button
												className="btn btn-outline gap-2"
												onClick={exportSettings}
											>
												<Download size={16} />
												Export Settings
											</button>
											<button className="btn btn-outline gap-2">
												<Upload size={16} />
												Import Settings
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Delete Account Modal */}
				{isDeleteModalOpen && (
					<div className="modal modal-open">
						<div className="modal-box">
							<div className="flex items-center gap-2 mb-4">
								<AlertTriangle className="text-error" size={20} />
								<h3 className="font-bold text-lg">Delete Account</h3>
							</div>
							<p className="mb-4">
								Are you sure you want to delete your account? This action
								cannot be undone.
							</p>
							<p className="text-base-content/60 text-sm mb-4">
								All your assets, collections, and data will be permanently
								removed.
							</p>
							<div className="mb-6">
								<label className="label">
									<span className="label-text">Type 'DELETE' to confirm</span>
								</label>
								<input
									className="input input-bordered input-error w-full"
									placeholder="DELETE"
								/>
							</div>
							<div className="modal-action">
								<button
									className="btn btn-ghost"
									onClick={() => setIsDeleteModalOpen(false)}
								>
									Cancel
								</button>
								<button
									className="btn btn-error"
									onClick={() => setIsDeleteModalOpen(false)}
								>
									Delete Account
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</AppLayout>
	);
}