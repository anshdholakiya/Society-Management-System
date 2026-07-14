import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, Input, Button, Link, Select, ListBox, ListBoxItem, Label } from "@heroui/react";
import { User, Mail, Lock, Phone, Hash, Eye, EyeOff, Building } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

export default function Register() {
    const { register: registerAuth, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        control,
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
        const result = await registerAuth(data);
        if (result.success) {
            toast.success("Account created successfully! Welcome to the society.");
            navigate("/resident"); // Public registration defaults to resident dashboard
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <Card className="w-full max-w-lg border border-slate-200/50 p-4 shadow-xl">
                <CardHeader className="flex flex-col items-center gap-1 pb-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                        <Building size={24} />
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">Create Resident Account</h1>
                    <p className="text-sm text-slate-500">Register to connect with your society</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                {...register("fullName", { required: "Full name is required" })}
                                type="text"
                                label="Full Name"
                                placeholder="John Doe"
                                labelPlacement="outside"
                                startContent={<User className="pointer-events-none text-slate-400" size={18} />}
                                isInvalid={!!errors.fullName}
                                errorMessage={errors.fullName?.message}
                                variant="bordered"
                                className="text-slate-700"
                            />

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
                                placeholder="john@example.com"
                                labelPlacement="outside"
                                startContent={<Mail className="pointer-events-none text-slate-400" size={18} />}
                                isInvalid={!!errors.email}
                                errorMessage={errors.email?.message}
                                variant="bordered"
                                className="text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                placeholder="Min. 6 characters"
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

                            <Input
                                {...register("phone")}
                                type="text"
                                label="Phone Number (Optional)"
                                placeholder="10-digit number"
                                labelPlacement="outside"
                                startContent={<Phone className="pointer-events-none text-slate-400" size={18} />}
                                variant="bordered"
                                className="text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Input
                                {...register("unitNumber", { required: "Flat/Unit is required" })}
                                type="text"
                                label="Unit Number"
                                placeholder="e.g. 101"
                                labelPlacement="outside"
                                startContent={<Hash className="pointer-events-none text-slate-400" size={18} />}
                                isInvalid={!!errors.unitNumber}
                                errorMessage={errors.unitNumber?.message}
                                variant="bordered"
                                className="text-slate-700"
                            />

                            <Input
                                {...register("block", { required: "Block/Wing is required" })}
                                type="text"
                                label="Block / Wing"
                                placeholder="e.g. A"
                                labelPlacement="outside"
                                startContent={<Building className="pointer-events-none text-slate-400" size={18} />}
                                isInvalid={!!errors.block}
                                errorMessage={errors.block?.message}
                                variant="bordered"
                                className="text-slate-700"
                            />

                            <Controller
                                control={control}
                                name="ownershipStatus"
                                rules={{ required: "Ownership status is required" }}
                                render={({ field }) => (
                                    <div className="flex flex-col">
                                        <Select
                                            placeholder="Select status"
                                            variant="bordered"
                                            className="text-slate-700"
                                            onSelectionChange={(keys) => {
                                                const selectedValue = Array.from(keys)[0];
                                                field.onChange(selectedValue);
                                            }}
                                            selectedKeys={field.value ? [field.value] : []}
                                        >
                                            <Label className="text-sm text-slate-500 font-medium mb-1 block">Ownership Status</Label>
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
                                            <span className="text-[11px] text-danger mt-1">
                                                {errors.ownershipStatus.message}
                                            </span>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            color="primary"
                            className="mt-4 font-semibold shadow-md shadow-indigo-200"
                            isLoading={isLoading}
                        >
                            Create Account
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center pt-4">
                    <p className="text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link as={RouterLink} to="/login" size="sm" className="font-semibold text-indigo-600">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
