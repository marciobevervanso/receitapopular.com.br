import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RecipeDetail } from './RecipeDetail';
import { storageService } from '../services/storageService';
import { Recipe, Language, AdSettings, SiteSettings } from '../types';

interface RecipeSlugWrapperProps {
  recipes: Recipe[];
  language: Language;
  onOpenRecipe: (recipe: Recipe) => void;
  adSettings?: AdSettings | null;
  settings?: SiteSettings;
}

export const RecipeSlugWrapper: React.FC<RecipeSlugWrapperProps> = ({
  recipes,
  language,
  onOpenRecipe,
  adSettings,
  settings
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipe = async () => {
      setLoading(true);
      if (!slug) {
        navigate('/');
        return;
      }

      // Try memory first
      const foundInMemory = recipes.find(r => r.slug === slug);
      if (foundInMemory) {
        setRecipe(foundInMemory);
        setLoading(false);
        return;
      }

      // Try DB
      const foundInDb = await storageService.getRecipeBySlug(slug);
      if (foundInDb) {
        setRecipe(foundInDb);
      } else {
        // Not found, maybe fallback to home or 404
        navigate('/');
        return;
      }
      setLoading(false);
    };

    loadRecipe();
  }, [slug, recipes, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-pop-gray border-t-pop-red rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <>
      <Helmet>
        <title>{recipe.title} - {settings?.siteName || 'Receita Popular'}</title>
        <meta name="description" content={recipe.description} />
      </Helmet>
      <RecipeDetail
        recipe={recipe}
        allRecipes={recipes}
        onBack={() => navigate('/')}
        language={language}
        onOpenRecipe={onOpenRecipe}
        adSettings={adSettings}
        settings={settings}
      />
    </>
  );
};
