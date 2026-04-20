// /Register page

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/src/services/api";
import axios from "axios";
import {
  Shield,
  Thermometer,
  Sun,
  Network,
  ArrowRight,
  Sliders
} from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const full_name = formData.get("full_name") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    const adafruit_username = formData.get("adafruit_username") as string;
    const adafruit_api_key = formData.get("adafruit_api_key") as string;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      setLoading(false);
      return;
    }

    const payload = {
      full_name,
      username,
      password,
      adafruit_username,
      adafruit_api_key,
    };

    try {
      await apiClient.post("auth/register", payload);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      router.push("/login");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
          setLoading(false);
          return;
        }
        const detail = err.response?.data?.detail;
        setError(Array.isArray(detail) ? detail[0].msg : detail || "Lỗi đăng ký");
      } else {
        setError("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      
      {/* LEFT block */}
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

          {/* NỬA PHẢI: Form Đăng ký */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Create Account
          </h2>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Join the Lumina Home ecosystem today.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Full Name</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-lg bg-[#F3F4F6] p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="johndoe_home"
                  className="w-full rounded-lg bg-[#F3F4F6] p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-[#F3F4F6] p-3 text-sm tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Confirm Password</label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-[#F3F4F6] p-3 text-sm tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
            </div>

            {/* Adafruit IO Block */}
            <div className="rounded-2xl bg-[#F4F4F5] p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-800 uppercase">
                <Sliders className="h-4 w-4 text-[#1A73E8]" />
                Adafruit IO Integration
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Adafruit IO Username
                  </label>
                  <input
                    name="adafruit_username"
                    type="text"
                    required
                    placeholder="adafruit_user"
                    className="w-full rounded-lg bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Adafruit IO API Key
                  </label>
                  <input
                    name="adafruit_api_key"
                    type="password"
                    required
                    placeholder="aio_••••••••••••••••••••••••"
                    className="w-full rounded-lg bg-white p-3 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] p-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "Processing..." : "Initialize System"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Link to Login */}
          <p className="mt-8 text-center text-sm font-medium text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#1A73E8] hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}