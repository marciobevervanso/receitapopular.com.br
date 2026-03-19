import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2t6bGZqbHBrdGZ6bWNwaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzU2NTcsImV4cCI6MjA3OTUxMTY1N30.IoZmjXug5WVy9LCICHff93Sz4_ruNTleI7Xn6e88nDQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanDuplicateCategories() {
  console.log('Buscando categorias...');
  const { data, error } = await supabase.from('categories').select('*');
  
  if (error) {
    console.error('Erro:', error);
    return;
  }

  const seen = new Set();
  const toDelete = [];

  for (const cat of data) {
    const nameLower = cat.name.toLowerCase().trim();
    if (seen.has(nameLower)) {
      toDelete.push(cat.id);
    } else {
      seen.add(nameLower);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Encontradas ${toDelete.length} categorias duplicadas. Deletando...`);
    const { error: delError } = await supabase.from('categories').delete().in('id', toDelete);
    if (delError) {
      console.error('Erro ao deletar:', delError);
    } else {
      console.log('Duplicadas removidas com sucesso!');
    }
  } else {
    console.log('Nenhuma categoria duplicada encontrada.');
  }
}

cleanDuplicateCategories();
