
import { Recipe, Category, SiteSettings, WebStory, MealPlan, RecipeSuggestion, DietPlan } from "../types";
import { CATEGORIES as DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";

// --- Helpers ---

// Helper: Convert Base64 string to Blob manually (More robust than fetch)
const base64ToBlob = (base64Data: string): { blob: Blob, ext: string } => {
  try {
    // 1. Extract MIME type and data
    const arr = base64Data.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    // 2. Determine extension
    let ext = 'png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') ext = 'jpg';
    if (mime === 'image/webp') ext = 'webp';

    return { blob: new Blob([u8arr], {type: mime}), ext };
  } catch (e) {
    console.error("Error converting base64 to blob", e);
    throw new Error("Falha ao processar imagem para upload.");
  }
};

// Helper: Upload Base64 Image to Supabase Storage
const uploadImageInternal = async (base64Data: string, path: string): Promise<string> => {
  try {
    if (!base64Data || base64Data.startsWith('http')) return base64Data;

    if (base64Data.startsWith('data:image')) {
      
      // Resize image if it's too large (Canvas Resize)
      // This is crucial for performance and ensuring successful uploads
      const resizeImage = (dataUrl: string): Promise<string> => {
         return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
               const canvas = document.createElement('canvas');
               const ctx = canvas.getContext('2d');
               
               // Max width 1920px (Full HD)
               const MAX_WIDTH = 1920;
               let width = img.width;
               let height = img.height;

               if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
               }

               canvas.width = width;
               canvas.height = height;
               ctx?.drawImage(img, 0, 0, width, height);
               
               // Compress to WebP 80%
               resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.onerror = () => resolve(dataUrl); // Fallback to original
         });
      };

      const resizedBase64 = await resizeImage(base64Data);

      // Use the robust manual conversion
      const { blob } = base64ToBlob(resizedBase64);
      const fileName = `${path}-${Date.now()}.webp`; // Always save as WebP now

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (error) {
        console.error('Supabase Upload Error:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    }

    return base64Data;
  } catch (error) {
    console.error("Failed to upload image, using placeholder", error);
    // Return a fallback image if upload fails so the flow doesn't break completely
    return "https://images.unsplash.com/photo-1495521821378-860fa0171913?q=80&w=1000&auto=format&fit=crop";
  }
};

