// /Login page
"use client";
import { useState,} from "react";
import { useRouter } from "next/navigation";
import { login } from "@/src/services/auth";
import Link from "next/link";
import { 
  Shield, 
  Thermometer, 
  Sun, 
  Network, 
  ArrowRight, 
  LayoutGrid 
} from "lucide-react";


export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    setError("");

    // get data from form using FormData API
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    try {
      await login(identifier, password);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Thông tin đăng nhập không chính xác. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* left */}
      <div className="hidden w-1/2 flex-col justify-center bg-[#F4F8FB] p-12 lg:flex xl:p-24">
        <div className="max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#1A73E8]">
            COMHOME
          </h1>
          <p className="mt-6 text-2xl font-medium leading-snug text-gray-800">
            Transform your house into an AI-powered smart home.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="flex h-32 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
              <Shield className="h-6 w-6 text-[#1A73E8]" />
              <p className="text-sm font-medium text-gray-700">Advanced encryption & AI monitoring</p>
            </div>
            <div className="flex h-32 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
              <Thermometer className="h-6 w-6 text-[#1A73E8]" />
              <p className="text-sm font-medium text-gray-700">Smart thermal regulation</p>
            </div>
            <div className="flex h-32 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
              <Sun className="h-6 w-6 text-[#1A73E8]" />
              <p className="text-sm font-medium text-gray-700">Circadian rhythm synchronization</p>
            </div>
            <div className="flex h-32 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
              <Network className="h-6 w-6 text-[#1A73E8]" />
              <p className="text-sm font-medium text-gray-700">Unified device ecosystem</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Access your intelligent ecosystem
          </p>

          <form className="mt-10 space-y-6" action={handleLogin}>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email or Username
              </label>
              <input
                name="identifier" // name to get data in FormData
                type="text"
                required
                placeholder="alex@concierge.io"
                className="w-full rounded-lg bg-[#F3F4F6] p-4 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-[#1A73E8] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                name="password" // name to get data in FormData
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg bg-[#F3F4F6] p-4 text-base tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] p-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "Signing in..." : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          {/* Other Links */}
          <div className="mt-8 flex flex-col items-center space-y-6">
            <p className="text-sm text-gray-600">
              New to ComHome?{" "}
              <Link href="/register" className="font-semibold text-[#1A73E8] hover:underline">
                Create Account
              </Link>
            </p>

            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              <LayoutGrid className="h-4 w-4" />
              Request Access
            </button>
          </div>  

          {/* Footer Text */}
          <p className="mt-16 text-center text-xs font-bold tracking-widest text-gray-400 uppercase">
            Enterprise Secure Connection • Lumina OS V4.2
          </p>
        </div>
      </div>

    </div>
  );
}