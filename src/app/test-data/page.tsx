"use client";
import { useEffect, useState } from "react";
import apiClient from "@/src/services/api";

export default function TestData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn chưa đăng nhập!");
        return;
      }

      try {
        const res = await apiClient.get("records/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        setError("Lỗi lấy dữ liệu: " + (err.response?.status === 401 ? "Token hết hạn" : "Lỗi server"));
      }
    };

    fetchData();
  }, []);

  if (error) return <div className="p-10 text-red-500">{error}</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Dữ liệu từ Adafruit (Dành cho User đã Login)</h1>
      <pre className="bg-gray-800 text-green-400 p-5 rounded-lg">
        {data ? JSON.stringify(data, null, 2) : "Đang tải..."}
      </pre>
      <button 
        onClick={() => { localStorage.removeItem("token"); window.location.href="/login"; }}
        className="mt-5 bg-red-500 text-white px-4 py-2 rounded"
      >
        Đăng xuất
      </button>
    </div>
  );
}