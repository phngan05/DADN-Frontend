// app/dashboard/page.js
"use client";
import { useEffect, useState } from "react";
import apiClient from "@/src/services/api";
import { userAgent } from "next/server";
export default function Dashboard() {
  const [sensorData, setSensorData] = useState({humidity: null, temperature: null});
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const baseURL = apiClient.defaults.baseURL; 

    // Chuyển đổi http -> ws và loại bỏ phần /api nếu cần
    const wsURL = baseURL.replace("http", "ws").replace("/api", "/ws");

    console.log("Kết nối WebSocket tới:", `${wsURL}/${userId}`);
    // Sử dụng trong useEffect
    const socket = new WebSocket(`${wsURL}/${userId}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Dữ liệu mới từ WebSocket:", data);
      
      // Cập nhật state để giao diện thay đổi tức thì
      setSensorData(prev => ({
        ...prev,
        [data.feed]: data.value
      }));
    };

    return () => socket.close(); // Đóng khi rời trang
  }, [userId]);

  return (
    <div>
      <h1>Nhiệt độ: {sensorData.temperature || "--"} °C</h1>
      <h1>Độ ẩm: {sensorData.humidity || "--"} %</h1>
    </div>
  );
}