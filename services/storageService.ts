
import { Recipe, Category, SiteSettings, WebStory, MealPlan, RecipeSuggestion, DietPlan } from "../types";
import { CATEGORIES as DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";
import { imageOptimizer } from "./imageOptimizer"; 

// --- Helpers ---

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
      .from('images')
      .upload(fileName, blobToUpload, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('images')
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

  async removeFile(url: string): Promise<void> {
    if (!url || !url.includes('/storage/v1/object/public/images/')) return;
    try {
      const path = url.split('/storage/v1/object/public/images/')[1];
      if (path) {
        const cleanPath = path.split('?')[0]; 
        console.log(`[Storage] Removendo arquivo antigo: ${cleanPath}`);
        await supabase.storage.from('images').remove([cleanPath]);
      }
    } catch (e) {
      console.warn("Remove file exception:", e);
    }
  },

  async optimizeImage(imageUrl: string, path: string): Promise<string> {
      const settings = await this.getSettings();
      const endpoint = settings.customConverterUrl || settings.n8nImageOptimizationUrl;
      
      if (!endpoint) {
          throw new Error("Webhook de otimização não configurado nas Integrações.");
      }

      console.log(`[Storage] Iniciando requisição para n8n: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); 

      try {
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  imageUrl: imageUrl, 
                  path: path, 
                  action: 'optimize' 
              }),
              signal: controller.signal
          });

          if (!response.ok) {
              const errText = await response.text();
              console.error(`[Storage] Erro n8n: ${response.status}`, errText);
              throw new Error(`Erro no servidor de conversão: ${response.status}`);
          }

          const rawData = await response.json();
          console.log(`[Storage] Resposta bruta do n8n:`, rawData);

          let resultUrl = null;
          
          if (Array.isArray(rawData)) {
             resultUrl = rawData[0]?.url || rawData[0]?.optimizedUrl || rawData[0]?.publicUrl || (rawData[0]?.json?.url);
          } else if (typeof rawData === 'object' && rawData !== null) {
             resultUrl = rawData.url || rawData.optimizedUrl || rawData.publicUrl || (rawData.json?.url);
             if (!resultUrl && rawData.data && Array.isArray(rawData.data)) {
                resultUrl = rawData.data[0]?.url;
             }
          } else if (typeof rawData === 'string' && rawData.startsWith('http')) {
             resultUrl = rawData;
          }
          
          if (!resultUrl) {
             console.error("[Storage] Formato de resposta inválido:", rawData);
             throw new Error("O n8n não retornou o link da imagem.");
          }
          
          console.log(`[Storage] Otimização concluída com sucesso: ${resultUrl}`);
          return `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}opt=${Date.now()}`;
      } catch (err: any) {
          console.error("[Storage] Erro fatal em optimizeImage:", err);
          if (err.name === 'AbortError') throw new Error("Tempo limite (20s) excedido. O n8n está muito lento.");
          throw err;
      } finally {
          clearTimeout(timeoutId);
      }
  },

  async smartOptimize(recipe: Recipe): Promise<Recipe> {
      console.log(`[SmartOptimize] Iniciando para: ${recipe.title}`);
      
      const targetPath = `recipes/${recipe.slug}`;
      const oldUrl = recipe.imageUrl;
      
      try {
          const newUrl = await this.optimizeImage(oldUrl, targetPath);

          if (newUrl) {
              const oldClean = oldUrl.split('?')[0];
              const newClean = newUrl.split('?')[0];

              if (oldClean !== newClean && oldUrl.includes('supabase.co')) {
                  await this.removeFile(oldUrl);
              }

              // Marca isOptimized como true para a UI saber que o processo foi concluído
              const updatedRecipe = { ...recipe, imageUrl: newUrl, isOptimized: true };
              await this.saveRecipe(updatedRecipe);
              
              return updatedRecipe;
          }
      } catch (err) {
          console.error("[SmartOptimize] Erro durante o fluxo:", err);
          throw err;
      }

      throw new Error("Falha ao gerar nova URL.");
  },

  // --- RECIPES ---

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

  // --- CATEGORIES ---

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

  // --- DIET PLANS ---
  
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

  // --- SETTINGS ---

  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'global').single();
    const DEFAULT_SETTINGS: SiteSettings = {
      siteName: 'Receita Popular', siteDescription: 'Gastronomia Descomplicada', heroRecipeIds: [], socialLinks: {}, banners: []
    };
    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...data.data };
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    const { error } = await supabase.from('site_settings').upsert({ id: 'global', data: settings });
    if (error) throw error;
  },

  // --- WEB STORIES ---

  async getStories(): Promise<WebStory[]> {
    const { data, error } = await supabase.from('web_stories').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => ({ ...row.data, id: row.id }));
  },

  async saveStory(story: WebStory): Promise<void> {
    const { error } = await supabase.from('web_stories').upsert({ id: story.id, data: story });
    if (error) throw error;
  },

  // --- MEAL PLANS ---
  
  getMealPlan(): MealPlan {
    const saved = localStorage.getItem('mealPlan');
    if (saved) return JSON.parse(saved);
    return { weekId: 'current', days: {} };
  },

  saveMealPlan(plan: MealPlan): void {
    localStorage.setItem('mealPlan', JSON.stringify(plan));
  },

  // --- SUGGESTIONS ---

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

  // --- USER ---
  
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
