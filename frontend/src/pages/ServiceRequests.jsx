import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Select, ListBox, ListBoxItem, Label, Spinner, Modal,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { Wrench, Plus, Clipboard, CheckCircle2, AlertCircle, Calendar, User, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function ServiceRequests() {
    const { user: currentUser } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            title: "",
            description: "",
            category: "",
            priority: "medium"
        }
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/service-requests?limit=50");
            if (response.data?.success) {
                setRequests(response.data.serviceRequests || []);
            }
        } catch (error) {
            toast.error("Failed to load service tickets.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            const response = await api.patch(`/api/service-requests/${requestId}`, { status: newStatus });
            if (response.data?.success) {
                toast.success(`Ticket status updated to ${newStatus.replace("_", " ")}.`);
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update ticket status.");
        }
    };

    const onSubmit = async (data) => {
        try {
            const response = await api.post("/api/service-requests", data);
            if (response.data?.success) {
                toast.success("Service ticket raised successfully!");
                setIsModalOpen(false);
                reset();
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to raise request.");
        }
    };

    const isResident = currentUser?.role === "resident";
    const isAdminOrCommittee = currentUser?.role === "admin" || currentUser?.role === "committee_member";

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Loading tickets ledger..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header controls */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Service Requests</h1>
                            <p className="text-sm text-slate-500">Raise maintenance issues, check ticket statuses, or track resolutions</p>
                        </div>
                    </div>

                    {isResident && (
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                            className="font-semibold shadow-md shadow-indigo-100"
                        >
                            Raise Request
                        </Button>
                    )}
                </div>

                {/* Table Viewport */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <Clipboard size={24} />
                            </div>
                            <h3 className="font-semibold text-slate-700">No Service Requests Found</h3>
                            <p className="text-sm text-slate-400">
                                {isResident 
                                    ? "You have not raised any maintenance tickets yet." 
                                    : "No maintenance tickets are currently logged in the society database."}
                            </p>
                        </div>
                    ) : (
                        <Table aria-label="Service Requests Table" removeWrapper shadow="none" className="min-w-full">
                            <TableHeader>
                                <TableColumn className="font-bold text-slate-500">ISSUE DETAILS</TableColumn>
                                {!isResident && <TableColumn className="font-bold text-slate-500">RAISED BY</TableColumn>}
                                <TableColumn className="font-bold text-slate-500">PRIORITY</TableColumn>
                                <TableColumn className="font-bold text-slate-500">DATE LODGED</TableColumn>
                                <TableColumn className="font-bold text-slate-500">STATUS</TableColumn>
                                {isAdminOrCommittee && <TableColumn className="font-bold text-slate-500 text-right">ACTION</TableColumn>}
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req._id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800 text-sm">{req.title}</span>
                                                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 font-bold uppercase tracking-wider rounded inline-block max-w-fit">
                                                    {req.category}
                                                </span>
                                                <p className="text-xs text-slate-400 mt-1 max-w-md font-medium truncate">{req.description}</p>
                                            </div>
                                        </TableCell>
                                        {!isResident && (
                                            <TableCell className="text-slate-600 font-medium text-xs">
                                                <div className="flex flex-col">
                                                    <span>{req.resident?.fullName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{req.resident?.block}-{req.resident?.unitNumber}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                                req.priority === "high" 
                                                    ? "bg-rose-50 text-rose-600" 
                                                    : req.priority === "medium" 
                                                    ? "bg-amber-50 text-amber-600" 
                                                    : "bg-slate-100 text-slate-600"
                                            }`}>
                                                {req.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-sans text-xs">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                                req.status === "completed" 
                                                    ? "bg-emerald-50 text-emerald-600" 
                                                    : req.status === "in_progress" 
                                                    ? "bg-blue-50 text-blue-600" 
                                                    : "bg-amber-50 text-amber-600"
                                            }`}>
                                                {req.status?.replace("_", " ")}
                                            </span>
                                        </TableCell>
                                        {isAdminOrCommittee && (
                                            <TableCell className="text-right">
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly variant="light" size="sm">
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu 
                                                        aria-label="Update ticket status"
                                                        onAction={(key) => handleStatusChange(req._id, key)}
                                                    >
                                                        <DropdownItem key="pending">Set Pending</DropdownItem>
                                                        <DropdownItem key="in_progress">Set In Progress</DropdownItem>
                                                        <DropdownItem key="completed">Set Completed</DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Raise Request Modal Overlay */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Raise Service Request Ticket</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <Input
                                                {...register("title", { required: "Request title is required" })}
                                                type="text"
                                                label="Service Ticket Title"
                                                placeholder="e.g. Living room fan regulator broken"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.title}
                                                errorMessage={errors.title?.message}
                                                variant="bordered"
                                            />

                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Problem Description</Label>
                                                <textarea
                                                    {...register("description", { required: "Description is required" })}
                                                    rows={4}
                                                    placeholder="Provide details about the issue..."
                                                    className="w-full rounded-xl border border-slate-200/80 p-3 text-slate-700 text-sm focus:border-indigo-600 focus:outline-none bg-transparent"
                                                />
                                                {errors.description && (
                                                    <span className="text-xs text-danger font-medium mt-0.5">
                                                        {errors.description.message}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Controller
                                                    control={control}
                                                    name="category"
                                                    rules={{ required: "Category is required" }}
                                                    render={({ field }) => (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                placeholder="Choose category"
                                                                variant="bordered"
                                                                onSelectionChange={(keys) => {
                                                                    const val = Array.from(keys)[0];
                                                                    field.onChange(val);
                                                                }}
                                                                selectedKeys={field.value ? [field.value] : []}
                                                            >
                                                                <Label className="text-xs text-slate-500 font-semibold mb-1 block">Maintenance Type</Label>
                                                                <Select.Trigger className="w-full">
                                                                    <Select.Value />
                                                                    <Select.Indicator />
                                                                </Select.Trigger>
                                                                <Select.Popover>
                                                                    <ListBox>
                                                                        <ListBoxItem id="plumbing">Plumbing</ListBoxItem>
                                                                        <ListBoxItem id="electrical">Electrical</ListBoxItem>
                                                                        <ListBoxItem id="carpentry">Carpentry</ListBoxItem>
                                                                        <ListBoxItem id="cleaning">Cleaning</ListBoxItem>
                                                                        <ListBoxItem id="other">Other</ListBoxItem>
                                                                    </ListBox>
                                                                </Select.Popover>
                                                            </Select>
                                                            {errors.category && (
                                                                <span className="text-[10px] text-danger mt-1">
                                                                    {errors.category.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                />

                                                <Controller
                                                    control={control}
                                                    name="priority"
                                                    rules={{ required: "Priority level is required" }}
                                                    render={({ field }) => (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                placeholder="Choose priority"
                                                                variant="bordered"
                                                                onSelectionChange={(keys) => {
                                                                    const val = Array.from(keys)[0];
                                                                    field.onChange(val);
                                                                }}
                                                                selectedKeys={field.value ? [field.value] : []}
                                                            >
                                                                <Label className="text-xs text-slate-500 font-semibold mb-1 block">Urgency Priority</Label>
                                                                <Select.Trigger className="w-full">
                                                                    <Select.Value />
                                                                    <Select.Indicator />
                                                                </Select.Trigger>
                                                                <Select.Popover>
                                                                    <ListBox>
                                                                        <ListBoxItem id="low">Low</ListBoxItem>
                                                                        <ListBoxItem id="medium">Medium</ListBoxItem>
                                                                        <ListBoxItem id="high">High</ListBoxItem>
                                                                    </ListBox>
                                                                </Select.Popover>
                                                            </Select>
                                                            {errors.priority && (
                                                                <span className="text-[10px] text-danger mt-1">
                                                                    {errors.priority.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button 
                                                variant="flat" 
                                                color="default" 
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                color="primary"
                                                isLoading={isSubmitting}
                                                className="font-semibold"
                                            >
                                                Submit Ticket
                                            </Button>
                                        </Modal.Footer>
                                    </form>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                )}
            </div>
        </DashboardLayout>
    );
}
