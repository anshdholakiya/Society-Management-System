import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { createResident, createCommittee, updateUser } from "../../api/users";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { X, Copy, Check, ShieldAlert, KeyRound, UserCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UserFormModal({ isOpen, onClose, user, role, onSubmitSuccess }) {
  const isEdit = !!user;
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Receipt state for new account credentials printout
  const [credentialsReceipt, setCredentialsReceipt] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      password: "",
      phone: user?.phone || "",
      block: user?.block || "",
      unitNumber: user?.unitNumber || "",
      ownershipStatus: user?.ownershipStatus || "",
      designation: user?.designation || "",
    }
  });

  const handleCopyCredentials = () => {
    if (!credentialsReceipt) return;
    const text = `Email: ${credentialsReceipt.email}\nPassword: ${credentialsReceipt.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    const label = role === "resident" ? "resident" : "committee member";
    const toastId = toast.loading(`${isEdit ? "Updating" : "Creating"} ${label}...`);

    try {
      if (isEdit) {
        const payload = {
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          ...(role === "resident" && {
            block: data.block.trim(),
            unitNumber: data.unitNumber.trim(),
            ownershipStatus: data.ownershipStatus,
          }),
          ...(role === "committee_member" && {
            designation: data.designation.trim(),
          })
        };
        await updateUser(user._id || user.id, payload);
        toast.success("Profile details updated successfully!", { id: toastId });
        onSubmitSuccess();
        onClose();
      } else {
        // Create account
        let res;
        if (role === "resident") {
          res = await createResident({
            fullName: data.fullName.trim(),
            email: data.email.trim(),
            password: data.password,
            phone: data.phone.trim(),
            block: data.block.trim(),
            unitNumber: data.unitNumber.trim(),
            ownershipStatus: data.ownershipStatus,
          });
        } else {
          res = await createCommittee({
            fullName: data.fullName.trim(),
            email: data.email.trim(),
            password: data.password,
            phone: data.phone.trim(),
            designation: data.designation.trim(),
          });
        }
        
        toast.success(`${label} registered successfully!`, { id: toastId });
        
        // Populate credentials receipt for copy action
        setCredentialsReceipt({
          email: data.email.trim(),
          password: data.password,
          fullName: data.fullName.trim(),
          role: role
        });
      }
    } catch (err) {
      toast.error(err.message || `Failed to process ${label} account.`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
      
      {/* Dynamic Display: Show credentials receipt on success */}
      {credentialsReceipt ? (
        <div className="bg-surface border border-primary/20 rounded-md max-w-sm w-full relative flex flex-col shadow-lg animate-fade-in text-left">
          
          <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
            <h4 className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-success" />
              Credentials Created
            </h4>
            <button 
              onClick={() => {
                setCredentialsReceipt(null);
                onSubmitSuccess();
                onClose();
              }}
              className="text-text/75 hover:text-primary p-1 rounded-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 font-sans">
            <div className="border border-success/30 bg-success/5 p-3.5 rounded-[3px] text-xs leading-relaxed text-success select-none">
              Account created successfully! Copy the credentials below and provide them manually to the member.
            </div>

            <div className="p-4 border border-primary/10 rounded-[3px] bg-primary/5 space-y-3 font-mono text-xs select-all">
              <div>
                <span className="text-text/50">Full Name:</span>
                <span className="font-bold text-primary block mt-0.5">{credentialsReceipt.fullName}</span>
              </div>
              <div>
                <span className="text-text/50">Role:</span>
                <span className="font-bold text-primary uppercase block mt-0.5">{credentialsReceipt.role}</span>
              </div>
              <div className="border-t border-primary/10 pt-2">
                <span className="text-text/50">Username (Email):</span>
                <span className="font-bold text-primary block mt-0.5">{credentialsReceipt.email}</span>
              </div>
              <div>
                <span className="text-text/50">Password:</span>
                <span className="font-bold text-accent block mt-0.5">{credentialsReceipt.password}</span>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-4 flex justify-between items-center select-none">
              <span className="text-[10px] text-text/40 italic">Provide manually via secure channels.</span>
              <Button 
                onClick={handleCopyCredentials}
                variant="primary" 
                size="sm"
                className="gap-1.5 text-xs px-3.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Credentials"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Regular User Form */
        <div className="bg-surface border border-primary/20 rounded-md max-w-md w-full relative flex flex-col shadow-lg animate-fade-in text-left">
          
          <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
            <div>
              <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">
                {role === "resident" ? "Resident registry" : "Committee board"}
              </span>
              <h4 className="font-display font-bold text-sm text-primary -mt-0.5">
                {isEdit ? "Edit Profile Details" : `Register New ${role === "resident" ? "Resident" : "Committee"}`}
              </h4>
            </div>
            <button 
              onClick={onClose} 
              className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] font-sans">
            
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              error={errors.fullName?.message}
              disabled={submitting}
              {...register("fullName", { required: "Full name is required" })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email (Username)"
                type="email"
                placeholder="e.g. john@gmail.com"
                error={errors.email?.message}
                disabled={submitting || isEdit}
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address format"
                  }
                })}
              />
              <Input
                label="Phone number"
                placeholder="10-digit mobile"
                error={errors.phone?.message}
                disabled={submitting}
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be exactly 10 digits"
                  }
                })}
              />
            </div>

            {/* Password - Only shown during account creation */}
            {!isEdit && (
              <Input
                label="Starting Password"
                type="text"
                placeholder="Minimum 6 characters"
                error={errors.password?.message}
                disabled={submitting}
                {...register("password", { 
                  required: "Password is required for registration",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
                })}
              />
            )}

            {/* Resident fields */}
            {role === "resident" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Block / Wing"
                    placeholder="e.g. C"
                    error={errors.block?.message}
                    disabled={submitting}
                    {...register("block", { required: "Block is required" })}
                  />
                  <Input
                    label="Unit / Flat Number"
                    placeholder="e.g. 102"
                    error={errors.unitNumber?.message}
                    disabled={submitting}
                    {...register("unitNumber", { required: "Unit number is required" })}
                  />
                </div>

                <Select
                  label="Ownership Type"
                  placeholder="Select ownership type..."
                  disabled={submitting}
                  error={errors.ownershipStatus?.message}
                  {...register("ownershipStatus", { required: "Ownership status is required" })}
                  options={[
                    { value: "owner", label: "Owner" },
                    { value: "tenant", label: "Tenant" },
                  ]}
                />
              </>
            )}

            {/* Committee Designation fields */}
            {role === "committee_member" && (
              <Input
                label="Committee Designation"
                placeholder="e.g. Treasurer / Secretary"
                error={errors.designation?.message}
                disabled={submitting}
                {...register("designation", { required: "Designation is required" })}
              />
            )}

            <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={submitting}
                className="gap-2 min-w-32"
              >
                {submitting ? <Spinner size="sm" /> : (isEdit ? "Save Details" : "Register Account")}
              </Button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
