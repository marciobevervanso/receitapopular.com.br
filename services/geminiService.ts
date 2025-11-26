
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, WebStory, NutritionalAnalysis, ReelScript, ChatMessage } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema definition for structured output (Descriptions in PT-BR to guide the model)
const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título SEO-friendly (max 60 chars), contendo a palavra-chave principal." },
    slug: { type: Type.STRING, description: "URL amigável, letras minúsculas, hífens, sem acentos." },
    datePublished: { type: Type.STRING, description: "Data atual no formato YYYY-MM-DD." },
    description: { type: Type.STRING, description: "Meta-description para Google (150-160 caracteres). Atraente e contendo palavras-chave." },
    story: { type: Type.STRING, description: "Conteúdo editorial rico (>300 palavras). Use HTML básico (<p>, <strong>) se necessário. Conte a história, origem ou contexto cultural do prato para engajar o leitor." },
    prepTime: { type: Type.STRING, description: "Tempo de preparo (ex: '15 min')" },
    cookTime: { type: Type.STRING, description: "Tempo de cozimento (ex: '45 min')" },
    servings: { type: Type.NUMBER, description: "Número de porções" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Nome do ingrediente" },
          amount: { type: Type.STRING, description: "Quantidade (ex: '2 xícaras', '100g')" },
          note: { type: Type.STRING, description: "Nota de preparo (ex: 'picado', 'temperatura ambiente')" },
          purchaseLink: { type: Type.STRING, description: "Gere um link de busca da Shopee Brasil para comprar este ingrediente se for algo específico. Formato: 'https://shopee.com.br/search?keyword=...'. Se for comum, deixe vazio." }
        },
        required: ["item", "amount"],
      },
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Instruções passo a passo. Use verbos no imperativo. Seja detalhado para que o Rich Snippet 'HowTo' seja útil.",
    },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.STRING },
        carbs: { type: Type.STRING },
        fat: { type: Type.STRING },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Tags para SEO e Categorização. Inclua: Culinária (ex: Italiana), Tipo (ex: Jantar), Dieta (ex: Vegano, Sem Glúten) se aplicável."
    },
    visualDescription: { type: Type.STRING, description: "Descrição visual detalhada do prato pronto para o gerador de imagens (em inglês para melhor performance)." },
    affiliates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING, description: "Link de busca da Shopee Brasil para o utensílio" },
          price: { type: Type.STRING, description: "Preço estimado (ex: 'R$ 150,00')" },
        },
        required: ["name", "url"],
      },
      description: "Utensílios essenciais para preparar a receita."
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 dicas 'insider' para garantir o sucesso da receita."
    },
    pairing: { type: Type.STRING, description: "Sugestão de harmonização (Bebida)." },
    faq: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Dúvida comum (SEO Question Schema)" },
          answer: { type: Type.STRING, description: "Resposta direta (SEO Answer Schema)" }
        },
        required: ["question", "answer"]
      },
      description: "4 perguntas frequentes para aparecer no Google 'As pessoas também perguntam'."
    }
  },
  required: ["title", "slug", "datePublished", "description", "ingredients", "steps", "nutrition", "story", "visualDescription", "tips", "pairing", "faq", "tags"],
};

const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['cover', 'ingredients', 'step', 'conclusion'] },
          layout: { type: Type.STRING, enum: ['classic', 'modern', 'quote', 'minimal', 'cover', 'list', 'conclusion'], description: "Estilo visual do slide." },
          text: { type: Type.STRING, description: "Texto principal em destaque (max 10 palavras)" },
          subtext: { type: Type.STRING, description: "Detalhes secundários (max 20 palavras)" },
          visualPrompt: { type: Type.STRING, description: "Prompt EM INGLÊS detalhado para gerar a imagem deste slide específico. Ex: 'Close up of hands kneading dough', 'Ingredients laid out on table'." }
        },
        required: ["type", "text", "layout", "visualPrompt"]
      }
    }
  }
};

const reelScriptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING, description: "Texto inicial para prender a atenção (0-3s). Ex: 'Você nunca comeu um bolo assim!'" },
    body: { type: Type.STRING, description: "Roteiro narrado curto e dinâmico explicando a receita." },
    cta: { type: Type.STRING, description: "Chamada para ação final. Ex: 'Comente EU QUERO para a receita completa'." },
    visualPrompt: { type: Type.STRING, description: "Prompt CINEMATOGRÁFICO EM INGLÊS para gerar um vídeo de fundo com o modelo Veo. Deve descrever movimento, luz e textura. Ex: 'Cinematic close-up, slow motion, melted cheese stretching, steam rising, 4k, photorealistic food porn'." },
    hashtags: { type: Type.STRING, description: "Hashtags virais para o post." }
  },
  required: ["hook", "body", "cta", "visualPrompt", "hashtags"]
};

const nutritionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING, description: "Nome do prato identificado" },
    calories: { type: Type.NUMBER, description: "Calorias estimadas por porção (kcal)" },
    protein: { type: Type.STRING, description: "Proteínas em gramas (ex: '20g')" },
    carbs: { type: Type.STRING, description: "Carboidratos em gramas" },
    fat: { type: Type.STRING, description: "Gorduras em gramas" },
    healthTip: { type: Type.STRING, description: "Uma dica curta de saúde ou curiosidade nutricional sobre este prato." }
  },
  required: ["foodName", "calories", "protein", "carbs", "fat", "healthTip"]
};

/**
 * STEP 1 & 2: Generate Recipe Text with Grounding and SEO Optimization
 */
export const generateRecipeFromScratch = async (dishName: string): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  const ai = createAI();
  try {
    // Pass 1: Research
    let rawData = "";
    
    try {
      // Attempt 1: Use Google Search Grounding
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Pesquise profundamente sobre "${dishName}". Preciso de uma receita autêntica, história cultural, segredos de chef, variações dietéticas (vegan/gluten-free se aplicável) e dados nutricionais precisos. Responda em Português do Brasil.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      rawData = searchResponse.text || "";
    } catch (searchError) {
      console.warn("Google Search tool failed, falling back to internal knowledge base.", searchError);
      
      // Attempt 2: Fallback to Internal Knowledge (No Tools)
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Você é um Chef Executivo renomado. Crie uma receita completa, detalhada e autêntica de "${dishName}" baseada no seu conhecimento. Inclua a história do prato, ingredientes precisos, modo de preparo passo-a-passo, dados nutricionais estimados e dicas de chef. Responda estritamente em Português do Brasil.`,
      });
      rawData = fallbackResponse.text || "";
    }

    if (!rawData) throw new Error("Failed to generate recipe content after fallback attempt.");
    
    // Pass 2: Format & SEO
    const structurePrompt = `
        Você é o Editor Chefe e Especialista em SEO do 'Receita Popular'.
        Transforme os dados brutos a seguir em um JSON estruturado para Google Rich Snippets.
        
        DADOS BRUTOS:
        ${rawData}

        REQUISITOS SEO:
        1. **Título**: Atraente e com keyword principal à esquerda.
        2. **Descrição**: Meta-description perfeita (160 chars) com call-to-action.
        3. **Tags**: Identifique dietas (Vegano, Sem Glúten, Low Carb) se a receita for compatível. Isso é crucial para o Schema.
        4. **Story**: Escreva um artigo editorial >300 palavras. Use HTML básico (<p>, <strong>) se necessário. Engaje o leitor antes da receita.
        5. **FAQ**: Perguntas que as pessoas realmente fazem no Google sobre este prato.
        6. **Idioma**: Português do Brasil (PT-BR) Nativo.
        7. **Data**: Use a data de hoje: ${new Date().toISOString().split('T')[0]}.
      `;

    let structureResponse;
    try {
      structureResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: structurePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        }
      });
    } catch (structError) {
      console.warn("Structure generation failed, retrying once...", structError);
      // Retry logic for structure generation
      structureResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: structurePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        }
      });
    }

    const jsonText = structureResponse.text;
    if (!jsonText) throw new Error("Failed to structure recipe");
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error generating recipe text:", error);
    throw error;
  }
};

/**
 * STEP 3: Generate Recipe Image
 */
export const generateRecipeImage = async (visualDescription: string): Promise<string> => {
  const ai = createAI();
  const prompt = `Professional food photography, commercial shot, 8k, overhead shot or 45 degree angle, soft natural lighting coming from side, culinary magazine style, shallow depth of field. ${visualDescription}`;
  
  try {
    // Primary Strategy: Use High Quality Model
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3", // Standard for recipes
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data in primary response");

  } catch (error) {
    console.warn("Primary image generation failed, attempting fallback:", error);
    
    // Fallback Strategy: Use Flash Model
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (fallbackError) {
      console.error("All image generation attempts failed:", fallbackError);
    }

    // Ultimate Fallback: Unsplash Placeholder
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
  }
};

/**
 * Generate Web Story Image (Vertical 9:16)
 */
const generateStoryImage = async (visualDescription: string): Promise<string> => {
  const ai = createAI();
  const prompt = `Vertical story format (9:16). Professional food photography, aesthetic, high contrast, cinematic lighting. ${visualDescription}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "9:16", // Vertical for stories
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image");
  } catch (error) {
    // Fallback
    try {
      const fallback = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      for (const part of fallback.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error(e);
    }
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";
  }
};


export const convertWordPressToRecipe = async (htmlContent: string, title: string, existingCategories: string[] = []): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  const ai = createAI();
  try {
    const model = "gemini-3-pro-preview"; 
    
    const categoriesString = existingCategories.length > 0 
      ? `CATEGORIAS EXISTENTES: ${existingCategories.join(', ')}. Selecione a que melhor se adapta e adicione ao campo 'tags'.`
      : "";

    const prompt = `
      ATENÇÃO: ATUE COMO ESPECIALISTA EM SEO E ESTRUTURAÇÃO DE DADOS (SCHEMA.ORG).
      
      TAREFA:
      Converta este post antigo do WordPress ("${title}") em uma receita JSON perfeita para SEO.
      
      DIRETRIZES:
      1. Melhore o texto original para torná-lo editorial e rico.
      2. Adicione 'faq', 'tips' e 'pairing' se não existirem.
      3. Estime a nutrição com precisão.
      4. Identifique se é Vegana/Sem Glúten nas tags.
      5. **VISUAL DESCRIPTION**: Gere obrigatoriamente uma descrição visual detalhada EM INGLÊS no campo 'visualDescription' para gerar uma imagem IA depois.
      6. ${categoriesString}
      7. Data de Publicação: ${new Date().toISOString().split('T')[0]}.
      8. **UTENSÍLIOS**: Extraia do texto ou sugira uma lista COMPLETA de todos os utensílios, eletrodomésticos e acessórios necessários (ex: Batedeira, Forma, Espátula, Fouet, Airfryer, Panela de Pressão) no campo 'affiliates'. Não limite a quantidade, liste tudo que for útil.
      
      CONTEÚDO BRUTO:
      ${htmlContent.substring(0, 50000)} 
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.3, // Lower temperature for more consistent formatting
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    return parsed;

  } catch (error) {
    console.error("Error converting recipe:", error);
    throw error;
  }
};

export const generateWebStory = async (recipe: Recipe): Promise<Omit<WebStory, 'id'>> => {
  const ai = createAI();
  try {
    // 1. Generate the script (text content + prompt ideas)
    const prompt = `
      Crie um Web Story no padrão "Google Web Stories" (estilo Instagram) com 5 slides baseado nesta receita: "${recipe.title}".
      
      Dados da Receita:
      Descrição: ${recipe.description}
      Ingredientes: ${recipe.ingredients.map(i => i.item).join(', ')}
      Passos: ${recipe.steps.join(' ')}

      Requisitos Visuais (visualPrompt):
      - Para CADA slide, descreva uma imagem DIFERENTE e ESPECÍFICA em INGLÊS para eu gerar com IA.
      - Slide 1 (Capa): Foto do prato pronto, linda, iluminação perfeita.
      - Slide 2 (Ingredientes): Foto "flat lay" dos ingredientes na mesa, estilo rústico ou moderno.
      - Slide 3 (Processo): Foto de ação (mexendo, cortando, assando).
      - Slide 4 (Processo/Detalhe): Close-up de textura ou detalhes do cozimento.
      - Slide 5 (Final): O prato sendo servido ou alguém comendo.

      Requisitos de Texto:
      - Slide 1 (cover): Título gancho curto. Layout: 'cover'.
      - Slide 2 (ingredients): Destaque "O que você precisa". Layout: 'list'.
      - Slide 3 (step): Resumo do início. Layout: 'minimal'.
      - Slide 4 (step): Dica crucial. Layout: 'quote'.
      - Slide 5 (conclusion): Chamada para ação. Layout: 'conclusion'.
      
      Idioma: Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema
      }
    });

    const data = JSON.parse(response.text);
    
    // 2. Generate UNIQUE images for each slide in parallel
    const slidesWithImages = await Promise.all(data.slides.map(async (slide: any) => {
      let imageUrl = recipe.imageUrl; // Default backup
      
      if (slide.visualPrompt) {
        try {
          imageUrl = await generateStoryImage(slide.visualPrompt);
        } catch (e) {
          console.error("Failed to generate slide image", e);
        }
      }
      
      return {
        ...slide,
        imageUrl: imageUrl
      };
    }));

    return {
      recipeId: recipe.id,
      title: recipe.title,
      slides: slidesWithImages
    };

  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateReelScript = async (recipe: Recipe): Promise<ReelScript> => {
  const ai = createAI();
  const prompt = `
    Atue como um estrategista de conteúdo para TikTok/Reels. Crie um roteiro viral para a receita: "${recipe.title}".
    
    Dados:
    Descrição: ${recipe.description}
    
    Requisitos:
    1. HOOK: Uma frase curta (3s) para prender a atenção.
    2. BODY: O roteiro falado, rápido e direto.
    3. CTA: Chamada para comentar ou acessar o link.
    4. VISUAL PROMPT: Descreva UMA cena de vídeo impressionante (7s) em INGLÊS para eu gerar com IA (Veo). Deve ser o momento mais "food porn" (ex: queijo derretendo, calda caindo). Use termos como: "Cinematic, slow motion, 4k, shallow depth of field".
    5. HASHTAGS: Tags virais.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: reelScriptSchema
    }
  });

  return JSON.parse(response.text);
};

export const generateReelVideo = async (visualPrompt: string): Promise<string | null> => {
  const ai = createAI();
  try {
    console.log("Attempting Veo generation...");
    // Try Veo Fast
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: visualPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (videoUri) {
      // Important: Append API Key for fetching
      return `${videoUri}&key=${process.env.API_KEY}`;
    }
    
    return null;

  } catch (error: any) {
    console.error("Error generating video with Veo:", error);
    
    // Handle 404 explicitly (Model not found or not available for API Key)
    if (error.message?.includes("404") || error.status === 404) {
        console.warn("Veo model not available (404). Trying standard model as fallback.");
        // Fallback
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
             if (videoUri) return `${videoUri}&key=${process.env.API_KEY}`;
        } catch(fallbackErr) {
             console.error("Fallback also failed", fallbackErr);
        }
    }
    
    throw error;
  }
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionalAnalysis> => {
  const ai = createAI();
  try {
    // Remove data URL prefix if present for the API call
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analise esta imagem de comida. Identifique o prato, estime as calorias para uma porção padrão e forneça os macros (proteína, carbo, gordura). Dê também uma dica de saúde. Responda estritamente em Português do Brasil seguindo o esquema JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Failed to analyze image");
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

// --- NEW: Chat with Chef ---
export const chatWithChef = async (history: ChatMessage[], newMessage: string, recipes: Recipe[]): Promise<string> => {
  const ai = createAI();
  
  // Simplified Recipe Context (to save tokens)
  const recipesContext = recipes.map(r => `- ${r.title} (slug: ${r.slug})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Você é o 'Chef Popular', o assistente virtual amigável e especialista do site 'Receita Popular'.
        
        SUA PERSONALIDADE:
        - Entusiasmado, acolhedor e muito entendido de gastronomia.
        - Use emojis (👨‍🍳, 🥘, ✨).
        - Respostas curtas e diretas (max 3 parágrafos).
        
        SEUS OBJETIVOS:
        1. Responder dúvidas culinárias (substituições, tempos, técnicas).
        2. Recomendar receitas DO SITE quando apropriado.
        3. Sugerir acompanhamentos e bebidas.
        
        RECEITAS DISPONÍVEIS NO SITE:
        ${recipesContext}
        
        IMPORTANTE SOBRE LINKS:
        Quando você sugerir uma receita que está na lista acima, VOCÊ DEVE USAR EXATAMENTE O SEGUINTE FORMATO MARKDOWN:
        [Nome da Receita](/receita/slug-da-receita)
        
        Exemplo: "Que tal preparar um [Bolo de Cenoura](/receita/bolo-de-cenoura)?"
        
        NÃO use apenas o nome entre aspas. Use o link markdown para que o usuário possa clicar.
        
        HISTÓRICO DA CONVERSA:
        ${history.map(m => `${m.role}: ${m.text}`).join('\n')}
        user: ${newMessage}
      `,
    });

    return response.text || "Desculpe, estou com as mãos na massa! Pode repetir?";
  } catch (error) {
    console.error("Chef chat error", error);
    return "Ocorreu um erro na cozinha. Tente novamente em instantes.";
  }
};
