"use client";

import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	MessageCircle,
	Monitor,
	Phone,
	Settings,
	Users,
	Video,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Participant {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "host" | "participant" | "viewer";
	status: "online" | "offline" | "busy";
	isActive: boolean;
	isSpeaking?: boolean;
	lastSeen?: Date;
}

interface CollaborationSession {
	id: string;
	name: string;
	assetId?: string;
	assetName?: string;
	type: "review" | "edit" | "meeting" | "discussion";
	status: "active" | "scheduled" | "completed" | "cancelled";
	startTime: Date;
	endTime?: Date;
	participants: Participant[];
	host: Participant;
}

interface Message {
	id: string;
	sender: Participant;
	content: string;
	timestamp: Date;
	type: "text" | "system" | "notification";
}

const mockParticipants: Participant[] = [
	{
		id: "1",
		name: "Sarah Chen",
		email: "sarah@company.com",
		avatar: "/avatars/sarah.jpg",
		role: "host",
		status: "online",
		isActive: true,
		isSpeaking: true,
		lastSeen: new Date(),
	},
	{
		id: "2",
		name: "Mike Johnson",
		email: "mike@company.com",
		avatar: "/avatars/mike.jpg",
		role: "participant",
		status: "online",
		isActive: true,
		isSpeaking: false,
		lastSeen: new Date(),
	},
	{
		id: "3",
		name: "Emily Davis",
		email: "emily@company.com",
		avatar: "/avatars/emily.jpg",
		role: "viewer",
		status: "busy",
		isActive: true,
		isSpeaking: false,
		lastSeen: new Date(),
	},
];

const mockSession: CollaborationSession = {
	id: "session-1",
	name: "Brand Logo Review Session",
	assetId: "asset-123",
	assetName: "brand-logo-v2.svg",
	type: "review",
	status: "active",
	startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
	participants: mockParticipants,
	host: mockParticipants[0],
};

