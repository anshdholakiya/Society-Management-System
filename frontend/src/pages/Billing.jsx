import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Select, ListBox, ListBoxItem, Label, Spinner, Modal, Card, CardContent
} from "@heroui/react";
import { CreditCard, Plus, FileText, Trash2, Calendar, User, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function Billing() {
    const { user: currentUser } = useAuthStore();
    const [bills, setBills] = useState([]);
    const [residents, setResidents] = useState([]);
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
            resident: "",
            amount: "",
            dueDate: "",
            billingPeriod: ""
        }
    });

    const fetchBills = async () => {
        try {
            const response = await api.get("/api/bills?limit=50");
            if (response.data?.success) {
                setBills(response.data.bills || []);
            }
        } catch (error) {
            toast.error("Failed to fetch billing invoices.");
        }
    };

    const fetchResidents = async () => {
        try {
            const response = await api.get("/api/users/residents?limit=100");
            if (response.data?.success) {
                setResidents(response.data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch residents", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchBills();
        if (currentUser?.role === "admin") {
            await fetchResidents();
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this bill?")) return;
        try {
            const response = await api.delete(`/api/bills/${id}`);
            if (response.data?.success) {
                toast.success("Bill deleted successfully.");
                fetchBills();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete bill.");
        }
    };

    const onSubmit = async (data) => {
        try {
            const response = await api.post("/api/bills", {
                resident: data.resident,
                amount: Number(data.amount),
                dueDate: data.dueDate,
                billingPeriod: data.billingPeriod
            });
            if (response.data?.success) {
                toast.success("Maintenance invoice generated successfully.");
                setIsModalOpen(false);
                reset();
                fetchBills();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate bill.");
        }
    };

    const isAdmin = currentUser?.role === "admin";

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Accessing invoices ledger..." />
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
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Maintenance Invoices</h1>
                            <p className="text-sm text-slate-500">View generated bills, billing history, or generate new society maintenance receipts</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                            className="font-semibold shadow-md shadow-indigo-100"
                        >
                            Generate Bill
                        </Button>
                    )}
                </div>

                {/* Table Viewport */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                    {bills.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <FileText size={24} />
                            </div>
                            <h3 className="font-semibold text-slate-700">No Invoices Found</h3>
                            <p className="text-sm text-slate-400">
                                {isAdmin 
                                    ? "No maintenance bills have been generated in the system yet." 
                                    : "You have no bills generated on your account."}
                            </p>
                        </div>
                    ) : (
                        <Table aria-label="Maintenance Invoices Table" removeWrapper shadow="none" className="min-w-full">
                            <TableHeader>
                                <TableColumn className="font-bold text-slate-500">BILLING PERIOD</TableColumn>
                                {isAdmin && <TableColumn className="font-bold text-slate-500">RESIDENT</TableColumn>}
                                <TableColumn className="font-bold text-slate-500">AMOUNT</TableColumn>
                                <TableColumn className="font-bold text-slate-500">DUE DATE</TableColumn>
                                <TableColumn className="font-bold text-slate-500">STATUS</TableColumn>
                                {isAdmin && <TableColumn className="font-bold text-slate-500 text-right">ACTION</TableColumn>}
                            </TableHeader>
                            <TableBody>
                                {bills.map((bill) => (
                                    <TableRow key={bill._id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-800 text-sm">
                                            {bill.billingPeriod}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-slate-600 font-medium text-xs">
                                                <div className="flex flex-col">
                                                    <span>{bill.resident?.fullName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{bill.resident?.block}-{bill.resident?.unitNumber}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell className="font-bold text-slate-700">₹{bill.amount}</TableCell>
                                        <TableCell className="text-slate-500 font-sans text-xs">
                                            {new Date(bill.dueDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                                bill.status === "paid" 
                                                    ? "bg-emerald-50 text-emerald-600" 
                                                    : "bg-rose-50 text-rose-600"
                                            }`}>
                                                {bill.status}
                                            </span>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                {bill.status === "unpaid" && (
                                                    <Button 
                                                        isIconOnly 
                                                        color="danger" 
                                                        variant="light" 
                                                        onClick={() => handleDelete(bill._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Generate Bill Modal Overlay */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Generate Maintenance Invoice</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <Controller
                                                control={control}
                                                name="resident"
                                                rules={{ required: "Resident selection is required" }}
                                                render={({ field }) => (
                                                    <div className="flex flex-col">
                                                        <Select
                                                            placeholder="Select resident"
                                                            variant="bordered"
                                                            onSelectionChange={(keys) => {
                                                                const val = Array.from(keys)[0];
                                                                field.onChange(val);
                                                            }}
                                                            selectedKeys={field.value ? [field.value] : []}
                                                        >
                                                            <Label className="text-xs text-slate-500 font-semibold mb-1 block">Resident Account</Label>
                                                            <Select.Trigger className="w-full">
                                                                <Select.Value />
                                                                <Select.Indicator />
                                                            </Select.Trigger>
                                                            <Select.Popover>
                                                                <ListBox>
                                                                    {residents.map((r) => (
                                                                        <ListBoxItem key={r._id} id={r._id}>
                                                                            {r.fullName} ({r.block}-{r.unitNumber})
                                                                        </ListBoxItem>
                                                                    ))}
                                                                </ListBox>
                                                            </Select.Popover>
                                                        </Select>
                                                        {errors.resident && (
                                                            <span className="text-xs text-danger mt-1">
                                                                {errors.resident.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />

                                            <Input
                                                {...register("amount", { 
                                                    required: "Amount is required",
                                                    min: { value: 1, message: "Amount must be greater than 0" }
                                                })}
                                                type="number"
                                                label="Billing Amount (INR)"
                                                placeholder="e.g. 2500"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.amount}
                                                errorMessage={errors.amount?.message}
                                                variant="bordered"
                                            />

                                            <Input
                                                {...register("dueDate", { required: "Due date is required" })}
                                                type="date"
                                                label="Invoice Due Date"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.dueDate}
                                                errorMessage={errors.dueDate?.message}
                                                variant="bordered"
                                            />

                                            <Input
                                                {...register("billingPeriod", { required: "Billing period is required" })}
                                                type="text"
                                                label="Billing Period / Month"
                                                placeholder="e.g. July 2026"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.billingPeriod}
                                                errorMessage={errors.billingPeriod?.message}
                                                variant="bordered"
                                            />
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
                                                Generate Invoice
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
