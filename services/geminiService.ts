
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, WebStory, NutritionalAnalysis, ReelScript, ChatMessage, DietPlan } from "../types";
import { storageService } from "./storageService";

// Helper to get the key from Vite env or fallback
const getApiKey = (): string => {
  // @ts-ignore: Vite specific syntax
  return import.meta.env.VITE_API_KEY || process.env.API_KEY || '';
};

// Prevent crash if API_KEY is missing, though API calls will fail gracefully later
const createAI = () => {
  const key = getApiKey();
  if (!key) {
    console.warn("⚠️ [GeminiService] VITE_API_KEY is missing or empty. AI features will fail.");
  } else {
    // Log masked key for verification
    console.log(`✅ [GeminiService] API_KEY loaded. Length: ${key.length}. Start: ${key.substring(0,4)}...`);
  }
  return new GoogleGenAI({ apiKey: key });
};

const recipeSchema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, slug: { type: Type.STRING }, datePublished: { type: Type.STRING }, description: { type: Type.STRING }, story: { type: Type.STRING }, prepTime: { type: Type.STRING }, cookTime: { type: Type.STRING }, servings: { type: Type.NUMBER }, ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, amount: { type: Type.STRING }, note: { type: Type.STRING }, purchaseLink: { type: Type.STRING } }, required: ["item", "amount"] } }, steps: { type: Type.ARRAY, items: { type: Type.STRING } }, nutrition: { type: Type.OBJECT, properties: { calories: { type: Type.NUMBER }, protein: { type: Type.STRING }, carbs: { type: Type.STRING }, fat: { type: Type.STRING } }, required: ["calories", "protein", "carbs", "fat"] }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, visualDescription: { type: Type.STRING }, affiliates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, url: { type: Type.STRING }, price: { type: Type.STRING } }, required: ["name", "url"] } }, tips: { type: Type.ARRAY, items: { type: Type.STRING } }, pairing: { type: Type.STRING }, faq: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["question", "answer"] } } }, required: ["title", "slug", "datePublished", "description", "ingredients", "steps", "nutrition", "story", "visualDescription", "tips", "pairing", "faq", "tags"] };
const storySchema: Schema = { type: Type.OBJECT, properties: { slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, layout: { type: Type.STRING }, text: { type: Type.STRING }, subtext: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }, required: ["type", "text", "layout", "visualPrompt"] } } } };
const reelScriptSchema: Schema = { type: Type.OBJECT, properties: { hook: { type: Type.STRING }, body: { type: Type.STRING }, cta: { type: Type.STRING }, visualPrompt: { type: Type.STRING }, hashtags: { type: Type.STRING } }, required: ["hook", "body", "cta", "visualPrompt", "hashtags"] };
const nutritionSchema: Schema = { type: Type.OBJECT, properties: { foodName: { type: Type.STRING }, calories: { type: Type.NUMBER }, protein: { type: Type.STRING }, carbs: { type: Type.STRING }, fat: { type: Type.STRING }, healthTip: { type: Type.STRING } }, required: ["foodName", "calories", "protein", "carbs", "fat", "healthTip"] };
const utensilsSchema: Schema = { type: Type.OBJECT, properties: { utensils: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ["name"] } } }, required: ["utensils"] };

const dietPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    goal: { type: Type.STRING },
    structure: {
      type: Type.OBJECT,
      properties: {
        mon: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        tue: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        wed: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        thu: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        fri: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        sat: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
        sun: { type: Type.OBJECT, properties: { lunchQuery: { type: Type.STRING }, dinnerQuery: { type: Type.STRING } } },
      }
    }
  },
  required: ["title", "description", "goal", "structure"]
};

export const generateRecipeFromScratch = async (dishName: string): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  const ai = createAI();
  try {
    let rawData = "";
    try {
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Pesquise profundamente sobre "${dishName}". Preciso de uma receita autêntica, história cultural, segredos de chef, variações dietéticas (vegan/gluten-free se aplicável) e dados nutricionais precisos. Responda em Português do Brasil.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      rawData = searchResponse.text || "";
    } catch (searchError) {
      console.warn("Google Search tool failed, falling back.", searchError);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Você é um Chef Executivo renomado. Crie uma receita completa de "${dishName}". Responda estritamente em Português do Brasil.`,
      });
      rawData = fallbackResponse.text || "";
    }
    if (!rawData) throw new Error("Failed to generate content");
    
    const structureResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `Você é o Editor Chefe do 'Receita Popular'. Transforme os dados em JSON SEO. DADOS: ${rawData}. Data: ${new Date().toISOString().split('T')[0]}. **IMPORTANTE**: No campo 'affiliates', liste 4-6 utensílios/eletros essenciais (ex: Airfryer, Batedeira, Forma) apenas com 'name' (deixe 'url' vazio).`,
      config: { responseMimeType: "application/json", responseSchema: recipeSchema }
    });
    return JSON.parse(structureResponse.text || "{}");
  } catch (error) {
    console.error("Error generating recipe text:", error);
    throw error;
  }
};

export const generateRecipeFromIngredients = async (ingredients: string[]): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  const ai = createAI();
  try {
    const prompt = `Atue como um Chef de Cozinha Criativo. Tenho os seguintes ingredientes na geladeira: ${ingredients.join(', ')}. Crie uma receita DELICIOSA usando PRINCIPALMENTE esses ingredientes (você pode adicionar itens básicos de despensa como azeite, sal, temperos, ovos, farinha). A receita deve ser criativa e surpreendente. Responda em JSON.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: recipeSchema }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating recipe from ingredients:", error);
    throw error;
  }
};

