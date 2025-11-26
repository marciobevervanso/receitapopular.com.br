
import React, { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
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
      {/* Added max-h-[90vh] and flex-col for scrolling */}
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Header (Fixed) */}
        <div className="bg-pop-dark text-white p-6 text-center shrink-0 rounded-t-3xl">
          <div className="w-12 h-12 bg-pop-green rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-900/50">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black">{t(language, 'nutriScanner')}</h2>
          <p className="text-gray-400 text-sm">{t(language, 'uploadPhoto')}</p>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
           {/* Image Upload Area */}
           <div 
             onClick={triggerFileInput}
             className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all shrink-0 ${image ? 'border-transparent' : 'border-gray-200 hover:border-pop-green bg-gray-50'}`}
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
                 {/* Scanning Overlay Animation */}
                 {loading && (
                   <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                      <div className="w-full h-1 bg-pop-green absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                      <div className="w-12 h-12 border-4 border-white border-t-pop-green rounded-full animate-spin mb-4"></div>
                      <span className="text-white font-bold animate-pulse">{t(language, 'analyzing')}</span>
                   </div>
                 )}
               </>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-bold text-sm">{t(language, 'scanFood')}</span>
               </div>
             )}
           </div>

           {/* Action Button */}
           {!analysis && image && !loading && (
             <button 
               onClick={handleAnalyze}
               className="w-full mt-6 py-4 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg shrink-0"
             >
               {t(language, 'nutriScanner')}
             </button>
           )}

           {/* Results */}
           {analysis && (
             <div className="mt-6 animate-fade-in pb-4">
                <div className="text-center mb-6">
                   <div className="text-xs font-bold text-pop-green uppercase tracking-widest mb-1">{t(language, 'detected')}</div>
                   <h3 className="text-2xl font-black text-pop-dark">{analysis.foodName}</h3>
                </div>

                {/* Calories Big Number */}
                <div className="bg-gray-50 rounded-2xl p-6 text-center mb-6 border border-gray-100">
                   <span className="text-5xl font-black text-pop-dark block">{analysis.calories}</span>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kcal / Porção</span>
                </div>

                {/* Macros Bars */}
                <div className="space-y-4 mb-6">
                   {/* Protein */}
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Proteína</span>
                         <span className="text-pop-dark">{analysis.protein}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                      </div>
                   </div>
                   {/* Carbs */}
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Carboidratos</span>
                         <span className="text-pop-dark">{analysis.carbs}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-pop-yellow w-[40%] rounded-full"></div>
                      </div>
                   </div>
                   {/* Fat */}
                   <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-gray-500">Gorduras</span>
                         <span className="text-pop-dark">{analysis.fat}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-pop-red w-[30%] rounded-full"></div>
                      </div>
                   </div>
                </div>

                {/* Health Tip */}
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
      
      {/* Scan Animation Keyframes */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        /* Custom scrollbar for better look */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
    </div>
  );
};
