
import React, { useState, useRef, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { NutritionalAnalysis, Language } from '../types';
import { t } from '../utils/i18n';

interface NutriScannerProps {
  onClose: () => void;
  language: Language;
}

export const NutriScanner: React.FC<NutriScannerProps> = ({ onClose, language }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setIsCameraOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setImage(null);
    setAnalysis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await analyzeFoodImage(image);
      setAnalysis(result);
    } catch (error) {
      alert("Não foi possível analisar a imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh] overflow-hidden">
        
        <button 
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="bg-pop-dark text-white p-6 text-center shrink-0">
          <div className="w-12 h-12 bg-pop-green rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-900/50">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black">{t(language, 'nutriScanner')}</h2>
          <p className="text-gray-400 text-sm">Descubra as calorias da sua comida com IA.</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
           
           {isCameraOpen ? (
             <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black flex items-center justify-center mb-6 shadow-lg">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6">
                   <button onClick={stopCamera} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                   <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform bg-white/20 backdrop-blur">
                      <div className="w-12 h-12 bg-white rounded-full"></div>
                   </button>
                   <div className="w-10"></div>
                </div>
             </div>
           ) : (
             <div className="space-y-4">
                <div 
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed transition-all shrink-0 bg-white shadow-sm ${image ? 'border-transparent' : 'border-gray-200'}`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  
                  {image ? (
                    <>
                      <img src={image} alt="Food Preview" className="w-full h-full object-cover" />
                      {loading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                           <div className="w-full h-1 bg-pop-green absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                           <div className="w-12 h-12 border-4 border-white border-t-pop-green rounded-full animate-spin mb-4"></div>
                           <span className="text-white font-bold animate-pulse">{t(language, 'analyzing')}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                       <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       <span className="font-bold text-sm">Nenhuma imagem selecionada</span>
                    </div>
                  )}
                </div>

                {!loading && (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={triggerFileInput}
                      className="py-4 bg-white border border-gray-200 text-pop-dark rounded-xl font-bold hover:bg-gray-50 transition-colors flex flex-col items-center gap-2 shadow-sm"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Galeria / Arquivo
                    </button>

                    <button 
                      onClick={startCamera}
                      className="py-4 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-colors flex flex-col items-center gap-2 shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Usar Câmera
                    </button>
                  </div>
                )}
                
                {image && !loading && (
                   <button 
                     onClick={handleAnalyze}
                     className="w-full py-4 bg-pop-green text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                   >
                     <span className="animate-pulse">✨</span> Analisar Prato
                   </button>
                )}
             </div>
           )}

           {analysis && !isCameraOpen && (
             <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up">
                <div className="text-center mb-6">
                   <div className="text-xs font-bold text-pop-green uppercase tracking-widest mb-1">{t(language, 'detected')}</div>
                   <h3 className="text-2xl font-black text-pop-dark">{analysis.foodName}</h3>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 text-center mb-6 border border-gray-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-pop-yellow/10 rounded-bl-full -mr-8 -mt-8"></div>
                   <span className="text-5xl font-black text-pop-dark block">{analysis.calories}</span>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kcal / Porção</span>
                </div>

                <div className="space-y-4 mb-6">
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Proteína</span>
                         <span className="text-pop-dark">{analysis.protein}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[60%] rounded-full shadow-sm"></div>
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Carboidratos</span>
                         <span className="text-pop-dark">{analysis.carbs}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-pop-yellow w-[40%] rounded-full shadow-sm"></div>
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Gorduras</span>
                         <span className="text-pop-dark">{analysis.fat}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-pop-red w-[30%] rounded-full shadow-sm"></div>
                      </div>
                   </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                   <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                         <h4 className="text-xs font-black text-green-800 uppercase tracking-wide mb-1">{t(language, 'healthTip')}</h4>
                         <p className="text-sm text-green-700 leading-relaxed font-medium">"{analysis.healthTip}"</p>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
