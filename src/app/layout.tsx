import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";


import { AppLayout } from "~/components/layout/AppLayout";
import { Providers } from "~/contexts";
import { TRPCReactProvider } from "~/trpc/react";
import { SEOUtils } from "~/utils/seoOptimization";

export const metadata: Metadata = {
	title: SEOUtils.generateTitle(),
	description: SEOUtils.generateDescription(),
	keywords: SEOUtils.generateKeywords().join(", "),
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		type: "website",
		siteName: "Brand Portal",
		title: SEOUtils.generateTitle(),
		description: SEOUtils.generateDescription(),
		url: process.env.NEXT_PUBLIC_APP_URL,
		images: [
			{
				url: SEOUtils.generateOGImageUrl(),
				width: 1200,
				height: 630,
				alt: "Brand Portal - Digital Asset Management",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: SEOUtils.generateTitle(),
		description: SEOUtils.generateDescription(),
		images: [SEOUtils.generateOGImageUrl()],
	},
	icons: [
		{ rel: "icon", url: "/favicon.ico" },
		{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
		{ rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
		{ rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
	],
	manifest: "/site.webmanifest",
	other: {
		"theme-color": "#0066cc",
	},
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<head>
				{/* Preconnect to external domains */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				
				{/* Structured Data */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(SEOUtils.generateStructuredData.website()),
					}}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(SEOUtils.generateStructuredData.organization()),
					}}
				/>
			</head>
			<body>
				<TRPCReactProvider>
					<Providers>
						<AppLayout>{children}</AppLayout>
					</Providers>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
