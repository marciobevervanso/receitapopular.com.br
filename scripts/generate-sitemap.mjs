import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Supabase credentials from the same place the client uses
const SUPABASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2t6bGZqbHBrdGZ6bWNwaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzU2NTcsImV4cCI6MjA3OTUxMTY1N30.IoZmjXug5WVy9LCICHff93Sz4_ruNTleI7Xn6e88nDQ';
const SITE_URL = 'https://receitapopular.com.br';

async function generateSitemap() {
  console.log('Gerando sitemap.xml...');

  try {
    // Buscar slugs diretamente da API REST do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=slug&limit=5000`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API Supabase: ${response.statusText}`);
    }

    const recipes = await response.json();
    console.log(`Encontradas ${recipes.length} receitas para o mapa do site.`);

    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/categorias', changefreq: 'weekly', priority: '0.8' },
      { url: '/receitas', changefreq: 'daily', priority: '0.9' },
      { url: '/planos', changefreq: 'weekly', priority: '0.7' },
      { url: '/stories', changefreq: 'daily', priority: '0.8' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add recipes
    for (const recipe of recipes) {
      // Se não houver updated_at, usa a data atual com fallback
      const lastModDate = recipe.updated_at ? new Date(recipe.updated_at).toISOString().split('T')[0] : today;
      
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/${recipe.slug}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    // Save to public dir so Vite puts it in dist folder
    const publicPath = path.resolve(__dirname, '../public');
    const destPath = path.join(publicPath, 'sitemap.xml');
    
    // Certifique-se que o diretório public existe (em um projeto normal existe)
    if (!fs.existsSync(publicPath)){
      fs.mkdirSync(publicPath);
    }
    
    fs.writeFileSync(destPath, xml);
    console.log('✅ sitemap.xml gerado com sucesso em public/sitemap.xml');

  } catch (error) {
    console.error('❌ Erro ao gerar sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
