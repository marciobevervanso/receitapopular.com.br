
export type Language = 'pt' | 'en' | 'es';

export interface Ingredient {
  item: string;
  amount: string;
  note?: string;
  purchaseLink?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface AffiliateProduct {
  name: string;
  url: string;
  price?: string;
  imageUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  datePublished: string;
  originalLink?: string;
  description: string;
  story: string;
  visualDescription?: string; // Prompt visual para IA
  prepTime: string;
  cookTime: string;
  totalTime?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: NutritionInfo;
  imageUrl: string;
  videoUrl?: string;
  affiliates: AffiliateProduct[];
  tags: string[];
  status?: 'published' | 'draft';
  reviews?: Review[];
  tips?: string[];
  pairing?: string;
  faq?: FAQItem[];
}

export interface StorySlide {
  type: 'cover' | 'ingredients' | 'step' | 'conclusion';
  layout: 'classic' | 'modern' | 'quote' | 'minimal' | 'cover' | 'list' | 'conclusion';
  text: string;
  subtext?: string;
  imageUrl: string; 
  visualPrompt?: string;
}

export interface WebStory {
  id: string;
  recipeId: string;
  title: string;
  slides: StorySlide[];
}

export interface ReelScript {
  hook: string;
  body: string;
  cta: string;
  visualPrompt: string;
  hashtags: string;
}

export interface WordPressPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
}

export interface AdSettings {
  clientId: string;
  slots: {
    homeTop: string;
    homeMiddle: string;
    sidebar: string;
    recipeTop?: string;
    recipeMiddle?: string;
    recipeBottom?: string;
  };
}

// Banner de Afiliado (ActionPay/Genérico)
export interface AffiliateBanner {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  position: 'home_top' | 'home_middle' | 'recipe_top' | 'recipe_middle' | 'recipe_bottom' | 'sidebar';
  isActive: boolean;
  clicks?: number;
}

export interface NutritionalAnalysis {
  foodName: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  healthTip: string;
}

export interface Category {
  id: string;
  name: string;
  img: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  heroRecipeIds: string[];
  specialCollectionCategoryId?: string; // ID da categoria para a coleção especial
  n8nWebhookUrl?: string;
  n8nSocialWebhookUrl?: string;
  n8nMemeWebhookUrl?: string; // Webhook para gerador de memes
  n8nImageOptimizationUrl?: string; // Webhook para otimização de imagens (Legacy n8n)
  customConverterUrl?: string; // NOVO: URL direta do VPS conversor (Coolify)
  banners?: AffiliateBanner[]; 
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isTyping?: boolean;
  showLeadGen?: boolean;
}

// MEAL PLANNER
export interface MealSlot {
  recipeId: string;
  recipeTitle: string;
  recipeImage: string;
}

export interface DayPlan {
  day: string; // 'mon', 'tue', etc.
  lunch?: MealSlot;
  dinner?: MealSlot;
}

export interface MealPlan {
  weekId: string; // usually current week number or date
  days: Record<string, DayPlan>; // keys: mon, tue, wed...
}

// DIET PLANS (CURATED)
export interface DietPlan {
  id: string;
  title: string;
  description: string;
  duration: string; // "7 dias", "3 dias"
  level: 'Fácil' | 'Médio' | 'Difícil' | 'Personalizado';
  goal: 'Emagrecimento' | 'Ganho de Massa' | 'Economia' | 'Saúde' | 'Praticidade';
  imageUrl: string;
  // A simple map of Day ID (mon, tue) to search terms or tags to find recipes
  // In a real app, this would map to specific Recipe IDs
  structure: Record<string, { lunchQuery: string, dinnerQuery: string }>;
}

// RECIPE SUGGESTIONS
export interface RecipeSuggestion {
  id: string;
  dishName: string;
  description?: string;
  suggestedBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}
