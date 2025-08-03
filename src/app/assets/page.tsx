"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AssetBrowser } from "~/components/assets/AssetBrowser";

export default function AssetsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="container mx-auto p-6">
				<div className="flex justify-center items-center min-h-64">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="container mx-auto p-6">
				<div className="card bg-warning">
					<div className="card-body">
						<h2 className="card-title">Authentication Required</h2>
						<p>Please log in to access the assets.</p>
						<div className="card-actions">
							<button 
								className="btn btn-primary"
								onClick={() => router.push("/login")}
							>
								Go to Login
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<AssetBrowser />
		</div>
	);
}
