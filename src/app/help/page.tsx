"use client";

import {
	BarChart3,
	Bell,
	BookOpen,
	ChevronRight,
	Clock,
	Download,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	FolderOpen,
	Globe,
	HelpCircle,
	Lightbulb,
	MessageCircle,
	Play,
	Search,
	Settings,
	Share,
	Shield,
	Star,
	Upload,
	User,
	Users,
	Video,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";

interface HelpArticle {
	id: string;
	title: string;
	content: string;
	category: string;
	tags: string[];
	rating: number;
	views: number;
	lastUpdated: Date;
	difficulty: "beginner" | "intermediate" | "advanced";
}

interface FAQ {
	id: string;
	question: string;
	answer: string;
	category: string;
	helpful: number;
	notHelpful: number;
}

const helpCategories = [
	{
		id: "getting-started",
		title: "Getting Started",
		description: "Learn the basics of using the Brand Portal",
		icon: <Lightbulb size={24} />,
		color: "primary",
		articles: 12,
	},
	{
		id: "assets",
		title: "Asset Management",
		description: "Upload, organize, and manage your digital assets",
		icon: <FileText size={24} />,
		color: "secondary",
		articles: 18,
	},
	{
		id: "collections",
		title: "Collections",
		description: "Create and manage asset collections",
		icon: <FolderOpen size={24} />,
		color: "success",
		articles: 8,
	},
	{
		id: "collaboration",
		title: "Collaboration",
		description: "Work with team members and share assets",
		icon: <Users size={24} />,
		color: "warning",
		articles: 15,
	},
	{
		id: "settings",
		title: "Settings & Admin",
		description: "Configure your account and system settings",
		icon: <Settings size={24} />,
		color: "danger",
		articles: 10,
	},
	{
		id: "troubleshooting",
		title: "Troubleshooting",
		description: "Solve common issues and problems",
		icon: <HelpCircle size={24} />,
		color: "default",
		articles: 22,
	},
];

const featuredArticles = [
	{
		id: "1",
		title: "Getting Started with Brand Portal",
		content:
			"Learn how to set up your account and start managing your brand assets effectively.",
		category: "getting-started",
		tags: ["setup", "basics", "account"],
		rating: 4.8,
		views: 2847,
		lastUpdated: new Date("2024-01-15"),
		difficulty: "beginner" as const,
	},
	{
		id: "2",
		title: "Advanced Asset Filtering and Search",
		content:
			"Master the powerful search and filtering capabilities to find assets quickly.",
		category: "assets",
		tags: ["search", "filters", "advanced"],
		rating: 4.6,
		views: 1523,
		lastUpdated: new Date("2024-01-10"),
		difficulty: "advanced" as const,
	},
	{
		id: "3",
		title: "Setting Up Team Permissions",
		content: "Configure user roles and permissions for secure collaboration.",
		category: "collaboration",
		tags: ["permissions", "security", "teams"],
		rating: 4.7,
		views: 1834,
		lastUpdated: new Date("2024-01-08"),
		difficulty: "intermediate" as const,
	},
];

const faqs: FAQ[] = [
	{
		id: "1",
		question: "How do I upload multiple assets at once?",
		answer:
			"You can upload multiple assets by selecting multiple files in the upload dialog or by dragging and dropping a folder containing your assets. The system supports batch uploads of up to 100 files at once.",
		category: "assets",
		helpful: 42,
		notHelpful: 3,
	},
	{
		id: "2",
		question: "What file formats are supported?",
		answer:
			"We support all major file formats including: Images (JPG, PNG, SVG, GIF, WebP), Videos (MP4, MOV, AVI), Documents (PDF, DOC, DOCX, PPT, PPTX), and Audio (MP3, WAV, AAC).",
		category: "assets",
		helpful: 38,
		notHelpful: 1,
	},
	{
		id: "3",
		question: "How do I share a collection with external users?",
		answer:
			"To share a collection externally, go to the collection settings and enable 'Public Sharing'. You can then generate a secure link or send email invitations to specific users.",
		category: "collaboration",
		helpful: 29,
		notHelpful: 2,
	},
	{
		id: "4",
		question: "Can I customize the brand portal theme?",
		answer:
			"Yes! Go to Settings > Appearance to customize colors, logos, and layout. Premium plans also include white-label options for complete branding customization.",
		category: "settings",
		helpful: 35,
		notHelpful: 0,
	},
	{
		id: "5",
		question: "How do I recover deleted assets?",
		answer:
			"Deleted assets are moved to the Trash folder where they remain for 30 days. You can restore them from Settings > Trash. After 30 days, assets are permanently deleted.",
		category: "troubleshooting",
		helpful: 51,
		notHelpful: 4,
	},
];

const quickStartGuides = [
	{
		title: "Upload Your First Asset",
		description: "Learn how to upload and organize your first digital asset",
		duration: "3 min",
		steps: 5,
		icon: <Upload size={20} />,
	},
	{
		title: "Create a Collection",
		description: "Organize your assets into meaningful collections",
		duration: "2 min",
		steps: 3,
		icon: <FolderOpen size={20} />,
	},
	{
		title: "Share with Your Team",
		description: "Invite team members and set up collaboration",
		duration: "5 min",
		steps: 7,
		icon: <Users size={20} />,
	},
	{
		title: "Set Up Notifications",
		description: "Configure alerts for important activities",
		duration: "2 min",
		steps: 4,
		icon: <Bell size={20} />,
	},
];

export default function HelpPage() {
	const [selectedTab, setSelectedTab] = useState("overview");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const filteredFAQs = faqs.filter((faq) => {
		const matchesSearch =
			!searchQuery ||
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory =
			selectedCategory === "all" || faq.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "beginner":
				return "badge-success";
			case "intermediate":
				return "badge-warning";
			case "advanced":
				return "badge-error";
			default:
				return "badge-neutral";
		}
	};

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="space-y-4 text-center">
					<h1 className="font-bold text-4xl">Help & Documentation</h1>
					<p className="mx-auto max-w-2xl text-base-content/70 text-xl">
						Find answers, learn best practices, and get the most out of your
						Brand Portal
					</p>

					{/* Search */}
					<div className="mx-auto max-w-xl">
						<div className="relative">
							<input
								type="text"
								placeholder="Search help articles, guides, and FAQs..."
								className="input input-lg w-full pl-12 rounded-full"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50" />
						</div>
					</div>

					{/* Quick Actions */}
					<div className="flex flex-wrap items-center justify-center gap-4">
						<button className="btn btn-ghost">
							<Video size={16} />
							Video Tutorials
						</button>
						<button className="btn btn-ghost">
							<MessageCircle size={16} />
							Contact Support
						</button>
						<button className="btn btn-ghost">
							<Download size={16} />
							User Guide PDF
						</button>
					</div>
				</div>

				{/* Main Content */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body p-0">
						<div className="w-full">
							<div role="tablist" className="tabs tabs-bordered">
								{/* Overview */}
								<input
									type="radio"
									name="help-tabs"
									role="tab"
									className="tab"
									aria-label="Overview"
									checked={selectedTab === "overview"}
									onChange={() => setSelectedTab("overview")}
								/>
								<div role="tabpanel" className="tab-content space-y-8 p-6">
									{selectedTab === "overview" && (
										<>
											{/* Quick Start Guides */}
											<div>
												<h2 className="mb-6 font-bold text-2xl">
													Quick Start Guides
												</h2>
												<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
													{quickStartGuides.map((guide, index) => (
														<div
															key={index}
															className="card bg-base-100 shadow-xl cursor-pointer transition-transform hover:scale-105"
														>
															<div className="card-body">
																<div className="flex items-start gap-3">
																	<div className="rounded-lg bg-primary/10 p-2">
																		{guide.icon}
																	</div>
																	<div className="min-w-0 flex-1">
																		<h3 className="font-semibold text-sm">
																			{guide.title}
																		</h3>
																		<p className="mt-1 text-base-content/60 text-xs">
																			{guide.description}
																		</p>
																		<div className="mt-3 flex items-center gap-2">
																			<div className="badge badge-primary badge-sm">
																				{guide.steps} steps
																			</div>
																			<div className="flex items-center gap-1">
																				<Clock
																					size={12}
																					className="text-base-content/40"
																				/>
																				<span className="text-base-content/60 text-xs">
																					{guide.duration}
																				</span>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>

											<div className="divider"></div>

											{/* Categories */}
											<div>
												<h2 className="mb-6 font-bold text-2xl">
													Browse by Category
												</h2>
												<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
													{helpCategories.map((category) => (
														<div key={category.id} className="card bg-base-100 shadow-xl cursor-pointer">
															<div className="card-body">
																<div className="flex items-start gap-4">
																	<div className={`p-3 bg-${category.color}/10 rounded-lg`}>
																		<div className={`text-${category.color}`}>
																			{category.icon}
																		</div>
																	</div>
																	<div className="flex-1">
																		<div className="mb-2 flex items-center justify-between">
																			<h3 className="font-semibold">
																				{category.title}
																			</h3>
																			<div className="badge badge-sm">
																				{category.articles}
																			</div>
																		</div>
																		<p className="mb-3 text-base-content/70 text-sm">
																			{category.description}
																		</p>
																		<div className="flex items-center justify-between">
																			<span className="text-base-content/60 text-xs">
																				{category.articles} articles
																			</span>
																			<ChevronRight
																				size={16}
																				className="text-base-content/40"
																			/>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>

											<div className="divider"></div>

											{/* Featured Articles */}
											<div>
												<h2 className="mb-6 font-bold text-2xl">
													Featured Articles
												</h2>
												<div className="space-y-4">
													{featuredArticles.map((article) => (
														<div key={article.id} className="card bg-base-100 shadow-xl cursor-pointer">
															<div className="card-body">
																<div className="flex items-start justify-between">
																	<div className="flex-1">
																		<div className="mb-2 flex items-center gap-2">
																			<h3 className="font-semibold">
																				{article.title}
																			</h3>
																			<div className={`badge badge-sm ${getDifficultyColor(article.difficulty)}`}>
																				{article.difficulty}
																			</div>
																		</div>
																		<p className="mb-3 text-base-content/70 text-sm">
																			{article.content}
																		</p>
																		<div className="flex items-center gap-4 text-base-content/60 text-xs">
																			<div className="flex items-center gap-1">
																				<Star size={12} className="text-warning" />
																				<span>{article.rating}</span>
																			</div>
																			<div className="flex items-center gap-1">
																				<Eye size={12} />
																				<span>
																					{article.views.toLocaleString()} views
																				</span>
																			</div>
																			<div className="flex items-center gap-1">
																				<Clock size={12} />
																				<span>
																					Updated{" "}
																					{article.lastUpdated.toLocaleDateString()}
																				</span>
																			</div>
																		</div>
																	</div>
																	<ChevronRight
																		size={16}
																		className="text-base-content/40"
																	/>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>
										</>
									)}
								</div>

								{/* FAQs */}
								<input
									type="radio"
									name="help-tabs"
									role="tab"
									className="tab"
									aria-label="FAQs"
									checked={selectedTab === "faqs"}
									onChange={() => setSelectedTab("faqs")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "faqs" && (
										<>
											<div className="flex flex-col gap-4 sm:flex-row">
												<div className="relative sm:flex-1">
													<input
														type="text"
														placeholder="Search FAQs..."
														className="input w-full pl-10"
														value={searchQuery}
														onChange={(e) => setSearchQuery(e.target.value)}
													/>
													<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
												</div>
												<div className="flex flex-wrap gap-2">
													<button
														className={`btn btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-ghost"}`}
														onClick={() => setSelectedCategory("all")}
													>
														All
													</button>
													{helpCategories.map((category) => (
														<button
															key={category.id}
															className={`btn btn-sm ${
																selectedCategory === category.id
																	? "btn-primary"
																	: "btn-ghost"
															}`}
															onClick={() => setSelectedCategory(category.id)}
														>
															{category.title}
														</button>
													))}
												</div>
											</div>

											<div className="space-y-4">
												{filteredFAQs.map((faq) => (
													<div key={faq.id} className="collapse collapse-plus bg-base-200">
														<input type="checkbox" />
														<div className="collapse-title">
															<div className="flex items-center justify-between">
																<h3 className="font-medium">{faq.question}</h3>
																<div className="flex items-center gap-2">
																	<div className="badge badge-sm">
																		{
																			helpCategories.find(
																				(c) => c.id === faq.category,
																			)?.title
																		}
																	</div>
																	<span className="text-success text-xs">
																		{Math.round(
																			(faq.helpful / (faq.helpful + faq.notHelpful)) *
																				100,
																		)}
																		% helpful
																	</span>
																</div>
															</div>
														</div>
														<div className="collapse-content">
															<div className="space-y-4">
																<p className="text-base-content/70">{faq.answer}</p>
																<div className="divider"></div>
																<div className="flex items-center justify-between">
																	<span className="text-base-content/60 text-sm">
																		Was this helpful?
																	</span>
																	<div className="flex items-center gap-2">
																		<button className="btn btn-sm btn-success btn-ghost">
																			Yes ({faq.helpful})
																		</button>
																		<button className="btn btn-sm btn-error btn-ghost">
																			No ({faq.notHelpful})
																		</button>
																	</div>
																</div>
															</div>
														</div>
													</div>
												))}
											</div>

											{filteredFAQs.length === 0 && (
												<div className="py-12 text-center">
													<HelpCircle
														className="mx-auto mb-4 text-base-content/40"
														size={48}
													/>
													<h3 className="mb-2 font-medium text-lg">
														No FAQs found
													</h3>
													<p className="text-base-content/60">
														Try adjusting your search or category filter.
													</p>
												</div>
											)}
										</>
									)}
								</div>

								{/* Video Tutorials */}
								<input
									type="radio"
									name="help-tabs"
									role="tab"
									className="tab"
									aria-label="Video Tutorials"
									checked={selectedTab === "tutorials"}
									onChange={() => setSelectedTab("tutorials")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "tutorials" && (
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
											{[
												{
													title: "Brand Portal Overview",
													description:
														"Get a complete overview of all features and capabilities",
													duration: "8:32",
													views: "12K",
													thumbnail: "/tutorial-1.jpg",
												},
												{
													title: "Asset Management Basics",
													description:
														"Learn how to upload, organize, and manage your digital assets",
													duration: "6:15",
													views: "8.5K",
													thumbnail: "/tutorial-2.jpg",
												},
												{
													title: "Advanced Search Techniques",
													description:
														"Master powerful search and filtering for quick asset discovery",
													duration: "4:22",
													views: "5.2K",
													thumbnail: "/tutorial-3.jpg",
												},
												{
													title: "Team Collaboration Setup",
													description:
														"Set up your team for effective collaboration and sharing",
													duration: "7:45",
													views: "9.1K",
													thumbnail: "/tutorial-4.jpg",
												},
												{
													title: "Brand Guidelines Management",
													description:
														"Create and maintain consistent brand guidelines",
													duration: "5:58",
													views: "6.8K",
													thumbnail: "/tutorial-5.jpg",
												},
												{
													title: "Analytics and Reporting",
													description:
														"Generate insights from your brand asset usage data",
													duration: "9:12",
													views: "4.3K",
													thumbnail: "/tutorial-6.jpg",
												},
											].map((tutorial, index) => (
												<div key={index} className="card bg-base-100 shadow-xl cursor-pointer">
													<div className="card-body p-0">
														<div className="relative">
															<div className="flex aspect-video items-center justify-center rounded-t-lg bg-base-200">
																<Play className="text-primary" size={32} />
															</div>
															<div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
																{tutorial.duration}
															</div>
														</div>
														<div className="p-4">
															<h3 className="mb-2 font-semibold">
																{tutorial.title}
															</h3>
															<p className="mb-3 text-base-content/70 text-sm">
																{tutorial.description}
															</p>
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-1">
																	<Eye size={12} className="text-base-content/40" />
																	<span className="text-base-content/60 text-xs">
																		{tutorial.views} views
																	</span>
																</div>
																<button className="btn btn-sm btn-primary btn-ghost">
																	Watch
																</button>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* API Documentation */}
								<input
									type="radio"
									name="help-tabs"
									role="tab"
									className="tab"
									aria-label="API Docs"
									checked={selectedTab === "api"}
									onChange={() => setSelectedTab("api")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "api" && (
										<>
											<div>
												<h2 className="mb-4 font-bold text-2xl">
													API Documentation
												</h2>
												<p className="mb-6 text-base-content/70">
													Integrate with Brand Portal using our comprehensive REST
													API. Perfect for custom applications and automated
													workflows.
												</p>
											</div>

											<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
												<div className="card bg-base-100 shadow-xl">
													<div className="card-header">
														<h3 className="font-semibold text-lg">Quick Start</h3>
													</div>
													<div className="card-body">
														<div className="space-y-4">
															<div>
																<p className="mb-2 text-base-content/70 text-sm">
																	Base URL:
																</p>
																<div className="mockup-code">
																	<pre><code>https://api.brandportal.com/v1</code></pre>
																</div>
															</div>
															<div>
																<p className="mb-2 text-base-content/70 text-sm">
																	Authentication:
																</p>
																<div className="mockup-code">
																	<pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>
																</div>
															</div>
															<button className="btn btn-ghost">
																<ExternalLink size={16} />
																View Full Documentation
															</button>
														</div>
													</div>
												</div>

												<div className="card bg-base-100 shadow-xl">
													<div className="card-header">
														<h3 className="font-semibold text-lg">
															Common Endpoints
														</h3>
													</div>
													<div className="card-body">
														<div className="space-y-3">
															{[
																{
																	method: "GET",
																	path: "/assets",
																	desc: "List all assets",
																},
																{
																	method: "POST",
																	path: "/assets",
																	desc: "Upload new asset",
																},
																{
																	method: "GET",
																	path: "/collections",
																	desc: "List collections",
																},
																{
																	method: "PUT",
																	path: "/assets/{id}",
																	desc: "Update asset",
																},
																{
																	method: "DELETE",
																	path: "/assets/{id}",
																	desc: "Delete asset",
																},
															].map((endpoint, index) => (
																<div
																	key={index}
																	className="flex items-center gap-3"
																>
																	<div className={`badge badge-sm ${
																		endpoint.method === "GET"
																			? "badge-success"
																			: endpoint.method === "POST"
																				? "badge-primary"
																				: endpoint.method === "PUT"
																					? "badge-warning"
																					: "badge-error"
																	}`}>
																		{endpoint.method}
																	</div>
																	<code className="text-sm">{endpoint.path}</code>
																	<span className="text-base-content/60 text-sm">
																		{endpoint.desc}
																	</span>
																</div>
															))}
														</div>
													</div>
												</div>
											</div>
										</>
									)}
								</div>

								{/* Contact Support */}
								<input
									type="radio"
									name="help-tabs"
									role="tab"
									className="tab"
									aria-label="Contact Support"
									checked={selectedTab === "support"}
									onChange={() => setSelectedTab("support")}
								/>
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{selectedTab === "support" && (
										<>
											<div className="text-center">
												<h2 className="mb-4 font-bold text-2xl">Need More Help?</h2>
												<p className="mx-auto mb-8 max-w-2xl text-base-content/70">
													Can't find what you're looking for? Our support team is
													here to help you get the most out of Brand Portal.
												</p>
											</div>

											<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
												<div className="card bg-base-100 shadow-xl">
													<div className="card-body text-center">
														<MessageCircle
															className="mx-auto mb-4 text-primary"
															size={32}
														/>
														<h3 className="mb-2 font-semibold">Live Chat</h3>
														<p className="mb-4 text-base-content/70 text-sm">
															Get instant help from our support team
														</p>
														<button className="btn btn-primary btn-ghost">
															Start Chat
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															Available 24/7
														</p>
													</div>
												</div>

												<div className="card bg-base-100 shadow-xl">
													<div className="card-body text-center">
														<Globe
															className="mx-auto mb-4 text-secondary"
															size={32}
														/>
														<h3 className="mb-2 font-semibold">Support Portal</h3>
														<p className="mb-4 text-base-content/70 text-sm">
															Submit a ticket and track your requests
														</p>
														<button className="btn btn-secondary btn-ghost">
															Open Portal
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															Response within 4 hours
														</p>
													</div>
												</div>

												<div className="card bg-base-100 shadow-xl">
													<div className="card-body text-center">
														<Users
															className="mx-auto mb-4 text-success"
															size={32}
														/>
														<h3 className="mb-2 font-semibold">Community Forum</h3>
														<p className="mb-4 text-base-content/70 text-sm">
															Connect with other users and experts
														</p>
														<button className="btn btn-success btn-ghost">
															Join Forum
														</button>
														<p className="mt-2 text-base-content/60 text-xs">
															10K+ active members
														</p>
													</div>
												</div>
											</div>

											<div className="divider"></div>

											<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
												<div>
													<h3 className="mb-4 font-semibold text-lg">
														Additional Resources
													</h3>
													<div className="space-y-3">
														<a href="#" className="flex items-center gap-2 link">
															<Download size={16} />
															<span>Download User Manual (PDF)</span>
															<ExternalLink size={14} />
														</a>
														<a href="#" className="flex items-center gap-2 link">
															<Video size={16} />
															<span>Video Tutorial Library</span>
															<ExternalLink size={14} />
														</a>
														<a href="#" className="flex items-center gap-2 link">
															<BookOpen size={16} />
															<span>Best Practices Guide</span>
															<ExternalLink size={14} />
														</a>
														<a href="#" className="flex items-center gap-2 link">
															<Settings size={16} />
															<span>System Status Page</span>
															<ExternalLink size={14} />
														</a>
													</div>
												</div>

												<div>
													<h3 className="mb-4 font-semibold text-lg">
														Contact Information
													</h3>
													<div className="space-y-3 text-sm">
														<div>
															<strong>Email Support:</strong>
															<br />
															support@brandportal.com
														</div>
														<div>
															<strong>Phone Support:</strong>
															<br />
															+1 (555) 123-HELP
															<br />
															<span className="text-base-content/60">
																Mon-Fri 9AM-6PM PST
															</span>
														</div>
														<div>
															<strong>Emergency Support:</strong>
															<br />
															+1 (555) 911-HELP
															<br />
															<span className="text-base-content/60">
																24/7 for critical issues
															</span>
														</div>
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