import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2t6bGZqbHBrdGZ6bWNwaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzU2NTcsImV4cCI6MjA3OTUxMTY1N30.IoZmjXug5WVy9LCICHff93Sz4_ruNTleI7Xn6e88nDQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixCategory() {
  const newImg = 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?q=80&w=800&auto=format&fit=crop';
  console.log('Atualizando categoria Café da Manhã no Supabase...');
  
  const { data, error } = await supabase
    .from('categories')
    .update({ img: newImg })
    .ilike('name', 'Café da Manhã%');

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Categoria atualizada com sucesso!');
  }
}

fixCategory();
