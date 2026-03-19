
import React, { useState, useEffect } from 'react';

interface GlobalTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalTimer: React.FC<GlobalTimerProps> = ({ isOpen, onClose }) => {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else if (!isActive && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  // Auto-open if timer starts running (optional logic, kept manual for now)
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetAndClose = () => {
    setIsActive(false);
    setTimer(0);
    onClose();
  };

  const resetOnly = () => {
    setIsActive(false);
    setTimer(0);
  };

  const addTime = (seconds: number) => {
    setTimer(t => t + seconds);
    if(!isActive) setIsActive(true);
  };

  if (!isOpen) return null;

  if (isMinimized) {
     return (
        <div className="fixed top-24 right-4 z-[60] animate-fade-in no-print">
           <button 
             onClick={() => setIsMinimized(false)}
             className="bg-pop-dark text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 font-mono font-bold border-2 border-white/20"
           >
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              {formatTime(timer)}
           </button>
        </div>
     )
  }

  return (
    <div className="fixed top-24 right-4 z-[60] bg-pop-dark text-white rounded-2xl shadow-2xl shadow-gray-400 overflow-hidden animate-fade-in min-w-[240px] no-print border border-gray-700">
      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm cursor-move">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
           <span className="text-xs font-bold uppercase tracking-widest opacity-70">Cronômetro</span>
        </div>
        <div className="flex items-center gap-1">
           {/* Minimize Button */}
           <button onClick={() => setIsMinimized(true)} className="hover:text-gray-300 p-1" title="Minimizar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </button>
           {/* Close Button (Red X) */}
           <button onClick={resetAndClose} className="hover:text-white bg-red-500/20 hover:bg-red-500 p-1 rounded transition-colors" title="Fechar e Zerar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      </div>
      
      <div className="p-6 text-center">
         <div className="text-5xl font-mono font-bold mb-6 tabular-nums tracking-wider text-white">
            {formatTime(timer)}
         </div>
         
         <div className="flex justify-center gap-3 mb-6">
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isActive ? 'bg-pop-yellow text-pop-dark' : 'bg-pop-green text-white shadow-lg shadow-green-900/50'}`}
            >
               {isActive ? (
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               )}
            </button>
            <button 
              onClick={resetOnly}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Zerar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
         </div>
         
         <div className="grid grid-cols-3 gap-2">
            <button onClick={() => addTime(60)} className="px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/5 transition-colors">+1 min</button>
            <button onClick={() => addTime(300)} className="px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/5 transition-colors">+5 min</button>
            <button onClick={() => addTime(600)} className="px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/5 transition-colors">+10 min</button>
         </div>
      </div>
    </div>
  );
};
