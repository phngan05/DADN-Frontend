// app/dashboard/page.js
"use client";
import { useEffect, useState } from "react";
import apiClient from "@/src/services/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
export default function Dashboard() {
  const [sensorData, setSensorData] = useState({humidity: null, temperature: null});
  const userId = Cookies.get("userId");
  const token = Cookies.get("token"); // Giả sử userId được lưu trong cookie sau khi đăng nhập
  const router = useRouter();
  
  useEffect(() => {
    let socket;

    const initDashboard = async () => {
      try {
        if (!token) {
          router.push("/login");
          return;
        }

        // 1. "Đánh thức" MQTT session ở Backend trước
        console.log("Kích hoạt MQTT session...");
        await apiClient.get(`/record/all`);

        // 2. Sau khi API /all thành công, mới bắt đầu kết nối WebSocket
        const baseURL = apiClient.defaults.baseURL;
        const wsURL = baseURL.replace("http", "ws").replace("/api", "/ws");
        
        socket = new WebSocket(`${wsURL}/${userId}`);

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setSensorData(prev => ({
            ...prev,
            [data.feed]: data.value
          }));
        };

        socket.onopen = () => console.log("WebSocket đã mở");
        socket.onerror = (err) => console.error("Lỗi WebSocket:", err);

      } catch (error) {
        console.error("Lỗi khởi tạo Dashboard:", error);
      }
    };

    initDashboard();

    return () => {
      if (socket) socket.close();
    };
  }, [token, userId, router]); // Thêm token vào dependency

  return (
    <div>
      <h1>Nhiệt độ: {sensorData.temperature || "--"} °C</h1>
      <h1>Độ ẩm: {sensorData.humidity || "--"} %</h1>
    </div>
  );
}