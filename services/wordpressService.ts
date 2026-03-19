
import { WordPressPost } from "../types";

// Helper to strip HTML tags for preview
export const stripHtml = (html: string) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

export const fetchLatestPosts = async (domain: string): Promise<WordPressPost[]> => {
  // Remove trailing slash and protocol if present to normalize
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  let allPosts: WordPressPost[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      // Fetch 100 posts per page (max allowed by WP API usually)
      const apiUrl = `https://${cleanDomain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=id,date,slug,title,content,excerpt,link`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        // If page is not found (400), we reached the end
        if (response.status === 400) {
          hasMore = false;
          break;
        }
        throw new Error(`WordPress API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        allPosts = [...allPosts, ...data];
        page++;
      }
      
      // Safety break to prevent infinite loops in dev (limit to 1000 for safety, can increase)
      if (page > 20) hasMore = false; 
    }

    return allPosts as WordPressPost[];

  } catch (error) {
    console.warn("Fetch failed, possibly CORS or invalid domain. Returning mock data for demo purposes.", error);
    // Only return mock if we got absolutely nothing
    if (allPosts.length === 0) return MOCK_WP_POSTS;
    return allPosts;
  }
};

const MOCK_WP_POSTS: WordPressPost[] = [
  {
    id: 101,
    date: "2023-10-15",
    slug: "bolo-de-cenoura-chocolate",
    link: "https://antigo.com/bolo-de-cenoura-chocolate",
    title: { rendered: "Bolo de Cenoura com Chocolate Crocante" },
    excerpt: { rendered: "O clássico brasileiro, fofinho e com aquela cobertura que quebra..." },
    content: { rendered: "<p>Hoje vou ensinar a receita da minha avó. <strong>Ingredientes:</strong> 3 cenouras, 4 ovos, 1 xicara oleo, 2 xicaras acucar, 2 xicaras farinha, 1 colher fermento. <em>Cobertura:</em> manteiga, chocolate em po, acucar, leite. <strong>Modo de fazer:</strong> Bata tudo no liquidificador menos a farinha. Misture a farinha numa tigela. Asse por 40min.</p>" }
  },
  {
    id: 102,
    date: "2023-11-02",
    slug: "risoto-cogumelos-funghi",
    link: "https://antigo.com/risoto-cogumelos-funghi",
    title: { rendered: "Risoto de Cogumelos Funghi" },
    excerpt: { rendered: "Um jantar sofisticado em menos de 30 minutos." },
    content: { rendered: "<h3>Risoto Perfeito</h3><p>Para fazer um bom risoto, você precisa de arroz arbóreo. Refogue a cebola na manteiga. Adicione o arroz. Jogue vinho branco. Vá adicionando caldo de legumes aos poucos...</p>" }
  },
  {
    id: 103,
    date: "2023-12-10",
    slug: "moqueca-baiana-tradicional",
    link: "https://antigo.com/moqueca-baiana-tradicional",
    title: { rendered: "Moqueca Baiana Tradicional" },
    excerpt: { rendered: "Sabor do nordeste na sua mesa com dendê e leite de coco." },
    content: { rendered: "Peixe fresco (robalo ou cação), pimentões coloridos, cebola, tomate, leite de coco, azeite de dendê. Monte em camadas na panela de barro..." }
  }
];
