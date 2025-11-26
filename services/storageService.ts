
import { Recipe, Category, SiteSettings, WebStory } from "../types";
import { CATEGORIES as DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";

// --- Helpers ---

// Helper: Upload Base64 Image to Supabase Storage
const uploadImageToSupabase = async (base64Data: string, path: string): Promise<string> => {
  try {
    // If it's already a URL (http/https), return as is
    if (!base64Data || base64Data.startsWith('http')) return base64Data;

    // If it is a base64 string
    if (base64Data.startsWith('data:image')) {
      // Convert Base64 to Blob
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const fileExt = base64Data.substring("data:image/".length, base64Data.indexOf(";base64"));
      const fileName = `${path}-${Date.now()}.${fileExt}`;

      // Upload
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) {
        console.error('Supabase Upload Error:', error);
        throw error;
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      console.log("Image uploaded to:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }

    return base64Data;
  } catch (error) {
    console.error("Failed to upload image, using placeholder", error);
    return "https://images.unsplash.com/photo-1495521821378-860fa0171913?q=80&w=1000&auto=format&fit=crop";
  }
};

export const storageService = {
  
  // --- RECIPES ---

  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    // Merge the top-level ID/Slug with the JSONB data
    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      slug: row.slug,
      title: row.title
    }));
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    // 1. Handle Image Upload (if needed)
    const publicImageUrl = await uploadImageToSupabase(recipe.imageUrl, `recipes/${recipe.slug}`);
    const recipeToSave = { ...recipe, imageUrl: publicImageUrl };

    // 2. Save to DB
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
    // 1. Fetch the recipe first to get the image URL
    const { data: recipeData, error: fetchError } = await supabase
      .from('recipes')
      .select('data')
      .eq('id', id)
      .single();

    if (recipeData && recipeData.data && recipeData.data.imageUrl) {
      const imageUrl = recipeData.data.imageUrl;
      // Check if the image is hosted in our bucket
      if (imageUrl.includes('/storage/v1/object/public/images/')) {
        // Extract the path after /images/
        const path = imageUrl.split('/storage/v1/object/public/images/')[1];
        if (path) {
          console.log("Deleting image:", path);
          const { error: storageError } = await supabase.storage.from('images').remove([path]);
          if (storageError) console.warn("Failed to delete image from storage:", storageError);
        }
      }
    }

    // 2. Delete the record from database
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CATEGORIES ---

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    
    if (error || !data || data.length === 0) {
      // First run: seed default categories
      await this.saveCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i}` })));
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i}` }));
    }

    return data;
  },

  async saveCategories(categories: Category[]): Promise<void> {
    // Upsert all categories
    const rows = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      img: cat.img
    }));

    const { error } = await supabase.from('categories').upsert(rows);
    if (error) throw error;
  },

  // --- SETTINGS ---

  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'global').single();
    
    const DEFAULT_SETTINGS: SiteSettings = {
      siteName: 'Receita Popular',
      siteDescription: 'Gastronomia Descomplicada',
      heroRecipeIds: [],
      n8nWebhookUrl: 'https://n8n.seureview.com.br/webhook/shopee-utensilios', 
      n8nSocialWebhookUrl: '', // New Default
      socialLinks: {}
    };

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    // Merge defaults with saved data to ensure new fields exist
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
    // Upload images for each slide if they are new
    const slidesWithUrls = await Promise.all(story.slides.map(async (slide, idx) => {
      const url = await uploadImageToSupabase(slide.imageUrl, `stories/${story.id}-${idx}`);
      return { ...slide, imageUrl: url };
    }));

    const storyToSave = { ...story, slides: slidesWithUrls };

    const { error } = await supabase.from('web_stories').upsert({
      id: story.id,
      data: storyToSave
    });

    if (error) throw error;
  },

  // --- LOCAL STORAGE (Session Specific) ---
  
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