export const storageService = {
  
  // Expose upload for external components (like MemeGenerator)
  async uploadImage(base64Data: string, folder: string = 'misc'): Promise<string> {
     return uploadImageInternal(base64Data, `${folder}/img`);
  },

  // --- RECIPES (PAGINATED & SEARCH) ---

  // Fetches a specific page of recipes
  async getRecipesPaginated(page: number = 0, pageSize: number = 12): Promise<Recipe[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching recipes page:', error);
      return [];
    }

    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      slug: row.slug,
      title: row.title
    }));
  },

  // Optimized Search: Search on Server Side instead of downloading everything
  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!query) return [];

    // Search in title column OR perform a text search on the JSONB data tags
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(20); // Limit results for performance

    if (error) {
      console.error('Error searching recipes:', error);
      return [];
    }

    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      slug: row.slug,
      title: row.title
    }));
  },

  // Fetches ALL recipes (Only use for Dashboard or Export)
  async getRecipes(): Promise<Recipe[]> {
    // WARNING: Heavy operation. Avoid on client side main view.
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Safety limit for now

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      slug: row.slug,
      title: row.title
    }));
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    const publicImageUrl = await uploadImageInternal(recipe.imageUrl, `recipes/${recipe.slug}`);
    const recipeToSave = { ...recipe, imageUrl: publicImageUrl };

    const { error } = await supabase
      .from('recipes')
      .upsert({
        id: recipeToSave.id,
        title: recipeToSave.title,
        slug: recipeToSave.slug,
        data: recipeToSave
      });

    if (error) throw error;
  },

  async deleteRecipe(id: string): Promise<void> {
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('data')
      .eq('id', id)
      .single();

    if (recipeData && recipeData.data && recipeData.data.imageUrl) {
      const imageUrl = recipeData.data.imageUrl;
      if (imageUrl.includes('/storage/v1/object/public/images/')) {
        const path = imageUrl.split('/storage/v1/object/public/images/')[1];
        if (path) {
          await supabase.storage.from('images').remove([path]);
        }
      }
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

    // Auto-sync & Repair
    const existingMap = new Map<string, any>(data.map((c: any) => [c.name.toLowerCase(), c]));
    const categoriesToUpsert: any[] = [];

    DEFAULT_CATEGORIES.forEach((defaultCat, i) => {
       const existingCat = existingMap.get(defaultCat.name.toLowerCase());
       
       if (!existingCat) {
          categoriesToUpsert.push({
             id: `cat-sync-${Date.now()}-${i}`,
             name: defaultCat.name,
             img: defaultCat.img
          });
       } else if (!existingCat.img || existingCat.img === '' || existingCat.img.includes('placeholder') || defaultCat.name === 'Airfryer') {
          categoriesToUpsert.push({
             ...existingCat,
             img: defaultCat.img
          });
       }
    });

    if (categoriesToUpsert.length > 0) {
       await this.saveCategories(categoriesToUpsert);
       const updatedData = [...data];
       categoriesToUpsert.forEach(upd => {
          const idx = updatedData.findIndex(d => d.id === upd.id);
          if (idx >= 0) updatedData[idx] = upd;
          else updatedData.push(upd);
       });
       return updatedData;
    }

    return data;
  },

  async saveCategories(categories: Category[]): Promise<void> {
    const rows = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      img: cat.img
    }));

    const { error } = await supabase.from('categories').upsert(rows);
    if (error) throw error;
  },

  // --- DIET PLANS ---
  
  async getDietPlans(): Promise<DietPlan[]> {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Error fetching diet plans (or table not created yet):", error.message);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      duration: row.duration,
      level: row.level,
      goal: row.goal,
      imageUrl: row.image_url,
      structure: row.structure,
      category: row.category
    }));
  },

  async updateDietPlan(plan: DietPlan): Promise<void> {
    // Only update specific fields we might change (like image_url)
    const { error } = await supabase
      .from('diet_plans')
      .update({
        image_url: plan.imageUrl,
        // We could update other fields if needed
      })
      .eq('id', plan.id);

    if (error) throw error;
  },

  // --- SETTINGS ---

  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'global').single();
    
    const DEFAULT_SETTINGS: SiteSettings = {
      siteName: 'Receita Popular',
      siteDescription: 'Gastronomia Descomplicada',
      heroRecipeIds: [],
      n8nWebhookUrl: '', 
      n8nSocialWebhookUrl: '', 
      banners: [],
      socialLinks: {}
    };

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...data.data };
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        id: 'global',
        data: settings
      });
    
    if (error) throw error;
  },

  // --- WEB STORIES ---

  async getStories(): Promise<WebStory[]> {
    const { data, error } = await supabase.from('web_stories').select('*').order('created_at', { ascending: false });
    if (error) return [];
    
    return data.map((row: any) => ({
      ...row.data,
      id: row.id
    }));
  },

  async saveStory(story: WebStory): Promise<void> {
    const slidesWithUrls = await Promise.all(story.slides.map(async (slide, idx) => {
      const url = await uploadImageInternal(slide.imageUrl, `stories/${story.id}-${idx}`);
      return { ...slide, imageUrl: url };
    }));

    const storyToSave = { ...story, slides: slidesWithUrls };

    const { error } = await supabase.from('web_stories').upsert({
      id: story.id,
      data: storyToSave
    });

    if (error) throw error;
  },

  // --- MEAL PLANS ---
  
  getMealPlan(): MealPlan {
    const saved = localStorage.getItem('mealPlan');
    if (saved) return JSON.parse(saved);
    
    return {
      weekId: 'current',
      days: {
        'mon': { day: 'mon' },
        'tue': { day: 'tue' },
        'wed': { day: 'wed' },
        'thu': { day: 'thu' },
        'fri': { day: 'fri' },
        'sat': { day: 'sat' },
        'sun': { day: 'sun' },
      }
    };
  },

  saveMealPlan(plan: MealPlan): void {
    localStorage.setItem('mealPlan', JSON.stringify(plan));
  },

  // --- RECIPE SUGGESTIONS (SUPABASE) ---

  async submitSuggestion(suggestion: RecipeSuggestion): Promise<void> {
    try {
      const { error } = await supabase.from('recipe_suggestions').insert({
        dish_name: suggestion.dishName,
        description: suggestion.description,
        suggested_by: suggestion.suggestedBy,
        status: 'pending'
      });

      if (error) {
        console.error('Error submitting suggestion:', error);
        throw error;
      }
    } catch (err) {
      console.warn("Suggestion submission failed", err);
      throw err;
    }
  },

  async getSuggestions(): Promise<RecipeSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') { 
           console.warn("Tabela 'recipe_suggestions' não encontrada. Funcionalidade desabilitada temporariamente.");
           return [];
        }
        console.error('Error fetching suggestions:', error.message || JSON.stringify(error));
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        dishName: row.dish_name,
        description: row.description,
        suggestedBy: row.suggested_by,
        date: row.created_at,
        status: row.status as 'pending' | 'approved' | 'rejected'
      }));
    } catch (err) {
      console.warn("Error fetching suggestions (unexpected):", err);
      return [];
    }
  },

  async deleteSuggestion(id: string): Promise<void> {
    const { error } = await supabase.from('recipe_suggestions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting suggestion:', error);
      throw error;
    }
  },

  // --- GAMIFICATION / USER STATS ---
  
  getUserLevel(): { title: string, level: number, xp: number } {
    const recipesCount = parseInt(localStorage.getItem('recipesCreated') || '0');
    const favoritesCount = JSON.parse(localStorage.getItem('favorites') || '[]').length;
    
    const xp = (recipesCount * 100) + (favoritesCount * 10);
    
    let title = "Aprendiz";
    let level = 1;

    if (xp > 1000) { title = "Master Chef"; level = 5; }
    else if (xp > 500) { title = "Chef Executivo"; level = 4; }
    else if (xp > 200) { title = "Sous Chef"; level = 3; }
    else if (xp > 50) { title = "Cozinheiro"; level = 2; }

    return { title, level, xp };
  },

  // --- NEWSLETTER ---

  async subscribeNewsletter(email: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter')
      .insert({ email });
    
    if (error) {
      if (error.code === '23505') throw new Error('Este email já está cadastrado.');
      throw error;
    }
  },

  async getSubscribers(): Promise<{email: string, created_at: string}[]> {
    const { data, error } = await supabase
      .from('newsletter')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  },

  // --- LOCAL STORAGE ---
  
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
  },

  getShoppingList(): any[] {
    return JSON.parse(localStorage.getItem('shoppingList') || '[]');
  },
  
  addToShoppingList(item: any): void {
    const list = this.getShoppingList();
    list.push(item);
    localStorage.setItem('shoppingList', JSON.stringify(list));
  },
  
  updateShoppingList(list: any[]): void {
    localStorage.setItem('shoppingList', JSON.stringify(list));
  }
};
