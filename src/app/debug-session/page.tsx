"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export default function DebugSessionPage() {
	const { data: session, status } = useSession();

	// Test the asset search directly
	const { 
		data: assetsData, 
		isLoading: assetsLoading, 
		error: assetsError 
	} = api.asset.search.useQuery({
		query: "",
		limit: 10,
		offset: 0,
	});

	// Test the getAll endpoint
	const { 
		data: getAllData, 
		isLoading: getAllLoading, 
		error: getAllError 
	} = api.asset.getAll.useQuery();

	return (
		<div className="container mx-auto p-6 space-y-6">
			<h1 className="text-3xl font-bold">Debug Session & Assets</h1>

			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title">Session Status</h2>
					<div className="space-y-2">
						<p><strong>Status:</strong> {status}</p>
						<p><strong>Session exists:</strong> {session ? "Yes" : "No"}</p>
						{session && (
							<div className="bg-base-200 p-4 rounded">
								<h3 className="font-semibold">Session Data:</h3>
								<pre className="text-sm overflow-auto">
									{JSON.stringify(session, null, 2)}
								</pre>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title">Asset Search API Test</h2>
					<div className="space-y-2">
						<p><strong>Loading:</strong> {assetsLoading ? "Yes" : "No"}</p>
						<p><strong>Error:</strong> {assetsError ? "Yes" : "No"}</p>
						{assetsError && (
							<div className="bg-error/10 p-4 rounded">
								<h3 className="font-semibold text-error">Error Details:</h3>
								<pre className="text-sm overflow-auto">
									{JSON.stringify(assetsError, null, 2)}
								</pre>
							</div>
						)}
						{assetsData && (
							<div className="bg-success/10 p-4 rounded">
								<h3 className="font-semibold text-success">Success:</h3>
								<p>Total assets: {assetsData.total}</p>
								<p>Assets returned: {assetsData.assets.length}</p>
								<p>Has more: {assetsData.hasMore ? "Yes" : "No"}</p>
								{assetsData.assets.length > 0 && (
									<div className="mt-2">
										<h4 className="font-medium">First 3 assets:</h4>
										<ul className="list-disc list-inside">
											{assetsData.assets.slice(0, 3).map((asset: any) => (
												<li key={asset.id}>
													{asset.title} ({asset.fileName})
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title">Asset GetAll API Test</h2>
					<div className="space-y-2">
						<p><strong>Loading:</strong> {getAllLoading ? "Yes" : "No"}</p>
						<p><strong>Error:</strong> {getAllError ? "Yes" : "No"}</p>
						{getAllError && (
							<div className="bg-error/10 p-4 rounded">
								<h3 className="font-semibold text-error">Error Details:</h3>
								<pre className="text-sm overflow-auto">
									{JSON.stringify(getAllError, null, 2)}
								</pre>
							</div>
						)}
						{getAllData && (
							<div className="bg-success/10 p-4 rounded">
								<h3 className="font-semibold text-success">Success:</h3>
								<p>Total assets: {getAllData.total}</p>
								<p>Assets returned: {getAllData.assets.length}</p>
								<p>Has more: {getAllData.hasMore ? "Yes" : "No"}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title">Actions</h2>
					<div className="flex gap-2">
						<button 
							className="btn btn-primary"
							onClick={() => window.location.reload()}
						>
							Reload Page
						</button>
						<button 
							className="btn btn-secondary"
							onClick={() => window.location.href = '/assets'}
						>
							Go to Assets Page
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}