
import React from 'react';
import { WebStory } from '../types';

interface WebStoriesGalleryProps {
  stories: WebStory[];
  onOpenStory: (story: WebStory) => void;
  onBack: () => void;
}

export const WebStoriesGallery: React.FC<WebStoriesGalleryProps> = ({ stories, onOpenStory, onBack }) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20">
      
      {/* Header Editorial (Igual AllRecipesPage e CategoryPage) */}
      <div className="bg-pop-gray/30 pt-24 pb-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-pop-red transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-pop-red"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar ao Início
          </button>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-pop-dark mb-4 tracking-tight">
            Stories da Cozinha
          </h1>
          <p className="text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Experiências visuais rápidas. Deslize e descubra novos sabores em segundos.
          </p>
          
          <div className="mt-8 flex justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
             <span>{stories.length} Histórias Criadas</span>
             <span>•</span>
             <span>Formato Vertical</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-32">
        {stories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
            {stories.map((story) => (
              <div 
                key={story.id} 
                onClick={() => onOpenStory(story)}
                className="group cursor-pointer flex flex-col gap-3"
              >
                {/* Card Image Container */}
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-card transition-all duration-500 bg-gray-100">
                   <img 
                    src={story.slides[0].imageUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                   
                   {/* Overlay Gradient */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                   
                   {/* Play Icon Badge */}
                   <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:bg-pop-red group-hover:border-pop-red transition-colors shadow-lg">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                   </div>

                   {/* Slide Count Badge */}
                   <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                      {story.slides.length} Slides
                   </div>
                </div>

                {/* Title Below Image (Editorial Style) */}
                <div>
                   <h3 className="text-lg font-serif font-bold text-pop-dark leading-snug group-hover:text-pop-red transition-colors line-clamp-2">
                     {story.title}
                   </h3>
                   <p className="text-xs text-gray-400 mt-1 font-medium">Visualizar Story</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
             <div className="text-6xl mb-6 grayscale opacity-50">📱</div>
             <h3 className="text-2xl font-bold text-pop-dark mb-2">Nenhum Story Publicado</h3>
             <p className="text-gray-500 font-serif italic max-w-md mx-auto">
               Acesse a Área do Chef para transformar suas receitas em Web Stories automaticamente com IA.
             </p>
             <button 
               onClick={onBack}
               className="mt-8 px-8 py-3 bg-pop-dark text-white rounded-full font-bold hover:bg-black transition-colors"
             >
               Voltar ao Dashboard
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
