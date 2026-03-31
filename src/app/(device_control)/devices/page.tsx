"use client";
import { useEffect, useState, useRef } from 'react';

export default function VoiceRecognition() {
    const [recognizer, setRecognizer] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [status, setStatus] = useState("Đang tải thư viện...");

    // Đường dẫn model trong thư mục public/voice_model/
    const MODEL_URL = "/voice_model/"; 

    useEffect(() => {
        const loadScriptsAndModel = async () => {
            try {
                // 1. Tải thư viện từ CDN (giống hệt các thẻ <script> trong mẫu của bạn)
                await loadExternalScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js");
                await loadExternalScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js");

                // 2. Khởi tạo model sau khi script đã load xong
                const origin = window.location.origin;
                const checkpointURL = origin + MODEL_URL + "model.json";
                const metadataURL = origin + MODEL_URL + "metadata.json";

                const rec = window.speechCommands.create(
                    "BROWSER_FFT", 
                    undefined, 
                    checkpointURL, 
                    metadataURL
                );

                await rec.ensureModelLoaded();
                setRecognizer(rec);
                setStatus("Sẵn sàng! Nhấn Start để bắt đầu.");
            } catch (err) {
                console.error(err);
                setStatus("Lỗi tải model. Kiểm tra file trong thư mục public.");
            }
        };

        loadScriptsAndModel();

        // Dọn dẹp khi đóng trang
        return () => {
            if (recognizer) recognizer.stopListening();
        };
    }, []);

    // Hàm load script thủ công để tránh lỗi 'fs' của Webpack/Turbopack
    const loadExternalScript = (src) => {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    };

    const startListening = async () => {
        if (!recognizer) return;

        setIsListening(true);
        setStatus("Đang lắng nghe...");

        recognizer.listen(result => {
            const classLabels = recognizer.wordLabels();
            const scores = result.scores;
            
            // Chuyển kết quả thành mảng để hiển thị React Map
            const currentPredictions = classLabels.map((label, i) => ({
                className: label,
                probability: scores[i]
            }));
            setPredictions(currentPredictions);

            // LOGIC TỰ TẮT KHI > 70% (Như bạn yêu cầu ở các câu trước)
            const bestMatch = currentPredictions.reduce((prev, current) => 
                (prev.probability > current.probability) ? prev : current
            );

            if (bestMatch.probability > 0.70 && bestMatch.className !== "_background_noise_") {
                setStatus(`🔓 Đã nhận diện: ${bestMatch.className}`);
                // Dừng mic
                setTimeout(() => {
                    recognizer.stopListening();
                    setIsListening(false);
                }, 2000);
            }
        }, {
            includeSpectrogram: true,
            probabilityThreshold: 0.75,
            invokeCallbackOnNoiseAndUnknown: true,
            overlapFactor: 0.50
        });
    };

    const stopListening = () => {
        if (recognizer) {
            recognizer.stopListening();
            setIsListening(false);
            setStatus("Đã dừng.");
        }
    };

    return (
        <div className="flex flex-col items-center p-6 border rounded-2xl shadow-lg bg-white max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-4">Voice ID Control</h2>
            <p className="mb-4 text-sm text-gray-500">{status}</p>

            <button
                onClick={isListening ? stopListening : startListening}
                className={`px-8 py-3 rounded-full font-bold text-white transition-all ${
                    isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                {isListening ? "Stop Mic" : "Start Mic"}
            </button>

            <div className="mt-6 w-full space-y-2">
                {predictions.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium">{p.className}</span>
                        <span className="text-blue-600">{(p.probability * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}