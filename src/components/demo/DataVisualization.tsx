"use client";

import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Divider,
	Progress,
	Select,
	SelectItem,
	Spinner,
} from "@heroui/react";
import {
	Activity,
	BarChart3,
	Download,
	Eye,
	FileImage,
	RefreshCw,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMockData } from "~/hooks/useMockData";
import type { Asset } from "~/types";

interface DataVisualizationProps {
	title?: string;
	showControls?: boolean;
	enableRealTime?: boolean;
}

interface ChartData {
	labels: string[];
	datasets: {
		name: string;
		data: number[];
		color: string;
	}[];
}

export function DataVisualization({
	title = "Data Visualization",
	showControls = true,
	enableRealTime = false,
}: DataVisualizationProps) {
	const { assets, collections, stats, isLoading } = useMockData();
	const [selectedMetric, setSelectedMetric] = useState("downloads");
	const [timeRange, setTimeRange] = useState("7d");
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Generate chart data based on selected metric
	const generateChartData = (): ChartData => {
		const now = new Date();
		const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
		const labels: string[] = [];
		const data: number[] = [];

		// Generate labels for the time period
		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			labels.push(
				date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
			);
		}

		// Generate sample data based on metric
		switch (selectedMetric) {
			case "downloads":
				data.push(
					...Array.from(
						{ length: days },
						() => Math.floor(Math.random() * 50) + 10,
					),
				);
				break;
			case "uploads":
				data.push(
					...Array.from(
						{ length: days },
						() => Math.floor(Math.random() * 20) + 2,
					),
				);
				break;
			case "views":
				data.push(
					...Array.from(
						{ length: days },
						() => Math.floor(Math.random() * 200) + 50,
					),
				);
				break;
			case "users":
				data.push(
					...Array.from(
						{ length: days },
						() => Math.floor(Math.random() * 30) + 5,
					),
				);
				break;
			default:
				data.push(
					...Array.from({ length: days }, () =>
						Math.floor(Math.random() * 100),
					),
				);
		}

		return {
			labels,
			datasets: [
				{
					name: selectedMetric,
					data,
					color: "hsl(var(--primary))",
				},
			],
		};
	};

	const chartData = generateChartData();

	// Asset type distribution
	const assetTypeDistribution = [
		{
			type: "Images",
			count: assets.filter((a) => a.type === "image").length,
			color: "bg-primary",
		},
		{
			type: "Videos",
			count: assets.filter((a) => a.type === "video").length,
			color: "bg-secondary",
		},
		{
			type: "Documents",
			count: assets.filter((a) => a.type === "document").length,
			color: "bg-success",
		},
		{
			type: "Audio",
			count: assets.filter((a) => a.type === "audio").length,
			color: "bg-warning",
		},
	];

	// Top performing assets
	const topAssets = [...assets]
		.sort((a, b) => b.downloads - a.downloads)
		.slice(0, 5);

	// Usage trends
	const usageTrends = {
		totalDownloads: stats.totalDownloads,
		totalViews: assets.reduce((sum, asset) => sum + asset.views, 0),
		totalUsers: stats.totalUsers,
		avgRating:
			assets.reduce((sum, asset) => sum + asset.rating, 0) / assets.length,
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		// Simulate refresh delay
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsRefreshing(false);
	};

	// Real-time updates
	useEffect(() => {
		if (!enableRealTime) return;

		const interval = setInterval(() => {
			// Trigger re-render for real-time effect
			setIsRefreshing(false);
		}, 5000);

		return () => clearInterval(interval);
	}, [enableRealTime]);

	if (isLoading) {
		return (
			<Card>
				<CardBody className="flex h-96 items-center justify-center">
					<Spinner size="lg" />
					<p className="mt-4 text-default-500">Loading visualization data...</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-2xl">{title}</h2>
				{showControls && (
					<div className="flex items-center gap-3">
						<Select
							size="sm"
							selectedKeys={[selectedMetric]}
							onSelectionChange={(keys) =>
								setSelectedMetric(Array.from(keys)[0] as string)
							}
							className="w-32"
						>
							<SelectItem key="downloads">Downloads</SelectItem>
							<SelectItem key="uploads">Uploads</SelectItem>
							<SelectItem key="views">Views</SelectItem>
							<SelectItem key="users">Users</SelectItem>
						</Select>
						<Select
							size="sm"
							selectedKeys={[timeRange]}
							onSelectionChange={(keys) =>
								setTimeRange(Array.from(keys)[0] as string)
							}
							className="w-24"
						>
							<SelectItem key="7d">7d</SelectItem>
							<SelectItem key="30d">30d</SelectItem>
							<SelectItem key="90d">90d</SelectItem>
						</Select>
						<Button
							size="sm"
							variant="flat"
							isIconOnly
							onPress={handleRefresh}
							isLoading={isRefreshing}
						>
							<RefreshCw size={16} />
						</Button>
					</div>
				)}
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardBody>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-default-500 text-small">Total Downloads</p>
								<p className="font-bold text-2xl">
									{usageTrends.totalDownloads.toLocaleString()}
								</p>
								<div className="mt-1 flex items-center gap-1">
									<TrendingUp size={14} className="text-success" />
									<span className="text-small text-success">+12.5%</span>
								</div>
							</div>
							<div className="rounded-lg bg-primary/10 p-3">
								<Download className="text-primary" size={24} />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-default-500 text-small">Total Views</p>
								<p className="font-bold text-2xl">
									{usageTrends.totalViews.toLocaleString()}
								</p>
								<div className="mt-1 flex items-center gap-1">
									<TrendingUp size={14} className="text-success" />
									<span className="text-small text-success">+8.3%</span>
								</div>
							</div>
							<div className="rounded-lg bg-secondary/10 p-3">
								<Eye className="text-secondary" size={24} />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-default-500 text-small">Active Users</p>
								<p className="font-bold text-2xl">{usageTrends.totalUsers}</p>
								<div className="mt-1 flex items-center gap-1">
									<TrendingDown size={14} className="text-danger" />
									<span className="text-danger text-small">-2.1%</span>
								</div>
							</div>
							<div className="rounded-lg bg-success/10 p-3">
								<Users className="text-success" size={24} />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-default-500 text-small">Avg Rating</p>
								<p className="font-bold text-2xl">
									{usageTrends.avgRating.toFixed(1)}
								</p>
								<div className="mt-1 flex items-center gap-1">
									<TrendingUp size={14} className="text-success" />
									<span className="text-small text-success">+0.3</span>
								</div>
							</div>
							<div className="rounded-lg bg-warning/10 p-3">
								<Activity className="text-warning" size={24} />
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Trend Chart */}
				<Card>
					<CardHeader>
						<h4 className="font-semibold text-lg">
							{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}{" "}
							Trend
						</h4>
					</CardHeader>
					<CardBody>
						<div className="flex h-64 items-center justify-center rounded-lg bg-default-50">
							<div className="text-center">
								<BarChart3
									className="mx-auto mb-2 text-default-400"
									size={32}
								/>
								<p className="text-default-500 text-small">
									{selectedMetric.charAt(0).toUpperCase() +
										selectedMetric.slice(1)}{" "}
									chart ({timeRange})
								</p>
								<p className="text-default-400 text-tiny">
									Peak: {Math.max(...(chartData.datasets[0]?.data || []))} |
									Avg:{" "}
									{Math.round(
										(chartData.datasets[0]?.data || []).reduce(
											(a, b) => a + b,
											0,
										) / (chartData.datasets[0]?.data?.length || 1),
									)}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Asset Type Distribution */}
				<Card>
					<CardHeader>
						<h4 className="font-semibold text-lg">Asset Type Distribution</h4>
					</CardHeader>
					<CardBody>
						<div className="space-y-4">
							{assetTypeDistribution.map((item) => (
								<div
									key={item.type}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<div className={`h-3 w-3 rounded-full ${item.color}`} />
										<span className="text-small">{item.type}</span>
									</div>
									<div className="text-right">
										<span className="font-medium text-small">{item.count}</span>
										<span className="ml-2 text-default-500 text-tiny">
											({((item.count / stats.totalAssets) * 100).toFixed(1)}%)
										</span>
									</div>
								</div>
							))}
						</div>
						<Divider className="my-4" />
						<div className="text-center">
							<p className="text-default-500 text-small">
								Total Assets: {stats.totalAssets}
							</p>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Top Performing Assets */}
			<Card>
				<CardHeader>
					<h4 className="font-semibold text-lg">Top Performing Assets</h4>
				</CardHeader>
				<CardBody>
					<div className="space-y-3">
						{topAssets.map((asset, index) => (
							<div key={asset.id} className="flex items-center gap-4">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-default-100">
									<span className="font-bold text-small">{index + 1}</span>
								</div>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100">
									<FileImage size={16} className="text-default-500" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">{asset.name}</p>
									<div className="mt-1 flex items-center gap-4">
										<div className="flex items-center gap-1">
											<Download size={12} className="text-default-400" />
											<span className="text-default-500 text-small">
												{asset.downloads}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<Eye size={12} className="text-default-400" />
											<span className="text-default-500 text-small">
												{asset.views}
											</span>
										</div>
									</div>
								</div>
								<Chip size="sm" color="primary" variant="flat">
									{asset.type}
								</Chip>
							</div>
						))}
					</div>
				</CardBody>
			</Card>

			{/* Real-time indicator */}
			{enableRealTime && (
				<div className="flex items-center justify-center">
					<Chip size="sm" color="success" variant="dot">
						Live Data
					</Chip>
				</div>
			)}
		</div>
	);
}
