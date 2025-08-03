"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [email, setEmail] = useState("admin@test.com");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				redirect: false,
			});

			if (result?.error) {
				setError("Login failed. Please check your email.");
			} else {
				// Verify session was created
				const session = await getSession();
				if (session) {
					router.push("/assets");
				} else {
					setError("Session creation failed. Please try again.");
				}
			}
		} catch (error) {
			setError("An error occurred during login.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-md bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title text-2xl font-bold justify-center mb-6">
						Brand Portal Login
					</h2>

					<form onSubmit={handleLogin} className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Email</span>
							</label>
							<select
								className="select select-bordered w-full"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							>
								<option value="admin@test.com">Admin User (admin@test.com)</option>
								<option value="user1@test.com">Test User 1 (user1@test.com)</option>
								<option value="user2@test.com">Test User 2 (user2@test.com)</option>
								<option value="user3@test.com">Test User 3 (user3@test.com)</option>
								<option value="user4@test.com">Test User 4 (user4@test.com)</option>
								<option value="user5@test.com">Test User 5 (user5@test.com)</option>
							</select>
						</div>

						{error && (
							<div className="alert alert-error">
								<span>{error}</span>
							</div>
						)}

						<div className="form-control mt-6">
							<button
								type="submit"
								className="btn btn-primary"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<span className="loading loading-spinner loading-sm"></span>
										Logging in...
									</>
								) : (
									"Login"
								)}
							</button>
						</div>
					</form>

					<div className="divider">Development Mode</div>

					<div className="text-sm text-base-content/70">
						<h3 className="font-semibold mb-2">Test Accounts:</h3>
						<ul className="space-y-1">
							<li>• admin@test.com - Admin User</li>
							<li>• user1@test.com - Test User 1</li>
							<li>• user2@test.com - Test User 2</li>
							<li>• user3@test.com - Test User 3</li>
							<li>• user4@test.com - Test User 4</li>
							<li>• user5@test.com - Test User 5</li>
						</ul>
						<p className="mt-3 text-xs">
							All accounts belong to "Test Company" and have access to 340+ assets.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}