
import React from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface RelatedRecipesProps {
  currentRecipeId: string;
  currentTags: string[];
  allRecipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
}

export const RelatedRecipes: React.FC<RelatedRecipesProps> = ({ 
  currentRecipeId, 
  currentTags, 
  allRecipes, 
  onOpenRecipe 
}) => {
  // Find recipes that share at least one tag, exclude current one
  const related = allRecipes
    .filter(recipe => 
      recipe.id !== currentRecipeId && 
      recipe.tags.some(tag => currentTags.includes(tag))
    )
    .slice(0, 3); // Limit to 3

  if (related.length === 0) return null;

  return (
    <div className="bg-gray-50 py-16 mt-16 print-break-inside no-print border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-10">
            <span className="text-xs font-bold text-pop-red uppercase tracking-widest mb-2 block">Continue Cozinhando</span>
            <h3 className="text-3xl font-serif font-bold text-pop-dark">Você também pode gostar</h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map(recipe => (
               <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onOpenRecipe(recipe)} />
            ))}
         </div>
      </div>
    </div>
  );
};
