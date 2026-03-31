"use client";
import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

export default function AudioMachine() {
    const [recognizer, setRecognizer] = useState(null);
    const [isAnalyzing, setisAnalyzing] = useState(false);
    const [message, setMessage] = useState("Waiting for recognition...");
    
    const URL = "/voice_model/"; 

    useEffect(() => {
        const loadModel = async () => {
            const checkpointURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";

            // Cách khởi tạo đúng cho Speech Commands
            const recognizer = speechCommands.create(
                "BROWSER_FFT", 
                undefined, 
                checkpointURL, 
                metadataURL
            );
            
            await recognizer.ensureModelLoaded();
            setRecognizer(recognizer);
            console.log("Audio Model Loaded!");
        };
        loadModel();
    }, []);

    const toggleListening = async () => {
        if (!recognizer) return;

        if (isAnalyzing) {
            recognizer.stopListening();
            setisAnalyzing(false);
        } else {
            setisAnalyzing(true);
            
            recognizer.listen(result => {
                const labels = recognizer.wordLabels();
                const currentPredictions = labels.map((label, i) => ({
                    className: label,
                    probability: result.scores[i]
                }));

                setPredictions(currentPredictions);

                // Logic tự tắt khi > 70%
                const highConfidenceMatch = currentPredictions.some(p => 
                    p.className !== "_background_noise_" && p.probability > 0.7
                );

                if (highConfidenceMatch) {
                    setMessage("Access Granted!");
                    recognizer.stopListening();
                    setisAnalyzing(false);
                }
            }, {
                includeSpectrogram: true,
                probabilityThreshold: 0.75,
                overlapFactor: 0.5
            });
        }
    };

    // ... phần return UI giữ nguyên như cũ
        return (
        <div className="flex flex-col items-center p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-blue-600">Face Recognition System</h2>
            
            {/* Nút điều khiển */}
            <button 
                onClick={toggleListening}
                className={`px-6 py-2 rounded-full font-medium transition-all mb-6 ${
                    isAnalyzing 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
            >
                {isAnalyzing ? "Dừng nhận diện" : "Bắt đầu nhận diện"}
            </button>
            <h3 className={`text-lg font-medium mb-4`}>
                {message}
            </h3>
        </div>
    );
}

