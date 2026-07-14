import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <span className="text-4xl font-extrabold">404</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Page Not Found</h1>
                    <p className="text-sm text-slate-500 mt-1">The page you are looking for does not exist or has been moved.</p>
                </div>
                <Button as={Link} to="/" color="primary" startContent={<Home size={16} />} className="font-semibold shadow-md shadow-indigo-100">
                    Back to Home
                </Button>
            </div>
        </div>
    );
}
