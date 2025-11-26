
import React, { useState } from 'react';

interface MeasurementModalProps {
  onClose: () => void;
}

export const MeasurementModal: React.FC<MeasurementModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'volume' | 'weight' | 'temp'>('volume');

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-pop-dark text-white p-6 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-lg">Tabela de Medidas</h3>
             <p className="text-gray-400 text-xs">Conversões rápidas para cozinha.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
           <button 
             onClick={() => setActiveTab('volume')}
             className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'volume' ? 'text-pop-red border-b-2 border-pop-red bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Líquidos (ml)
           </button>
           <button 
             onClick={() => setActiveTab('weight')}
             className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'weight' ? 'text-pop-red border-b-2 border-pop-red bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Secos (g)
           </button>
           <button 
             onClick={() => setActiveTab('temp')}
             className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'temp' ? 'text-pop-red border-b-2 border-pop-red bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Forno
           </button>
        </div>

        {/* Content */}
        <div className="p-6">
           {activeTab === 'volume' && (
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                 <tr><th className="px-4 py-2 rounded-l-lg">Medida Caseira</th><th className="px-4 py-2 rounded-r-lg text-right">Mililitros (ml)</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 <tr><td className="px-4 py-3 font-bold text-pop-dark">1 Xícara (chá)</td><td className="px-4 py-3 text-right">240 ml</td></tr>
                 <tr><td className="px-4 py-3 font-bold text-pop-dark">1/2 Xícara</td><td className="px-4 py-3 text-right">120 ml</td></tr>
                 <tr><td className="px-4 py-3 font-bold text-pop-dark">1 Copo Americano</td><td className="px-4 py-3 text-right">190 ml</td></tr>
                 <tr><td className="px-4 py-3 font-bold text-pop-dark">1 Colher (sopa)</td><td className="px-4 py-3 text-right">15 ml</td></tr>
                 <tr><td className="px-4 py-3 font-bold text-pop-dark">1 Colher (chá)</td><td className="px-4 py-3 text-right">5 ml</td></tr>
               </tbody>
             </table>
           )}

           {activeTab === 'weight' && (
             <div className="space-y-6">
               <div>
                  <h4 className="text-xs font-bold text-pop-yellow uppercase tracking-widest mb-2">Farinha de Trigo</h4>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="py-2 text-gray-600">1 Xícara</td><td className="py-2 text-right font-bold">120g</td></tr>
                      <tr><td className="py-2 text-gray-600">1 Colher (sopa)</td><td className="py-2 text-right font-bold">10g</td></tr>
                    </tbody>
                  </table>
               </div>
               <div>
                  <h4 className="text-xs font-bold text-pop-yellow uppercase tracking-widest mb-2">Açúcar</h4>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="py-2 text-gray-600">1 Xícara</td><td className="py-2 text-right font-bold">180g</td></tr>
                      <tr><td className="py-2 text-gray-600">1 Colher (sopa)</td><td className="py-2 text-right font-bold">12g</td></tr>
                    </tbody>
                  </table>
               </div>
                <p className="text-[10px] text-gray-400 italic text-center mt-2">*Valores aproximados. Use balança para precisão.</p>
             </div>
           )}

           {activeTab === 'temp' && (
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                 <tr><th className="px-4 py-2 rounded-l-lg">Descrição</th><th className="px-4 py-2">Celsius (ºC)</th><th className="px-4 py-2 rounded-r-lg text-right">Fahrenheit (ºF)</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 <tr><td className="px-4 py-3 text-gray-600">Forno Baixo</td><td className="px-4 py-3 font-bold">150ºC</td><td className="px-4 py-3 text-right text-gray-500">300ºF</td></tr>
                 <tr><td className="px-4 py-3 text-gray-600">Forno Médio</td><td className="px-4 py-3 font-bold text-pop-dark">180ºC</td><td className="px-4 py-3 text-right text-gray-500">350ºF</td></tr>
                 <tr><td className="px-4 py-3 text-gray-600">Forno Alto</td><td className="px-4 py-3 font-bold">220ºC</td><td className="px-4 py-3 text-right text-gray-500">425ºF</td></tr>
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
};
