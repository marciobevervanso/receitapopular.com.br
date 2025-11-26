
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { storageService } from '../services/storageService';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  // Local state for interactions
  const [liked, setLiked] = useState(false);
  // Use lazy initialization to avoid recalculating random numbers on every render
  const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 50) + 12);
  
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(() => Math.floor(Math.random() * 100) + 45);

  // Check persistent favorite state on mount
  useEffect(() => {
    setSaved(storageService.isFavorite(recipe.id));
  }, [recipe.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLikeCount(c => c - 1);
    } else {
      setLikeCount(c => c + 1);
    }
    setLiked(!liked);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle in storage
    const newStatus = storageService.toggleFavorite(recipe.id);
    setSaved(newStatus);
    
    // Simulate count update
    if (newStatus) {
      setSaveCount(c => c + 1);
    } else {
      setSaveCount(c => c - 1);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer flex flex-col"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-5 shadow-sm transition-all duration-500 group-hover:shadow-card bg-gray-100">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        
        {/* Top Left: Time Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-pop-dark shadow-sm z-10 flex items-center gap-1">
           <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           {recipe.prepTime}
        </div>

        {/* Top Right: Save Button */}
        <button 
          onClick={handleSave}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-300 z-20 active:scale-95 ${
            saved 
              ? 'bg-pop-yellow text-white hover:bg-yellow-500 shadow-yellow-200' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-pop-yellow'
          }`}
          title={saved ? "Remover dos favoritos" : "Salvar receita"}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${saved ? 'fill-current scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-xs font-bold">{saveCount}</span>
        </button>

        {/* Bottom Right: Like Button */}
        <button 
          onClick={handleLike}
          className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 z-20 active:scale-95 ${
             liked
             ? 'bg-pop-red text-white shadow-red-200'
             : 'bg-white/90 text-gray-600 hover:bg-white hover:text-pop-red'
           }`}
        >
           <svg className={`w-4 h-4 transition-transform duration-300 ${liked ? 'fill-current scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
           </svg>
           <span className="text-xs font-bold">{likeCount}</span>
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex flex-col gap-2 px-1">
        {/* Meta Line */}
        <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-gray-400">
           <span className="text-pop-red">{recipe.tags[0] || 'Geral'}</span>
           <span className="flex items-center gap-1">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             {recipe.servings}
           </span>
        </div>
        
        {/* Title */}
        <h3 className="text-xl md:text-2xl font-serif font-bold text-pop-dark leading-snug group-hover:text-pop-red transition-colors">
          {recipe.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed font-sans line-clamp-2 mt-1">
          {recipe.description}
        </p>
      </div>
    </div>
  );
};
