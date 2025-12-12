
import { DietPlan } from "./types";

export const CATEGORIES = [
  { name: 'Café da Manhã', img: 'https://images.unsplash.com/photo-1533089862017-5f32f0e5057c?q=80&w=800&auto=format&fit=crop' },
  { name: 'Almoço', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop' },
  { name: 'Jantar', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop' },
  { name: 'Fitness', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' },
  { name: 'Airfryer', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop' },
  { name: 'Saudável', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop' },
  { name: 'Massas', img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=800&auto=format&fit=crop' },
  { name: 'Sobremesas', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop' },
  { name: 'Drinks', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop' },
  { name: 'Pães', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop' },
];

export const FEATURED_PLANS: DietPlan[] = [
  {
    id: 'viral-low-carb',
    title: 'Desafio Seca Barriga 7 Dias',
    description: 'O protocolo viral focado em baixo carboidrato e jejum natural. Ideal para desinchar rápido antes de eventos.',
    duration: '7 Dias',
    level: 'Médio',
    goal: 'Emagrecimento',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    structure: {
      mon: { lunchQuery: 'Frango Grelhado', dinnerQuery: 'Sopa Verde' },
      tue: { lunchQuery: 'Peixe Assado', dinnerQuery: 'Omelete' },
      wed: { lunchQuery: 'Carne com Brócolis', dinnerQuery: 'Salada Caesar' },
      thu: { lunchQuery: 'Ovos Cozidos', dinnerQuery: 'Caldo de Abóbora' },
      fri: { lunchQuery: 'Sobrecoxa', dinnerQuery: 'Abobrinha' },
      sat: { lunchQuery: 'Churrasco Magro', dinnerQuery: 'Salada de Atum' },
      sun: { lunchQuery: 'Peixe', dinnerQuery: 'Ovos Mexidos' }
    }
  },
  {
    id: 'cheap-meal-prep',
    title: 'Marmitas da Semana com R$50',
    description: 'Economize tempo e dinheiro. Lista de compras inteligente para cozinhar tudo no domingo e comer a semana toda.',
    duration: '5 Dias',
    level: 'Fácil',
    goal: 'Economia',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?q=80&w=800&auto=format&fit=crop',
    structure: {
      mon: { lunchQuery: 'Carne Moída com Batata', dinnerQuery: 'Arroz com Ovo' },
      tue: { lunchQuery: 'Frango Desfiado', dinnerQuery: 'Macarrão Alho e Óleo' },
      wed: { lunchQuery: 'Feijão Tropeiro', dinnerQuery: 'Salsicha' },
      thu: { lunchQuery: 'Omelete de Legumes', dinnerQuery: 'Sobras de Frango' },
      fri: { lunchQuery: 'Arroz de Forno', dinnerQuery: 'Sanduíche' }
    }
  },
  {
    id: 'muscle-gain',
    title: 'Projeto Hipertrofia Limpa',
    description: 'Alta proteína, gorduras boas e carboidratos complexos. O combustível perfeito para quem treina pesado.',
    duration: '7 Dias',
    level: 'Difícil',
    goal: 'Ganho de Massa',
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=800&auto=format&fit=crop',
    structure: {
      mon: { lunchQuery: 'Peito de Frango', dinnerQuery: 'Patinho Moído' },
      tue: { lunchQuery: 'Tilápia', dinnerQuery: 'Ovos Cozidos' },
      wed: { lunchQuery: 'Alcatra', dinnerQuery: 'Frango com Batata Doce' },
      thu: { lunchQuery: 'Salmão', dinnerQuery: 'Whey Protein' },
      fri: { lunchQuery: 'Frango Grelhado', dinnerQuery: 'Hamburguer Caseiro' },
      sat: { lunchQuery: 'Churrasco', dinnerQuery: 'Tapioca com Frango' },
      sun: { lunchQuery: 'Macarrão Integral', dinnerQuery: 'Omelete Gigante' }
    }
  },
  {
    id: 'airfryer-week',
    title: 'Semana Só na Airfryer',
    description: 'Sem sujeira, sem óleo e muito crocante. Um cardápio completo feito 100% na fritadeira elétrica.',
    duration: '5 Dias',
    level: 'Fácil',
    goal: 'Praticidade',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop',
    structure: {
      mon: { lunchQuery: 'Frango na Airfryer', dinnerQuery: 'Batata Rústica' },
      tue: { lunchQuery: 'Peixe Empanado', dinnerQuery: 'Legumes Assados' },
      wed: { lunchQuery: 'Almôndegas', dinnerQuery: 'Pão de Alho' },
      thu: { lunchQuery: 'Coxinha da Asa', dinnerQuery: 'Chips de Batata' },
      fri: { lunchQuery: 'Hamburguer', dinnerQuery: 'Torrada' }
    }
  }
];
