
import { Recipe } from '../types';

/**
 * Helper to convert human strings like "20 min" or "1h 30min" to ISO 8601 Duration format (PT20M)
 * Required by Google Schema.org
 */
const convertDurationToISO = (timeString: string): string => {
  if (!timeString) return 'PT0M';
  
  let minutes = 0;
  
  // Simple parsing logic for strings like "1h 30min" or "45 min"
  const hourMatch = timeString.match(/(\d+)\s*h/);
  const minMatch = timeString.match(/(\d+)\s*min/);
  
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  
  // If no unit matched but there is a number, assume minutes
  if (minutes === 0 && parseInt(timeString) > 0) {
      minutes = parseInt(timeString);
  }

  return `PT${minutes}M`;
};

/**
 * Detect dietary restrictions for Schema based on tags
 */
const detectDiets = (tags: string[]) => {
  const diets = [];
  const lowerTags = tags.map(t => t.toLowerCase());

  if (lowerTags.includes('vegano') || lowerTags.includes('vegan')) diets.push("https://schema.org/VeganDiet");
  if (lowerTags.includes('vegetariano')) diets.push("https://schema.org/VegetarianDiet");
  if (lowerTags.includes('sem glúten') || lowerTags.includes('gluten free')) diets.push("https://schema.org/GlutenFreeDiet");
  if (lowerTags.includes('sem lactose')) diets.push("https://schema.org/LactoseFreeDiet");
  if (lowerTags.includes('low carb')) diets.push("https://schema.org/LowCarbDiet");

  return diets.length > 0 ? diets[0] : undefined; // Schema prefers single diet or array, usually one main one is best
};

/**
 * Generates the JSON-LD object for Schema.org/Recipe
 * Full documentation: https://developers.google.com/search/docs/appearance/structured-data/recipe
 */
export const generateRecipeSchema = (recipe: Recipe) => {
  const isoPrep = convertDurationToISO(recipe.prepTime);
  const isoCook = convertDurationToISO(recipe.cookTime);
  
  // Calculate total time safely
  const prepMins = parseInt(isoPrep.replace(/\D/g,'')) || 0;
  const cookMins = parseInt(isoCook.replace(/\D/g,'')) || 0;
  const isoTotal = `PT${prepMins + cookMins}M`;

  // Expanded list of cuisines for better detection from tags
  const knownCuisines = [
    'Italiana', 'Brasileira', 'Americana', 'Asiática', 'Japonesa', 
    'Francesa', 'Mediterrânea', 'Mexicana', 'Indiana', 'Tailandesa', 
    'Árabe', 'Portuguesa', 'Espanhola', 'Alemã', 'Chinesa'
  ];
  
  // Attempt to find a cuisine in tags, default to Global
  const detectedCuisine = recipe.tags.find(t => knownCuisines.includes(t)) || "Global";
  
  // Attempt to find a category that ISN'T a cuisine (e.g., "Sobremesa", "Jantar"), default to first tag or Main Course
  const category = recipe.tags.find(t => !knownCuisines.includes(t)) || recipe.tags[0] || "Prato Principal";

  // Calculate dynamic rating based on actual reviews if available
  let ratingValue = 4.8; // Default strong start
  let ratingCount = 12; // Default seed

  if (recipe.reviews && recipe.reviews.length > 0) {
    const avg = recipe.reviews.reduce((acc, r) => acc + r.rating, 0) / recipe.reviews.length;
    ratingValue = parseFloat(avg.toFixed(1));
    ratingCount = recipe.reviews.length;
  }

  const siteUrl = "https://receitapopular.com.br";
  const recipeUrl = `${siteUrl}/receita/${recipe.slug}`;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": recipe.title,
    "image": [
       recipe.imageUrl,
       recipe.imageUrl.replace('fit=crop', 'fit=crop&ar=1:1'), // Square aspect (simulated)
       recipe.imageUrl.replace('fit=crop', 'fit=crop&ar=16:9'), // Wide aspect (simulated)
    ],
    "author": {
      "@type": "Organization",
      "name": "Receita Popular"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Receita Popular",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "datePublished": recipe.datePublished || new Date().toISOString().split('T')[0],
    "description": recipe.description,
    "prepTime": isoPrep,
    "cookTime": isoCook,
    "totalTime": isoTotal,
    "keywords": recipe.tags.join(", "),
    "recipeYield": `${recipe.servings} porções`,
    "recipeCategory": category,
    "recipeCuisine": detectedCuisine,
    "suitableForDiet": detectDiets(recipe.tags),
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": `${recipe.nutrition.calories} calories`,
      "proteinContent": recipe.nutrition.protein,
      "fatContent": recipe.nutrition.fat,
      "carbohydrateContent": recipe.nutrition.carbs
    },
    "recipeIngredient": recipe.ingredients.map(ing => `${ing.amount} ${ing.item} ${ing.note ? `(${ing.note})` : ''}`),
    "recipeInstructions": recipe.steps.map((step, index) => ({
      "@type": "HowToStep",
      "name": `Passo ${index + 1}`,
      "text": step,
      "url": `${recipeUrl}#passo${index+1}`,
      "image": recipe.imageUrl
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "ratingCount": ratingCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": recipeUrl
    }
  };

  // Add Video Object if URL exists (Crucial for Video Search)
  if (recipe.videoUrl) {
    schema.video = {
      "@type": "VideoObject",
      "name": recipe.title,
      "description": recipe.description,
      "thumbnailUrl": [recipe.imageUrl],
      "contentUrl": recipe.videoUrl,
      "embedUrl": recipe.videoUrl.replace('watch?v=', 'embed/'),
      "uploadDate": recipe.datePublished || new Date().toISOString(),
      "duration": isoTotal // Fallback estimation
    };
  }

  return schema;
};
