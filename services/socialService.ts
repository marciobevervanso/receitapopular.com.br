import { Recipe } from "../types";

/**
 * Formats a Recipe object into the WordPress-like payload expected by the n8n social workflow.
 * Generates attractive captions for Instagram/Facebook.
 */
export const publishToSocialMedia = async (recipe: Recipe, webhookUrl: string): Promise<boolean> => {
  if (!webhookUrl) throw new Error("URL do Webhook Social não configurada.");

  try {
    // 1. Generate "Beauty" Content (Hashtags & Caption)
    
    // Create hashtags from tags, ensuring no spaces and lowercase
    const hashtags = recipe.tags
      .map(tag => `#${tag.replace(/\s+/g, '')}`)
      .join(' ');
    
    const defaultHashtags = "#ReceitaPopular #Gastronomia #Culinária #ReceitaFácil";
    const finalHashtags = `${hashtags} ${defaultHashtags}`;

    // Format the caption to look like the example provided (clean, emoji-rich)
    const instagramCaption = `✨ ${recipe.title.toUpperCase()} ✨

${recipe.description}

Quem resiste? 🤤 Essa receita é perfeita para surpreender a família e os amigos. É fácil, deliciosa e vai deixar todo mundo com água na boca!

📝 **Destaques:**
⏱️ Tempo: ${recipe.prepTime}
🥘 Rendimento: ${recipe.servings} porções

👇 **Quer a receita completa passo-a-passo?**
Comente "EU QUERO" que eu te mando o link no direct! Ou acesse o link na bio.

Salve este post para não perder! 📌

${finalHashtags}`;

    // 2. Create Payload matching n8n expectation
    // The n8n nodes access: guid.rendered (image), link (for comments), output.instagramPost (caption)
    const payload = {
      title: {
        rendered: recipe.title
      },
      guid: {
        rendered: recipe.imageUrl // The image URL
      },
      link: recipe.originalLink || `https://receitapopular.com.br/${recipe.slug}`, // The link for the comment
      output: {
        slug: recipe.slug,
        instagramPost: instagramCaption, // The formatted text
        title: recipe.title
      }
    };

    // 3. Send to n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro no n8n: ${response.statusText}`);
    }

    return true;

  } catch (error) {
    console.error("Social Publish Error:", error);
    throw error;
  }
};

/**
 * Triggers the n8n webhook to generate and post a meme based on a payload.
 * Accepts any object to allow matching complex n8n structures (like WordPress packet simulation).
 */
export const generateMeme = async (payload: any, webhookUrl: string): Promise<boolean> => {
  if (!webhookUrl) throw new Error("Webhook de Memes não configurado.");

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar meme: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Meme Generation Error:", error);
    throw error;
  }
};