import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Select, ListBox, Label, Spinner, Modal, Card, CardContent
} from "@heroui/react";
import { Landmark, Plus, FileText, CheckCircle2, History, CreditCard, Receipt, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function Payments() {
    const { user: currentUser } = useAuthStore();
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            amountPaid: "",
            paymentMethod: "cash",
            transactionId: ""
        }
    });

    // Watch paymentMethod to conditionally require transactionId
    const watchedPaymentMethod = watch("paymentMethod");

    const fetchUnpaidBills = async () => {
        try {
            const response = await api.get("/api/bills?status=unpaid&limit=50");
            if (response.data?.success) {
                setUnpaidBills(response.data.bills || []);
            }
        } catch (error) {
            console.error("Failed to fetch unpaid bills", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const response = await api.get("/api/payments?limit=50");
            if (response.data?.success) {
                setPayments(response.data.payments || []);
            }
        } catch (error) {
            toast.error("Failed to load payment transactions history.");
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchPayments();
        if (currentUser?.role === "admin") {
            await fetchUnpaidBills();
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const handleRecordPaymentClick = (bill) => {
        setSelectedBill(bill);
        setValue("amountPaid", bill.amount.toString());
        setValue("paymentMethod", "cash");
        setValue("transactionId", "");
        setIsModalOpen(true);
    };

    const onSubmit = async (data) => {
        // Validation logic matching Patch 2
        if (["online", "cheque"].includes(data.paymentMethod) && (!data.transactionId || !data.transactionId.trim())) {
            toast.error("Transaction Reference ID is strictly required for online/cheque methods.");
            return;
        }

        try {
            const response = await api.post("/api/payments", {
                bill: selectedBill._id,
                amountPaid: Number(data.amountPaid),
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId
            });
            if (response.data?.success) {
                toast.success("Payment transaction recorded successfully!");
                setIsModalOpen(false);
                reset();
                loadData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to record payment.");
        }
    };

    const isAdmin = currentUser?.role === "admin";

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Fetching payments ledger..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header title */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payments Desk</h1>
                        <p className="text-sm text-slate-500">Record maintenance receipts, manage payments, and audit society transaction histories</p>
                    </div>
                </div>

                {/* Unpaid Bills Section (Admin only) */}
                {isAdmin && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
                            <Landmark size={18} className="text-slate-500" />
                            Outstanding Bills Awaiting Payment ({unpaidBills.length})
                        </h2>
                        
                        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                            {unpaidBills.length === 0 ? (
                                <div className="text-center py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <CheckCircle2 className="text-emerald-500" size={32} />
                                    <span className="text-sm font-semibold text-slate-700">All balances cleared!</span>
                                    <span className="text-xs">No pending maintenance invoices await payment.</span>
                                </div>
                            ) : (
                                <Table aria-label="Unpaid Bills Ledger" removeWrapper shadow="none" className="min-w-full">
                                    <TableHeader>
                                        <TableColumn className="font-bold text-slate-500">BILLING PERIOD</TableColumn>
                                        <TableColumn className="font-bold text-slate-500">RESIDENT</TableColumn>
                                        <TableColumn className="font-bold text-slate-500">DUE DATE</TableColumn>
                                        <TableColumn className="font-bold text-slate-500">AMOUNT DUE</TableColumn>
                                        <TableColumn className="font-bold text-slate-500 text-right">ACTION</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {unpaidBills.map((bill) => (
                                            <TableRow key={bill._id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-bold text-slate-800 text-sm">{bill.billingPeriod}</TableCell>
                                                <TableCell className="text-slate-600 font-medium text-xs">
                                                    <div className="flex flex-col">
                                                        <span>{bill.resident?.fullName}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{bill.resident?.block}-{bill.resident?.unitNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-sans text-xs">
                                                    {new Date(bill.dueDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-bold text-rose-600">₹{bill.amount}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        size="sm" 
                                                        color="primary" 
                                                        className="font-semibold shadow-sm"
                                                        onClick={() => handleRecordPaymentClick(bill)}
                                                    >
                                                        Record Payment
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                )}

                {/* Ledger History Feed */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-slate-500" />
                        Transactions History Ledger ({payments.length})
                    </h2>
                    
                    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden p-4">
                        {payments.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No logged payment transactions exist on the society ledger database.
                            </div>
                        ) : (
                            <Table aria-label="Transactions Ledger History" removeWrapper shadow="none" className="min-w-full">
                                <TableHeader>
                                    <TableColumn className="font-bold text-slate-500">BILLING PERIOD</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">RESIDENT</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">PAYMENT DATE</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">PAYMENT METHOD</TableColumn>
                                    <TableColumn className="font-bold text-slate-500">REF CODE</TableColumn>
                                    <TableColumn className="font-bold text-slate-500 text-right">AMOUNT PAID</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p._id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-700 text-sm">{p.bill?.billingPeriod || "N/A"}</TableCell>
                                            <TableCell className="text-slate-600 font-medium text-xs">
                                                <div className="flex flex-col">
                                                    <span>{p.resident?.fullName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{p.resident?.block}-{p.resident?.unitNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-sans text-xs">
                                                {new Date(p.paymentDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-semibold capitalize bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">
                                                    {p.paymentMethod}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-500">{p.transactionId || "-"}</TableCell>
                                            <TableCell className="font-bold text-emerald-600 text-right">₹{p.amountPaid}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Record Payment Modal Overlay */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Record Invoice Payment</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-3.5 flex flex-col gap-1 text-sm mb-1 text-slate-700">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Resident:</span>
                                                    <span className="font-bold">{selectedBill?.resident?.fullName} ({selectedBill?.resident?.block}-{selectedBill?.resident?.unitNumber})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Billing Period:</span>
                                                    <span className="font-bold">{selectedBill?.billingPeriod}</span>
                                                </div>
                                                <div className="flex justify-between mt-1 pt-1.5 border-t border-indigo-100/50">
                                                    <span className="font-medium">Due Balance:</span>
                                                    <span className="font-extrabold text-rose-600">₹{selectedBill?.amount}</span>
                                                </div>
                                            </div>

                                            <Input
                                                {...register("amountPaid", { 
                                                    required: "Amount paid is required",
                                                    min: { value: 1, message: "Amount must be greater than 0" }
                                                })}
                                                type="number"
                                                label="Amount Received (INR)"
                                                placeholder="e.g. 2500"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.amountPaid}
                                                errorMessage={errors.amountPaid?.message}
                                                variant="bordered"
                                            />

                                            <Controller
                                                control={control}
                                                name="paymentMethod"
                                                rules={{ required: "Payment method is required" }}
                                                render={({ field }) => (
                                                    <div className="flex flex-col">
                                                        <Select
                                                            placeholder="Select payment method"
                                                            variant="bordered"
                                                            onSelectionChange={(keys) => {
                                                                const val = Array.from(keys)[0];
                                                                field.onChange(val);
                                                            }}
                                                            selectedKeys={field.value ? [field.value] : []}
                                                        >
                                                            <Label className="text-xs text-slate-500 font-semibold mb-1 block">Payment Method</Label>
                                                            <Select.Trigger className="w-full">
                                                                <Select.Value />
                                                                <Select.Indicator />
                                                            </Select.Trigger>
                                                            <Select.Popover>
                                                                <ListBox>
                                                                    <ListBox.Item id="cash">Cash</ListBox.Item>
                                                                    <ListBox.Item id="cheque">Cheque</ListBox.Item>
                                                                    <ListBox.Item id="online">Online / UPI</ListBox.Item>
                                                                </ListBox>
                                                            </Select.Popover>
                                                        </Select>
                                                        {errors.paymentMethod && (
                                                            <span className="text-xs text-danger mt-1">
                                                                {errors.paymentMethod.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />

                                            {/* Transaction Reference ID - required for Online / Cheque */}
                                            {["online", "cheque"].includes(watchedPaymentMethod) && (
                                                <Input
                                                    {...register("transactionId", { 
                                                        required: "Transaction Reference ID is strictly required for online/cheque payments" 
                                                    })}
                                                    type="text"
                                                    label="Transaction / Cheque Reference ID"
                                                    placeholder="e.g. TXN98273641 or Cheque No."
                                                    labelPlacement="outside"
                                                    isInvalid={!!errors.transactionId}
                                                    errorMessage={errors.transactionId?.message}
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
                                                Confirm Payment
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
