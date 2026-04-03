"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/src/services/api";
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    adafruit_username: "",
    adafruit_api_key: "",

  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Gửi JSON body cho endpoint /register
      await apiClient.post(
        "auth/register", 
        formData
      );

      alert("Đăng ký thành công! Hãy đăng nhập.");
      router.push("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : detail || "Lỗi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Tạo tài khoản mới</h2>
        
        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          <input
            name="full_name"
            type="text"
            required
            className="w-full rounded-md border border-gray-300 p-3 focus:border-green-500 focus:outline-none"
            placeholder="Họ và tên"
            onChange={handleChange}
          />
          <input
            name="username"
            type="text"
            required
            className="w-full rounded-md border border-gray-300 p-3 focus:border-green-500 focus:outline-none"
            placeholder="Username"
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 p-3 focus:border-green-500 focus:outline-none"
            placeholder="Mật khẩu (ít nhất 8 ký tự)"
            onChange={handleChange}
          />
          <input
            name="adafruit_username"
            type="text"
            required
            className="w-full rounded-md border border-gray-300 p-3 focus:border-green-500 focus:outline-none"
            placeholder="Adafruit Username"
            onChange={handleChange}
          />
          <input
            name="adafruit_api_key"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 p-3 focus:border-green-500 focus:outline-none"
            placeholder="API Key của Adafruit"
            onChange={handleChange}
          />

          {error && <p className="text-sm text-red-500 italic">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Đang xử lý..." : "Đăng ký ngay"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
}