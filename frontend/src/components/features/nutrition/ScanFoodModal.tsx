import { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, Check } from 'lucide-react';
import Image from 'next/image';

interface ScanFoodModalProps {
    onClose: () => void;
    onScanComplete: (data: any) => void;
}

export function ScanFoodModal({ onClose, onScanComplete }: ScanFoodModalProps) {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setIsAnalyzing(true);
        try {
            // Emulate API call for now (we fit implement the real one next)
            const response = await fetch('/api/nutrition/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image })
            });

            if (!response.ok) throw new Error('Failed to analyze');

            const data = await response.json();
            onScanComplete(data);
            onClose();
        } catch (error) {
            console.error('Error analyzing image:', error);
            // Handle error (show toast etc)
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Escanear Refeição</h3>
                    <p className="text-sm text-gray-400">Tire uma foto para identificar calorias e macros</p>
                </div>

                {!image ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/5 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Camera size={32} className="text-blue-400" />
                        </div>
                        <p className="font-medium text-white mb-1">Tirar foto ou escolher arquivo</p>
                        <p className="text-xs text-gray-500">JPG, PNG até 5MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
                            <Image
                                src={image}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => setImage(null)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Analisando com IA...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Identificar Alimentos
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
