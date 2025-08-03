"use client";

import {
	BarChart3,
	Database,
	Download,
	FileText,
	Pause,
	Play,
	RefreshCw,
	Settings,
} from "lucide-react";
import { useState } from "react";
import { DataVisualization } from "~/components/demo/DataVisualization";
import { AppLayout } from "~/components/layout/AppLayout";
import { useMockData } from "~/hooks/useMockData";

export default function DemoPage() {
	const {
		assets,
		collections,
		users,
		notifications,
		stats,
		isLoading,
		resetData,
		addAsset,
		addCollection,
		addNotification,
	} = useMockData({ enablePersistence: true });

	const [selectedTab, setSelectedTab] = useState("overview");
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [dataSize, setDataSize] = useState("medium");

	const handleGenerateAssets = () => {
		const count = dataSize === "small" ? 10 : dataSize === "medium" ? 50 : 100;
		for (let i = 0; i < count; i++) {
			addAsset();
		}
	};

	const handleGenerateCollections = () => {
		const count = dataSize === "small" ? 3 : dataSize === "medium" ? 10 : 20;
		for (let i = 0; i < count; i++) {
			addCollection();
		}
	};

	const handleGenerateNotifications = () => {
		const count = dataSize === "small" ? 5 : dataSize === "medium" ? 15 : 30;
		for (let i = 0; i < count; i++) {
			addNotification();
		}
	};

	const exportData = () => {
		const data = {
			assets,
			collections,
			users,
			notifications,
			stats,
			exportedAt: new Date().toISOString(),
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `brand-portal-data-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-3xl">Demo & Data Management</h1>
						<p className="mt-1 text-base-content/60">
							Explore the mock data system and generate realistic demo content.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								className="toggle toggle-sm"
								checked={autoRefresh}
								onChange={(e) => setAutoRefresh(e.target.checked)}
							/>
							<span className="text-sm">Auto Refresh</span>
						</label>
						<button
							className="btn btn-ghost"
							onClick={exportData}
						>
							<Download size={16} />
							Export Data
						</button>
					</div>
				</div>

				{/* Current Stats */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div className="card bg-base-100 shadow-xl">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-primary">
								{stats.totalAssets}
							</div>
							<div className="text-base-content/60 text-sm">Assets</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow-xl">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-secondary">
								{stats.totalCollections}
							</div>
							<div className="text-base-content/60 text-sm">Collections</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow-xl">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-success">
								{stats.totalUsers}
							</div>
							<div className="text-base-content/60 text-sm">Users</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow-xl">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-warning">
								{stats.unreadNotifications}
							</div>
							<div className="text-base-content/60 text-sm">Notifications</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body p-0">
						<div className="w-full">
							<div role="tablist" className="tabs tabs-bordered">
								{/* Data Overview */}
								<input
									type="radio"
									name="demo-tabs"
									role="tab"
									className="tab"
									aria-label="Data Overview"
									checked={selectedTab === "overview"}
									onChange={() => setSelectedTab("overview")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "overview" && (
										<>
											<div>
												<h3 className="mb-4 font-semibold text-lg">
													Mock Data System
												</h3>
												<p className="mb-4 text-base-content/70">
													The Brand Portal uses a sophisticated mock data generation
													system to provide realistic demo content. This system
													generates assets, collections, users, notifications, and
													activity items with proper relationships and realistic
													metadata.
												</p>
											</div>

											<div className="divider"></div>

											<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
												<div>
													<h4 className="mb-3 font-semibold">
														Asset Types Distribution
													</h4>
													<div className="space-y-2">
														{[
															{
																type: "Images",
																count: assets.filter((a) => a.type === "image")
																	.length,
																color: "primary",
															},
															{
																type: "Videos",
																count: assets.filter((a) => a.type === "video")
																	.length,
																color: "secondary",
															},
															{
																type: "Documents",
																count: assets.filter((a) => a.type === "document")
																	.length,
																color: "success",
															},
															{
																type: "Audio",
																count: assets.filter((a) => a.type === "audio")
																	.length,
																color: "warning",
															},
														].map((item) => (
															<div
																key={item.type}
																className="flex items-center justify-between"
															>
																<div className="flex items-center gap-2">
																	<div className="badge badge-sm">
																		{item.type}
																	</div>
																</div>
																<span className="text-sm">
																	{item.count} assets
																</span>
															</div>
														))}
													</div>
												</div>

												<div>
													<h4 className="mb-3 font-semibold">System Features</h4>
													<ul className="space-y-2 text-base-content/70 text-sm">
														<li>✓ Realistic asset metadata generation</li>
														<li>✓ Smart relationship management</li>
														<li>✓ Configurable data persistence</li>
														<li>✓ Advanced search and filtering</li>
														<li>✓ Real-time data updates</li>
														<li>✓ Export/import capabilities</li>
													</ul>
												</div>
											</div>
										</>
									)}
								</div>

								{/* Data Generation */}
								<input
									type="radio"
									name="demo-tabs"
									role="tab"
									className="tab"
									aria-label="Data Generation"
									checked={selectedTab === "generation"}
									onChange={() => setSelectedTab("generation")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "generation" && (
										<>
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg">
													Generate Demo Data
												</h3>
												<select
													className="select select-sm w-32"
													value={dataSize}
													onChange={(e) => setDataSize(e.target.value)}
												>
													<option value="small">Small</option>
													<option value="medium">Medium</option>
													<option value="large">Large</option>
												</select>
											</div>

											<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
												<div className="card bg-base-100 shadow-xl">
													<div className="card-header">
														<div className="flex items-center gap-2">
															<Database className="text-primary" size={20} />
															<h4 className="font-semibold">Assets</h4>
														</div>
													</div>
													<div className="card-body">
														<p className="mb-4 text-base-content/70 text-sm">
															Generate new assets with realistic metadata, tags, and
															relationships.
														</p>
														<button
															className="btn btn-primary w-full"
															onClick={handleGenerateAssets}
														>
															Generate Assets
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															Will create{" "}
															{dataSize === "small"
																? "10"
																: dataSize === "medium"
																	? "50"
																	: "100"}{" "}
															assets
														</p>
													</div>
												</div>

												<div className="card bg-base-100 shadow-xl">
													<div className="card-header">
														<div className="flex items-center gap-2">
															<FileText className="text-secondary" size={20} />
															<h4 className="font-semibold">Collections</h4>
														</div>
													</div>
													<div className="card-body">
														<p className="mb-4 text-base-content/70 text-sm">
															Create organized collections with curated asset sets
															and metadata.
														</p>
														<button
															className="btn btn-secondary w-full"
															onClick={handleGenerateCollections}
														>
															Generate Collections
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															Will create{" "}
															{dataSize === "small"
																? "3"
																: dataSize === "medium"
																	? "10"
																	: "20"}{" "}
															collections
														</p>
													</div>
												</div>

												<div className="card bg-base-100 shadow-xl">
													<div className="card-header">
														<div className="flex items-center gap-2">
															<Settings className="text-success" size={20} />
															<h4 className="font-semibold">Notifications</h4>
														</div>
													</div>
													<div className="card-body">
														<p className="mb-4 text-base-content/70 text-sm">
															Add realistic notifications for various system events
															and activities.
														</p>
														<button
															className="btn btn-success w-full"
															onClick={handleGenerateNotifications}
														>
															Generate Notifications
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															Will create{" "}
															{dataSize === "small"
																? "5"
																: dataSize === "medium"
																	? "15"
																	: "30"}{" "}
															notifications
														</p>
													</div>
												</div>
											</div>

											<div className="divider"></div>

											<div>
												<h4 className="mb-3 font-semibold">Data Management</h4>
												<div className="flex gap-3">
													<button
														className="btn btn-ghost"
														onClick={resetData}
													>
														<RefreshCw size={16} />
														Reset All Data
													</button>
													<button
														className="btn btn-ghost"
														onClick={exportData}
													>
														<Download size={16} />
														Export Current Data
													</button>
												</div>
											</div>
										</>
									)}
								</div>

								{/* Analytics */}
								<input
									type="radio"
									name="demo-tabs"
									role="tab"
									className="tab"
									aria-label="Analytics"
									checked={selectedTab === "analytics"}
									onChange={() => setSelectedTab("analytics")}
								/>
								<div role="tabpanel" className="tab-content p-6">
									{selectedTab === "analytics" && (
										<DataVisualization
											title="Mock Data Analytics"
											showControls={true}
											enableRealTime={autoRefresh}
										/>
									)}
								</div>

								{/* API Examples */}
								<input
									type="radio"
									name="demo-tabs"
									role="tab"
									className="tab"
									aria-label="API Examples"
									checked={selectedTab === "api"}
									onChange={() => setSelectedTab("api")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "api" && (
										<>
											<div>
												<h3 className="mb-4 font-semibold text-lg">
													Mock Data API Usage
												</h3>
												<p className="mb-4 text-base-content/70">
													Here are examples of how to use the mock data system in
													your components:
												</p>
											</div>

											<div className="space-y-6">
												<div>
													<h4 className="mb-2 font-semibold">Basic Hook Usage</h4>
													<div className="mockup-code">
														<pre><code>{`import { useMockData } from '~/hooks/useMockData';

function MyComponent() {
  const {
    assets,
    collections,
    stats,
    addAsset,
    searchAndFilterAssets
  } = useMockData();

  // Use the data...
}`}</code></pre>
													</div>
												</div>

												<div>
													<h4 className="mb-2 font-semibold">Search and Filter</h4>
													<div className="mockup-code">
														<pre><code>{`// Search assets
const results = searchAndFilterAssets('logo', {
  type: 'image',
  status: 'approved',
  minRating: 4.0,
  sortBy: 'downloads',
  sortOrder: 'desc'
});`}</code></pre>
													</div>
												</div>

												<div>
													<h4 className="mb-2 font-semibold">Data Persistence</h4>
													<div className="mockup-code">
														<pre><code>{`// Enable data persistence
const { assets } = useMockData({
  enablePersistence: true,
  storageKey: 'myAppData'
});`}</code></pre>
													</div>
												</div>

												<div>
													<h4 className="mb-2 font-semibold">
														Generate Custom Data
													</h4>
													<div className="mockup-code">
														<pre><code>{`import { generateAsset, generateCollection } from '~/utils/mockData';

// Generate custom asset
const newAsset = generateAsset({
  name: 'Custom Logo.svg',
  type: 'image',
  uploadedBy: 'John Doe'
});

// Generate custom collection
const newCollection = generateCollection({
  name: 'Brand Assets',
  description: 'Core brand elements'
});`}</code></pre>
													</div>
												</div>
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}