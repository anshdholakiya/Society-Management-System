import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { toast } from "react-hot-toast";
import { Spinner } from "../../components/ui/Spinner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Verifying ledger credentials...");
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.fullName}!`, { id: toastId });

      // Role-aware redirections
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "committee_member") {
        navigate("/committee/dashboard");
      } else {
        navigate("/resident/dashboard");
      }
    } catch (error) {
      const errMsg = error.message || "Invalid email or password.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 relative p-8">

        {/* Decorative corner pin */}
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-accent rounded-full border border-primary/10 shadow-sm" />
        </div>

        {/* Form Title */}
        <div className="border-b border-primary/15 pb-4 mb-6 text-center">
          <h2 className="text-3xl font-display font-bold text-primary">Society Sign-in</h2>
          <p className="font-sans text-xs text-text/60 mt-1 uppercase tracking-wider font-semibold">
            Admin & Resident Portal
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul.sharma@example.com"
            error={errors.email}
            disabled={isSubmitting}
            required
            {...register("email", {
              required: "Email is required to sign in",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            disabled={isSubmitting}
            required
            {...register("password", {
              required: "Password is required to sign in",
            })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="border-surface" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer Notice */}
        <div className="border-t border-primary/10 pt-4 mt-6 text-center font-sans text-xs">
          <span className="text-text/75">No registered flat? </span>
          <span className="text-text/60 font-semibold block mt-1">
            Contact the society administrator to register.
          </span>
        </div>
      </Card>
    </div>
  );
}
