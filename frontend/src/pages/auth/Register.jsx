import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/auth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { Spinner } from "../../components/ui/Spinner";

export default function Register() {
  const { refetchUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      unitNumber: "",
      block: "",
      ownershipStatus: "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting resident intake registration...");
    try {
      await registerUser(data);
      // Backend automatically sets HttpOnly auth cookie on successful registration
      await refetchUser();
      
      toast.success("Registration successful! Welcome to the society.", { id: toastId });
      navigate("/resident/dashboard");
    } catch (error) {
      const errMsg = error.message || "Registration failed. Email might already be registered.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 relative p-8">
        
        {/* Decorative corner pin */}
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-accent rounded-full border border-primary/10 shadow-sm" />
        </div>

        {/* Form Title */}
        <div className="border-b border-primary/15 pb-4 mb-6 text-center">
          <h2 className="text-3xl font-display font-bold text-primary">Resident Registration</h2>
          <p className="font-sans text-xs text-text/60 mt-1 uppercase tracking-wider font-semibold">
            Create your Resident Account
          </p>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name"
              placeholder="e.g. Jane Resident"
              error={errors.fullName}
              disabled={isSubmitting}
              required
              {...register("fullName", {
                required: "Full name is required",
                minLength: { value: 3, message: "Name must be at least 3 characters" },
              })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. jane.res@example.com"
              error={errors.email}
              disabled={isSubmitting}
              required
              {...register("email", {
                required: "Email address is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address",
                },
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              error={errors.password}
              disabled={isSubmitting}
              required
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              error={errors.phone}
              disabled={isSubmitting}
              {...register("phone", {
                pattern: {
                  value: /^\+?[0-9]{10,12}$/,
                  message: "Please enter a valid contact phone number",
                },
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Flat / Unit Number"
              placeholder="e.g. 102"
              error={errors.unitNumber}
              disabled={isSubmitting}
              required
              {...register("unitNumber", {
                required: "Unit is required",
              })}
            />

            <Input
              label="Wing / Block"
              placeholder="e.g. C"
              error={errors.block}
              disabled={isSubmitting}
              required
              {...register("block", {
                required: "Block is required",
              })}
            />

            <Select
              label="Ownership Status"
              placeholder="Choose..."
              error={errors.ownershipStatus}
              disabled={isSubmitting}
              required
              options={[
                { value: "owner", label: "Flat Owner" },
                { value: "tenant", label: "Tenant" },
              ]}
              {...register("ownershipStatus", {
                required: "Ownership status is required",
              })}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="border-surface" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="border-t border-primary/10 pt-4 mt-6 text-center font-sans text-xs">
          <span className="text-text/70">Already registered? </span>
          <Link to="/login" className="text-accent underline font-semibold hover:text-accent/80">
            Go to Office Sign-in
          </Link>
        </div>
      </Card>
    </div>
  );
}
