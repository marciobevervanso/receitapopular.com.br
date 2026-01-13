
import React, { useState, useRef, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { NutritionalAnalysis, Language } from '../types';
import { t } from '../utils/i18n';

interface NutriScannerProps {
  onClose: () => void;
  language: Language;
}

export const NutriScanner: React.FC<NutriScannerProps> = ({ onClose, language }) => {
  // --- STATES ---
  const [step, setStep] = useState<'register' | 'camera' | 'result'>('register');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResultUnlocked, setIsResultUnlocked] = useState(false);
  
  // User Data (Persisted in localStorage for demo)
  const [credits, setCredits] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState('');

  // Hardware Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL DE VENDAS
  const FOODSNAP_URL = "https://foodsnap.com.br"; 

  // --- INIT LOGIC ---
  useEffect(() => {
    const savedEmail = localStorage.getItem('foodsnap_email');
    const savedCredits = localStorage.getItem('foodsnap_credits');

    if (savedEmail) {
      setUserEmail(savedEmail);
      setCredits(savedCredits ? parseInt(savedCredits) : 0);
      setStep('camera'); // Skip registration if already done
      startCamera();
    } else {
      setStep('register');
    }

    return () => stopCamera();
  }, []);

  // --- CAMERA LOGIC ---
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      // Fallback allowed (upload only)
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        stopCamera(); // Stop video stream to save battery
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
        setImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  // --- BUSINESS LOGIC ---

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return alert('Digite um e-mail válido');

    localStorage.setItem('foodsnap_email', emailInput);
    localStorage.setItem('foodsnap_credits', '5'); // 5 Free Credits
    
    setUserEmail(emailInput);
    setCredits(5);
    setStep('camera');
    startCamera();
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    
    try {
      // 1. Perform Analysis
      const result = await analyzeFoodImage(image);
      setAnalysis(result);
      
      // 2. Consume Credit Logic
      if (credits > 0) {
        const newCredits = credits - 1;
        setCredits(newCredits);
        localStorage.setItem('foodsnap_credits', newCredits.toString());
        setIsResultUnlocked(true);
      } else {
        setIsResultUnlocked(false); // Locked mode
      }

      setStep('result');

    } catch (error) {
      alert("Não foi possível analisar a imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
     window.open(FOODSNAP_URL, '_blank');
  };

  const handleReset = () => {
    setImage(null);
    setAnalysis(null);
    setStep('camera');
    startCamera();
  };

  // --- UI RENDER ---

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F172A] rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh] overflow-hidden border border-gray-800">
        
        <button 
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Header Branding */}
        <div className="bg-[#0F172A] text-white p-6 text-center shrink-0 border-b border-gray-800">
          <div className="flex items-center justify-center gap-2 mb-1">
             <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-lg">📸</span>
             </div>
             <h2 className="text-xl font-black tracking-tight">FoodSnap<span className="text-green-500">.ai</span></h2>
          </div>
          {step !== 'register' && (
             <div className="flex justify-center items-center gap-2 mt-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${credits > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                   {credits > 0 ? `${credits} Créditos Grátis` : 'Créditos Esgotados'}
                </span>
             </div>
          )}
        </div>

        <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-[#0F172A] relative flex flex-col">
           
           {/* VIEW 1: REGISTRATION */}
           {step === 'register' && (
              <div className="p-8 flex flex-col justify-center h-full text-center">
                 <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎁</span>
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Experimente Grátis</h3>
                 <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    Cadastre-se agora e ganhe <strong>5 análises completas</strong> com nossa IA nutricionista.
                 </p>
                 <form onSubmit={handleRegister} className="space-y-4">
                    <input 
                      type="email" 
                      placeholder="Seu melhor e-mail"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none text-center"
                      required
                    />
                    <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">
                       Resgatar 5 Créditos
                    </button>
                 </form>
                 <p className="text-[10px] text-gray-600 mt-4">Não pedimos cartão de crédito agora.</p>
              </div>
           )}

           {/* VIEW 2: CAMERA / PREVIEW */}
           {step === 'camera' && (
             <div className="h-full flex flex-col">
                <div className="relative flex-1 bg-black overflow-hidden">
                   {!image ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                   ) : (
                      <>
                        <img src={image} className="w-full h-full object-cover opacity-80" alt="Preview" />
                        {loading && (
                           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
                              <div className="w-16 h-16 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin mb-4"></div>
                              <span className="text-white font-bold animate-pulse text-sm uppercase">Analisando calorias...</span>
                           </div>
                        )}
                      </>
                   )}
                   <canvas ref={canvasRef} className="hidden"></canvas>
                   
                   {!image && (
                     <div className="absolute inset-0 border-2 border-white/10 m-8 rounded-3xl pointer-events-none">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 rounded-br-lg"></div>
                     </div>
                   )}
                </div>
                
                <div className="p-6 bg-[#0F172A] min-h-[100px] flex items-center justify-center">
                   {!image ? (
                      <div className="flex items-center gap-8">
                         <button onClick={triggerFileInput} className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </button>
                         <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform bg-white/10 backdrop-blur">
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                         </button>
                         <div className="w-14"></div> {/* Spacer */}
                      </div>
                   ) : !loading && (
                      <div className="w-full grid grid-cols-2 gap-3">
                         <button onClick={() => setImage(null)} className="py-3 bg-gray-800 text-gray-300 rounded-xl font-bold">
                            Tirar Outra
                         </button>
                         <button onClick={handleAnalyze} className="py-3 bg-white text-black rounded-xl font-black flex items-center justify-center gap-2 shadow-lg">
                            <span>✨</span> Analisar
                         </button>
                      </div>
                   )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
             </div>
           )}

           {/* VIEW 3: RESULTS (UNLOCKED or LOCKED) */}
           {step === 'result' && analysis && (
              <div className="p-6 space-y-6 animate-slide-up">
                 
                 <div className="text-center">
                    <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                       {analysis.foodName}
                    </div>
                    <div className="text-6xl font-black text-white">
                       {analysis.calories}
                       <span className="text-lg text-gray-500 font-bold ml-1">kcal</span>
                    </div>
                 </div>

                 {isResultUnlocked ? (
                    /* --- FULL UNLOCKED VIEW --- */
                    <div className="space-y-6">
                       <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-800 p-3 rounded-xl text-center">
                             <div className="text-xs text-gray-400 uppercase font-bold mb-1">Prot</div>
                             <div className="text-xl font-black text-blue-400">{analysis.protein}</div>
                          </div>
                          <div className="bg-gray-800 p-3 rounded-xl text-center">
                             <div className="text-xs text-gray-400 uppercase font-bold mb-1">Carb</div>
                             <div className="text-xl font-black text-yellow-400">{analysis.carbs}</div>
                          </div>
                          <div className="bg-gray-800 p-3 rounded-xl text-center">
                             <div className="text-xs text-gray-400 uppercase font-bold mb-1">Gord</div>
                             <div className="text-xl font-black text-red-400">{analysis.fat}</div>
                          </div>
                       </div>
                       
                       <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                             <span className="text-xl">👨‍⚕️</span> Dica do Nutri
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{analysis.healthTip}</p>
                       </div>

                       <button onClick={handleReset} className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">
                          Escanear Próximo
                       </button>
                    </div>
                 ) : (
                    /* --- LOCKED TEASER VIEW --- */
                    <div className="relative rounded-3xl overflow-hidden bg-gray-800/50 border border-gray-700/50">
                       <div className="p-6 filter blur-md opacity-30 select-none pointer-events-none">
                          <div className="space-y-4">
                             <div className="flex justify-between text-gray-300"><span>Proteína</span><span>25g</span></div>
                             <div className="h-2 bg-gray-600 rounded-full w-full"></div>
                             <div className="flex justify-between text-gray-300"><span>Carboidratos</span><span>30g</span></div>
                             <div className="h-2 bg-gray-600 rounded-full w-full"></div>
                             <p className="text-sm">Essa refeição é excelente para quem busca hipertrofia...</p>
                          </div>
                       </div>

                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0F172A] to-transparent p-6 text-center">
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-3 shadow-lg animate-pulse">
                             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                          <h4 className="text-white font-bold text-lg mb-1">Seus Créditos Acabaram</h4>
                          <p className="text-gray-400 text-xs mb-6 max-w-[200px]">
                             Assine o FoodSnap Premium para análises ilimitadas e acompanhamento no WhatsApp.
                          </p>
                          
                          <button 
                            onClick={handleUpgrade}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                             <span>Liberar Acesso Premium</span>
                          </button>
                          
                          <button onClick={handleReset} className="mt-4 text-xs text-gray-500 hover:text-white underline">
                             Voltar ao Início
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           )}

        </div>
      </div>
    </div>
  );
};
