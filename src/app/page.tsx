"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	ArrowRight,
	BarChart3,
	CheckCircle,
	Clock,
	Download,
	FileImage,
	FolderOpen,
	Globe,
	Palette,
	Play,
	Search,
	Shield,
	Star,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const features = [
	{
		icon: <FileImage size={24} />,
		title: "Asset Management",
		description:
			"Upload, organize, and manage all your digital assets in one centralized location with powerful search and filtering.",
		color: "primary",
	},
	{
		icon: <FolderOpen size={24} />,
		title: "Smart Collections",
		description:
			"Create dynamic collections with automated rules, smart tagging, and collaborative organization tools.",
		color: "secondary",
	},
	{
		icon: <Search size={24} />,
		title: "Advanced Search",
		description:
			"Find assets instantly with AI-powered search, faceted filters, and saved search capabilities.",
		color: "success",
	},
	{
		icon: <Zap size={24} />,
		title: "AI-Powered Features",
		description:
			"Automatic tagging, content analysis, and intelligent asset recommendations powered by machine learning.",
		color: "warning",
	},
	{
		icon: <Shield size={24} />,
		title: "Brand Compliance",
		description:
			"Ensure brand consistency with approval workflows, guidelines enforcement, and usage tracking.",
		color: "danger",
	},
	{
		icon: <BarChart3 size={24} />,
		title: "Analytics & Insights",
		description:
			"Track usage patterns, performance metrics, and user engagement with comprehensive analytics.",
		color: "primary",
	},
];

const testimonials = [
	{
		name: "Sarah Chen",
		role: "Creative Director",
		company: "TechCorp",
		avatar: "/avatar-sarah.jpg",
		content:
			"This brand portal has revolutionized how our team manages digital assets. The AI-powered search saves us hours every week.",
		rating: 5,
	},
	{
		name: "Mike Johnson",
		role: "Marketing Manager",
		company: "InnovateLab",
		avatar: "/avatar-mike.jpg",
		content:
			"The collaboration features and approval workflows have streamlined our entire creative process. Highly recommended!",
		rating: 5,
	},
	{
		name: "Emily Davis",
		role: "Brand Manager",
		company: "GlobalBrand",
		avatar: "/avatar-emily.jpg",
		content:
			"Finally, a solution that keeps our brand assets organized and easily accessible to our global team.",
		rating: 5,
	},
];

const stats = [
	{ label: "Active Users", value: "10K+", growth: "+23%" },
	{ label: "Assets Managed", value: "500K+", growth: "+45%" },
	{ label: "Teams Served", value: "2K+", growth: "+67%" },
	{ label: "Time Saved", value: "80%", growth: "avg" },
];

const demoSections = [
	{
		title: "Asset Browser",
		description: "Explore our powerful asset management interface",
		href: "/assets",
		image: "/demo-assets.jpg",
	},
	{
		title: "Collection Management",
		description: "See how collections organize your workflow",
		href: "/collections",
		image: "/demo-collections.jpg",
	},
	{
		title: "Analytics Dashboard",
		description: "Discover insights about your brand assets",
		href: "/analytics",
		image: "/demo-analytics.jpg",
	},
	{
		title: "Search & Discovery",
		description: "Experience advanced search capabilities",
		href: "/search",
		image: "/demo-search.jpg",
	},
];

