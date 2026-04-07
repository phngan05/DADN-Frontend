"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/src/services/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await apiClient.post(
        "/auth/login", 
        formData
      );

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("userId", response.data.user_id);
      alert("Đăng nhập thành công!");
      router.push("/test-data"); 
    } catch (err) {
      setError(err.response?.data?.detail || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Test Đăng Nhập</h2>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="text"
              required
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}