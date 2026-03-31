"use client";
import { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';

export default function TeachableMachine() {
    const webcamRef = useRef(null);
    const [valid, setValid] = useState(false);
    const [message, setMessage] = useState("Waiting for recognition...");
    const [model, setModel] = useState(null);
    const [webcam, setWebcam] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false); 

    const URL = "/faceid_model/";

    useEffect(() => {
        const loadModel = async () => {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            const loadedModel = await tmImage.load(modelURL, metadataURL);
            setModel(loadedModel);
            console.log("Model loaded!");
        };
        loadModel();
    }, []);

    // Turn on/off webcam and start/stop recognition
    const toggleRecognition = async () => {
        if (isAnalyzing) {
            // Tắt camera
            if (webcam) {
                webcam.stop();
                webcamRef.current.innerHTML = "";
                setWebcam(null);
            }
            setIsAnalyzing(false);
        } else {
            // Bật camera
            setIsAnalyzing(true);
            const flip = true;
            const tempWebcam = new tmImage.Webcam(300, 300, flip);
            await tempWebcam.setup();
            await tempWebcam.play();
            setWebcam(tempWebcam);
            
            if (webcamRef.current) {
                webcamRef.current.appendChild(tempWebcam.canvas);
            }
        }
    };

    // Face recognition loop
    useEffect(() => {
        let frameId;
        const loop = async () => {
            if (webcam && model && isAnalyzing) {
                webcam.update();
                const prediction = await model.predict(webcam.canvas);
                const sleep = ms => new Promise(r => setTimeout(r, ms));
                const highConfidenceMatch = prediction.some(p => p.probability > 0.7);
                const bestMatch = prediction.reduce((best, p) => p.probability > best.probability ? p : best, {probability: 0});
                if(highConfidenceMatch) {
                    setValid(true);
                    setMessage("Door opened by " + bestMatch.className);
                    await sleep(3000);
                    toggleRecognition();
                    return;
                }
                frameId = window.requestAnimationFrame(loop);
            }
        };

        if (isAnalyzing && webcam && model) {
            frameId = window.requestAnimationFrame(loop);
        }

        return () => {
            if (frameId) window.cancelAnimationFrame(frameId);
        };
    }, [isAnalyzing, webcam, model]);

    return (
        <div className="flex flex-col items-center p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-blue-600">Face Recognition System</h2>
            
            {/* Nút điều khiển */}
            <button 
                onClick={toggleRecognition}
                className={`px-6 py-2 rounded-full font-medium transition-all mb-6 ${
                    isAnalyzing 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
            >
                {isAnalyzing ? "Dừng nhận diện" : "Bắt đầu nhận diện"}
            </button>
            {isAnalyzing && (
            <div 
                ref={webcamRef} 
                className={`relative border-4 rounded-lg overflow-hidden transition-opacity duration-500 ${
                    isAnalyzing ? "opacity-100 border-blue-400" : "opacity-0 border-gray-200"
                }`}
                style={{ width: 300, height: 300 }}
            >
                {!isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                        Camera đang tắt
                    </div>
                )}
            </div>
            )}
            <h3 className={`text-lg font-medium mb-4 ${valid ? "text-green-500" : "text-gray-600"}`}>
                {message}
            </h3>
        </div>
    );
}