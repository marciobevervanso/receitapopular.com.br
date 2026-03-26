import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WebStory } from '../types';
import { storageService } from '../services/storageService';
import { WebStoryViewer } from './WebStoryViewer';

export const WebStoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<WebStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const found = await storageService.getStoryBySlug(slug);
        if (found) {
          setStory(found);
          // SEO: Update page title and meta tags dynamically
          document.title = `${found.title} | Web Story - Receita Popular`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', `Veja o passo a passo de ${found.title} neste Web Story interativo.`);
          // OG Tags for social sharing
          let ogTitle = document.querySelector('meta[property="og:title"]');
          if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
          ogTitle.setAttribute('content', found.title);
          let ogImage = document.querySelector('meta[property="og:image"]');
          if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
          ogImage.setAttribute('content', found.slides?.[0]?.imageUrl || '');
          let ogType = document.querySelector('meta[property="og:type"]');
          if (!ogType) { ogType = document.createElement('meta'); ogType.setAttribute('property', 'og:type'); document.head.appendChild(ogType); }
          ogType.setAttribute('content', 'article');
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error('Erro ao carregar Web Story:', e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-pop-red rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Carregando Story...</p>
        </div>
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">📖</div>
          <h1 className="text-3xl font-black text-pop-dark mb-4">Story não encontrado</h1>
          <p className="text-gray-500 mb-8">
            O Web Story que você procura não existe ou foi removido.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-pop-dark text-white rounded-full font-bold hover:bg-black transition-colors shadow-lg"
          >
            Voltar para a Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <WebStoryViewer 
      story={story} 
      onClose={() => navigate('/')} 
    />
  );
};
