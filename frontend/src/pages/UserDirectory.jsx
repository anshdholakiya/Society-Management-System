import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Select, ListBox, ListBoxItem, Label, Spinner, Modal, RadioGroup, Radio 
} from "@heroui/react";
import { Users, UserPlus, Trash2, Mail, Phone, Shield } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function UserDirectory() {
    const { user: currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState("residents"); // "residents" | "committee"
    const [residents, setResidents] = useState([]);
    const [committee, setCommittee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [regUserType, setRegUserType] = useState("resident"); // "resident" | "committee"

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            phone: "",
            unitNumber: "",
            block: "",
            ownershipStatus: "",
            designation: ""
        }
    });

    const fetchResidents = async () => {
        try {
            const response = await api.get("/api/users/residents?limit=50");
            if (response.data?.success) {
                setResidents(response.data.users || []);
            }
        } catch {
            toast.error("Failed to load resident members directory.");
        }
    };

    const fetchCommittee = async () => {
        try {
            const response = await api.get("/api/users/committee?limit=50");
            if (response.data?.success) {
                setCommittee(response.data.users || []);
            }
        } catch {
            toast.error("Failed to load committee members list.");
        }
    };

    const loadData = async () => {
        setLoading(true);
        if (currentUser?.role === "admin" || currentUser?.role === "committee_member") {
            await Promise.all([fetchResidents(), fetchCommittee()]);
        } else {
            await fetchCommittee(); // Non-admin/committee can only view committee list
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const response = await api.delete(`/api/users/${id}`);
            if (response.data?.success) {
                toast.success("User deleted successfully.");
                loadData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user.");
        }
    };

    const onSubmit = async (data) => {
        try {
            let response;
            if (regUserType === "resident") {
                const payload = {
                    fullName: data.fullName,
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                    unitNumber: data.unitNumber,
                    block: data.block,
                    ownershipStatus: data.ownershipStatus
                };
                response = await api.post("/api/users/residents", payload);
            } else {
                const payload = {
                    fullName: data.fullName,
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                    designation: data.designation
                };
                response = await api.post("/api/users/committee", payload);
            }

            if (response.data?.success) {
                toast.success(`${regUserType === "resident" ? "Resident" : "Committee member"} registered successfully.`);
                setIsModalOpen(false);
                reset();
                loadData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed.");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Fetching directory..." />
                </div>
            </DashboardLayout>
        );
    }

    const isAdmin = currentUser?.role === "admin";

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header view controls */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Society Directory</h1>
                            <p className="text-sm text-slate-500">Contact roster and records of society residents and administration</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <Button
                            color="primary"
                            startContent={<UserPlus size={16} />}
                            onClick={() => {
                                setRegUserType("resident");
                                setIsModalOpen(true);
                            }}
                            className="font-semibold shadow-md shadow-indigo-100"
                        >
                            Register Member
                        </Button>
                    )}
                </div>

                {/* Tab Switchers */}
                {isAdmin && (
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab("residents")}
                            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                                activeTab === "residents"
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Residents ({residents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("committee")}
                            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                                activeTab === "committee"
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Committee Members ({committee.length})
                        </button>
                    </div>
                )}

                {/* Table Viewport */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                    {activeTab === "residents" && isAdmin ? (
                        residents.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No resident members registered in the database.
                            </div>
                        ) : (
                            <Table aria-label="Residents Roster" removeWrapper shadow="none" className="min-w-full">
                                <TableHeader>
                                    <TableColumn className="font-bold text-slate-500">NAME</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">FLAT / UNIT</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">STATUS</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">CONTACT INFO</TableColumn>
                                    {isAdmin && <TableColumn className="font-bold text-slate-500 text-right">ACTIONS</TableColumn>}
                                </TableHeader>
                                <TableBody>
                                    {residents.map((r) => (
                                        <TableRow key={r._id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-semibold text-slate-700">{r.fullName}</TableCell>
                                            <TableCell className="text-slate-600 font-medium">{r.block}-{r.unitNumber}</TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                                    r.ownershipStatus === "owner" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                }`}>
                                                    {r.ownershipStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-sans text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {r.email}</span>
                                                    {r.phone && <span className="flex items-center gap-1"><Phone size={12} /> {r.phone}</span>}
                                                </div>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <Button 
                                                        isIconOnly 
                                                        color="danger" 
                                                        variant="light" 
                                                        onClick={() => handleDelete(r._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    ) : (
                        committee.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No committee members registered in the database.
                            </div>
                        ) : (
                            <Table aria-label="Committee Directory" removeWrapper shadow="none" className="min-w-full">
                                <TableHeader>
                                    <TableColumn className="font-bold text-slate-500">NAME</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">DESIGNATION</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">CONTACT INFO</TableColumn>
                                    {isAdmin && <TableColumn className="font-bold text-slate-500 text-right">ACTIONS</TableColumn>}
                                </TableHeader>
                                <TableBody>
                                    {committee.map((c) => (
                                        <TableRow key={c._id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-semibold text-slate-700">{c.fullName}</TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs inline-block">
                                                    <Shield size={12} /> {c.designation}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-sans text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>
                                                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                                                </div>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <Button 
                                                        isIconOnly 
                                                        color="danger" 
                                                        variant="light" 
                                                        onClick={() => handleDelete(c._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    )}
                </div>

                {/* Registration Modal Overlay */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Register New Member</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            {/* Selector for Registration type */}
                                            <div className="flex flex-col gap-1">
                                                <RadioGroup
                                                    label="Member Role Type"
                                                    value={regUserType}
                                                    onValueChange={setRegUserType}
                                                    orientation="horizontal"
                                                    classNames={{
                                                        label: "text-sm font-semibold text-slate-500 mb-1"
                                                    }}
                                                >
                                                    <Radio value="resident">Resident</Radio>
                                                    <Radio value="committee">Committee Member</Radio>
                                                </RadioGroup>
                                            </div>

                                            {/* Common Fields */}
                                            <Input
                                                {...register("fullName", { required: "Full name is required" })}
                                                type="text"
                                                label="Full Name"
                                                placeholder="Enter full name"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.fullName}
                                                errorMessage={errors.fullName?.message}
                                                variant="bordered"
                                            />

                                            <Input
                                                {...register("email", { 
                                                    required: "Email address is required",
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: "Invalid email format"
                                                    }
                                                })}
                                                type="email"
                                                label="Email Address"
                                                placeholder="name@example.com"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.email}
                                                errorMessage={errors.email?.message}
                                                variant="bordered"
                                            />

                                            <Input
                                                {...register("password", { 
                                                    required: "Temporary password is required",
                                                    minLength: { value: 6, message: "Min length is 6 characters" }
                                                })}
                                                type="password"
                                                label="Temporary Password"
                                                placeholder="Minimum 6 characters"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.password}
                                                errorMessage={errors.password?.message}
                                                variant="bordered"
                                            />

                                            <Input
                                                {...register("phone")}
                                                type="text"
                                                label="Phone Number (Optional)"
                                                placeholder="Enter phone number"
                                                labelPlacement="outside"
                                                variant="bordered"
                                            />

                                            {/* Resident Specific Fields */}
                                            {regUserType === "resident" && (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <Input
                                                        {...register("unitNumber", { required: "Unit # is required" })}
                                                        type="text"
                                                        label="Unit Number"
                                                        placeholder="e.g. 101"
                                                        labelPlacement="outside"
                                                        isInvalid={!!errors.unitNumber}
                                                        errorMessage={errors.unitNumber?.message}
                                                        variant="bordered"
                                                    />

                                                    <Input
                                                        {...register("block", { required: "Block is required" })}
                                                        type="text"
                                                        label="Block"
                                                        placeholder="e.g. A"
                                                        labelPlacement="outside"
                                                        isInvalid={!!errors.block}
                                                        errorMessage={errors.block?.message}
                                                        variant="bordered"
                                                    />

                                                    <Controller
                                                        control={control}
                                                        name="ownershipStatus"
                                                        rules={{ required: "Status is required" }}
                                                        render={({ field }) => (
                                                            <div className="flex flex-col">
                                                                <Select
                                                                    placeholder="Select status"
                                                                    variant="bordered"
                                                                    onSelectionChange={(keys) => {
                                                                        const val = Array.from(keys)[0];
                                                                        field.onChange(val);
                                                                    }}
                                                                    selectedKeys={field.value ? [field.value] : []}
                                                                >
                                                                    <Label className="text-xs text-slate-500 font-semibold mb-1 block">Ownership</Label>
                                                                    <Select.Trigger className="w-full">
                                                                        <Select.Value />
                                                                        <Select.Indicator />
                                                                    </Select.Trigger>
                                                                    <Select.Popover>
                                                                        <ListBox>
                                                                            <ListBoxItem id="owner">Owner</ListBoxItem>
                                                                            <ListBoxItem id="tenant">Tenant</ListBoxItem>
                                                                        </ListBox>
                                                                    </Select.Popover>
                                                                </Select>
                                                                {errors.ownershipStatus && (
                                                                    <span className="text-[10px] text-danger mt-1">
                                                                        {errors.ownershipStatus.message}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {/* Committee Specific Fields */}
                                            {regUserType === "committee" && (
                                                <Input
                                                    {...register("designation", { required: "Designation is required" })}
                                                    type="text"
                                                    label="Designation / Role"
                                                    placeholder="e.g. Secretary, Treasurer"
                                                    labelPlacement="outside"
                                                    isInvalid={!!errors.designation}
                                                    errorMessage={errors.designation?.message}
                                                    variant="bordered"
                                                />
                                            )}
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
                                                Register Member
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
