import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardHeader, CardContent, Button, Input, Select, ListBox, ListBoxItem, Label, Spinner, Modal } from "@heroui/react";
import { Megaphone, MessageSquare, Plus, Trash2, Calendar, ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";

export default function Announcements() {
    const { user: currentUser } = useAuthStore();
    const [announcements, setAnnouncements] = useState([]);
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
            content: "",
            targetAudience: "all"
        }
    });

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/announcements?limit=50");
            if (response.data?.success) {
                setAnnouncements(response.data.announcements || []);
            }
        } catch (error) {
            toast.error("Failed to load announcements feed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            const response = await api.delete(`/api/announcements/${id}`);
            if (response.data?.success) {
                toast.success("Announcement deleted successfully.");
                fetchAnnouncements();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete notice.");
        }
    };

    const onSubmit = async (data) => {
        try {
            const response = await api.post("/api/announcements", data);
            if (response.data?.success) {
                toast.success("Notice published successfully!");
                setIsModalOpen(false);
                reset();
                fetchAnnouncements();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to publish notice.");
        }
    };

    const canPublish = currentUser?.role === "admin" || currentUser?.role === "committee_member";

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Syncing notice board..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Announcements</h1>
                            <p className="text-sm text-slate-500">Official circulars, notifications, and alerts broadcasted to the society</p>
                        </div>
                    </div>

                    {canPublish && (
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                            className="font-semibold shadow-md shadow-indigo-100"
                        >
                            Publish Notice
                        </Button>
                    )}
                </div>

                {/* Announcement Cards List Grid */}
                <div className="flex flex-col gap-4">
                    {announcements.length === 0 ? (
                        <Card className="border border-slate-200/50 shadow-sm p-8 text-center max-w-lg mx-auto w-full mt-6">
                            <CardContent className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <MessageSquare size={24} />
                                </div>
                                <h3 className="font-semibold text-slate-700">No Announcements Found</h3>
                                <p className="text-sm text-slate-400">There are no notifications published matching your scope at this time.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        announcements.map((notice) => {
                            const isAuthor = notice.publishedBy?._id === currentUser?.id;
                            const isAdmin = currentUser?.role === "admin";
                            const showDelete = isAuthor || isAdmin;

                            return (
                                <Card key={notice._id} className="border border-slate-200/50 shadow-sm p-4 hover:shadow-md transition-shadow">
                                    <CardHeader className="flex gap-3 justify-between items-start pb-2 border-b border-slate-100/50">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-md font-bold text-slate-800">{notice.title}</h2>
                                                <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full ${
                                                    notice.targetAudience === "all"
                                                        ? "bg-slate-100 text-slate-600"
                                                        : notice.targetAudience === "residents"
                                                        ? "bg-indigo-50 text-indigo-600"
                                                        : "bg-amber-50 text-amber-600"
                                                }`}>
                                                    To: {notice.targetAudience}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold font-sans mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> 
                                                    {new Date(notice.createdAt).toLocaleDateString()} at {new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User size={12} /> 
                                                    By: {notice.publishedBy?.fullName || "Management"} ({notice.publishedBy?.designation || notice.publishedBy?.role || "System"})
                                                </span>
                                            </div>
                                        </div>

                                        {showDelete && (
                                            <Button 
                                                isIconOnly 
                                                color="danger" 
                                                variant="light" 
                                                size="sm" 
                                                onClick={() => handleDelete(notice._id)}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-4 text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                                        {notice.content}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Publish Modal Overlay */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                        <Modal.Backdrop>
                            <Modal.Container>
                                <Modal.Dialog>
                                    <Modal.CloseTrigger onClick={() => setIsModalOpen(false)} />
                                    <Modal.Header>
                                        <Modal.Heading>Publish Notice Board Circular</Modal.Heading>
                                    </Modal.Header>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Modal.Body className="flex flex-col gap-4">
                                            <Input
                                                {...register("title", { required: "Notice title is required" })}
                                                type="text"
                                                label="Notice Title"
                                                placeholder="e.g. Annual General Body Meeting 2026"
                                                labelPlacement="outside"
                                                isInvalid={!!errors.title}
                                                errorMessage={errors.title?.message}
                                                variant="bordered"
                                            />

                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-sm text-slate-500 font-semibold">Detailed Message</Label>
                                                <textarea
                                                    {...register("content", { required: "Content is required" })}
                                                    rows={5}
                                                    placeholder="Write notice circular content here..."
                                                    className="w-full rounded-xl border border-slate-200/80 p-3 text-slate-700 text-sm focus:border-indigo-600 focus:outline-none bg-transparent"
                                                />
                                                {errors.content && (
                                                    <span className="text-xs text-danger font-medium mt-0.5">
                                                        {errors.content.message}
                                                    </span>
                                                )}
                                            </div>

                                            <Controller
                                                control={control}
                                                name="targetAudience"
                                                rules={{ required: "Target audience is required" }}
                                                render={({ field }) => (
                                                    <div className="flex flex-col">
                                                        <Select
                                                            placeholder="Select target audience"
                                                            variant="bordered"
                                                            onSelectionChange={(keys) => {
                                                                const val = Array.from(keys)[0];
                                                                field.onChange(val);
                                                            }}
                                                            selectedKeys={field.value ? [field.value] : []}
                                                        >
                                                            <Label className="text-xs text-slate-500 font-semibold mb-1 block">Broadcast To</Label>
                                                            <Select.Trigger className="w-full">
                                                                <Select.Value />
                                                                <Select.Indicator />
                                                            </Select.Trigger>
                                                            <Select.Popover>
                                                                <ListBox>
                                                                    <ListBoxItem id="all">All Members</ListBoxItem>
                                                                    <ListBoxItem id="residents">Residents Only</ListBoxItem>
                                                                    <ListBoxItem id="committee">Committee Members Only</ListBoxItem>
                                                                </ListBox>
                                                            </Select.Popover>
                                                        </Select>
                                                        {errors.targetAudience && (
                                                            <span className="text-xs text-danger mt-1">
                                                                {errors.targetAudience.message}
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
                                                Publish Circular
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
