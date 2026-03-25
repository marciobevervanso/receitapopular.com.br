import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CategoryPage } from './CategoryPage';
import { storageService } from '../services/storageService';
import { Recipe, Category, SiteSettings } from '../types';

interface CategorySlugWrapperProps {
  categories: Category[];
  recipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
  settings?: SiteSettings;
}

export const CategorySlugWrapper: React.FC<CategorySlugWrapperProps> = ({
  categories,
  recipes,
  onOpenRecipe,
  settings
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(recipes);

  useEffect(() => {
    // Load ALL recipes for category filtering (not just paginated subset)
    storageService.getRecipes().then(all => {
      if (all.length > recipes.length) setAllRecipes(all);
    }).catch(console.error);
  }, [recipes]);

  useEffect(() => {
    if (!id) {
      navigate('/categorias');
      return;
    }
    
    // Procura por ID exato ou nome formatado (ex: "bolos-e-tortas")
    const found = categories.find(c => 
      c.id === id || 
      c.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()
    );

    if (found) {
      setCategory(found);
    } else {
      navigate('/categorias');
    }
  }, [id, categories, navigate]);

  if (!category) return null;

  return (
    <>
      <Helmet>
        <title>{category.name} - {settings?.siteName || 'Receita Popular'}</title>
        <meta name="description" content={`Explore as melhores receitas de ${category.name}.`} />
        <meta property="og:title" content={`${category.name} - Receitas Incríveis`} />
        <meta property="og:description" content={`Explore as melhores receitas de ${category.name} testadas e aprovadas.`} />
        <meta property="og:image" content={category.img} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>
      <CategoryPage 
        categoryName={category.name}
        categoryImage={category.img}
        recipes={allRecipes}
        onOpenRecipe={onOpenRecipe}
        onBack={() => navigate('/')}
      />
    </>
  );
};
