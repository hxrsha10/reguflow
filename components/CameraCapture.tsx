
import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 p-6 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {error ? (
          <div className="p-10 text-center text-white">
            <p className="mb-6">{error}</p>
            <button onClick={onClose} className="px-8 py-3 bg-white/10 rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-8 inset-x-0 flex justify-center gap-6">
              <button 
                onClick={onClose} 
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-all"
              >
                ✕
              </button>
              <button 
                onClick={capture} 
                className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
              >
                <div className="w-8 h-8 rounded-full bg-[#1d70b8]" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