export const generateCustomDietPlan = async (userGoal: string): Promise<DietPlan> => {
  const ai = createAI();
  try {
    // 1. Generate Plan Structure WITH Google Grounding
    // We use Google Search to ensure the plan is based on real, scientific or trending data, avoiding hallucinations.
    const prompt = `Atue como um Nutricionista e Chef Personalizado. 
    Use a Busca do Google para encontrar protocolos de dieta e planos alimentares REAIS e validados que atendam ao objetivo: "${userGoal}".
    Crie um plano alimentar semanal (seg-dom, almoço e jantar) baseado nessas informações reais.
    O plano deve ser prático e usar termos de busca de receitas reais (ex: "Frango Grelhado", "Salada Caesar").
    Retorne em JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: dietPlanSchema,
        tools: [{ googleSearch: {} }] // Enable Grounding
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // 2. Generate Real Image for the Plan
    let imageUrl = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop';
    try {
       const imgPrompt = `Healthy food photography for a meal plan: ${data.title}. ${data.description}. Fresh ingredients, balanced meal, bright lighting, 4k resolution.`;
       const imgBase64 = await generateRecipeImage(imgPrompt); // This returns data:image/... string
       // Upload to bucket so we have a permanent URL
       if (imgBase64.startsWith('data:')) {
          imageUrl = await storageService.uploadImage(imgBase64, 'plans');
       }
    } catch (imgErr) {
       console.error("Failed to generate plan image", imgErr);
    }

    // Add default fields needed for DietPlan interface
    return {
      ...data,
      id: `ai-plan-${Date.now()}`,
      duration: '7 Dias',
      level: 'Personalizado',
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw error;
  }
};

export const remixRecipe = async (originalRecipe: Recipe, modification: string): Promise<Recipe> => {
  const ai = createAI();
  try {
    const prompt = `Atue como um Chef Molecular e Nutricionista. Adapte a receita abaixo para ser: "${modification}".
    Mantenha o formato JSON. Ajuste ingredientes, passos e título (ex: "Bolo de Cenoura" -> "Bolo de Cenoura Vegano").
    Receita Original: ${JSON.stringify(originalRecipe)}
    IMPORTANTE: Mantenha a imagem original (imageUrl) no JSON de retorno, a menos que a mudança seja drástica (ex: carne para vegano), se for drástica, gere uma nova descrição visual no campo visualDescription.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: recipeSchema }
    });

    const remixed = JSON.parse(response.text || "{}");
    
    // Merge ID and basic props to ensure stability, but allow AI to override fields
    return {
      ...originalRecipe, // Keep ID, slug, etc from original initially
      ...remixed, // Overwrite with new data
      id: `${originalRecipe.id}-remix-${Date.now()}`, // New ID for the remix
      slug: `${originalRecipe.slug}-${modification.toLowerCase().replace(/\s/g, '-')}`,
      tags: [...(originalRecipe.tags || []), modification, "Remix"]
    };
  } catch (error) {
    console.error("Error remixing recipe:", error);
    throw error;
  }
};

export const generateRecipeImage = async (visualDescription: string): Promise<string> => {
  const ai = createAI();
  const prompt = `Professional food photography: ${visualDescription}. High resolution, delicious, culinary magazine style, 4k. Cinematic lighting.`;
  
  try {
    // 1. Try Premium Model first
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: { parts: [{ text: prompt }] },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from Pro model");

  } catch (error: any) {
    console.warn("Pro model failed, switching to Flash model:", error.message || error);
    
    // 2. Fallback to Flash Model
    try {
      const responseFlash = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Fallback standard model
        contents: { parts: [{ text: prompt }] },
      });
      
      for (const part of responseFlash.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          // Note: The MIME type might be different, but typically png or jpeg. 
          // We assume png/base64 here or detect from mimeType if available in SDK, 
          // but inlineData.mimeType is usually reliable.
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    } catch (flashError) {
       console.error("Flash model also failed:", flashError);
    }

    // 3. Final Fallback to Placeholder
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
  }
};

