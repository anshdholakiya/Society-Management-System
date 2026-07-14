import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, Input, Button, Link } from "@heroui/react";
import { Mail, Lock, Eye, EyeOff, Building } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

export default function Login() {
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

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
        const result = await login(data.email, data.password);
        if (result.success) {
            toast.success(`Welcome back, ${result.user.fullName}!`);
            // Route users based on their custom RBAC roles
            if (result.user.role === "admin") {
                navigate("/admin");
            } else if (result.user.role === "committee_member") {
                navigate("/committee");
            } else {
                navigate("/resident");
            }
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <Card className="w-full max-w-md border border-slate-200/50 p-4 shadow-xl">
                <CardHeader className="flex flex-col items-center gap-1 pb-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                        <Building size={24} />
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">Welcome Back</h1>
                    <p className="text-sm text-slate-500">Sign in to access your society portal</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <Input
                            {...register("email", {
                                required: "Email address is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address format",
                                },
                            })}
                            type="email"
                            label="Email Address"
                            placeholder="you@example.com"
                            labelPlacement="outside"
                            startContent={<Mail className="pointer-events-none text-slate-400" size={18} />}
                            isInvalid={!!errors.email}
                            errorMessage={errors.email?.message}
                            variant="bordered"
                            className="text-slate-700"
                        />

                        <Input
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters long",
                                },
                            })}
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            placeholder="Enter your password"
                            labelPlacement="outside"
                            startContent={<Lock className="pointer-events-none text-slate-400" size={18} />}
                            endContent={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="text-slate-400" size={18} />
                                    ) : (
                                        <Eye className="text-slate-400" size={18} />
                                    )}
                                </button>
                            }
                            isInvalid={!!errors.password}
                            errorMessage={errors.password?.message}
                            variant="bordered"
                            className="text-slate-700"
                        />

                        <Button
                            type="submit"
                            color="primary"
                            className="mt-2 font-semibold shadow-md shadow-indigo-200"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center pt-4">
                    <p className="text-sm text-slate-600">
                        Don't have an account?{" "}
                        <Link as={RouterLink} to="/register" size="sm" className="font-semibold text-indigo-600">
                            Register as Resident
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
