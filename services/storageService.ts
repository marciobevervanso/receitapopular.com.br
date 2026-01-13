
import { Recipe, Category, SiteSettings, WebStory, MealPlan, RecipeSuggestion, DietPlan } from "../types";
import { CATEGORIES as DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";

let _settingsCache: SiteSettings | null = null;
const SUPABASE_BUCKET = 'images';
const SUPABASE_BASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co/storage/v1/object/public/images/';

const getRelativePath = (url: string): string | null => {
  if (!url || !url.includes(`/${SUPABASE_BUCKET}/`)) return null;
  try {
    const parts = url.split(`/${SUPABASE_BUCKET}/`);
    return parts[parts.length - 1].split('?')[0];
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

    const fileName = `${path}-${Date.now()}.webp`; 
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, blobToUpload, { contentType: 'image/webp', upsert: true });

    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);
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

  async removeFile(url: string): Promise<void> {
    const path = getRelativePath(url);
    if (!path) return;
    try {
      await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
    } catch (e) {}
  },

  async optimizeImage(imageUrl: string, path: string, slug: string, action: string = 'optimize'): Promise<any> {
      const settings = await this.getSettings();
      const endpoint = settings.customConverterUrl || settings.n8nImageOptimizationUrl;
      if (!endpoint) throw new Error("Webhook não configurado.");

      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, path, slug, action })
      });

      if (!response.ok) throw new Error(`Erro no conversor: ${response.status}`);
      return await response.json();
  },

  async smartOptimize(recipe: Recipe): Promise<Recipe> {
      try {
          const rawData = await this.optimizeImage(
              recipe.imageUrl, 
              `recipes/${recipe.slug}`, 
              recipe.slug,
              'full_replace'
          );

          let resultUrl = null;
          if (typeof rawData === 'object' && rawData !== null) {
             resultUrl = rawData.url || rawData.publicUrl || rawData.Key || rawData.json?.url;
          } else if (typeof rawData === 'string') {
             resultUrl = rawData;
          }

          if (resultUrl && !resultUrl.startsWith('http')) {
             resultUrl = `${SUPABASE_BASE_URL}${resultUrl}`;
          }
          
          if (!resultUrl) throw new Error("n8n não devolveu link válido.");

          // SOLUÇÃO: Cache Buster para forçar o navegador a mostrar a nova imagem
          const finalUrl = `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}opt=${Date.now()}`;

          const updatedRecipe = { ...recipe, imageUrl: finalUrl, isOptimized: true };
          await this.saveRecipe(updatedRecipe);
          return updatedRecipe;
      } catch (err: any) {
          console.error("[SmartOptimize] Erro:", err);
          throw err;
      }
  },

  async getRecipesPaginated(page: number = 0, pageSize: number = 12): Promise<Recipe[]> {
    const from = page * pageSize;
    const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false }).range(from, from + pageSize - 1);
    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!query) return [];
    const { data, error } = await supabase.from('recipes').select('*').or(`title.ilike.%${query}%,slug.ilike.%${query}%`).limit(20);
    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false }).limit(2000);
    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id, slug: row.slug, title: row.title }));
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    const { error } = await supabase.from('recipes').upsert({ id: recipe.id, title: recipe.title, slug: recipe.slug, data: recipe });
    if (error) throw error;
  },

  async deleteRecipe(id: string): Promise<void> {
    const { data: recipeData } = await supabase.from('recipes').select('data').eq('id', id).single();
    if (recipeData?.data?.imageUrl) await this.removeFile(recipeData.data.imageUrl);
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
    const { error } = await supabase.from('categories').upsert(categories.map(cat => ({ id: cat.id, name: cat.name, img: cat.img })));
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
    if (error || !data) return { siteName: 'Receita Popular', siteDescription: '', heroRecipeIds: [], socialLinks: {}, banners: [] };
    _settingsCache = data.data;
    return _settingsCache!;
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
    return saved ? JSON.parse(saved) : { weekId: 'current', days: {} };
  },

  saveMealPlan(plan: MealPlan): void {
    localStorage.setItem('mealPlan', JSON.stringify(plan));
  },

  async submitSuggestion(suggestion: RecipeSuggestion): Promise<void> {
    await supabase.from('recipe_suggestions').insert({ dish_name: suggestion.dishName, description: suggestion.description, suggested_by: suggestion.suggestedBy, status: 'pending' });
  },

  async getSuggestions(): Promise<RecipeSuggestion[]> {
    const { data, error } = await supabase.from('recipe_suggestions').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => ({ id: row.id, dishName: row.dish_name, description: row.description, suggestedBy: row.suggested_by, date: row.created_at, status: row.status }));
  },

  async deleteSuggestion(id: string): Promise<void> {
    await supabase.from('recipe_suggestions').delete().eq('id', id);
  },

  getUserLevel(): { title: string, level: number, xp: number } {
    const recipesCount = parseInt(localStorage.getItem('recipesCreated') || '0');
    const favoritesCount = JSON.parse(localStorage.getItem('favorites') || '[]').length;
    const xp = (recipesCount * 100) + (favoritesCount * 10);
    if (xp > 1000) return { title: "Master Chef", level: 5, xp };
    if (xp > 500) return { title: "Chef Executivo", level: 4, xp };
    if (xp > 200) return { title: "Sous Chef", level: 3, xp };
    if (xp > 50) return { title: "Cozinheiro", level: 2, xp };
    return { title: "Aprendiz", level: 1, xp };
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
    const isAdded = !favorites.includes(recipeId);
    const newFavorites = isAdded ? [...favorites, recipeId] : favorites.filter((id: string) => id !== recipeId);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    return isAdded;
  },

  getFavoriteIds(): string[] {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }
};
