
import React, { useState, useEffect } from 'react';
import { SiteSettings, Recipe, Category } from '../types';
import { storageService } from '../services/storageService';

interface SettingsManagerProps {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => Promise<void>;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // We need to fetch recipes to populate the hero selector
    storageService.getRecipes().then(setAvailableRecipes);
    storageService.getCategories().then(setCategories);
  }, []);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (network: keyof SiteSettings['socialLinks'], value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [network]: value }
    }));
  };

  const toggleHeroRecipe = (id: string) => {
    const current = formData.heroRecipeIds || [];
    let updated;
    if (current.includes(id)) {
      updated = current.filter(rid => rid !== id);
    } else {
      updated = [...current, id];
    }
    setFormData(prev => ({ ...prev, heroRecipeIds: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
       <div className="mb-8">
         <h2 className="text-3xl font-extrabold text-pop-dark">Configurações do Site</h2>
         <p className="text-gray-500">Ajuste os detalhes globais da plataforma.</p>
       </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          
          {/* SEO Identity */}
          <div>
             <h3 className="font-bold text-pop-dark uppercase text-sm mb-4 border-b border-gray-100 pb-2">Identidade & SEO</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome do Site</label>
                   <input 
                     type="text" 
                     value={formData.siteName}
                     onChange={e => handleChange('siteName', e.target.value)}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição (Meta Description)</label>
                   <textarea 
                     value={formData.siteDescription}
                     onChange={e => handleChange('siteDescription', e.target.value)}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none"
                   />
                </div>
             </div>
          </div>

          {/* Special Collection Config */}
          <div>
             <h3 className="font-bold text-pop-dark uppercase text-sm mb-4 border-b border-gray-100 pb-2">Coleção Especial (Home)</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoria em Destaque</label>
                   <select
                     value={formData.specialCollectionCategoryId || ''}
                     onChange={e => handleChange('specialCollectionCategoryId', e.target.value)}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                   >
                     <option value="">-- Automático (Rotacionar Diariamente) --</option>
                     {categories.map(cat => (
                       <option key={cat.id} value={cat.id}>{cat.name}</option>
                     ))}
                   </select>
                   <p className="text-[10px] text-gray-400 mt-2">
                      Escolha uma categoria específica para exibir na seção "Coleção Especial" ou deixe em automático para mudar todo dia.
                   </p>
                </div>
             </div>
          </div>

          {/* Integrations (n8n) */}
          <div>
             <h3 className="font-bold text-pop-dark uppercase text-sm mb-4 border-b border-gray-100 pb-2">Integrações (Automação)</h3>
             <div className="space-y-4">
                {/* Affiliates */}
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Webhook Afiliados (Shopee)</label>
                   <div className="flex gap-2">
                      <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm">POST</span>
                      <input 
                        type="text" 
                        value={formData.n8nWebhookUrl || ''}
                        onChange={e => handleChange('n8nWebhookUrl', e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-blue-600"
                        placeholder="https://seu-n8n.com/webhook/shopee..."
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2">
                      Para gerar links de afiliados dos utensílios.
                   </p>
                </div>

                {/* Social Media */}
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Webhook Redes Sociais (Instagram/FB)</label>
                   <div className="flex gap-2">
                      <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm">POST</span>
                      <input 
                        type="text" 
                        value={formData.n8nSocialWebhookUrl || ''}
                        onChange={e => handleChange('n8nSocialWebhookUrl', e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-pink-600"
                        placeholder="https://seu-n8n.com/webhook/social..."
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2">
                      Para publicar a receita automaticamente nas redes.
                   </p>
                </div>

                {/* Memes */}
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Webhook Fábrica de Memes</label>
                   <div className="flex gap-2">
                      <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm">POST</span>
                      <input 
                        type="text" 
                        value={formData.n8nMemeWebhookUrl || ''}
                        onChange={e => handleChange('n8nMemeWebhookUrl', e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-purple-600"
                        placeholder="https://seu-n8n.com/webhook/memes..."
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2">
                      Dispara a criação e postagem de memes automáticos.
                   </p>
                </div>
             </div>
          </div>

          {/* Hero Feature Selection */}
          <div>
             <h3 className="font-bold text-pop-dark uppercase text-sm mb-4 border-b border-gray-100 pb-2">Destaques da Home (Hero)</h3>
             <p className="text-xs text-gray-400 mb-4">
               Selecione as receitas para o destaque. Se selecionar apenas 1, ela ficará fixa. Se selecionar mais, elas alternarão a cada 2 dias.
             </p>
             <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 custom-scrollbar space-y-1">
                {availableRecipes.map(recipe => {
                   const isSelected = (formData.heroRecipeIds || []).includes(recipe.id);
                   return (
                     <label key={recipe.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-pop-yellow/10 border-2 border-pop-yellow shadow-sm' : 'hover:bg-gray-50 border-2 border-transparent'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleHeroRecipe(recipe.id)}
                          className="w-4 h-4 text-pop-red rounded border-gray-300 focus:ring-pop-red accent-pop-red"
                        />
                        <div className="flex-1">
                           <div className={`text-sm font-bold ${isSelected ? 'text-pop-dark' : 'text-gray-600'}`}>{recipe.title}</div>
                           <div className="text-xs text-gray-400">{recipe.datePublished}</div>
                        </div>
                        {isSelected && <span className="text-xs font-bold text-pop-yellow uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm">Ativo</span>}
                     </label>
                   );
                })}
             </div>
          </div>

          {/* Social Media Links */}
          <div>
             <h3 className="font-bold text-pop-dark uppercase text-sm mb-4 border-b border-gray-100 pb-2">Redes Sociais (Rodapé)</h3>
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                   <input type="text" placeholder="URL do Facebook" value={formData.socialLinks.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded bg-pink-600 flex items-center justify-center text-white"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.072 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></div>
                   <input type="text" placeholder="URL do Instagram" value={formData.socialLinks.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
                   <input type="text" placeholder="URL do X (Twitter)" value={formData.socialLinks.twitter || ''} onChange={e => handleSocialChange('twitter', e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
                </div>
             </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg disabled:opacity-50">
             {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
          </button>
       </div>
    </div>
  );
};
