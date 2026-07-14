import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Select, ListBox, ListBoxItem, Label, Spinner, Modal
} from "@heroui/react";
import { ShieldAlert, Plus, MessageSquare, Upload, Eye, UserCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function Complaints() {
    const { user: currentUser } = useAuthStore();
    const [complaints, setComplaints] = useState([]);
    const [committee, setCommittee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

    const {
        register: registerComplaint,
        handleSubmit: handleSubmitComplaint,
        reset: resetComplaint,
        formState: { errors: errorsComplaint, isSubmitting: isSubmittingComplaint }
    } = useForm();

    const {
        handleSubmit: handleSubmitAssign,
        control: controlAssign,
        reset: resetAssign,
        formState: { errors: errorsAssign, isSubmitting: isSubmittingAssign }
    } = useForm();

    const {
        register: registerComment,
        handleSubmit: handleSubmitComment,
        reset: resetComment,
        formState: { errors: errorsComment, isSubmitting: isSubmittingComment }
    } = useForm();

    const fetchComplaints = async () => {
        try {
            const response = await api.get("/api/complaints?limit=50");
            if (response.data?.success) {
                setComplaints(response.data.complaints || []);
            }
        } catch {
            toast.error("Failed to load complaints registry.");
        }
    };

    const fetchCommittee = async () => {
        try {
            const response = await api.get("/api/users/committee?limit=50");
            if (response.data?.success) {
                setCommittee(response.data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch committee members", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchComplaints();
        if (currentUser?.role === "admin") {
            await fetchCommittee();
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleRaiseComplaint = async (data) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        if (data.image && data.image[0]) {
            formData.append("image", data.image[0]);
        }

        try {
            const response = await api.post("/api/complaints", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if (response.data?.success) {
                toast.success("Complaint logged successfully!");
                setIsRaiseModalOpen(false);
                resetComplaint();
                fetchComplaints();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to log complaint.");
        }
    };

    const handleAssignComplaint = async (data) => {
        try {
            const response = await api.post(`/api/complaints/${selectedComplaint._id}/assign`, {
                assignedTo: data.assignedTo
            });
            if (response.data?.success) {
                toast.success("Complaint assigned successfully.");
                setIsAssignModalOpen(false);
                resetAssign();
                fetchComplaints();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign complaint.");
        }
    };

    const handleUpdateStatusAndComment = async (data) => {
        try {
            const response = await api.patch(`/api/complaints/${selectedComplaint._id}`, {
                status: data.status,
                comment: data.comment
            });
            if (response.data?.success) {
                toast.success("Complaint updated successfully.");
                setIsCommentModalOpen(false);
                resetComment();
                fetchComplaints();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update complaint status.");
        }
    };

    const handleDeleteComplaint = async (id) => {
        if (!window.confirm("Are you sure you want to delete this complaint?")) return;
        try {
            const response = await api.delete(`/api/complaints/${id}`);
            if (response.data?.success) {
                toast.success("Complaint deleted successfully.");
                fetchComplaints();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete complaint.");
        }
    };

    const isResident = currentUser?.role === "resident";
    const isAdmin = currentUser?.role === "admin";
    const isCommittee = currentUser?.role === "committee_member";

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Accessing complaints log..." />
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
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Complaints & Grievances</h1>
                            <p className="text-sm text-slate-500">File complaints, track progress, or delegate assignments to committee members</p>
                        </div>
                    </div>

                    {isResident && (
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onClick={() => setIsRaiseModalOpen(true)}
                            className="font-semibold shadow-md shadow-indigo-100"
                        >
                            File Complaint
                        </Button>
                    )}
                </div>

                {/* Table Viewport */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                    {complaints.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="font-semibold text-slate-700">No Complaints Registered</h3>
                            <p className="text-sm text-slate-400">
                                {isResident 
                                    ? "You have not raised any society complaints yet." 
                                    : "No resident complaints are currently logged in the system."}
                            </p>
                        </div>
                    ) : (
                        <Table aria-label="Complaints Table" removeWrapper shadow="none" className="min-w-full">
                            <TableHeader>
                                <TableColumn className="font-bold text-slate-500">TITLE & DETAILS</TableColumn>
                                <TableColumn className="font-bold text-slate-500">RAISED BY</TableColumn>
                                <TableColumn className="font-bold text-slate-500">ASSIGNED TO</TableColumn>
                                <TableColumn className="font-bold text-slate-500">DATE RAISED</TableColumn>
                                <TableColumn className="font-bold text-slate-500">STATUS</TableColumn>
                                <TableColumn className="font-bold text-slate-500 text-right">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {complaints.map((c) => (
                                    <TableRow key={c._id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800 text-sm">{c.title}</span>
                                                <p className="text-xs text-slate-400 font-medium max-w-sm truncate">{c.description}</p>
                                                {c.imageUrl && (
                                                    <a 
                                                        href={c.imageUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 mt-1"
                                                    >
                                                        <Eye size={10} /> View Attachment Link
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium text-xs">
                                            <div className="flex flex-col">
                                                <span>{c.raisedBy?.fullName}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{c.raisedBy?.block}-{c.raisedBy?.unitNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium text-xs">
                                            {c.assignedTo ? (
                                                <div className="flex flex-col">
                                                    <span>{c.assignedTo.fullName}</span>
                                                    <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">{c.assignedTo.designation}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold uppercase italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-sans text-xs">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                                c.status === "resolved" 
                                                    ? "bg-emerald-50 text-emerald-600" 
                                                    : c.status === "assigned" 
                                                    ? "bg-blue-50 text-blue-600" 
                                                    : "bg-amber-50 text-amber-600"
                                            }`}>
                                                {c.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                {isAdmin && c.status === "open" && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="flat" 
                                                        color="primary"
                                                        startContent={<UserCheck size={13} />}
                                                        onClick={() => {
                                                            setSelectedComplaint(c);
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                    >
                                                        Assign
                                                    </Button>
                                                )}
                                                {(isAdmin || isCommittee) && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="flat" 
                                                        color="warning"
                                                        onClick={() => {
                                                            setSelectedComplaint(c);
                                                            setIsCommentModalOpen(true);
                                                        }}
                                                    >
                                                        Update
                                                    </Button>
                                                )}
                                                {(isAdmin || (isResident && c.status === "open")) && (
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        color="danger" 
                                                        variant="light"
                                                        onClick={() => handleDeleteComplaint(c._id)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Raise Complaint Modal Overlay */}
                {isRaiseModalOpen && (
                    <Modal isOpen={isRaiseModalOpen} onOpenChange={setIsRaiseModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsRaiseModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>File Society Complaint</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmitComplaint(handleRaiseComplaint)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <Input
                                                {...registerComplaint("title", { required: "Complaint title is required" })}
                                                type="text"
                                                label="Complaint Title"
                                                placeholder="e.g. Water logging in parking area"
                                                labelPlacement="outside"
                                                isInvalid={!!errorsComplaint.title}
                                                errorMessage={errorsComplaint.title?.message}
                                                variant="bordered"
                                            />

                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Grievance Description</Label>
                                                <textarea
                                                    {...registerComplaint("description", { required: "Description is required" })}
                                                    rows={4}
                                                    placeholder="Detail your complaint here..."
                                                    className="w-full rounded-xl border border-slate-200/80 p-3 text-slate-700 text-sm focus:border-indigo-600 focus:outline-none bg-transparent"
                                                />
                                                {errorsComplaint.description && (
                                                    <span className="text-xs text-danger font-medium mt-0.5">
                                                        {errorsComplaint.description.message}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Attach Photo Evidence (Optional)</Label>
                                                <div className="flex items-center justify-center w-full">
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                            <p className="text-xs text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                            <p className="text-[10px] text-slate-400">PNG, JPG or JPEG (Max 5MB)</p>
                                                        </div>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden" 
                                                            {...registerComplaint("image")}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button 
                                                variant="flat" 
                                                color="default" 
                                                onClick={() => setIsRaiseModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                color="primary"
                                                isLoading={isSubmittingComplaint}
                                                className="font-semibold"
                                            >
                                                File Complaint
                                            </Button>
                                        </Modal.Footer>
                                    </form>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                )}

                {/* Assign Modal Overlay */}
                {isAssignModalOpen && (
                    <Modal isOpen={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsAssignModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Delegate Complaint Assignment</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmitAssign(handleAssignComplaint)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <p className="text-xs text-slate-500">Select a committee member to assign this complaint for investigation and resolution.</p>
                                            
                                            <Controller
                                                control={controlAssign}
                                                name="assignedTo"
                                                rules={{ required: "Assignee is required" }}
                                                render={({ field }) => (
                                                    <div className="flex flex-col">
                                                        <Select
                                                            placeholder="Select assignee"
                                                            variant="bordered"
                                                            onSelectionChange={(keys) => {
                                                                const val = Array.from(keys)[0];
                                                                field.onChange(val);
                                                            }}
                                                            selectedKeys={field.value ? [field.value] : []}
                                                        >
                                                            <Label className="text-xs text-slate-500 font-semibold mb-1 block">Committee Member</Label>
                                                            <Select.Trigger className="w-full">
                                                                <Select.Value />
                                                                <Select.Indicator />
                                                            </Select.Trigger>
                                                            <Select.Popover>
                                                                <ListBox>
                                                                    {committee.map((c) => (
                                                                        <ListBoxItem key={c._id} id={c._id}>
                                                                            {c.fullName} ({c.designation})
                                                                        </ListBoxItem>
                                                                    ))}
                                                                </ListBox>
                                                            </Select.Popover>
                                                        </Select>
                                                        {errorsAssign.assignedTo && (
                                                            <span className="text-xs text-danger mt-1">
                                                                {errorsAssign.assignedTo.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button 
                                                variant="flat" 
                                                color="default" 
                                                onClick={() => setIsAssignModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                color="primary"
                                                isLoading={isSubmittingAssign}
                                                className="font-semibold"
                                            >
                                                Delegate Ticket
                                            </Button>
                                        </Modal.Footer>
                                    </form>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                )}

                {/* Comment / Status Modal Overlay */}
                {isCommentModalOpen && (
                    <Modal isOpen={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsCommentModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Update Complaint Status</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmitComment(handleUpdateStatusAndComment)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            {/* Select new status */}
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Set Resolution State</Label>
                                                <select 
                                                    {...registerComment("status", { required: "Status is required" })}
                                                    className="w-full rounded-xl border border-slate-200/80 p-2.5 text-slate-700 text-sm focus:border-indigo-600 focus:outline-none bg-transparent"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="assigned">Assigned</option>
                                                    <option value="resolved">Resolved</option>
                                                </select>
                                                {errorsComment.status && (
                                                    <span className="text-xs text-danger font-medium mt-0.5">
                                                        {errorsComment.status.message}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Action Comment</Label>
                                                <textarea
                                                    {...registerComment("comment")}
                                                    rows={3}
                                                    placeholder="Add an update comment (optional)..."
                                                    className="w-full rounded-xl border border-slate-200/80 p-3 text-slate-700 text-sm focus:border-indigo-600 focus:outline-none bg-transparent"
                                                />
                                            </div>

                                            {/* Show existing comments inside the modal */}
                                            {selectedComplaint?.comments?.length > 0 && (
                                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 mt-1">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grievance Audit Ledger</span>
                                                    <div className="max-h-32 overflow-y-auto flex flex-col gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                                        {selectedComplaint.comments.map((c, i) => (
                                                            <div key={i} className="text-[11px] leading-relaxed border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                                                                <span className="font-bold text-slate-700 block">{c.user?.fullName} ({c.user?.role}):</span>
                                                                <span className="text-slate-600">{c.comment}</span>
                                                                <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button 
                                                variant="flat" 
                                                color="default" 
                                                onClick={() => setIsCommentModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                color="primary"
                                                isLoading={isSubmittingComment}
                                                className="font-semibold"
                                            >
                                                Update Ticket
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