export default function HomePage() {
	const [activeDemo, setActiveDemo] = useState(0);

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
			{/* Hero Section */}
			<section className="relative px-4 py-20 text-center">
				<div className="container mx-auto max-w-6xl">
					<div className="space-y-8">
						<div className="space-y-4">
							<span className="badge badge-primary badge-lg gap-2">
								<Zap size={16} />
								Powered by AI
							</span>
							<h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text font-bold text-5xl text-transparent lg:text-7xl">
								Modern Brand Portal
							</h1>
							<p className="mx-auto max-w-3xl text-base-content/70 text-xl lg:text-2xl">
								Centralize, organize, and optimize your digital assets with
								intelligent features that scale with your brand.
							</p>
						</div>

						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Link href="/dashboard" className="btn btn-primary btn-lg px-8 py-6 text-lg gap-2">
								View Dashboard
								<ArrowRight size={20} />
							</Link>
							<button className="btn btn-outline btn-lg px-8 py-6 text-lg gap-2">
								<Play size={20} />
								Watch Demo
							</button>
						</div>

						{/* Stats */}
						<div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
							{stats.map((stat, index) => (
								<div key={index} className="text-center">
									<div className="font-bold text-3xl text-primary lg:text-4xl">
										{stat.value}
									</div>
									<div className="mt-1 text-base-content/70">{stat.label}</div>
									<div className="mt-2 flex items-center justify-center gap-1">
										<TrendingUp size={14} className="text-success" />
										<span className="text-small text-success">
											{stat.growth}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-4 py-20">
				<div className="container mx-auto max-w-6xl">
					<div className="mb-16 text-center">
						<h2 className="mb-6 font-bold text-4xl lg:text-5xl">
							Everything you need to manage your brand
						</h2>
						<p className="mx-auto max-w-3xl text-base-content/70 text-xl">
							From asset management to analytics, our platform provides all the
							tools your team needs to maintain brand consistency and
							efficiency.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<div key={index} className="card bg-base-100 shadow-md p-2">
								<div className="card-body p-6">
									<div
										className={`h-12 w-12 rounded-lg mb-4 flex items-center justify-center ${
											feature.color === "primary" ? "bg-primary/10" :
											feature.color === "secondary" ? "bg-secondary/10" :
											feature.color === "success" ? "bg-success/10" :
											feature.color === "warning" ? "bg-warning/10" :
											feature.color === "danger" ? "bg-error/10" :
											"bg-base-300"
										}`}
									>
										<div className={`${
											feature.color === "primary" ? "text-primary" :
											feature.color === "secondary" ? "text-secondary" :
											feature.color === "success" ? "text-success" :
											feature.color === "warning" ? "text-warning" :
											feature.color === "danger" ? "text-error" :
											"text-base-content"
										}`}>
											{feature.icon}
										</div>
									</div>
									<h3 className="mb-3 font-semibold text-xl">
										{feature.title}
									</h3>
									<p className="text-base-content/70">{feature.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Demo Section */}
			<section className="bg-base-200 px-4 py-20">
				<div className="container mx-auto max-w-6xl">
					<div className="mb-16 text-center">
						<h2 className="mb-6 font-bold text-4xl lg:text-5xl">
							Experience the platform
						</h2>
						<p className="mx-auto max-w-3xl text-base-content/70 text-xl">
							Explore our interactive demos to see how the brand portal can
							transform your digital asset management workflow.
						</p>
					</div>

					<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
						{demoSections.map((demo, index) => (
							<button
								key={index}
								className={`btn ${activeDemo === index ? "btn-primary" : "btn-outline"} h-auto justify-start p-4`}
								onClick={() => setActiveDemo(index)}
							>
								<div className="text-left">
									<p className="font-medium">{demo.title}</p>
									<p className="text-base-content/60 text-sm">
										{demo.description}
									</p>
								</div>
							</button>
						))}
					</div>

					<div className="card bg-base-100 shadow overflow-hidden">
						<div className="card-body p-0">
							<div className="flex h-96 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
								<div className="text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
										<Globe size={32} className="text-primary" />
									</div>
									<h3 className="mb-2 font-semibold text-xl">
										{demoSections[activeDemo]?.title}
									</h3>
									<p className="mb-4 text-base-content/70">
										{demoSections[activeDemo]?.description}
									</p>
									<Link
										href={demoSections[activeDemo]?.href || "/"}
										className="btn btn-primary gap-2"
									>
										Explore Feature
										<ArrowRight size={16} />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="px-4 py-20">
				<div className="container mx-auto max-w-6xl">
					<div className="mb-16 text-center">
						<h2 className="mb-6 font-bold text-4xl lg:text-5xl">
							Trusted by creative teams worldwide
						</h2>
						<p className="mx-auto max-w-3xl text-base-content/70 text-xl">
							See what industry leaders are saying about our brand portal
							platform.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<div key={index} className="card bg-base-100 shadow">
								<div className="card-body p-6">
									<div className="mb-4 flex items-center gap-1">
										{Array.from({ length: testimonial.rating }).map((_, i) => (
											<Star
												key={i}
												size={16}
												className="fill-warning text-warning"
											/>
										))}
									</div>
									<p className="mb-6 text-base-content/70">
										"{testimonial.content}"
									</p>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="w-10 rounded-full">
												<img src={testimonial.avatar} alt={testimonial.name} />
											</div>
										</div>
										<div>
											<p className="font-medium">{testimonial.name}</p>
											<p className="text-base-content/60 text-sm">
												{testimonial.role} at {testimonial.company}
											</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-gradient-to-r from-primary to-secondary px-4 py-20">
				<div className="container mx-auto max-w-4xl text-center">
					<div className="space-y-8 text-white">
						<h2 className="font-bold text-4xl lg:text-5xl">
							Ready to transform your brand management?
						</h2>
						<p className="mx-auto max-w-2xl text-xl opacity-90">
							Join thousands of teams who have streamlined their creative
							workflows with our comprehensive brand portal solution.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Link
								href="/dashboard"
								className="btn btn-neutral btn-lg px-8 py-6 text-lg gap-2"
							>
								Get Started Free
								<ArrowRight size={20} />
							</Link>
							<button className="btn btn-outline btn-lg border-white px-8 py-6 text-lg text-white hover:bg-white/10">
								Contact Sales
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t bg-base-100 px-4 py-12">
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
						<div>
							<h3 className="mb-4 font-bold text-lg">Brand Portal</h3>
							<p className="text-base-content/60 text-sm">
								The modern solution for digital asset management and brand
								consistency.
							</p>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Product</h4>
							<div className="space-y-2 text-sm">
								<Link
									href="/assets"
									className="block text-base-content/60 hover:text-primary"
								>
									Assets
								</Link>
								<Link
									href="/collections"
									className="block text-base-content/60 hover:text-primary"
								>
									Collections
								</Link>
								<Link
									href="/analytics"
									className="block text-base-content/60 hover:text-primary"
								>
									Analytics
								</Link>
								<Link
									href="/search"
									className="block text-base-content/60 hover:text-primary"
								>
									Search
								</Link>
							</div>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Features</h4>
							<div className="space-y-2 text-sm">
								<Link
									href="/dashboard"
									className="block text-base-content/60 hover:text-primary"
								>
									Dashboard
								</Link>
								<Link
									href="/workflow"
									className="block text-base-content/60 hover:text-primary"
								>
									Workflows
								</Link>
								<Link
									href="/guidelines"
									className="block text-base-content/60 hover:text-primary"
								>
									Guidelines
								</Link>
								<Link
									href="/collaboration"
									className="block text-base-content/60 hover:text-primary"
								>
									Collaboration
								</Link>
							</div>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Company</h4>
							<div className="space-y-2 text-sm">
								<Link
									href="/about"
									className="block text-base-content/60 hover:text-primary"
								>
									About
								</Link>
								<Link
									href="/contact"
									className="block text-base-content/60 hover:text-primary"
								>
									Contact
								</Link>
								<Link
									href="/privacy"
									className="block text-base-content/60 hover:text-primary"
								>
									Privacy
								</Link>
								<Link
									href="/terms"
									className="block text-base-content/60 hover:text-primary"
								>
									Terms
								</Link>
							</div>
						</div>
					</div>
					<div className="mt-8 border-t pt-8 text-center text-base-content/60 text-sm">
						© 2025 Brand Portal. Built with Claude Code.
					</div>
				</div>
			</footer>
		</div>
	);
}
