"use client";

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

const colorVariants = [
	"btn-neutral",
	"btn-primary", 
	"btn-secondary",
	"btn-success",
	"btn-warning",
	"btn-error",
];
const sizeVariants = ["btn-sm", "btn-md", "btn-lg"] as const;

export default function ShowcasePage() {
	const [selectedTab, setSelectedTab] = useState("buttons");
	const [switchValue, setSwitchValue] = useState(true);
	const [sliderValue, setSliderValue] = useState(50);
	const [selectedRadio, setSelectedRadio] = useState("option1");
	const [selectedCheckboxes, setSelectedCheckboxes] = useState(["option1"]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isOpen, setIsOpen] = useState(false);
	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);

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
					<p className="mt-1 text-base-content/70">
						A comprehensive demonstration of all UI components used in the Brand
						Portal.
					</p>
				</div>

				{/* Component Categories */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-box">
							<a 
								className={`tab ${selectedTab === "buttons" ? "tab-active" : ""}`}
								onClick={() => setSelectedTab("buttons")}
							>
								Buttons & Actions
							</a>
							<a 
								className={`tab ${selectedTab === "forms" ? "tab-active" : ""}`}
								onClick={() => setSelectedTab("forms")}
							>
								Form Elements
							</a>
							<a 
								className={`tab ${selectedTab === "display" ? "tab-active" : ""}`}
								onClick={() => setSelectedTab("display")}
							>
								Display Elements
							</a>
							<a 
								className={`tab ${selectedTab === "cards" ? "tab-active" : ""}`}
								onClick={() => setSelectedTab("cards")}
							>
								Cards & Layout
							</a>
							<a 
								className={`tab ${selectedTab === "feedback" ? "tab-active" : ""}`}
								onClick={() => setSelectedTab("feedback")}
							>
								Feedback
							</a>
						</div>
						
						<div className="p-6">
							{/* Buttons & Actions */}
							{selectedTab === "buttons" && (
								<div className="space-y-8">
									{/* Buttons */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Buttons</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Solid Variants
												</p>
												<div className="flex flex-wrap gap-3">
													{colorVariants.map((color) => (
														<button key={color} className={`btn ${color}`}>
															{color.replace('btn-', '')}
														</button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Outline Variants
												</p>
												<div className="flex flex-wrap gap-3">
													{colorVariants.map((color) => (
														<button key={color} className={`btn ${color} btn-outline`}>
															{color.replace('btn-', '')}
														</button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													With Icons
												</p>
												<div className="flex flex-wrap gap-3">
													<button className="btn btn-primary">
														<Plus size={16} />
														Add New
													</button>
													<button className="btn btn-success">
														<Download size={16} />
														Download
													</button>
													<button className="btn btn-error">
														<Trash size={16} />
														Delete
													</button>
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Sizes
												</p>
												<div className="flex items-end gap-3">
													{sizeVariants.map((size) => (
														<button key={size} className={`btn ${size}`}>
															{size.replace('btn-', '')}
														</button>
													))}
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Loading & Disabled
												</p>
												<div className="flex gap-3">
													<button className="btn btn-primary">
														<span className="loading loading-spinner"></span>
														loading
													</button>
													<button className="btn btn-primary" disabled>
														Disabled
													</button>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Button Groups */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Button Groups
										</h3>
										<div className="space-y-4">
											<div className="join">
												<button className="btn join-item">One</button>
												<button className="btn join-item">Two</button>
												<button className="btn join-item">Three</button>
											</div>
											<div className="join">
												<button className="btn btn-outline join-item">Day</button>
												<button className="btn btn-outline join-item">Week</button>
												<button className="btn btn-outline join-item">Month</button>
												<button className="btn btn-outline join-item">Year</button>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Dropdowns */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Dropdowns</h3>
										<div className="flex gap-3">
											<div className="dropdown">
												<button tabIndex={0} className="btn m-1">
													Actions
													<ChevronRight size={16} />
												</button>
												<ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
													<li><a><Eye size={16} />View</a></li>
													<li><a><Edit size={16} />Edit</a></li>
													<li><a><Share size={16} />Share</a></li>
													<li><a className="text-error"><Trash size={16} />Delete</a></li>
												</ul>
											</div>

											<div className="dropdown">
												<button tabIndex={0} className="btn btn-square">
													<MoreVertical size={16} />
												</button>
												<ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
													<li><a>Copy</a></li>
													<li><a>Paste</a></li>
													<li><a>Cut</a></li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Form Elements */}
							{selectedTab === "forms" && (
								<div className="space-y-8">
									{/* Inputs */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Inputs</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="w-full">
												<label className="label" htmlFor="default-input">Default Input</label>
												<input id="default-input" type="text" placeholder="Enter text..." className="input w-full" />
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="desc-input">With Description</label>
												<input id="desc-input" type="text" placeholder="Enter text..." className="input w-full" />
												<div className="label">
													<span className="text-xs opacity-70">This is a helper text</span>
												</div>
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="required-input">Required</label>
												<input id="required-input" type="text" placeholder="Enter text..." className="input w-full" required />
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="disabled-input">Disabled</label>
												<input id="disabled-input" type="text" placeholder="Disabled input" className="input w-full" disabled />
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="readonly-input">Read Only</label>
												<input id="readonly-input" type="text" value="Read only value" className="input w-full" readOnly />
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="error-input">With Error</label>
												<input id="error-input" type="text" placeholder="Enter text..." className="input input-error w-full" />
												<div className="label">
													<span className="text-xs text-error">This field is required</span>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Textarea */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Textarea</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div>
												<label className="label" htmlFor="default-textarea">Default Textarea</label>
												<textarea id="default-textarea" className="textarea" placeholder="Enter description..."></textarea>
											</div>
											
											<div>
												<label className="label" htmlFor="autoresize-textarea">Auto-resizing</label>
												<textarea id="autoresize-textarea" className="textarea" placeholder="Auto-resizing textarea..." rows={3}></textarea>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Select */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Select</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="w-full">
												<label className="label" htmlFor="single-select">Choose an option</label>
												<select id="single-select" className="select">
													<option disabled selected>Select an option</option>
													<option>Option 1</option>
													<option>Option 2</option>
													<option>Option 3</option>
												</select>
											</div>
											
											<div className="w-full">
												<label className="label" htmlFor="multi-select">Multiple Selection</label>
												<select id="multi-select" className="select" multiple>
													<option>React</option>
													<option>Vue</option>
													<option>Angular</option>
													<option>Svelte</option>
												</select>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Checkboxes & Radios */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Checkboxes & Radios
										</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<p className="mb-3 text-base-content/70 text-sm">
													Checkbox Group
												</p>
												<div>
													<label className="label cursor-pointer">
														<input id="checkbox-1" type="checkbox" className="checkbox" />
														Option 1
													</label>
													<label className="label cursor-pointer">
														<input id="checkbox-2" type="checkbox" className="checkbox" />
														Option 2
													</label>
													<label className="label cursor-pointer">
														<input id="checkbox-3" type="checkbox" className="checkbox" />
														Option 3
													</label>
												</div>
											</div>
											<div>
												<p className="mb-3 text-base-content/70 text-sm">
													Radio Group
												</p>
												<div>
													<label className="label cursor-pointer">
														<input id="radio-1" type="radio" name="radio-group" className="radio" />
														Option 1
													</label>
													<label className="label cursor-pointer">
														<input id="radio-2" type="radio" name="radio-group" className="radio" />
														Option 2
													</label>
													<label className="label cursor-pointer">
														<input id="radio-3" type="radio" name="radio-group" className="radio" />
														Option 3
													</label>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Switch & Slider */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Switch & Slider
										</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div className="space-y-4">
												<p className="text-base-content/70 text-sm">Switches</p>
												<div className="flex gap-4">
													<div>
														<label className="label cursor-pointer">
															<input id="toggle-default" type="checkbox" className="toggle" />
															Default
														</label>
													</div>
													<div>
														<label className="label cursor-pointer">
															<input id="toggle-success" type="checkbox" className="toggle toggle-success" defaultChecked />
															Success
														</label>
													</div>
													<div>
														<label className="label cursor-pointer">
															<input id="toggle-disabled" type="checkbox" className="toggle" disabled />
															Disabled
														</label>
													</div>
												</div>
											</div>
											<div className="space-y-4">
												<p className="text-base-content/70 text-sm">Range Sliders</p>
												<div>
													<label className="label" htmlFor="range-default">Default</label>
													<input id="range-default" type="range" min={0} max="100" value={sliderValue} className="range" />
												</div>
												<div>
													<label className="label" htmlFor="range-steps">With Steps</label>
													<input id="range-steps" type="range" min={0} max="100" step="10" defaultValue="40" className="range" />
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Display Elements */}
							{selectedTab === "display" && (
								<div className="space-y-8">
									{/* Badges */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Badges</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Colors
												</p>
												<div className="flex flex-wrap gap-2">
													<div className="badge">neutral</div>
													<div className="badge badge-primary">primary</div>
													<div className="badge badge-secondary">secondary</div>
													<div className="badge badge-success">success</div>
													<div className="badge badge-warning">warning</div>
													<div className="badge badge-error">error</div>
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Variants
												</p>
												<div className="flex flex-wrap gap-2">
													<div className="badge">Default</div>
													<div className="badge badge-outline">Outline</div>
													<div className="badge badge-lg">Large</div>
													<div className="badge badge-sm">Small</div>
													<div className="badge badge-xs">Extra Small</div>
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													With Icons
												</p>
												<div className="flex flex-wrap gap-2">
													<div className="badge badge-success gap-2">
														<Check size={16} />
														Approved
													</div>
													<div className="badge badge-warning gap-2">
														<Clock size={16} />
														Pending
													</div>
													<div className="badge badge-error gap-2">
														<X size={16} />
														Rejected
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Avatars */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Avatars</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Sizes
												</p>
												<div className="flex items-end gap-3">
													<div className="avatar">
														<div className="w-8 rounded-full">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
													<div className="avatar">
														<div className="w-12 rounded-full">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
													<div className="avatar">
														<div className="w-16 rounded-full">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Avatar Group
												</p>
												<div className="avatar-group -space-x-6 rtl:space-x-reverse">
													<div className="avatar">
														<div className="w-12">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
													<div className="avatar">
														<div className="w-12">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
													<div className="avatar">
														<div className="w-12">
															<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="Avatar" />
														</div>
													</div>
													<div className="avatar placeholder">
														<div className="w-12 bg-neutral text-neutral-content">
															<span>+2</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Progress */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Progress</h3>
										<div className="max-w-md space-y-4">
											<progress className="progress w-full" value="30" max="100"></progress>
											<progress className="progress progress-success w-full" value="60" max="100"></progress>
											<progress className="progress progress-warning w-full" value="80" max="100"></progress>
											<progress className="progress progress-error w-full" value="95" max="100"></progress>
											<progress className="progress progress-primary w-full"></progress>
										</div>
									</div>

									<div className="divider"></div>

									{/* Tooltips */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Tooltips
										</h3>
										<div className="flex gap-4">
											<div className="tooltip" data-tip="This is a tooltip">
												<button className="btn">Hover me</button>
											</div>
											<div className="tooltip tooltip-open tooltip-top" data-tip="Always visible">
												<button className="btn">Always visible</button>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Cards & Layout */}
							{selectedTab === "cards" && (
								<div className="space-y-8">
									{/* Cards */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Cards</h3>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
											<div className="card bg-base-100 shadow-xl">
												<div className="card-body">
													<h2 className="card-title">Default Card</h2>
													<p>This is a basic card with header and body.</p>
												</div>
											</div>
											<div className="card bg-base-100 shadow">
												<div className="card-body">
													<h2 className="card-title">Card with Shadow</h2>
													<p>This card has a subtle shadow effect.</p>
												</div>
											</div>
											<div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
												<div className="card-body">
													<h2 className="card-title">Interactive Card</h2>
													<p>This card is hoverable and pressable.</p>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Breadcrumbs */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Breadcrumbs</h3>
										<div className="text-sm breadcrumbs">
											<ul>
												<li>
													<a>
														<Home size={16} />
														Home
													</a>
												</li>
												<li><a>Assets</a></li>
												<li><a>Images</a></li>
												<li>Brand Logo</li>
											</ul>
										</div>
									</div>

									<div className="divider"></div>

									{/* Accordion */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Accordion</h3>
										<div className="collapse collapse-arrow bg-base-200">
											<input type="radio" name="my-accordion-2" defaultChecked />
											<div className="collapse-title text-xl font-medium">
												Click to open this one and close others
											</div>
											<div className="collapse-content">
												<p>Overview content goes here.</p>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Feedback */}
							{selectedTab === "feedback" && (
								<div className="space-y-8">
									{/* Modals */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">Modals</h3>
										<button className="btn btn-primary" onClick={onOpen}>
											Open Modal
										</button>
										
										<dialog className="modal" open={isOpen}>
											<div className="modal-box">
												<h3 className="font-bold text-lg">Modal Title</h3>
												<p className="py-4">
													This is a modal dialog. You can put any content
													here.
												</p>
												<p className="text-base-content/70 text-sm">
													Modals are perfect for forms, confirmations, or
													displaying detailed information.
												</p>
												<div className="modal-action">
													<button className="btn btn-error" onClick={onClose}>
														Cancel
													</button>
													<button className="btn btn-primary" onClick={onClose}>
														Action
													</button>
												</div>
											</div>
											<form method="dialog" className="modal-backdrop">
												<button onClick={onClose}>close</button>
											</form>
										</dialog>
									</div>

									<div className="divider"></div>

									{/* Loading States */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Loading States
										</h3>
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Loading Spinners
												</p>
												<div className="flex items-center gap-4">
													<span className="loading loading-spinner loading-sm"></span>
													<span className="loading loading-spinner loading-md"></span>
													<span className="loading loading-spinner loading-lg"></span>
													<span className="loading loading-dots loading-lg"></span>
													<span className="loading loading-ring loading-lg"></span>
												</div>
											</div>
											<div>
												<p className="mb-2 text-base-content/70 text-sm">
													Skeletons
												</p>
												<div className="flex w-52 flex-col gap-4">
													<div className="skeleton h-32 w-full"></div>
													<div className="skeleton h-4 w-28"></div>
													<div className="skeleton h-4 w-full"></div>
													<div className="skeleton h-4 w-full"></div>
												</div>
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Alert Messages */}
									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Alert Messages
										</h3>
										<div className="space-y-3">
											<div role="alert" className="alert alert-info">
												<Info size={20} />
												<span>Information: This is an informational message.</span>
											</div>
											<div role="alert" className="alert alert-success">
												<CheckCircle size={20} />
												<span>Success: Your action was completed successfully.</span>
											</div>
											<div role="alert" className="alert alert-warning">
												<AlertCircle size={20} />
												<span>Warning: Please review this important information.</span>
											</div>
											<div role="alert" className="alert alert-error">
												<XCircle size={20} />
												<span>Error: An error occurred. Please try again.</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}