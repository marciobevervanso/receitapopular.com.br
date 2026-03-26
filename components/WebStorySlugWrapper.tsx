import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { storageService } from '../services/storageService';
import { WebStory, SiteSettings } from '../types';
import { WebStoryViewer } from './WebStoryViewer';

interface WebStorySlugWrapperProps {
  settings?: SiteSettings;
}

export const WebStorySlugWrapper: React.FC<WebStorySlugWrapperProps> = ({ settings }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<WebStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      setLoading(true);
      try {
        if (!slug) throw new Error('No slug provided');
        
        // 1. Procurar a receita original pelo slug para achar o ID
        const recipes = await storageService.getRecipes();
        const recipe = recipes.find(r => r.slug === slug);
        
        if (!recipe) {
          navigate('/stories', { replace: true });
          return;
        }

        // 2. Com o ID da receita, encontrar o Web Story vinculado
        const stories = await storageService.getStories();
        const foundStory = stories.find(s => s.recipeId === recipe.id);

        if (foundStory) {
          setStory(foundStory);
        } else {
          // Se não existir Web Story, vai pro artigo normal
          navigate(`/${recipe.slug}`, { replace: true });
        }
      } catch (err) {
        console.error(err);
        navigate('/stories', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-pop-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirecionamento já acontece no useEffect de forma segura
  if (!story) return null;

  return (
    <>
      <Helmet>
        <title>{story.title} - Web Story | {settings?.siteName || 'Receita Popular'}</title>
      </Helmet>
      {/* Container tela cheia p/ encapsular o WebStoryViewer q eh fixo */}
      <div className="w-full h-screen bg-black">
         <WebStoryViewer story={story} onClose={() => navigate(`/${slug}`)} />
      </div>
    </>
  );
};
