"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";

interface AttackResult {
    clean_prediction: number;
    adversarial_prediction: number;
    adversarial_image: string;
    success: boolean;
}

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [epsilon, setEpsilon] = useState<number>(0.1);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<AttackResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null); // Reset previous results
            setError(null);
        }
    };

    const runAttack = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("epsilon", epsilon.toString());

        try {
            // Assuming backend is running on localhost:8000
            const response = await fetch("http://localhost:8000/attack", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to perform attack");
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-blue-600 mb-2">
                        DevNeuron AI Security
                    </h1>
                    <p className="text-lg text-gray-600">
                        Adversarial Attack Demonstration (FGSM)
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Controls Section */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6">Configuration</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Image (Digit)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Epsilon (Perturbation): {epsilon}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="0.5"
                                step="0.01"
                                value={epsilon}
                                onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Higher epsilon means more noise.
                            </p>
                        </div>

                        <button
                            onClick={runAttack}
                            disabled={!selectedFile || loading}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors
                ${!selectedFile || loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-md"
                                }`}
                        >
                            {loading ? "Attacking..." : "Run FGSM Attack"}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Results</h2>

                        {!selectedFile ? (
                            <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                Select an image to start
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {/* Original */}
                                <div className="flex flex-col items-center">
                                    <h3 className="font-medium text-gray-500 mb-3">Original Image</h3>
                                    <div className="relative w-48 h-48 border-4 border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                        {preview && (
                                            <Image
                                                src={preview}
                                                alt="Original"
                                                fill
                                                className="object-contain"
                                            />
                                        )}
                                    </div>
                                    {result && (
                                        <div className="mt-4 text-center">
                                            <p className="text-sm text-gray-500">Model Prediction</p>
                                            <p className="text-2xl font-bold text-gray-800">{result.clean_prediction}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Adversarial */}
                                <div className="flex flex-col items-center">
                                    <h3 className="font-medium text-gray-500 mb-3">Adversarial Image</h3>
                                    <div className="relative w-48 h-48 border-4 border-red-50 rounded-lg overflow-hidden shadow-sm">
                                        {result ? (
                                            <Image
                                                src={result.adversarial_image}
                                                alt="Adversarial"
                                                fill
                                                className="object-contain" // Use object-contain to avoid stretching
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-sm">
                                                Waiting for attack...
                                            </div>
                                        )}
                                    </div>
                                    {result && (
                                        <div className="mt-4 text-center">
                                            <p className="text-sm text-gray-500">Model Prediction</p>
                                            <p className={`text-2xl font-bold ${result.success ? 'text-red-600' : 'text-gray-800'}`}>
                                                {result.adversarial_prediction}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Banner */}
                        {result && (
                            <div className={`mt-8 p-4 rounded-lg text-center font-medium
                ${result.success ? "bg-red-100 text-red-800 border border-red-200" : "bg-green-100 text-green-800 border border-green-200"}
              `}>
                                {result.success
                                    ? "Attack Successful! The model was fooled."
                                    : "Attack Failed. The model prediction remained unchanged."}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}
