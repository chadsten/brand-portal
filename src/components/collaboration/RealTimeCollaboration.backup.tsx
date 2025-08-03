"use client";

import {
	Avatar,
	Badge,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Divider,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Progress,
	Select,
	SelectItem,
	Switch,
	Tab,
	Tabs,
	Textarea,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import {
	Activity,
	AlertCircle,
	Archive,
	ArrowRight,
	Bell,
	Bookmark,
	Calendar,
	Check,
	CheckCircle,
	Clock,
	Copy,
	Download,
	Edit,
	Eye,
	Flag,
	Globe,
	Heart,
	Info,
	Link,
	Lock,
	MessageCircle,
	MessageSquare,
	Mic,
	MicOff,
	Monitor,
	MoreHorizontal,
	Mouse,
	Navigation,
	Paperclip,
	Phone,
	PhoneOff,
	Plus,
	RefreshCw,
	Send,
	Settings,
	Share2,
	Smile,
	ThumbsDown,
	ThumbsUp,
	Trash2,
	Unlock,
	Upload,
	User,
	Users,
	Video,
	VideoOff,
	Wifi,
	WifiOff,
	X,
	XCircle,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CollaborationSession {
	id: string;
	name: string;
	assetId?: string;
	assetName?: string;
	type: "review" | "edit" | "meeting" | "discussion";
	status: "active" | "scheduled" | "completed" | "cancelled";
	startTime: Date;
	endTime?: Date;
	duration?: number;
	participants: Participant[];
	host: Participant;
	permissions: {
		canEdit: boolean;
		canComment: boolean;
		canShare: boolean;
		canInvite: boolean;
		isPublic: boolean;
	};
	activity: CollaborationActivity[];
	comments: Comment[];
	annotations: Annotation[];
}

interface Participant {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "host" | "editor" | "reviewer" | "viewer";
	status: "online" | "offline" | "away" | "busy";
	joinTime?: Date;
	lastSeen?: Date;
	cursor?: {
		x: number;
		y: number;
		color: string;
	};
	isTyping?: boolean;
	permissions: {
		canEdit: boolean;
		canComment: boolean;
		canShare: boolean;
		canInvite: boolean;
	};
}

interface CollaborationActivity {
	id: string;
	type:
		| "join"
		| "leave"
		| "edit"
		| "comment"
		| "annotation"
		| "share"
		| "like"
		| "approve"
		| "reject";
	userId: string;
	userName: string;
	userAvatar?: string;
	timestamp: Date;
	description: string;
	metadata?: {
		assetId?: string;
		commentId?: string;
		annotationId?: string;
		changes?: string[];
	};
}

interface Comment {
	id: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	text: string;
	timestamp: Date;
	replies: Comment[];
	reactions: {
		emoji: string;
		count: number;
		users: string[];
	}[];
	position?: {
		x: number;
		y: number;
	};
	resolved: boolean;
	priority: "low" | "medium" | "high";
	tags: string[];
	attachments?: {
		id: string;
		name: string;
		type: string;
		url: string;
		size: number;
	}[];
}

interface Annotation {
	id: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	type: "highlight" | "note" | "arrow" | "shape" | "text";
	position: {
		x: number;
		y: number;
		width?: number;
		height?: number;
	};
	content: string;
	timestamp: Date;
	color: string;
	style?: {
		borderColor?: string;
		backgroundColor?: string;
		fontSize?: number;
		fontWeight?: string;
	};
}

interface RealTimeCollaborationProps {
	sessionId?: string;
	assetId?: string;
	userId?: string;
	onJoinSession?: (sessionId: string) => void;
	onLeaveSession?: (sessionId: string) => void;
	onCreateSession?: (session: Partial<CollaborationSession>) => void;
	onInviteUser?: (sessionId: string, email: string) => void;
	onUpdatePermissions?: (sessionId: string, permissions: any) => void;
}

const MOCK_SESSIONS: CollaborationSession[] = [
	{
		id: "1",
		name: "Brand Logo Review",
		assetId: "asset-123",
		assetName: "Primary Logo Design",
		type: "review",
		status: "active",
		startTime: new Date(Date.now() - 45 * 60 * 1000),
		participants: [
			{
				id: "1",
				name: "Sarah Chen",
				email: "sarah@company.com",
				avatar: "/avatars/sarah.jpg",
				role: "host",
				status: "online",
				joinTime: new Date(Date.now() - 45 * 60 * 1000),
				cursor: { x: 250, y: 150, color: "#3b82f6" },
				permissions: {
					canEdit: true,
					canComment: true,
					canShare: true,
					canInvite: true,
				},
			},
			{
				id: "2",
				name: "Mike Johnson",
				email: "mike@company.com",
				avatar: "/avatars/mike.jpg",
				role: "editor",
				status: "online",
				joinTime: new Date(Date.now() - 30 * 60 * 1000),
				cursor: { x: 180, y: 220, color: "#10b981" },
				isTyping: true,
				permissions: {
					canEdit: true,
					canComment: true,
					canShare: false,
					canInvite: false,
				},
			},
			{
				id: "3",
				name: "Alex Rivera",
				email: "alex@company.com",
				avatar: "/avatars/alex.jpg",
				role: "reviewer",
				status: "online",
				joinTime: new Date(Date.now() - 20 * 60 * 1000),
				permissions: {
					canEdit: false,
					canComment: true,
					canShare: false,
					canInvite: false,
				},
			},
		],
		host: {
			id: "1",
			name: "Sarah Chen",
			email: "sarah@company.com",
			avatar: "/avatars/sarah.jpg",
			role: "host",
			status: "online",
			permissions: {
				canEdit: true,
				canComment: true,
				canShare: true,
				canInvite: true,
			},
		},
		permissions: {
			canEdit: true,
			canComment: true,
			canShare: true,
			canInvite: true,
			isPublic: false,
		},
		activity: [
			{
				id: "1",
				type: "join",
				userId: "1",
				userName: "Sarah Chen",
				userAvatar: "/avatars/sarah.jpg",
				timestamp: new Date(Date.now() - 45 * 60 * 1000),
				description: "started the collaboration session",
			},
			{
				id: "2",
				type: "join",
				userId: "2",
				userName: "Mike Johnson",
				userAvatar: "/avatars/mike.jpg",
				timestamp: new Date(Date.now() - 30 * 60 * 1000),
				description: "joined the session",
			},
			{
				id: "3",
				type: "comment",
				userId: "2",
				userName: "Mike Johnson",
				userAvatar: "/avatars/mike.jpg",
				timestamp: new Date(Date.now() - 25 * 60 * 1000),
				description: "added a comment about the logo colors",
				metadata: { commentId: "comment-1" },
			},
			{
				id: "4",
				type: "annotation",
				userId: "1",
				userName: "Sarah Chen",
				userAvatar: "/avatars/sarah.jpg",
				timestamp: new Date(Date.now() - 20 * 60 * 1000),
				description: "highlighted the brand typography",
				metadata: { annotationId: "annotation-1" },
			},
			{
				id: "5",
				type: "join",
				userId: "3",
				userName: "Alex Rivera",
				userAvatar: "/avatars/alex.jpg",
				timestamp: new Date(Date.now() - 20 * 60 * 1000),
				description: "joined the session",
			},
		],
		comments: [
			{
				id: "1",
				userId: "2",
				userName: "Mike Johnson",
				userAvatar: "/avatars/mike.jpg",
				text: "I think the blue color needs to be adjusted to match our brand guidelines. What do you think?",
				timestamp: new Date(Date.now() - 25 * 60 * 1000),
				replies: [
					{
						id: "1-1",
						userId: "1",
						userName: "Sarah Chen",
						userAvatar: "/avatars/sarah.jpg",
						text: "Good catch! I'll adjust the hex value to match our primary blue.",
						timestamp: new Date(Date.now() - 20 * 60 * 1000),
						replies: [],
						reactions: [{ emoji: "👍", count: 2, users: ["3", "2"] }],
						resolved: false,
						priority: "medium",
						tags: ["color", "brand"],
					},
				],
				reactions: [
					{ emoji: "👍", count: 1, users: ["1"] },
					{ emoji: "🎯", count: 1, users: ["3"] },
				],
				position: { x: 200, y: 180 },
				resolved: false,
				priority: "high",
				tags: ["color", "brand", "guidelines"],
			},
			{
				id: "2",
				userId: "3",
				userName: "Alex Rivera",
				userAvatar: "/avatars/alex.jpg",
				text: "The typography looks great! Really clean and professional.",
				timestamp: new Date(Date.now() - 15 * 60 * 1000),
				replies: [],
				reactions: [{ emoji: "❤️", count: 2, users: ["1", "2"] }],
				resolved: true,
				priority: "low",
				tags: ["typography", "approved"],
			},
		],
		annotations: [
			{
				id: "1",
				userId: "1",
				userName: "Sarah Chen",
				userAvatar: "/avatars/sarah.jpg",
				type: "highlight",
				position: { x: 150, y: 100, width: 120, height: 40 },
				content: "Brand Typography",
				timestamp: new Date(Date.now() - 20 * 60 * 1000),
				color: "#fbbf24",
				style: { backgroundColor: "#fef3c7", borderColor: "#fbbf24" },
			},
			{
				id: "2",
				userId: "2",
				userName: "Mike Johnson",
				userAvatar: "/avatars/mike.jpg",
				type: "arrow",
				position: { x: 180, y: 200, width: 50, height: 30 },
				content: "Color adjustment needed",
				timestamp: new Date(Date.now() - 15 * 60 * 1000),
				color: "#ef4444",
				style: { borderColor: "#ef4444" },
			},
		],
	},
	{
		id: "2",
		name: "Marketing Campaign Assets",
		type: "meeting",
		status: "scheduled",
		startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
		participants: [
			{
				id: "1",
				name: "Sarah Chen",
				email: "sarah@company.com",
				role: "host",
				status: "offline",
				permissions: {
					canEdit: true,
					canComment: true,
					canShare: true,
					canInvite: true,
				},
			},
			{
				id: "4",
				name: "Emma Wilson",
				email: "emma@company.com",
				role: "editor",
				status: "offline",
				permissions: {
					canEdit: true,
					canComment: true,
					canShare: true,
					canInvite: false,
				},
			},
		],
		host: {
			id: "1",
			name: "Sarah Chen",
			email: "sarah@company.com",
			role: "host",
			status: "offline",
			permissions: {
				canEdit: true,
				canComment: true,
				canShare: true,
				canInvite: true,
			},
		},
		permissions: {
			canEdit: true,
			canComment: true,
			canShare: true,
			canInvite: true,
			isPublic: false,
		},
		activity: [],
		comments: [],
		annotations: [],
	},
];

const COLLABORATION_TYPES = [
	{
		value: "review",
		label: "Review Session",
		icon: <Eye size={16} />,
		color: "primary",
	},
	{
		value: "edit",
		label: "Edit Session",
		icon: <Edit size={16} />,
		color: "warning",
	},
	{
		value: "meeting",
		label: "Meeting",
		icon: <Video size={16} />,
		color: "success",
	},
	{
		value: "discussion",
		label: "Discussion",
		icon: <MessageSquare size={16} />,
		color: "secondary",
	},
];

const USER_ROLES = [
	{
		value: "host",
		label: "Host",
		permissions: {
			canEdit: true,
			canComment: true,
			canShare: true,
			canInvite: true,
		},
	},
	{
		value: "editor",
		label: "Editor",
		permissions: {
			canEdit: true,
			canComment: true,
			canShare: true,
			canInvite: false,
		},
	},
	{
		value: "reviewer",
		label: "Reviewer",
		permissions: {
			canEdit: false,
			canComment: true,
			canShare: false,
			canInvite: false,
		},
	},
	{
		value: "viewer",
		label: "Viewer",
		permissions: {
			canEdit: false,
			canComment: false,
			canShare: false,
			canInvite: false,
		},
	},
];

const EMOJI_REACTIONS = ["👍", "👎", "❤️", "🎯", "💡", "🔥", "👀", "✨"];

export function RealTimeCollaboration({
	sessionId,
	assetId,
	userId = "1",
	onJoinSession,
	onLeaveSession,
	onCreateSession,
	onInviteUser,
	onUpdatePermissions,
}: RealTimeCollaborationProps) {
	const [sessions, setSessions] =
		useState<CollaborationSession[]>(MOCK_SESSIONS);
	const [currentSession, setCurrentSession] =
		useState<CollaborationSession | null>(
			sessionId ? sessions.find((s) => s.id === sessionId) || null : null,
		);
	const [selectedTab, setSelectedTab] = useState("active");
	const [newComment, setNewComment] = useState("");
	const [newSession, setNewSession] = useState<Partial<CollaborationSession>>({
		name: "",
		type: "review",
		permissions: {
			canEdit: true,
			canComment: true,
			canShare: true,
			canInvite: true,
			isPublic: false,
		},
	});
	const [inviteEmail, setInviteEmail] = useState("");
	const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "connecting" | "disconnected"
	>("connected");
	const [isRecording, setIsRecording] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOff, setIsVideoOff] = useState(false);
	const [isScreenSharing, setIsScreenSharing] = useState(false);

	const {
		isOpen: isCreateModalOpen,
		onOpen: onCreateModalOpen,
		onClose: onCreateModalClose,
	} = useDisclosure();

	const {
		isOpen: isInviteModalOpen,
		onOpen: onInviteModalOpen,
		onClose: onInviteModalClose,
	} = useDisclosure();

	const {
		isOpen: isCommentModalOpen,
		onOpen: onCommentModalOpen,
		onClose: onCommentModalClose,
	} = useDisclosure();

	const {
		isOpen: isSettingsModalOpen,
		onOpen: onSettingsModalOpen,
		onClose: onSettingsModalClose,
	} = useDisclosure();

	// Simulate real-time connection status
	useEffect(() => {
		const interval = setInterval(() => {
			if (Math.random() < 0.05) {
				setConnectionStatus("connecting");
				setTimeout(() => setConnectionStatus("connected"), 1000);
			}
		}, 10000);

		return () => clearInterval(interval);
	}, []);

	const handleJoinSession = (session: CollaborationSession) => {
		setCurrentSession(session);
		onJoinSession?.(session.id);
	};

	const handleLeaveSession = () => {
		if (currentSession) {
			onLeaveSession?.(currentSession.id);
			setCurrentSession(null);
		}
	};

	const handleCreateSession = () => {
		const session: CollaborationSession = {
			id: Date.now().toString(),
			name: newSession.name!,
			type: newSession.type!,
			status: "active",
			startTime: new Date(),
			participants: [
				{
					id: userId,
					name: "Current User",
					email: "user@company.com",
					role: "host",
					status: "online",
					joinTime: new Date(),
					permissions: {
						canEdit: true,
						canComment: true,
						canShare: true,
						canInvite: true,
					},
				},
			],
			host: {
				id: userId,
				name: "Current User",
				email: "user@company.com",
				role: "host",
				status: "online",
				permissions: {
					canEdit: true,
					canComment: true,
					canShare: true,
					canInvite: true,
				},
			},
			permissions: newSession.permissions!,
			activity: [],
			comments: [],
			annotations: [],
		};

		setSessions([...sessions, session]);
		setCurrentSession(session);
		onCreateSession?.(session);
		onCreateModalClose();
		setNewSession({
			name: "",
			type: "review",
			permissions: {
				canEdit: true,
				canComment: true,
				canShare: true,
				canInvite: true,
				isPublic: false,
			},
		});
	};

	const handleAddComment = () => {
		if (!currentSession || !newComment.trim()) return;

		const comment: Comment = {
			id: Date.now().toString(),
			userId,
			userName: "Current User",
			text: newComment,
			timestamp: new Date(),
			replies: [],
			reactions: [],
			resolved: false,
			priority: "medium",
			tags: [],
		};

		const updatedSession = {
			...currentSession,
			comments: [...currentSession.comments, comment],
		};

		setCurrentSession(updatedSession);
		setSessions(
			sessions.map((s) => (s.id === currentSession.id ? updatedSession : s)),
		);
		setNewComment("");
	};

	const handleInviteUser = () => {
		if (!currentSession || !inviteEmail.trim()) return;

		onInviteUser?.(currentSession.id, inviteEmail);
		setInviteEmail("");
		onInviteModalClose();
	};

	const handleReaction = (commentId: string, emoji: string) => {
		if (!currentSession) return;

		const updatedComments = currentSession.comments.map((comment) => {
			if (comment.id === commentId) {
				const existingReaction = comment.reactions.find(
					(r) => r.emoji === emoji,
				);
				if (existingReaction) {
					if (existingReaction.users.includes(userId)) {
						existingReaction.count--;
						existingReaction.users = existingReaction.users.filter(
							(u) => u !== userId,
						);
					} else {
						existingReaction.count++;
						existingReaction.users.push(userId);
					}
				} else {
					comment.reactions.push({ emoji, count: 1, users: [userId] });
				}
			}
			return comment;
		});

		const updatedSession = { ...currentSession, comments: updatedComments };
		setCurrentSession(updatedSession);
		setSessions(
			sessions.map((s) => (s.id === currentSession.id ? updatedSession : s)),
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "online":
				return "success";
			case "offline":
				return "default";
			case "away":
				return "warning";
			case "busy":
				return "danger";
			default:
				return "default";
		}
	};

	const getConnectionStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "success";
			case "connecting":
				return "warning";
			case "disconnected":
				return "danger";
			default:
				return "default";
		}
	};

	const formatDuration = (startTime: Date, endTime?: Date) => {
		const end = endTime || new Date();
		const diff = end.getTime() - startTime.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		}
		return `${minutes}m`;
	};

	const renderSessionCard = (session: CollaborationSession) => (
		<Card
			key={session.id}
			className={`cursor-pointer transition-all hover:shadow-lg ${
				currentSession?.id === session.id ? "ring-2 ring-primary" : ""
			}`}
			onPress={() => handleJoinSession(session)}
		>
			<CardHeader className="pb-2">
				<div className="flex w-full items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="relative">
							{COLLABORATION_TYPES.find((t) => t.value === session.type)?.icon}
							<Badge
								color={session.status === "active" ? "success" : "default"}
								size="sm"
								className="-top-1 -right-1 absolute"
							>
								{session.status}
							</Badge>
						</div>
						<div>
							<h4 className="font-semibold">{session.name}</h4>
							<p className="text-default-500 text-small">
								{session.assetName || `${session.type} session`}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="-space-x-2 flex">
							{session.participants.slice(0, 3).map((participant) => (
								<Avatar
									key={participant.id}
									src={participant.avatar}
									name={participant.name}
									size="sm"
									className="border-2 border-background"
								/>
							))}
							{session.participants.length > 3 && (
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-default-200 text-small">
									+{session.participants.length - 3}
								</div>
							)}
						</div>
					</div>
				</div>
			</CardHeader>
			<CardBody className="pt-0">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Clock size={14} className="text-default-400" />
							<span className="text-default-500 text-small">
								{session.status === "active"
									? `Active for ${formatDuration(session.startTime)}`
									: `Scheduled for ${session.startTime.toLocaleString()}`}
							</span>
						</div>
						<Badge size="sm" variant="flat">
							{session.participants.length} participant
							{session.participants.length !== 1 ? "s" : ""}
						</Badge>
					</div>

					{session.status === "active" && (
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1">
								<div className="h-2 w-2 animate-pulse rounded-full bg-success" />
								<span className="text-small text-success">Live</span>
							</div>
							<div className="flex items-center gap-1">
								<MessageSquare size={14} className="text-default-400" />
								<span className="text-default-500 text-small">
									{session.comments.length} comment
									{session.comments.length !== 1 ? "s" : ""}
								</span>
							</div>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);

	const renderSessionInterface = () => {
		if (!currentSession) return null;

		return (
			<div className="space-y-6">
				{/* Session Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="flat"
							size="sm"
							onPress={handleLeaveSession}
							startContent={<ArrowRight size={16} className="rotate-180" />}
						>
							Leave Session
						</Button>
						<div>
							<h3 className="font-semibold text-lg">{currentSession.name}</h3>
							<p className="text-default-500 text-small">
								{currentSession.assetName &&
									`Working on: ${currentSession.assetName}`}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							{connectionStatus === "connected" ? (
								<Wifi size={16} className="text-success" />
							) : connectionStatus === "connecting" ? (
								<RefreshCw size={16} className="animate-spin text-warning" />
							) : (
								<WifiOff size={16} className="text-danger" />
							)}
							<span className="text-default-500 text-small capitalize">
								{connectionStatus}
							</span>
						</div>
						<Button
							variant="flat"
							size="sm"
							onPress={onInviteModalOpen}
							startContent={<Plus size={16} />}
						>
							Invite
						</Button>
						<Button
							variant="flat"
							size="sm"
							onPress={onSettingsModalOpen}
							isIconOnly
						>
							<Settings size={16} />
						</Button>
					</div>
				</div>

				{/* Participants Bar */}
				<Card>
					<CardBody className="py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<Users size={16} className="text-default-400" />
									<span className="font-medium text-small">
										{currentSession.participants.length} participant
										{currentSession.participants.length !== 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex items-center gap-2">
									{currentSession.participants.map((participant) => (
										<Tooltip
											key={participant.id}
											content={`${participant.name} (${participant.role})`}
										>
											<div className="relative">
												<Avatar
													src={participant.avatar}
													name={participant.name}
													size="sm"
												/>
												<Badge
													color={getStatusColor(participant.status)}
													size="sm"
													className="-bottom-1 -right-1 absolute"
												>
													{participant.status}
												</Badge>
												{participant.isTyping && (
													<div className="-top-1 -right-1 absolute h-3 w-3 animate-pulse rounded-full bg-primary" />
												)}
											</div>
										</Tooltip>
									))}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{currentSession.type === "meeting" && (
									<>
										<Button
											variant="flat"
											size="sm"
											color={isMuted ? "danger" : "default"}
											isIconOnly
											onPress={() => setIsMuted(!isMuted)}
										>
											{isMuted ? <MicOff size={16} /> : <Mic size={16} />}
										</Button>
										<Button
											variant="flat"
											size="sm"
											color={isVideoOff ? "danger" : "default"}
											isIconOnly
											onPress={() => setIsVideoOff(!isVideoOff)}
										>
											{isVideoOff ? (
												<VideoOff size={16} />
											) : (
												<Video size={16} />
											)}
										</Button>
										<Button
											variant="flat"
											size="sm"
											color={isScreenSharing ? "primary" : "default"}
											isIconOnly
											onPress={() => setIsScreenSharing(!isScreenSharing)}
										>
											<Monitor size={16} />
										</Button>
									</>
								)}
								<Button
									variant="flat"
									size="sm"
									color={isRecording ? "danger" : "default"}
									startContent={
										isRecording ? (
											<Activity size={16} />
										) : (
											<RefreshCw size={16} />
										)
									}
									onPress={() => setIsRecording(!isRecording)}
								>
									{isRecording ? "Recording..." : "Record"}
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Main Content */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Asset Preview / Workspace */}
					<div className="lg:col-span-2">
						<Card className="h-96">
							<CardBody className="relative">
								<div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-secondary-50">
									<div className="text-center">
										<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100">
											<Eye size={24} className="text-primary" />
										</div>
										<h4 className="mb-2 font-semibold">Asset Preview</h4>
										<p className="text-default-500 text-small">
											{currentSession.assetName || "Collaboration workspace"}
										</p>
									</div>
								</div>

								{/* Cursors */}
								{currentSession.participants.map(
									(participant) =>
										participant.cursor && (
											<div
												key={participant.id}
												className="pointer-events-none absolute"
												style={{
													left: participant.cursor.x,
													top: participant.cursor.y,
													color: participant.cursor.color,
												}}
											>
												<Navigation size={16} />
												<span className="ml-2 rounded bg-background px-1 py-0.5 text-xs shadow-md">
													{participant.name}
												</span>
											</div>
										),
								)}

								{/* Annotations */}
								{currentSession.annotations.map((annotation) => (
									<div
										key={annotation.id}
										className="pointer-events-none absolute"
										style={{
											left: annotation.position.x,
											top: annotation.position.y,
											width: annotation.position.width,
											height: annotation.position.height,
											backgroundColor: annotation.style?.backgroundColor,
											border: `2px solid ${annotation.style?.borderColor}`,
											borderRadius: "4px",
										}}
									>
										<div className="-top-6 absolute left-0 rounded bg-background px-2 py-1 text-xs shadow-md">
											{annotation.content}
										</div>
									</div>
								))}
							</CardBody>
						</Card>
					</div>

					{/* Comments and Activity */}
					<div className="space-y-6">
						<Card>
							<CardHeader className="pb-2">
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquare size={16} className="text-primary" />
										<h4 className="font-semibold">Comments</h4>
									</div>
									<Badge size="sm" variant="flat">
										{currentSession.comments.length}
									</Badge>
								</div>
							</CardHeader>
							<CardBody>
								<div className="space-y-4">
									{/* New Comment */}
									<div className="flex items-start gap-2">
										<Avatar name="You" size="sm" />
										<div className="flex-1">
											<Textarea
												placeholder="Add a comment..."
												value={newComment}
												onValueChange={setNewComment}
												minRows={2}
												size="sm"
											/>
											<div className="mt-2 flex items-center justify-between">
												<div className="flex items-center gap-1">
													<Button variant="flat" size="sm" isIconOnly>
														<Paperclip size={14} />
													</Button>
													<Button variant="flat" size="sm" isIconOnly>
														<Smile size={14} />
													</Button>
												</div>
												<Button
													size="sm"
													color="primary"
													onPress={handleAddComment}
													isDisabled={!newComment.trim()}
													startContent={<Send size={14} />}
												>
													Comment
												</Button>
											</div>
										</div>
									</div>

									<Divider />

									{/* Existing Comments */}
									<div className="max-h-64 space-y-4 overflow-y-auto">
										{currentSession.comments.map((comment) => (
											<div key={comment.id} className="space-y-2">
												<div className="flex items-start gap-2">
													<Avatar
														src={comment.userAvatar}
														name={comment.userName}
														size="sm"
													/>
													<div className="flex-1">
														<div className="mb-1 flex items-center gap-2">
															<span className="font-medium text-small">
																{comment.userName}
															</span>
															<span className="text-default-400 text-tiny">
																{comment.timestamp.toLocaleTimeString()}
															</span>
															{comment.priority === "high" && (
																<Badge color="danger" size="sm">
																	Priority
																</Badge>
															)}
															{comment.resolved && (
																<Badge color="success" size="sm">
																	Resolved
																</Badge>
															)}
														</div>
														<p className="text-default-700 text-small">
															{comment.text}
														</p>

														{/* Reactions */}
														<div className="mt-2 flex items-center gap-2">
															<div className="flex items-center gap-1">
																{EMOJI_REACTIONS.map((emoji) => (
																	<Button
																		key={emoji}
																		variant="flat"
																		size="sm"
																		className="h-6 min-w-8 p-0"
																		onPress={() =>
																			handleReaction(comment.id, emoji)
																		}
																	>
																		{emoji}
																	</Button>
																))}
															</div>
														</div>

														{/* Existing Reactions */}
														{comment.reactions.length > 0 && (
															<div className="mt-2 flex items-center gap-1">
																{comment.reactions.map((reaction, idx) => (
																	<button
																		key={idx}
																		onClick={() =>
																			handleReaction(comment.id, reaction.emoji)
																		}
																		className="cursor-pointer"
																	>
																		<Chip size="sm" variant="flat">
																			{reaction.emoji} {reaction.count}
																		</Chip>
																	</button>
																))}
															</div>
														)}
													</div>
												</div>

												{/* Replies */}
												{comment.replies.map((reply) => (
													<div
														key={reply.id}
														className="ml-8 flex items-start gap-2"
													>
														<Avatar
															src={reply.userAvatar}
															name={reply.userName}
															size="sm"
														/>
														<div className="flex-1">
															<div className="mb-1 flex items-center gap-2">
																<span className="font-medium text-small">
																	{reply.userName}
																</span>
																<span className="text-default-400 text-tiny">
																	{reply.timestamp.toLocaleTimeString()}
																</span>
															</div>
															<p className="text-default-700 text-small">
																{reply.text}
															</p>
														</div>
													</div>
												))}
											</div>
										))}
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Activity Feed */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2">
									<Activity size={16} className="text-secondary" />
									<h4 className="font-semibold">Activity</h4>
								</div>
							</CardHeader>
							<CardBody>
								<div className="max-h-32 space-y-3 overflow-y-auto">
									{currentSession.activity.slice(-5).map((activity) => (
										<div key={activity.id} className="flex items-start gap-2">
											<Avatar
												src={activity.userAvatar}
												name={activity.userName}
												size="sm"
											/>
											<div className="flex-1">
												<p className="text-small">
													<span className="font-medium">
														{activity.userName}
													</span>
													<span className="text-default-500">
														{" "}
														{activity.description}
													</span>
												</p>
												<span className="text-default-400 text-tiny">
													{activity.timestamp.toLocaleTimeString()}
												</span>
											</div>
										</div>
									))}
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			</div>
		);
	};

	const renderCreateSessionModal = () => (
		<Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="2xl">
			<ModalContent>
				<ModalHeader>
					<h3 className="font-semibold text-lg">
						Create Collaboration Session
					</h3>
				</ModalHeader>
				<ModalBody>
					<div className="space-y-4">
						<Input
							label="Session Name"
							placeholder="Enter session name"
							value={newSession.name}
							onValueChange={(value) =>
								setNewSession({ ...newSession, name: value })
							}
						/>
						<Select
							label="Session Type"
							selectedKeys={[newSession.type!]}
							onSelectionChange={(keys) =>
								setNewSession({
									...newSession,
									type: Array.from(keys)[0] as any,
								})
							}
						>
							{COLLABORATION_TYPES.map((type) => (
								<SelectItem key={type.value} textValue={type.label}>
									<div className="flex items-center gap-2">
										{type.icon}
										<span>{type.label}</span>
									</div>
								</SelectItem>
							))}
						</Select>
						<div className="space-y-2">
							<h4 className="font-medium text-small">Permissions</h4>
							<div className="space-y-2">
								<Switch
									isSelected={newSession.permissions?.canEdit}
									onValueChange={(selected) =>
										setNewSession({
											...newSession,
											permissions: {
												...newSession.permissions!,
												canEdit: selected,
											},
										})
									}
								>
									Allow editing
								</Switch>
								<Switch
									isSelected={newSession.permissions?.canComment}
									onValueChange={(selected) =>
										setNewSession({
											...newSession,
											permissions: {
												...newSession.permissions!,
												canComment: selected,
											},
										})
									}
								>
									Allow comments
								</Switch>
								<Switch
									isSelected={newSession.permissions?.canShare}
									onValueChange={(selected) =>
										setNewSession({
											...newSession,
											permissions: {
												...newSession.permissions!,
												canShare: selected,
											},
										})
									}
								>
									Allow sharing
								</Switch>
								<Switch
									isSelected={newSession.permissions?.isPublic}
									onValueChange={(selected) =>
										setNewSession({
											...newSession,
											permissions: {
												...newSession.permissions!,
												isPublic: selected,
											},
										})
									}
								>
									Make session public
								</Switch>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onCreateModalClose}>
						Cancel
					</Button>
					<Button
						color="primary"
						onPress={handleCreateSession}
						isDisabled={!newSession.name}
					>
						Create Session
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);

	const renderInviteModal = () => (
		<Modal isOpen={isInviteModalOpen} onClose={onInviteModalClose}>
			<ModalContent>
				<ModalHeader>
					<h3 className="font-semibold text-lg">Invite Collaborators</h3>
				</ModalHeader>
				<ModalBody>
					<div className="space-y-4">
						<Input
							label="Email Address"
							placeholder="Enter email address"
							value={inviteEmail}
							onValueChange={setInviteEmail}
							type="email"
						/>
						<Select
							label="Role"
							placeholder="Select role"
							defaultSelectedKeys={["reviewer"]}
						>
							{USER_ROLES.map((role) => (
								<SelectItem key={role.value} textValue={role.label}>
									{role.label}
								</SelectItem>
							))}
						</Select>
						<div className="rounded-lg bg-default-50 p-3">
							<p className="text-default-600 text-small">
								Invited users will receive an email with a link to join this
								collaboration session.
							</p>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onInviteModalClose}>
						Cancel
					</Button>
					<Button
						color="primary"
						onPress={handleInviteUser}
						isDisabled={!inviteEmail.trim()}
					>
						Send Invitation
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);

	return (
		<div className="space-y-6">
			{currentSession ? (
				renderSessionInterface()
			) : (
				<>
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h2 className="flex items-center gap-2 font-semibold text-xl">
								<Users size={24} className="text-primary" />
								Real-Time Collaboration
							</h2>
							<p className="text-default-500 text-small">
								Collaborate with your team in real-time on assets and projects
							</p>
						</div>
						<Button
							color="primary"
							onPress={onCreateModalOpen}
							startContent={<Plus size={16} />}
						>
							New Session
						</Button>
					</div>

					{/* Connection Status */}
					<Card>
						<CardBody className="py-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2">
										<Badge color={getConnectionStatusColor()} variant="flat">
											{connectionStatus}
										</Badge>
										<span className="text-default-500 text-small">
											Real-time collaboration is {connectionStatus}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-default-500 text-small">
										{sessions.filter((s) => s.status === "active").length}{" "}
										active session
										{sessions.filter((s) => s.status === "active").length !== 1
											? "s"
											: ""}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Sessions */}
					<Tabs
						selectedKey={selectedTab}
						onSelectionChange={(key) => setSelectedTab(key as string)}
						className="w-full"
					>
						<Tab key="active" title="Active Sessions">
							<div className="space-y-4 pt-4">
								{sessions.filter((s) => s.status === "active").length === 0 ? (
									<Card>
										<CardBody className="py-12 text-center">
											<Users
												size={48}
												className="mx-auto mb-4 text-default-300"
											/>
											<h3 className="mb-2 font-semibold text-lg">
												No Active Sessions
											</h3>
											<p className="mb-4 text-default-500">
												Start a new collaboration session to work with your team
											</p>
											<Button
												color="primary"
												onPress={onCreateModalOpen}
												startContent={<Plus size={16} />}
											>
												Create Session
											</Button>
										</CardBody>
									</Card>
								) : (
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{sessions
											.filter((s) => s.status === "active")
											.map(renderSessionCard)}
									</div>
								)}
							</div>
						</Tab>

						<Tab key="scheduled" title="Scheduled Sessions">
							<div className="space-y-4 pt-4">
								{sessions.filter((s) => s.status === "scheduled").length ===
								0 ? (
									<Card>
										<CardBody className="py-12 text-center">
											<Calendar
												size={48}
												className="mx-auto mb-4 text-default-300"
											/>
											<h3 className="mb-2 font-semibold text-lg">
												No Scheduled Sessions
											</h3>
											<p className="text-default-500">
												Schedule collaboration sessions for future work
											</p>
										</CardBody>
									</Card>
								) : (
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{sessions
											.filter((s) => s.status === "scheduled")
											.map(renderSessionCard)}
									</div>
								)}
							</div>
						</Tab>

						<Tab key="history" title="Session History">
							<div className="space-y-4 pt-4">
								<Card>
									<CardBody className="py-12 text-center">
										<Clock
											size={48}
											className="mx-auto mb-4 text-default-300"
										/>
										<h3 className="mb-2 font-semibold text-lg">
											Session History
										</h3>
										<p className="text-default-500">
											View and manage previous collaboration sessions
										</p>
									</CardBody>
								</Card>
							</div>
						</Tab>
					</Tabs>
				</>
			)}

			{/* Modals */}
			{renderCreateSessionModal()}
			{renderInviteModal()}
		</div>
	);
}
