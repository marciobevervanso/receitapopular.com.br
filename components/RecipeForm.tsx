
import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '../types';

interface RecipeFormProps {
  initialData?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

const EMPTY_RECIPE: Recipe = {
  id: '',
  title: '',
  slug: '',
  datePublished: new Date().toISOString().split('T')[0],
  description: '',
  story: '',
  prepTime: '',
  cookTime: '',
  servings: 2,
  ingredients: [{ item: '', amount: '' }],
  steps: [''],
  nutrition: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
  imageUrl: '',
  videoUrl: '',
  affiliates: [],
  tags: [],
  status: 'published'
};

export const RecipeForm: React.FC<RecipeFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Recipe>(EMPTY_RECIPE);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Ensure ID is generated if missing
      setFormData({ ...EMPTY_RECIPE, id: Date.now().toString(), datePublished: new Date().toISOString().split('T')[0] });
    }
  }, [initialData]);

  const handleChange = (field: keyof Recipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNutritionChange = (field: keyof typeof formData.nutrition, value: any) => {
    setFormData(prev => ({
      ...prev,
      nutrition: { ...prev.nutrition, [field]: value }
    }));
  };

  // Ingredient Helpers
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngs = [...formData.ingredients];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngs }));
  };
  const addIngredient = () => {
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, { item: '', amount: '' }] }));
  };
  const removeIngredient = (index: number) => {
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  };

  // Step Helpers
  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };
  const addStep = () => {
    setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  };
  const removeStep = (index: number) => {
    setFormData(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
  };

  // Tag Helpers
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure ID is string
    const recipeToSave = {
        ...formData,
        id: formData.id ? formData.id.toString() : Date.now().toString()
    };
    onSave(recipeToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-pop-dark">{initialData ? 'Editar Receita' : 'Nova Receita'}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-6 py-2 bg-pop-green text-white font-bold rounded-lg hover:bg-green-600 shadow-lg shadow-green-100">Salvar</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Meta Data */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Título da Receita</label>
            <input 
              required 
              type="text" 
              value={formData.title} 
              onChange={e => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-dark outline-none font-bold text-lg" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Slug (URL Amigável)</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => handleChange('slug', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-blue-600" 
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Data Publicação</label>
                <input 
                  type="date" 
                  value={formData.datePublished} 
                  onChange={e => handleChange('datePublished', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição Curta</label>
            <textarea 
              required
              value={formData.description} 
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-dark outline-none h-24 resize-none" 
            />
          </div>
          
           <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Imagem URL</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={formData.imageUrl} 
                onChange={e => handleChange('imageUrl', e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
              />
              <img src={formData.imageUrl || 'https://via.placeholder.com/150'} alt="Preview" className="w-12 h-12 rounded object-cover border" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vídeo URL (YouTube)</label>
             <input 
               type="text" 
               value={formData.videoUrl || ''} 
               onChange={e => handleChange('videoUrl', e.target.value)}
               placeholder="https://www.youtube.com/watch?v=..."
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
             />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preparo</label>
               <input type="text" value={formData.prepTime} onChange={e => handleChange('prepTime', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Ex: 20 min" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cozimento</label>
               <input type="text" value={formData.cookTime} onChange={e => handleChange('cookTime', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Ex: 40 min" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Porções</label>
               <input type="number" value={formData.servings} onChange={e => handleChange('servings', parseInt(e.target.value))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">História (Blog Post)</label>
            <textarea 
              value={formData.story} 
              onChange={e => handleChange('story', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-dark outline-none h-40 resize-none font-serif text-sm leading-relaxed" 
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tags / Categorias (separadas por vírgula)</label>
             <input 
               type="text" 
               value={formData.tags.join(', ')} 
               onChange={handleTagsChange}
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
               placeholder="Ex: Jantar, Italiano, Fácil"
             />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-8">
           
           {/* Ingredients */}
           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold text-pop-dark uppercase text-sm">Ingredientes</h3>
                 <button type="button" onClick={addIngredient} className="text-xs font-bold text-pop-green hover:underline">+ Adicionar</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 {formData.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                       <input 
                         type="text" placeholder="Qtd" value={ing.amount} 
                         onChange={e => updateIngredient(i, 'amount', e.target.value)}
                         className="w-20 px-2 py-1.5 rounded border text-sm"
                       />
                       <input 
                         type="text" placeholder="Item" value={ing.item} 
                         onChange={e => updateIngredient(i, 'item', e.target.value)}
                         className="flex-1 px-2 py-1.5 rounded border text-sm"
                       />
                       <input 
                         type="text" placeholder="Nota" value={ing.note || ''} 
                         onChange={e => updateIngredient(i, 'note', e.target.value)}
                         className="w-24 px-2 py-1.5 rounded border text-sm text-gray-500"
                       />
                       <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                    </div>
                 ))}
              </div>
           </div>

           {/* Steps */}
           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold text-pop-dark uppercase text-sm">Passo a Passo</h3>
                 <button type="button" onClick={addStep} className="text-xs font-bold text-pop-green hover:underline">+ Adicionar</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 {formData.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                       <span className="text-xs font-bold text-gray-400 mt-2 w-4">{i+1}.</span>
                       <textarea 
                         value={step} 
                         onChange={e => updateStep(i, e.target.value)}
                         className="flex-1 px-2 py-2 rounded border text-sm resize-none h-16"
                       />
                       <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 font-bold px-2 mt-2">×</button>
                    </div>
                 ))}
              </div>
           </div>

           {/* Nutrition */}
           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-pop-dark uppercase text-sm mb-4">Nutrição</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-gray-400">Calorias</label>
                    <input type="number" value={formData.nutrition.calories} onChange={e => handleNutritionChange('calories', parseInt(e.target.value))} className="w-full px-2 py-1 rounded border text-sm" />
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Proteína</label>
                    <input type="text" value={formData.nutrition.protein} onChange={e => handleNutritionChange('protein', e.target.value)} className="w-full px-2 py-1 rounded border text-sm" />
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Carbo</label>
                    <input type="text" value={formData.nutrition.carbs} onChange={e => handleNutritionChange('carbs', e.target.value)} className="w-full px-2 py-1 rounded border text-sm" />
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Gordura</label>
                    <input type="text" value={formData.nutrition.fat} onChange={e => handleNutritionChange('fat', e.target.value)} className="w-full px-2 py-1 rounded border text-sm" />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </form>
  );
};
