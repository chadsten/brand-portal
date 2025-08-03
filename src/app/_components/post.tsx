"use client";

import { api } from "~/trpc/react";

export function WelcomeMessage() {
	const hello = api.post.hello.useQuery({ text: "from Brand Portal" });

	return (
		<div className="w-full max-w-xs">
			<p className="text-2xl text-white">
				{hello.data ? hello.data.greeting : "Loading tRPC query..."}
			</p>
		</div>
	);
}
