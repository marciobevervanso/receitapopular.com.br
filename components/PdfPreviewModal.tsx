import React, { useRef, useState } from 'react';
import { Recipe } from '../types';

interface PdfPreviewModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ recipe, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    try {
      // @ts-ignore
      if (typeof window.html2pdf === 'undefined') {
        alert("Biblioteca PDF carregando. Tente novamente em alguns segundos.");
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10], 
        filename: `${recipe.slug || 'receita'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(contentRef.current).save();
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    // Pequeno delay para garantir que o DOM esteja estável
    setTimeout(() => {
        window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-gray-100 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-fade-in print:shadow-none print:h-auto print:w-full print:rounded-none">
        
        {/* Header (Hide on Print) */}
        <div className="bg-pop-dark text-white p-4 flex justify-between items-center shrink-0 print:hidden">
           <h3 className="font-bold text-lg">Visualizar Impressão (Compacto)</h3>
           <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-500/50 print:p-0 print:bg-white print:overflow-visible print:block">
           
           {/* A4 Paper */}
           <div 
             id="printable-recipe" 
             ref={contentRef}
             className="bg-white shadow-2xl text-gray-800 font-serif print:shadow-none print:w-full print:m-0"
             style={{ width: '210mm', minHeight: '297mm', padding: '15mm', margin: '0 auto', boxSizing: 'border-box' }}
           >
              {/* Header (Branding & Title) */}
              <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center html2pdf__page-break-avoid">
                  <div className="flex justify-center items-center gap-2 mb-2 text-gray-400 uppercase tracking-widest text-[10px] font-sans font-bold">
                     <span>Receita Popular</span>
                     <span>•</span>
                     <span>receitapopular.com.br</span>
                  </div>
                  <h1 className="text-3xl font-black mb-2 leading-tight px-4">{recipe.title}</h1>
                  <p className="text-xs italic text-gray-600 max-w-xl mx-auto line-clamp-2 px-4">{recipe.description}</p>
                  
                  <div className="flex justify-center gap-6 mt-4 text-xs font-sans font-bold text-gray-700 bg-gray-50 py-2 rounded-lg mx-auto max-w-md border border-gray-100 print:border-gray-200">
                     <span className="flex items-center gap-1">⏱ {recipe.totalTime || recipe.prepTime}</span>
                     <span className="flex items-center gap-1">🥘 {recipe.servings} porções</span>
                     <span className="flex items-center gap-1">🔥 {recipe.nutrition.calories} kcal</span>
                  </div>
              </div>

              {/* 2-Column Layout */}
              <div className="flex gap-6 items-start">
                 
                 {/* Ingredients Column (32%) */}
                 <div className="w-[32%] pt-1 flex-shrink-0">
                    <h3 className="font-sans font-bold text-xs uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-pop-dark">Ingredientes</h3>
                    <ul className="space-y-2 text-xs">
                       {recipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="leading-tight html2pdf__page-break-inside-avoid pb-1 border-b border-dashed border-gray-100 last:border-0 pr-2">
                             <span className="font-bold">{ing.amount}</span> {ing.item}
                             {ing.note && <span className="block text-[10px] text-gray-500 italic mt-0.5">({ing.note})</span>}
                          </li>
                       ))}
                    </ul>

                    {recipe.tips && recipe.tips.length > 0 && (
                       <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg html2pdf__page-break-inside-avoid print:bg-gray-100">
                          <h4 className="font-sans font-bold text-[10px] uppercase text-gray-500 mb-1">Dica da Vovó</h4>
                          <p className="text-[10px] italic leading-relaxed text-gray-600">{recipe.tips[0]}</p>
                       </div>
                    )}
                 </div>

                 {/* Steps Column (Rest ~64%) */}
                 <div className="flex-1 border-l border-gray-100 pl-6">
                    <h3 className="font-sans font-bold text-xs uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-pop-dark">Modo de Preparo</h3>
                    <div className="space-y-4 text-xs">
                       {recipe.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2 html2pdf__page-break-inside-avoid">
                             <span className="font-sans font-black text-gray-400 text-lg leading-none mt-0.5 w-4 flex-shrink-0">{idx + 1}</span>
                             <div className="leading-relaxed text-justify text-gray-700" dangerouslySetInnerHTML={{ __html: step }} />
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 font-sans html2pdf__page-break-before-avoid">
                 Feito com amor • Receita Popular
              </div>
           </div>

        </div>

        {/* Footer Actions (Hide on Print) */}
        <div className="bg-white p-4 border-t border-gray-200 flex justify-end gap-4 shrink-0 print:hidden">
           <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
           
           <button 
             onClick={handlePrint} 
             className="px-6 py-3 border-2 border-pop-dark text-pop-dark rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Imprimir
           </button>

           <button onClick={handleDownloadPdf} disabled={isGenerating} className="px-8 py-3 bg-pop-dark text-white rounded-xl font-bold shadow-lg hover:bg-black flex items-center gap-2 disabled:opacity-50">
             {isGenerating ? 'Gerando...' : 'Baixar PDF'}
           </button>
        </div>

      </div>
    </div>
  );
};