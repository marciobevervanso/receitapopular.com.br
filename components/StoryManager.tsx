import React, { useState, useEffect } from 'react';
import { WebStory } from '../types';
import { storageService } from '../services/storageService';

export const StoryManager: React.FC = () => {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const data = await storageService.getStories();
      setStories(data);
    } catch (e) {
      console.error("Erro ao carregar os stories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o Story "${title}" permanentemente?`)) {
      try {
        await storageService.deleteStory(id);
        setStories(stories.filter(s => s.id !== id));
      } catch (e) {
        alert("Erro ao excluir o story.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-pop-dark flex items-center gap-3">
              Web Stories <span className="text-gray-400 text-lg font-medium tracking-normal">({stories.length})</span>
           </h2>
           <p className="text-gray-500 mt-2">Os Web Stories publicados ficam acessíveis via /web-stories/id e são excelentes para gerar tráfego orgânico do Google Discover.</p>
        </div>
        <button 
           onClick={fetchStories} 
           disabled={loading}
           className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm bg-white shadow-sm flex items-center gap-2"
        >
           {loading ? 'Atualizando...' : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Atualizar</>}
        </button>
      </div>

      {loading && stories.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-[9/16]"></div>
           ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Nenhum Story Encontrado</h3>
            <p className="text-gray-500">Crie stories incríveis diretamente na página de qualquer receita clicando em "Gerar Story com IA".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {stories.map(story => {
              const coverImage = story.slides?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
              return (
                 <div key={story.id} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                    <div className="relative aspect-[9/16] overflow-hidden bg-gray-100">
                       <img src={coverImage} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                       
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(story.id, story.title)}
                            className="w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-pop-red transition-colors"
                            title="Excluir Web Story"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                       
                       <div className="absolute bottom-4 left-4 right-4 text-white">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded mb-2 inline-block">ID: {(story.id).substring(0, 5)}...</span>
                          <h3 className="font-bold text-sm leading-tight drop-shadow-md line-clamp-2">{story.title}</h3>
                       </div>
                    </div>
                    
                    <div className="p-3 bg-white">
                       <a 
                         href={`/web-stories/${story.id}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="w-full flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-pop-dark hover:text-white text-gray-600 text-xs font-bold rounded-lg transition-colors border border-gray-100 shadow-sm"
                       >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         Ver Story Completo
                       </a>
                    </div>
                 </div>
              );
           })}
        </div>
      )}
    </div>
  );
};