export function RealTimeCollaboration() {
	const [session, setSession] = useState<CollaborationSession>(mockSession);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			sender: mockParticipants[0],
			content: "Welcome to the brand logo review session!",
			timestamp: new Date(Date.now() - 25 * 60 * 1000),
			type: "text",
		},
		{
			id: "2",
			sender: mockParticipants[1],
			content: "Thanks for joining. The new logo looks great!",
			timestamp: new Date(Date.now() - 20 * 60 * 1000),
			type: "text",
		},
	]);
	const [newMessage, setNewMessage] = useState("");
	const [activeTab, setActiveTab] = useState("chat");
	const [isVideoOn, setIsVideoOn] = useState(true);
	const [isAudioOn, setIsAudioOn] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);

	// Calculate session duration
	const getSessionDuration = () => {
		const now = new Date();
		const diff = now.getTime() - session.startTime.getTime();
		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const [duration, setDuration] = useState(getSessionDuration());

	useEffect(() => {
		const interval = setInterval(() => {
			setDuration(getSessionDuration());
		}, 1000);
		return () => clearInterval(interval);
	}, [session.startTime]);

	const sendMessage = () => {
		if (newMessage.trim()) {
			const message: Message = {
				id: Date.now().toString(),
				sender: mockParticipants[0], // Current user
				content: newMessage,
				timestamp: new Date(),
				type: "text",
			};
			setMessages([...messages, message]);
			setNewMessage("");
		}
	};

	const getStatusBadge = (status: string) => {
		const statusClasses = {
			active: "badge-success",
			scheduled: "badge-info",
			completed: "badge-neutral",
			cancelled: "badge-error",
		};
		return `badge ${statusClasses[status as keyof typeof statusClasses] || ""}`;
	};

	const getParticipantStatusColor = (status: string) => {
		const colors = {
			online: "bg-success",
			offline: "bg-neutral",
			busy: "bg-warning",
		};
		return colors[status as keyof typeof colors] || "bg-neutral";
	};

	return (
		<div className="min-h-screen bg-base-200">
			{/* Header */}
			<div className="navbar bg-base-100 border-b border-base-300">
				<div className="navbar-start">
					<div>
						<h1 className="text-xl font-semibold">{session.name}</h1>
						<div className="flex items-center gap-4 text-sm text-base-content/60">
							<span className={getStatusBadge(session.status)}>
								{session.status}
							</span>
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{duration}
							</span>
							<span className="flex items-center gap-1">
								<Users className="h-3 w-3" />
								{session.participants.length} participants
							</span>
						</div>
					</div>
				</div>
				<div className="navbar-end gap-2">
					<button
						className={`btn btn-sm ${isScreenSharing ? "btn-primary" : "btn-ghost"}`}
						onClick={() => setIsScreenSharing(!isScreenSharing)}
					>
						<Monitor className="h-4 w-4" />
						{isScreenSharing ? "Stop Sharing" : "Share Screen"}
					</button>
					<button className="btn btn-error btn-sm">
						<Phone className="h-4 w-4" />
						Leave Session
					</button>
				</div>
			</div>

			<div className="flex h-[calc(100vh-4rem)]">
				{/* Main Content Area */}
				<div className="flex-1 flex flex-col">
					{/* Video/Content Area */}
					<div className="flex-1 bg-base-300 relative">
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center">
								<div className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
									<Video className="h-16 w-16 text-primary" />
								</div>
								<h3 className="text-xl font-semibold mb-2">
									{session.assetName || "No content shared"}
								</h3>
								<p className="text-base-content/60">
									Share your screen to start presenting
								</p>
							</div>
						</div>

						{/* Participant Videos */}
						<div className="absolute bottom-4 right-4 flex gap-2">
							{session.participants.slice(0, 3).map((participant) => (
								<div
									key={participant.id}
									className="w-32 h-24 bg-base-100 rounded-lg border border-base-300 relative overflow-hidden"
								>
									<div className="absolute inset-0 flex items-center justify-center">
										{participant.avatar ? (
											<img
												src={participant.avatar}
												alt={participant.name}
												className="w-12 h-12 rounded-full"
											/>
										) : (
											<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
												<span className="text-lg font-semibold">
													{participant.name.charAt(0)}
												</span>
											</div>
										)}
									</div>
									<div className="absolute bottom-0 left-0 right-0 bg-base-100/80 px-2 py-1">
										<p className="text-xs truncate">{participant.name}</p>
									</div>
									{participant.isSpeaking && (
										<div className="absolute top-2 right-2">
											<div className="w-2 h-2 bg-success rounded-full animate-pulse" />
										</div>
									)}
								</div>
							))}
						</div>

						{/* Controls */}
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
							<button
								className={`btn btn-circle ${isVideoOn ? "btn-ghost" : "btn-error"}`}
								onClick={() => setIsVideoOn(!isVideoOn)}
							>
								<Video className="h-5 w-5" />
							</button>
							<button
								className={`btn btn-circle ${isAudioOn ? "btn-ghost" : "btn-error"}`}
								onClick={() => setIsAudioOn(!isAudioOn)}
							>
								<Phone className="h-5 w-5" />
							</button>
							<button className="btn btn-circle btn-ghost">
								<Settings className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="w-96 bg-base-100 border-l border-base-300 flex flex-col">
					{/* Tabs */}
					<div className="tabs tabs-boxed m-4">
						<button
							className={`tab ${activeTab === "chat" ? "tab-active" : ""}`}
							onClick={() => setActiveTab("chat")}
						>
							<MessageCircle className="h-4 w-4 mr-1" />
							Chat
						</button>
						<button
							className={`tab ${activeTab === "participants" ? "tab-active" : ""}`}
							onClick={() => setActiveTab("participants")}
						>
							<Users className="h-4 w-4 mr-1" />
							Participants
						</button>
						<button
							className={`tab ${activeTab === "activity" ? "tab-active" : ""}`}
							onClick={() => setActiveTab("activity")}
						>
							<Activity className="h-4 w-4 mr-1" />
							Activity
						</button>
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-hidden">
						{activeTab === "chat" && (
							<div className="flex flex-col h-full">
								{/* Messages */}
								<div className="flex-1 overflow-y-auto p-4 space-y-4">
									{messages.map((message) => (
										<div key={message.id} className="flex items-start gap-3">
											{message.sender.avatar ? (
												<img
													src={message.sender.avatar}
													alt={message.sender.name}
													className="w-8 h-8 rounded-full"
												/>
											) : (
												<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
													<span className="text-sm font-semibold">
														{message.sender.name.charAt(0)}
													</span>
												</div>
											)}
											<div className="flex-1">
												<div className="flex items-baseline gap-2 mb-1">
													<span className="font-medium text-sm">
														{message.sender.name}
													</span>
													<span className="text-xs text-base-content/60">
														{message.timestamp.toLocaleTimeString()}
													</span>
												</div>
												<p className="text-sm">{message.content}</p>
											</div>
										</div>
									))}
								</div>

								{/* Message Input */}
								<div className="p-4 border-t border-base-300">
									<div className="flex gap-2">
										<input
											type="text"
											className="input input-bordered flex-1"
											placeholder="Type a message..."
											value={newMessage}
											onChange={(e) => setNewMessage(e.target.value)}
											onKeyPress={(e) => e.key === "Enter" && sendMessage()}
										/>
										<button
											className="btn btn-primary btn-square"
											onClick={sendMessage}
										>
											<MessageCircle className="h-5 w-5" />
										</button>
									</div>
								</div>
							</div>
						)}

						{activeTab === "participants" && (
							<div className="p-4 space-y-4">
								{session.participants.map((participant) => (
									<div
										key={participant.id}
										className="flex items-center justify-between p-3 rounded-lg bg-base-200"
									>
										<div className="flex items-center gap-3">
											<div className="relative">
												{participant.avatar ? (
													<img
														src={participant.avatar}
														alt={participant.name}
														className="w-10 h-10 rounded-full"
													/>
												) : (
													<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
														<span className="text-lg font-semibold">
															{participant.name.charAt(0)}
														</span>
													</div>
												)}
												<div
													className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-200 ${getParticipantStatusColor(
														participant.status,
													)}`}
												/>
											</div>
											<div>
												<p className="font-medium">{participant.name}</p>
												<p className="text-xs text-base-content/60">
													{participant.role}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{participant.isSpeaking && (
												<span className="text-xs text-success">Speaking</span>
											)}
											<button className="btn btn-ghost btn-sm btn-square">
												<Settings className="h-4 w-4" />
											</button>
										</div>
									</div>
								))}
							</div>
						)}

						{activeTab === "activity" && (
							<div className="p-4 space-y-4">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
										<CheckCircle className="h-4 w-4 text-success" />
									</div>
									<div className="flex-1">
										<p className="text-sm">
											<span className="font-medium">Sarah Chen</span> started
											the session
										</p>
										<p className="text-xs text-base-content/60">
											30 minutes ago
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center">
										<Users className="h-4 w-4 text-info" />
									</div>
									<div className="flex-1">
										<p className="text-sm">
											<span className="font-medium">Mike Johnson</span> joined
										</p>
										<p className="text-xs text-base-content/60">
											25 minutes ago
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
										<Monitor className="h-4 w-4 text-primary" />
									</div>
									<div className="flex-1">
										<p className="text-sm">
											<span className="font-medium">Sarah Chen</span> shared
											screen
										</p>
										<p className="text-xs text-base-content/60">
											20 minutes ago
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}