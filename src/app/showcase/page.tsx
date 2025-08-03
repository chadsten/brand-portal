"use client";

import type { ChipProps } from "@heroui/react";
import {
	Avatar,
	AvatarGroup,
	Badge,
	BreadcrumbItem,
	Breadcrumbs,
	Button,
	ButtonGroup,
	Card,
	CardBody,
	CardHeader,
	Checkbox,
	CheckboxGroup,
	Chip,
	Code,
	Divider,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Pagination,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Progress,
	Radio,
	RadioGroup,
	Select,
	SelectItem,
	Skeleton,
	Slider,
	Spinner,
	Switch,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tabs,
	Textarea,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import {
	AlertCircle,
	Archive,
	Bell,
	Check,
	CheckCircle,
	ChevronRight,
	Clock,
	Copy,
	Download,
	Edit,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	Heart,
	Home,
	Image,
	Info,
	MoreVertical,
	Music,
	Plus,
	Search,
	Settings,
	Share,
	Star,
	Trash,
	TrendingDown,
	TrendingUp,
	User,
	Video,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";

const colorVariants: ChipProps["color"][] = [
	"default",
	"primary",
	"secondary",
	"success",
	"warning",
	"danger",
];
const sizeVariants = ["sm", "md", "lg"] as const;
const radiusVariants = ["none", "sm", "md", "lg", "full"] as const;

export default function ShowcasePage() {
	const [selectedTab, setSelectedTab] = useState("buttons");
	const [switchValue, setSwitchValue] = useState(true);
	const [sliderValue, setSliderValue] = useState(50);
	const [selectedRadio, setSelectedRadio] = useState("option1");
	const [selectedCheckboxes, setSelectedCheckboxes] = useState(["option1"]);
	const [currentPage, setCurrentPage] = useState(1);
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	const tableData = [
		{
			id: 1,
			name: "Brand Logo.svg",
			type: "Vector",
			size: "245 KB",
			status: "active",
		},
		{
			id: 2,
			name: "Hero Image.jpg",
			type: "Image",
			size: "1.2 MB",
			status: "inactive",
		},
		{
			id: 3,
			name: "Product Video.mp4",
			type: "Video",
			size: "15.8 MB",
			status: "active",
		},
	];

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="font-bold text-3xl">Component Showcase</h1>
					<p className="mt-1 text-default-500">
						A comprehensive demonstration of all UI components used in the Brand
						Portal.
					</p>
				</div>

				{/* Component Categories */}
				<Card>
					<CardBody className="p-0">
						<Tabs
							selectedKey={selectedTab}
							onSelectionChange={(key) => setSelectedTab(key as string)}
							className="w-full"
						>
							{/* Buttons & Actions */}
							<Tab key="buttons" title="Buttons & Actions">
								<div className="space-y-8 p-6">
									{/* Buttons */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Buttons</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-default-500 text-small">
													Solid Variants
												</p>
												<div className="flex flex-wrap gap-3">
													{colorVariants.map((color) => (
														<Button key={color} color={color}>
															{color}
														</Button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Flat Variants
												</p>
												<div className="flex flex-wrap gap-3">
													{colorVariants.map((color) => (
														<Button key={color} color={color} variant="flat">
															{color}
														</Button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Bordered Variants
												</p>
												<div className="flex flex-wrap gap-3">
													{colorVariants.map((color) => (
														<Button
															key={color}
															color={color}
															variant="bordered"
														>
															{color}
														</Button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													With Icons
												</p>
												<div className="flex flex-wrap gap-3">
													<Button
														color="primary"
														startContent={<Plus size={16} />}
													>
														Add New
													</Button>
													<Button
														color="success"
														endContent={<Download size={16} />}
													>
														Download
													</Button>
													<Button
														color="danger"
														startContent={<Trash size={16} />}
													>
														Delete
													</Button>
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Sizes
												</p>
												<div className="flex items-end gap-3">
													{sizeVariants.map((size) => (
														<Button key={size} size={size}>
															Size {size}
														</Button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Loading & Disabled
												</p>
												<div className="flex gap-3">
													<Button color="primary" isLoading>
														Loading
													</Button>
													<Button color="primary" isDisabled>
														Disabled
													</Button>
												</div>
											</div>
										</div>
									</div>

									<Divider />

									{/* Button Groups */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Button Groups
										</h3>
										<div className="space-y-4">
											<ButtonGroup>
												<Button>One</Button>
												<Button>Two</Button>
												<Button>Three</Button>
											</ButtonGroup>
											<ButtonGroup variant="flat">
												<Button>Day</Button>
												<Button>Week</Button>
												<Button>Month</Button>
												<Button>Year</Button>
											</ButtonGroup>
										</div>
									</div>

									<Divider />

									{/* Dropdowns */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Dropdowns</h3>
										<div className="flex gap-3">
											<Dropdown>
												<DropdownTrigger>
													<Button
														variant="flat"
														endContent={<ChevronRight size={16} />}
													>
														Actions
													</Button>
												</DropdownTrigger>
												<DropdownMenu aria-label="Actions menu">
													<DropdownItem
														key="view"
														startContent={<Eye size={16} />}
													>
														View
													</DropdownItem>
													<DropdownItem
														key="edit"
														startContent={<Edit size={16} />}
													>
														Edit
													</DropdownItem>
													<DropdownItem
														key="share"
														startContent={<Share size={16} />}
													>
														Share
													</DropdownItem>
													<DropdownItem
														key="delete"
														startContent={<Trash size={16} />}
														color="danger"
													>
														Delete
													</DropdownItem>
												</DropdownMenu>
											</Dropdown>

											<Dropdown>
												<DropdownTrigger>
													<Button isIconOnly variant="flat">
														<MoreVertical size={16} />
													</Button>
												</DropdownTrigger>
												<DropdownMenu aria-label="More actions">
													<DropdownItem key="copy">Copy</DropdownItem>
													<DropdownItem key="paste">Paste</DropdownItem>
													<DropdownItem key="cut">Cut</DropdownItem>
												</DropdownMenu>
											</Dropdown>
										</div>
									</div>
								</div>
							</Tab>

							{/* Form Elements */}
							<Tab key="forms" title="Form Elements">
								<div className="space-y-8 p-6">
									{/* Inputs */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Inputs</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<Input
												label="Default Input"
												placeholder="Enter text..."
											/>
											<Input
												label="With Description"
												placeholder="Enter text..."
												description="This is a helper text"
											/>
											<Input
												label="Required"
												placeholder="Enter text..."
												isRequired
											/>
											<Input
												label="Disabled"
												placeholder="Disabled input"
												isDisabled
											/>
											<Input
												label="Read Only"
												value="Read only value"
												isReadOnly
											/>
											<Input
												label="With Error"
												placeholder="Enter text..."
												isInvalid
												errorMessage="This field is required"
											/>
											<Input
												label="With Start Icon"
												placeholder="Search..."
												startContent={<Search size={16} />}
											/>
											<Input
												label="With End Icon"
												placeholder="Enter email..."
												endContent={<User size={16} />}
											/>
										</div>
									</div>

									<Divider />

									{/* Textarea */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Textarea</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<Textarea
												label="Default Textarea"
												placeholder="Enter description..."
											/>
											<Textarea
												label="With Min/Max Rows"
												placeholder="Auto-resizing textarea..."
												minRows={3}
												maxRows={6}
											/>
										</div>
									</div>

									<Divider />

									{/* Select */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Select</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<Select
												label="Choose an option"
												placeholder="Select an option"
											>
												<SelectItem key="option1">Option 1</SelectItem>
												<SelectItem key="option2">Option 2</SelectItem>
												<SelectItem key="option3">Option 3</SelectItem>
											</Select>
											<Select
												label="Multiple Selection"
												placeholder="Select options"
												selectionMode="multiple"
											>
												<SelectItem key="react">React</SelectItem>
												<SelectItem key="vue">Vue</SelectItem>
												<SelectItem key="angular">Angular</SelectItem>
												<SelectItem key="svelte">Svelte</SelectItem>
											</Select>
										</div>
									</div>

									<Divider />

									{/* Checkboxes & Radios */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Checkboxes & Radios
										</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<p className="mb-3 text-default-500 text-small">
													Checkbox Group
												</p>
												<CheckboxGroup
													value={selectedCheckboxes}
													onValueChange={setSelectedCheckboxes}
												>
													<Checkbox value="option1">Option 1</Checkbox>
													<Checkbox value="option2">Option 2</Checkbox>
													<Checkbox value="option3">Option 3</Checkbox>
												</CheckboxGroup>
											</div>
											<div>
												<p className="mb-3 text-default-500 text-small">
													Radio Group
												</p>
												<RadioGroup
													value={selectedRadio}
													onValueChange={setSelectedRadio}
												>
													<Radio value="option1">Option 1</Radio>
													<Radio value="option2">Option 2</Radio>
													<Radio value="option3">Option 3</Radio>
												</RadioGroup>
											</div>
										</div>
									</div>

									<Divider />

									{/* Switch & Slider */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Switch & Slider
										</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div className="space-y-4">
												<p className="text-default-500 text-small">Switches</p>
												<div className="flex gap-4">
													<Switch
														isSelected={switchValue}
														onValueChange={setSwitchValue}
													>
														Default
													</Switch>
													<Switch defaultSelected color="success">
														Success
													</Switch>
													<Switch isDisabled>Disabled</Switch>
												</div>
											</div>
											<div className="space-y-4">
												<p className="text-default-500 text-small">Sliders</p>
												<Slider
													label="Default"
													value={sliderValue}
													onChange={(value) =>
														setSliderValue(
															Array.isArray(value) ? value[0] || 0 : value,
														)
													}
													className="max-w-md"
												/>
												<Slider
													label="With Steps"
													step={10}
													maxValue={100}
													minValue={0}
													defaultValue={40}
													className="max-w-md"
												/>
											</div>
										</div>
									</div>
								</div>
							</Tab>

							{/* Display Elements */}
							<Tab key="display" title="Display Elements">
								<div className="space-y-8 p-6">
									{/* Chips */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Chips</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-default-500 text-small">
													Colors
												</p>
												<div className="flex flex-wrap gap-2">
													{colorVariants.map((color) => (
														<Chip key={color} color={color}>
															{color}
														</Chip>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Variants
												</p>
												<div className="flex flex-wrap gap-2">
													<Chip variant="solid">Solid</Chip>
													<Chip variant="bordered">Bordered</Chip>
													<Chip variant="light">Light</Chip>
													<Chip variant="flat">Flat</Chip>
													<Chip variant="faded">Faded</Chip>
													<Chip variant="shadow">Shadow</Chip>
													<Chip variant="dot">Dot</Chip>
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													With Icons
												</p>
												<div className="flex flex-wrap gap-2">
													<Chip
														startContent={<Check size={16} />}
														color="success"
													>
														Approved
													</Chip>
													<Chip
														startContent={<Clock size={16} />}
														color="warning"
													>
														Pending
													</Chip>
													<Chip startContent={<X size={16} />} color="danger">
														Rejected
													</Chip>
												</div>
											</div>
										</div>
									</div>

									<Divider />

									{/* Badges */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Badges</h3>
										<div className="flex items-center gap-6">
											<Badge content="5" color="danger">
												<Avatar src="/avatar-sarah.jpg" />
											</Badge>
											<Badge content="New" color="success">
												<Button>Messages</Button>
											</Badge>
											<Badge content="99+" color="primary">
												<Bell size={24} />
											</Badge>
											<Badge
												content=""
												color="success"
												placement="bottom-right"
												shape="circle"
											>
												<Avatar src="/avatar-mike.jpg" />
											</Badge>
										</div>
									</div>

									<Divider />

									{/* Avatars */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Avatars</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-default-500 text-small">
													Sizes
												</p>
												<div className="flex items-end gap-3">
													<Avatar src="/avatar-sarah.jpg" size="sm" />
													<Avatar src="/avatar-mike.jpg" size="md" />
													<Avatar src="/avatar-emily.jpg" size="lg" />
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Avatar Group
												</p>
												<AvatarGroup max={3}>
													<Avatar src="/avatar-sarah.jpg" />
													<Avatar src="/avatar-mike.jpg" />
													<Avatar src="/avatar-emily.jpg" />
													<Avatar src="/avatar-john.jpg" />
													<Avatar src="/avatar-jane.jpg" />
												</AvatarGroup>
											</div>
										</div>
									</div>

									<Divider />

									{/* Progress */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Progress</h3>
										<div className="max-w-md space-y-4">
											<Progress value={30} className="mb-2" />
											<Progress value={60} color="success" className="mb-2" />
											<Progress value={80} color="warning" className="mb-2" />
											<Progress value={95} color="danger" className="mb-2" />
											<Progress
												isIndeterminate
												color="primary"
												className="mb-2"
											/>
										</div>
									</div>

									<Divider />

									{/* Tooltips & Popovers */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Tooltips & Popovers
										</h3>
										<div className="flex gap-4">
											<Tooltip content="This is a tooltip">
												<Button variant="flat">Hover me</Button>
											</Tooltip>
											<Popover placement="bottom">
												<PopoverTrigger>
													<Button variant="flat">Click me</Button>
												</PopoverTrigger>
												<PopoverContent>
													<div className="px-1 py-2">
														<div className="font-bold text-small">
															Popover Content
														</div>
														<div className="text-tiny">
															This is a popover with more content.
														</div>
													</div>
												</PopoverContent>
											</Popover>
										</div>
									</div>
								</div>
							</Tab>

							{/* Cards & Layout */}
							<Tab key="cards" title="Cards & Layout">
								<div className="space-y-8 p-6">
									{/* Cards */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Cards</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
											<Card>
												<CardHeader>
													<h4 className="font-semibold">Default Card</h4>
												</CardHeader>
												<CardBody>
													<p className="text-default-600">
														This is a basic card with header and body.
													</p>
												</CardBody>
											</Card>
											<Card shadow="sm">
												<CardBody>
													<h4 className="mb-2 font-semibold">
														Card with Shadow
													</h4>
													<p className="text-default-600">
														This card has a subtle shadow effect.
													</p>
												</CardBody>
											</Card>
											<Card isHoverable isPressable>
												<CardBody>
													<h4 className="mb-2 font-semibold">
														Interactive Card
													</h4>
													<p className="text-default-600">
														This card is hoverable and pressable.
													</p>
												</CardBody>
											</Card>
										</div>
									</div>

									<Divider />

									{/* Breadcrumbs */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Breadcrumbs</h3>
										<Breadcrumbs>
											<BreadcrumbItem startContent={<Home size={16} />}>
												Home
											</BreadcrumbItem>
											<BreadcrumbItem>Assets</BreadcrumbItem>
											<BreadcrumbItem>Images</BreadcrumbItem>
											<BreadcrumbItem>Brand Logo</BreadcrumbItem>
										</Breadcrumbs>
									</div>

									<Divider />

									{/* Tabs */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Tabs</h3>
										<Card>
											<CardBody>
												<Tabs aria-label="Options">
													<Tab key="overview" title="Overview">
														<p className="text-default-600">
															Overview content goes here.
														</p>
													</Tab>
													<Tab key="details" title="Details">
														<p className="text-default-600">
															Details content goes here.
														</p>
													</Tab>
													<Tab key="settings" title="Settings">
														<p className="text-default-600">
															Settings content goes here.
														</p>
													</Tab>
												</Tabs>
											</CardBody>
										</Card>
									</div>
								</div>
							</Tab>

							{/* Tables & Lists */}
							<Tab key="tables" title="Tables & Lists">
								<div className="space-y-8 p-6">
									{/* Table */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Tables</h3>
										<Table aria-label="Example table">
											<TableHeader>
												<TableColumn>NAME</TableColumn>
												<TableColumn>TYPE</TableColumn>
												<TableColumn>SIZE</TableColumn>
												<TableColumn>STATUS</TableColumn>
												<TableColumn>ACTIONS</TableColumn>
											</TableHeader>
											<TableBody>
												{tableData.map((item) => (
													<TableRow key={item.id}>
														<TableCell>{item.name}</TableCell>
														<TableCell>{item.type}</TableCell>
														<TableCell>{item.size}</TableCell>
														<TableCell>
															<Chip
																color={
																	item.status === "active"
																		? "success"
																		: "default"
																}
																size="sm"
															>
																{item.status}
															</Chip>
														</TableCell>
														<TableCell>
															<div className="flex gap-2">
																<Tooltip content="View">
																	<Button isIconOnly size="sm" variant="light">
																		<Eye size={16} />
																	</Button>
																</Tooltip>
																<Tooltip content="Edit">
																	<Button isIconOnly size="sm" variant="light">
																		<Edit size={16} />
																	</Button>
																</Tooltip>
																<Tooltip content="Delete">
																	<Button
																		isIconOnly
																		size="sm"
																		variant="light"
																		color="danger"
																	>
																		<Trash size={16} />
																	</Button>
																</Tooltip>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									<Divider />

									{/* Pagination */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Pagination</h3>
										<div className="flex flex-wrap gap-4">
											<Pagination
												total={10}
												page={currentPage}
												onChange={setCurrentPage}
											/>
											<Pagination
												total={10}
												page={currentPage}
												onChange={setCurrentPage}
												showControls
											/>
											<Pagination
												total={10}
												page={currentPage}
												onChange={setCurrentPage}
												size="sm"
											/>
										</div>
									</div>
								</div>
							</Tab>

							{/* Feedback */}
							<Tab key="feedback" title="Feedback">
								<div className="space-y-8 p-6">
									{/* Modals */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Modals</h3>
										<Button color="primary" onPress={onOpen}>
											Open Modal
										</Button>
										<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
											<ModalContent>
												{(onClose) => (
													<>
														<ModalHeader className="flex flex-col gap-1">
															Modal Title
														</ModalHeader>
														<ModalBody>
															<p>
																This is a modal dialog. You can put any content
																here.
															</p>
															<p className="text-default-500 text-small">
																Modals are perfect for forms, confirmations, or
																displaying detailed information.
															</p>
														</ModalBody>
														<ModalFooter>
															<Button
																color="danger"
																variant="light"
																onPress={onClose}
															>
																Cancel
															</Button>
															<Button color="primary" onPress={onClose}>
																Action
															</Button>
														</ModalFooter>
													</>
												)}
											</ModalContent>
										</Modal>
									</div>

									<Divider />

									{/* Loading States */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Loading States
										</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-default-500 text-small">
													Spinners
												</p>
												<div className="flex items-center gap-4">
													<Spinner size="sm" />
													<Spinner size="md" />
													<Spinner size="lg" />
													<Spinner size="lg" color="success" />
													<Spinner size="lg" color="warning" />
													<Spinner size="lg" color="danger" />
												</div>
											</div>
											<div>
												<p className="mb-2 text-default-500 text-small">
													Skeletons
												</p>
												<Card className="w-[300px]">
													<CardBody className="space-y-3">
														<Skeleton className="rounded-lg">
															<div className="h-24 rounded-lg bg-default-300"></div>
														</Skeleton>
														<div className="space-y-2">
															<Skeleton className="w-3/5 rounded-lg">
																<div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
															</Skeleton>
															<Skeleton className="w-4/5 rounded-lg">
																<div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
															</Skeleton>
															<Skeleton className="w-2/5 rounded-lg">
																<div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
															</Skeleton>
														</div>
													</CardBody>
												</Card>
											</div>
										</div>
									</div>

									<Divider />

									{/* Alert Messages */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Alert Messages
										</h3>
										<div className="space-y-3">
											<Card className="border-primary border-l-4">
												<CardBody>
													<div className="flex gap-3">
														<Info className="text-primary" size={20} />
														<div>
															<p className="font-semibold text-primary">
																Information
															</p>
															<p className="text-default-600 text-small">
																This is an informational message.
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
											<Card className="border-success border-l-4">
												<CardBody>
													<div className="flex gap-3">
														<CheckCircle className="text-success" size={20} />
														<div>
															<p className="font-semibold text-success">
																Success
															</p>
															<p className="text-default-600 text-small">
																Your action was completed successfully.
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
											<Card className="border-warning border-l-4">
												<CardBody>
													<div className="flex gap-3">
														<AlertCircle className="text-warning" size={20} />
														<div>
															<p className="font-semibold text-warning">
																Warning
															</p>
															<p className="text-default-600 text-small">
																Please review this important information.
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
											<Card className="border-danger border-l-4">
												<CardBody>
													<div className="flex gap-3">
														<XCircle className="text-danger" size={20} />
														<div>
															<p className="font-semibold text-danger">Error</p>
															<p className="text-default-600 text-small">
																An error occurred. Please try again.
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
										</div>
									</div>
								</div>
							</Tab>

							{/* Typography */}
							<Tab key="typography" title="Typography">
								<div className="space-y-8 p-6">
									{/* Headings */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Headings</h3>
										<div className="space-y-2">
											<h1 className="font-bold text-5xl">Heading 1</h1>
											<h2 className="font-bold text-4xl">Heading 2</h2>
											<h3 className="font-bold text-3xl">Heading 3</h3>
											<h4 className="font-semibold text-2xl">Heading 4</h4>
											<h5 className="font-semibold text-xl">Heading 5</h5>
											<h6 className="font-semibold text-lg">Heading 6</h6>
										</div>
									</div>

									<Divider />

									{/* Text Styles */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Text Styles</h3>
										<div className="space-y-2">
											<p className="text-large">Large text for emphasis</p>
											<p>Default body text for regular content</p>
											<p className="text-small">
												Small text for secondary information
											</p>
											<p className="text-tiny">
												Tiny text for captions and labels
											</p>
											<p className="font-bold">Bold text for emphasis</p>
											<p className="font-semibold">
												Semibold text for subheadings
											</p>
											<p className="italic">
												Italic text for quotes or emphasis
											</p>
											<p className="underline">Underlined text for links</p>
											<p className="line-through">
												Strikethrough text for outdated content
											</p>
										</div>
									</div>

									<Divider />

									{/* Colors */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Text Colors</h3>
										<div className="space-y-2">
											<p className="text-default-900">Default text color</p>
											<p className="text-default-600">Secondary text color</p>
											<p className="text-default-500">Muted text color</p>
											<p className="text-default-400">Disabled text color</p>
											<p className="text-primary">Primary brand color</p>
											<p className="text-secondary">Secondary brand color</p>
											<p className="text-success">Success state color</p>
											<p className="text-warning">Warning state color</p>
											<p className="text-danger">Danger state color</p>
										</div>
									</div>

									<Divider />

									{/* Code & Links */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Code & Links</h3>
										<div className="space-y-3">
											<p>
												Inline code: <Code>const brandPortal = "awesome";</Code>
											</p>
											<Code className="block p-3">
												{`// Code block example
const assets = await assetService.getAssets();
console.log(assets);`}
											</Code>
											<div className="flex gap-4">
												<Link href="#">Default Link</Link>
												<Link href="#" color="primary">
													Primary Link
												</Link>
												<Link href="#" color="success">
													Success Link
												</Link>
												<Link href="#" isExternal>
													External Link <ExternalLink size={16} />
												</Link>
											</div>
										</div>
									</div>
								</div>
							</Tab>
						</Tabs>
					</CardBody>
				</Card>
			</div>
		</AppLayout>
	);
}
