import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { updateUser } from "../../api/users";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { toast } from "react-hot-toast";
import { Spinner } from "../../components/ui/Spinner";
import { ShieldCheck, User } from "lucide-react";

export default function Profile() {
  const { user, refetchUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  // Sync form default values if user context loads later
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    if (!user?._id) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating registrar profile card...");
    try {
      // Send ONLY the permitted editable fields to prevent backend rejection
      await updateUser(user._id, {
        fullName: data.fullName,
        phone: data.phone,
      });
      
      // Update global context profile (updates header & sidebar immediately)
      await refetchUser();
      
      toast.success("Profile ledger card updated successfully!", { id: toastId });
    } catch (error) {
      const errMsg = error.message || "Failed to update profile details.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-left font-sans animate-fade-in max-w-2xl">
      
      {/* Page Title Header */}
      <div className="mb-4 text-xs font-mono tracking-wider text-text/50 uppercase select-none">
        Resident Ledger / Profile Card
      </div>
      <div className="flex justify-between items-start border-b border-primary/15 pb-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Member Profile</h2>
          <p className="text-sm font-sans text-text/70 mt-1">Official Society Directory Records</p>
        </div>
        {user && <StampBadge status={user.isActive !== false ? "Active" : "Deactivated"} />}
      </div>

      <Card className="border border-primary/10 relative p-8">
        
        {/* Decorative corner pin */}
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-accent rounded-full border border-primary/10 shadow-sm" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="font-display font-semibold text-lg text-primary border-b border-primary/5 pb-2 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-accent stroke-[1.5]" />
            Personal Identification Card
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editable Fields */}
            <Input
              label="Full Legal Name"
              placeholder="e.g. Jane Resident"
              error={errors.fullName}
              disabled={isSubmitting}
              required
              {...register("fullName", {
                required: "Full name is required for identification",
                minLength: { value: 3, message: "Name must be at least 3 characters" },
              })}
            />

            <Input
              label="Contact Phone Number"
              placeholder="e.g. 9876543210"
              error={errors.phone}
              disabled={isSubmitting}
              maxLength={10}
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Please enter exactly 10 digits",
                },
              })}
            />
          </div>

          <h3 className="font-display font-semibold text-lg text-primary border-b border-primary/5 pb-2 pt-4 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success stroke-[1.5]" />
            Locked Administrative Metadata
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Locked/Disabled Fields - Genuinely disabled and excluded from form submission */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-xs font-semibold text-primary/60 block select-none">
                Registered Email (Read-Only)
              </label>
              <input
                type="text"
                value={user?.email || ""}
                disabled
                className="w-full bg-background/50 text-text/60 text-sm border border-primary/10 rounded-[4px] px-3 py-2 cursor-not-allowed font-sans select-none"
              />
            </div>

            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-xs font-semibold text-primary/60 block select-none">
                Flat Unit Address (Read-Only)
              </label>
              <input
                type="text"
                value={user?.block && user?.unitNumber ? `Block ${user.block} - ${user.unitNumber}` : ""}
                disabled
                className="w-full bg-background/50 text-text/60 text-sm border border-primary/10 rounded-[4px] px-3 py-2 cursor-not-allowed font-sans select-none"
              />
            </div>

            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-xs font-semibold text-primary/60 block select-none">
                Ownership Profile Status (Read-Only)
              </label>
              <input
                type="text"
                value={user?.ownershipStatus ? (user.ownershipStatus === "owner" ? "Flat Owner" : "Tenant") : ""}
                disabled
                className="w-full bg-background/50 text-text/60 text-sm border border-primary/10 rounded-[4px] px-3 py-2 cursor-not-allowed font-sans select-none uppercase font-mono text-xs"
              />
            </div>

            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-xs font-semibold text-primary/60 block select-none">
                Registry Account Type (Read-Only)
              </label>
              <input
                type="text"
                value={user?.role?.replace("_", " ") || ""}
                disabled
                className="w-full bg-background/50 text-text/60 text-sm border border-primary/10 rounded-[4px] px-3 py-2 cursor-not-allowed font-sans select-none uppercase font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-primary/5 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="px-6 py-2.5 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="border-surface" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <span>Update Profile Card</span>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
