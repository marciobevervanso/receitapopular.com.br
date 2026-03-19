
import React, { useState } from 'react';
import { Recipe, ReelScript } from '../types';
import { generateReelScript, generateReelVideo } from '../services/geminiService';

interface ReelCreatorProps {
  recipes: Recipe[];
}

export const ReelCreator: React.FC<ReelCreatorProps> = ({ recipes }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [script, setScript] = useState<ReelScript | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const handleGenerateScript = async () => {
    if (!selectedRecipe) return;
    setLoadingScript(true);
    setVideoUrl(null);
    try {
      const data = await generateReelScript(selectedRecipe);
      setScript(data);
    } catch (e) {
      alert("Erro ao gerar roteiro.");
    } finally {
      setLoadingScript(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script) return;
    setLoadingVideo(true);
    try {
      const url = await generateReelVideo(script.visualPrompt);
      setVideoUrl(url);
    } catch (e) {
      alert("Erro ao gerar vídeo. Verifique se sua chave de API suporta o modelo Veo.");
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-pop-dark">Estúdio de Reels (Veo)</h2>
        <p className="text-gray-500">Gere roteiros virais e vídeos com inteligência artificial.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Selection & Script */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Selecione a Receita</label>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-pop-dark"
              onChange={(e) => setSelectedRecipe(recipes.find(r => r.id === e.target.value) || null)}
              value={selectedRecipe?.id || ''}
            >
              <option value="">Selecione...</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            
            <button 
              onClick={handleGenerateScript}
              disabled={!selectedRecipe || loadingScript}
              className="w-full mt-4 py-3 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
            >
              {loadingScript ? 'Escrevendo Roteiro...' : 'Gerar Roteiro IA'}
            </button>
          </div>

          {script && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-fade-in">
               <div>
                 <span className="text-xs font-bold text-pop-red uppercase tracking-widest">Gancho (0-3s)</span>
                 <p className="font-bold text-lg leading-tight text-pop-dark">{script.hook}</p>
               </div>
               <div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Corpo</span>
                 <p className="text-sm text-gray-600 leading-relaxed">{script.body}</p>
               </div>
               <div>
                 <span className="text-xs font-bold text-pop-green uppercase tracking-widest">Chamada (CTA)</span>
                 <p className="font-bold text-pop-dark">{script.cta}</p>
               </div>
               <div className="pt-4 border-t border-gray-100">
                 <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Prompt de Vídeo (Veo)</span>
                 <p className="text-xs text-gray-400 italic mt-1 bg-gray-50 p-2 rounded">{script.visualPrompt}</p>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Generation */}
        <div className="bg-gray-900 rounded-3xl p-1 overflow-hidden relative min-h-[600px] flex flex-col items-center justify-center text-center">
           {videoUrl ? (
             <video 
               src={videoUrl} 
               controls 
               autoPlay 
               loop 
               className="w-full h-full object-cover rounded-[20px]"
             />
           ) : (
             <div className="p-8">
                {loadingVideo ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-pop-red rounded-full animate-spin"></div>
                    <p className="text-white font-bold animate-pulse">Gerando cena com Veo...</p>
                    <p className="text-xs text-gray-400">Isso pode levar até 2 minutos.</p>
                  </div>
                ) : script ? (
                  <>
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                       <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Gerar Cena</h3>
                    <p className="text-gray-400 text-sm mb-8">Use a IA Veo do Google para criar um vídeo de fundo cinematográfico baseado no roteiro.</p>
                    <button 
                      onClick={handleGenerateVideo}
                      className="px-8 py-4 bg-gradient-to-r from-pop-red to-pink-600 text-white rounded-full font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                    >
                      Gerar Vídeo (MP4)
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 font-bold">Gere um roteiro primeiro.</p>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
