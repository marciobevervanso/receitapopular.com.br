
import { Recipe, Category, SiteSettings, WebStory, MealPlan, RecipeSuggestion, DietPlan } from "../types";
import { CATEGORIES as DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";

// Cache em memória para evitar hits constantes no Supabase
let _settingsCache: SiteSettings | null = null;
const SUPABASE_BUCKET = 'images';
const SUPABASE_BASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co/storage/v1/object/public/images/';

/**
 * Utilitário para extrair o caminho relativo exato de uma URL do Supabase
 * Ex: de "https://.../public/images/recipes/bolo-123.webp" extrai "recipes/bolo-123.webp"
 */
const getRelativePath = (url: string): string | null => {
  if (!url || !url.includes(`/${SUPABASE_BUCKET}/`)) return null;
  try {
    // Divide pela pasta do bucket e pega a parte final (o caminho do arquivo)
    const parts = url.split(`/${SUPABASE_BUCKET}/`);
    const pathPart = parts[parts.length - 1];
    // Remove qualquer parâmetro de query (?opt=123...)
    return pathPart.split('?')[0];
  } catch (e) {
    return null;
  }
};

const uploadImageInternal = async (data: string | Blob, path: string): Promise<string> => {
  try {
    if (typeof data === 'string' && data.startsWith('http')) return data;

    let blobToUpload: Blob;

    if (typeof data === 'string' && data.startsWith('data:image')) {
        const res = await fetch(data);
        blobToUpload = await res.blob();
    } else if (data instanceof Blob) {
        blobToUpload = data;
    } else {
        return "https://images.unsplash.com/photo-1495521821378-860fa0171913?q=80&w=1000&auto=format&fit=crop";
    }

    // Upload manual usa timestamp para evitar conflito e cache durante o rascunho
    const fileName = `${path}-${Date.now()}.webp`; 

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, blobToUpload, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error("Failed to upload image", error);
    throw error;
  }
};

export const storageService = {
  
  async uploadImage(data: string | Blob, folder: string = 'misc'): Promise<string> {
     return uploadImageInternal(data, `${folder}/img`);
  },

  /**
   * Remove um arquivo físico do bucket do Supabase.
   */
  async removeFile(url: string): Promise<void> {
    const path = getRelativePath(url);
    if (!path) return;

    try {
      console.log(`[Storage] Deletando arquivo físico: ${path}`);
      const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
      if (error) throw error;
      console.log(`[Storage] Sucesso ao deletar: ${path}`);
    } catch (e: any) {
      console.warn(`[Storage] Falha na remoção do arquivo (${path}):`, e.message || e);
    }
  },

  /**
   * Dispara o n8n para otimização
   */
  async optimizeImage(imageUrl: string, path: string, slug: string): Promise<string> {
      const settings = await this.getSettings();
      const endpoint = settings.customConverterUrl || settings.n8nImageOptimizationUrl;
      
      if (!endpoint) throw new Error("Webhook de otimização não configurado.");

      try {
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  imageUrl: imageUrl, 
                  path: path, 
                  slug: slug,
                  action: 'optimize'
              })
          });

          if (!response.ok) throw new Error(`Erro n8n: ${response.status}`);

          const rawData = await response.json();
          let resultUrl = null;

          if (typeof rawData === 'object' && rawData !== null) {
             const possiblePath = rawData.url || rawData.publicUrl || rawData.Key || (rawData.json?.url);
             if (possiblePath && !possiblePath.startsWith('http')) {
                resultUrl = `${SUPABASE_BASE_URL}${possiblePath}`;
             } else {
                resultUrl = possiblePath;
             }
          } else if (typeof rawData === 'string') {
             resultUrl = rawData.startsWith('http') ? rawData : `${SUPABASE_BASE_URL}${rawData}`;
          }
          
          if (!resultUrl || !resultUrl.startsWith('http')) {
             throw new Error("n8n não retornou um link de imagem válido.");
          }

          return resultUrl;
      } catch (err: any) {
          throw err;
      }
  },

  /**
   * FLUXO DE SUBSTITUIÇÃO INTELIGENTE:
   * 1. Gera a imagem nova com nome limpo (via n8n).
   * 2. Atualiza a receita no banco de dados com a nova URL.
   * 3. Deleta o arquivo antigo se os caminhos forem diferentes.
   */
  async smartOptimize(recipe: Recipe): Promise<Recipe> {
      const oldUrl = recipe.imageUrl;
      // n8n vai salvar em: recipes/slug-da-receita.webp
      const targetPath = `recipes/${recipe.slug}`;
      
      try {
          // 1. Pede a otimização
          const newUrlRaw = await this.optimizeImage(oldUrl, targetPath, recipe.slug);
          
          // Adicionamos um timestamp para forçar o navegador a atualizar a imagem na tela
          const newUrl = `${newUrlRaw}${newUrlRaw.includes('?') ? '&' : '?'}v=${Date.now()}`;

          // 2. Criamos o objeto atualizado
          const updatedRecipe = { 
              ...recipe, 
              imageUrl: newUrl, 
              isOptimized: true 
          };

          // 3. Salvamos PRIMEIRO no banco de dados para garantir que o link não quebre
          await this.saveRecipe(updatedRecipe);
          console.log("[SmartOptimize] Receita atualizada no banco com novo link.");

          // 4. Faxina: Deleta o arquivo original (o que tinha o timestamp no nome)
          const oldPath = getRelativePath(oldUrl);
          const newPath = getRelativePath(newUrl);

          if (oldPath && newPath && oldPath !== newPath) {
              console.log("[SmartOptimize] Faxina iniciada. Substituindo arquivo...");
              // Executamos em background para não travar a UI
              this.removeFile(oldUrl).catch(err => console.error("Erro na faxina:", err));
          } else {
              console.log("[SmartOptimize] O nome do arquivo já era o ideal, nenhuma remoção necessária.");
          }

          return updatedRecipe;

      } catch (err) {
          console.error("[SmartOptimize] Erro no processo:", err);
          throw err;
      }
  },

  async getRecipesPaginated(page: number = 0, pageSize: number = 12): Promise<Recipe[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!query) return [];
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(20);

    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .upsert({
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        data: recipe
      });

    if (error) throw error;
  },

  async deleteRecipe(id: string): Promise<void> {
    const { data: recipeData } = await supabase.from('recipes').select('data').eq('id', id).single();
    if (recipeData?.data?.imageUrl) {
      await this.removeFile(recipeData.data.imageUrl);
    }
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error || !data || data.length === 0) {
      await this.saveCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i}` })));
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i}` }));
    }
    return data;
  },

  async saveCategories(categories: Category[]): Promise<void> {
    const rows = categories.map(cat => ({ id: cat.id, name: cat.name, img: cat.img }));
    const { error } = await supabase.from('categories').upsert(rows);
    if (error) throw error;
  },

  async getDietPlans(): Promise<DietPlan[]> {
    const { data, error } = await supabase.from('diet_plans').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => ({
      id: row.id, title: row.title, description: row.description, duration: row.duration,
      level: row.level, goal: row.goal, imageUrl: row.image_url, structure: row.structure, category: row.category
    }));
  },

  async updateDietPlan(plan: DietPlan): Promise<void> {
    const { error } = await supabase.from('diet_plans').update({ image_url: plan.imageUrl }).eq('id', plan.id);
    if (error) throw error;
  },

  async getSettings(): Promise<SiteSettings> {
    if (_settingsCache) return _settingsCache;
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'global').single();
    const DEFAULT_SETTINGS: SiteSettings = {
      siteName: 'Receita Popular', siteDescription: 'Gastronomia Descomplicada', heroRecipeIds: [], socialLinks: {}, banners: []
    };
    if (error || !data) return DEFAULT_SETTINGS;
    _settingsCache = { ...DEFAULT_SETTINGS, ...data.data };
    return _settingsCache;
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    const { error } = await supabase.from('site_settings').upsert({ id: 'global', data: settings });
    if (error) throw error;
    _settingsCache = settings;
  },

  async getStories(): Promise<WebStory[]> {
    const { data, error } = await supabase.from('web_stories').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id }));
  },

  async saveStory(story: WebStory): Promise<void> {
    const { error } = await supabase.from('web_stories').upsert({ id: story.id, data: story });
    if (error) throw error;
  },

  getMealPlan(): MealPlan {
    const saved = localStorage.getItem('mealPlan');
    if (saved) return JSON.parse(saved);
    return { weekId: 'current', days: {} };
  },

  saveMealPlan(plan: MealPlan): void {
    localStorage.setItem('mealPlan', JSON.stringify(plan));
  },

  async submitSuggestion(suggestion: RecipeSuggestion): Promise<void> {
    await supabase.from('recipe_suggestions').insert({
        dish_name: suggestion.dishName, description: suggestion.description, suggested_by: suggestion.suggestedBy, status: 'pending'
    });
  },

  async getSuggestions(): Promise<RecipeSuggestion[]> {
    const { data, error } = await supabase.from('recipe_suggestions').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => ({
      id: row.id, dishName: row.dish_name, description: row.description, suggestedBy: row.suggested_by, date: row.created_at, status: row.status
    }));
  },

  async deleteSuggestion(id: string): Promise<void> {
    await supabase.from('recipe_suggestions').delete().eq('id', id);
  },

  getUserLevel(): { title: string, level: number, xp: number } {
    const recipesCount = parseInt(localStorage.getItem('recipesCreated') || '0');
    const favoritesCount = JSON.parse(localStorage.getItem('favorites') || '[]').length;
    const xp = (recipesCount * 100) + (favoritesCount * 10);
    let title = "Aprendiz"; let level = 1;
    if (xp > 1000) { title = "Master Chef"; level = 5; }
    else if (xp > 500) { title = "Chef Executivo"; level = 4; }
    else if (xp > 200) { title = "Sous Chef"; level = 3; }
    else if (xp > 50) { title = "Cozinheiro"; level = 2; }
    return { title, level, xp };
  },

  async subscribeNewsletter(email: string): Promise<void> {
    const { error } = await supabase.from('newsletter').insert({ email });
    if (error && error.code === '23505') throw new Error('Este email já está cadastrado.');
    else if (error) throw error;
  },

  async getSubscribers(): Promise<{email: string, created_at: string}[]> {
    const { data } = await supabase.from('newsletter').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  isFavorite(recipeId: string): boolean {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(recipeId);
  },

  toggleFavorite(recipeId: string): boolean {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    let isAdded = false;
    if (favorites.includes(recipeId)) {
      newFavorites = favorites.filter((id: string) => id !== recipeId);
    } else {
      newFavorites = [...favorites, recipeId];
      isAdded = true;
    }
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    return isAdded;
  },

  getFavoriteIds(): string[] {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }
};