export const convertWordPressToRecipe = async (htmlContent: string, title: string, existingCategories: string[] = []): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  const ai = createAI();
  try {
    const categoriesString = existingCategories.length > 0 ? `CATEGORIAS EXISTENTES: ${existingCategories.join(', ')}. Selecione a que melhor se adapta.` : "";
    const prompt = `ATENÇÃO: ATUE COMO ESPECIALISTA EM SEO. Converta este post antigo do WordPress ("${title}") em uma receita JSON. DIRETRIZES: Melhore o texto, adicione faq/tips, estime nutrição. **VISUAL DESCRIPTION**: Gere descrição visual EM INGLÊS. ${categoriesString}. Data: ${new Date().toISOString().split('T')[0]}. **UTENSÍLIOS (Campo affiliates)**: Liste OBRIGATORIAMENTE 4 a 6 utensílios ou eletrodomésticos necessários (ex: Panela de Pressão, Liquidificador, Espátula Silicone) preenchendo o campo 'name' (deixe 'url' vazio). CONTEÚDO BRUTO: ${htmlContent.substring(0, 50000)}`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: recipeSchema }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error converting recipe:", error);
    throw error;
  }
};

export const identifyUtensils = async (recipe: Recipe): Promise<{name: string}[]> => {
  const ai = createAI();
  try {
    const prompt = `Analise a receita "${recipe.title}". Ingredientes: ${recipe.ingredients.map(i => i.item).join(', ')}. Passos: ${recipe.steps.join(' ')}. Liste de 4 a 6 utensílios, eletrodomésticos ou acessórios de cozinha essenciais para preparar esta receita (ex: Batedeira Planetária, Airfryer, Jogo de Facas, Forma de Silicone). Retorne apenas os nomes em JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: utensilsSchema }
    });
    const result = JSON.parse(response.text || "{}");
    return result.utensils || [];
  } catch (error) {
    console.error("Error identifying utensils:", error);
    return [];
  }
};

export const generateWebStory = async (recipe: Recipe): Promise<Omit<WebStory, 'id'>> => {
  const ai = createAI();
  try {
    const prompt = `Crie um Web Story com 5 slides baseado em: "${recipe.title}". Descrição: ${recipe.description}. Ingredientes: ${recipe.ingredients.map(i => i.item).join(', ')}. REQUISITOS VISUAIS: Descreva uma imagem DIFERENTE em INGLÊS para cada slide.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: storySchema }
    });
    const data = JSON.parse(response.text || "{}");
    const slidesWithImages = await Promise.all(data.slides.map(async (slide: any) => {
      let imageUrl = recipe.imageUrl;
      if (slide.visualPrompt) {
        try {
           const imgBase64 = await generateRecipeImage(`Vertical story format (9:16). Food photography. ${slide.visualPrompt}`);
           if(imgBase64.startsWith('data:')) {
              imageUrl = imgBase64;
           }
        } catch (e) { console.error(e); }
      }
      return { ...slide, imageUrl };
    }));
    return { recipeId: recipe.id, title: recipe.title, slides: slidesWithImages };
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateReelScript = async (recipe: Recipe): Promise<ReelScript> => {
  const ai = createAI();
  const prompt = `Atue como estrategista de TikTok. Crie roteiro viral para: "${recipe.title}". VISUAL PROMPT: Descreva UMA cena impressionante (7s) em INGLÊS para Veo (slow motion, cinematic).`;
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: reelScriptSchema }
  });
  return JSON.parse(response.text || "{}");
};

export const generateReelVideo = async (visualPrompt: string): Promise<string | null> => {
  const ai = createAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: visualPrompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return videoUri ? `${videoUri}&key=${getApiKey()}` : null;
  } catch (error: any) {
    console.error("Veo Error:", error);
    if (error.message?.includes("404") || error.status === 404) {
        try {
             let operation = await ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: visualPrompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
             });
             while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
             }
             const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
             if (videoUri) return `${videoUri}&key=${getApiKey()}`;
        } catch(fallbackErr) { console.error(fallbackErr); }
    }
    throw error;
  }
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionalAnalysis> => {
  const ai = createAI();
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: "Analise esta comida. JSON: foodName, calories, protein, carbs, fat, healthTip (PT-BR)." }] },
      config: { responseMimeType: "application/json", responseSchema: nutritionSchema }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

export const chatWithChef = async (history: ChatMessage[], newMessage: string, recipes: Recipe[]): Promise<string> => {
  const ai = createAI();
  const recipesContext = recipes.map(r => `- ${r.title} (Slug: ${r.slug})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Você é o 'Chef Popular', o assistente virtual amigável e especialista do site 'Receita Popular'.
        RECEITAS DISPONÍVEIS: ${recipesContext}
        HISTÓRICO: ${history.map(m => `${m.role}: ${m.text}`).join('\n')}
        user: ${newMessage}
      `,
    });
    return response.text || "Desculpe, estou com as mãos na massa! Pode repetir?";
  } catch (error) {
    console.error("Chef chat error", error);
    return "Ocorreu um erro na cozinha. Tente novamente em instantes.";
  }
};
