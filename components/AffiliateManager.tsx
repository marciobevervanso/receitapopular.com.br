
import React, { useState } from 'react';
import { SiteSettings, AffiliateBanner } from '../types';

interface AffiliateManagerProps {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => Promise<void>;
}

const EMPTY_BANNER: AffiliateBanner = {
  id: '',
  name: '',
  imageUrl: '',
  linkUrl: '',
  position: 'home_middle',
  isActive: true
};

export const AffiliateManager: React.FC<AffiliateManagerProps> = ({ settings, onSave }) => {
  const [banners, setBanners] = useState<AffiliateBanner[]>(settings.banners || []);
  const [editingBanner, setEditingBanner] = useState<AffiliateBanner | null>(null);
  const [saving, setSaving] = useState(false);

  const POSITIONS = [
    { id: 'home_top', label: 'Home: Topo' },
    { id: 'home_middle', label: 'Home: Meio (Banner)' },
    { id: 'recipe_top', label: 'Receita: Topo' },
    { id: 'recipe_middle', label: 'Receita: Meio' },
    { id: 'recipe_bottom', label: 'Receita: Rodapé' },
    { id: 'sidebar', label: 'Lateral (Desktop)' },
  ];

  const handleEdit = (banner: AffiliateBanner) => {
    setEditingBanner({ ...banner });
  };

  const handleCreate = () => {
    setEditingBanner({ ...EMPTY_BANNER, id: Date.now().toString() });
  };

  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    
    setSaving(true);
    let updatedBanners = [...banners];
    
    const index = updatedBanners.findIndex(b => b.id === editingBanner.id);
    if (index >= 0) {
      updatedBanners[index] = editingBanner;
    } else {
      updatedBanners.push(editingBanner);
    }

    setBanners(updatedBanners);
    await onSave({ ...settings, banners: updatedBanners });
    setSaving(false);
    setEditingBanner(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover este banner?")) {
      setSaving(true);
      const updatedBanners = banners.filter(b => b.id !== id);
      setBanners(updatedBanners);
      await onSave({ ...settings, banners: updatedBanners });
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
       <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-3xl font-extrabold text-pop-dark">Afiliados & Banners</h2>
           <p className="text-gray-500">Gerencie campanhas ActionPay e outros anúncios.</p>
         </div>
         <button onClick={handleCreate} disabled={saving} className="bg-pop-dark text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2 shadow-lg">
           + Novo Banner
         </button>
       </div>

       {editingBanner && (
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg mb-8 animate-fade-in">
            <h3 className="font-bold text-pop-dark text-lg mb-6 border-b border-gray-100 pb-2">
               {editingBanner.id === '' ? 'Criar Banner' : 'Editar Banner'}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome da Campanha</label>
                     <input 
                       type="text" 
                       value={editingBanner.name}
                       onChange={e => setEditingBanner({...editingBanner, name: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                       placeholder="Ex: Shopee Oferta Natal"
                     />
                  </div>
                  
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Imagem do Banner (URL)</label>
                     <input 
                       type="text" 
                       value={editingBanner.imageUrl}
                       onChange={e => setEditingBanner({...editingBanner, imageUrl: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                       placeholder="https://..."
                     />
                     <p className="text-[10px] text-gray-400 mt-1">Copie o link da imagem do ActionPay ou use uma imagem sua.</p>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Link de Afiliado (Destino)</label>
                     <input 
                       type="text" 
                       value={editingBanner.linkUrl}
                       onChange={e => setEditingBanner({...editingBanner, linkUrl: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-blue-600 font-mono"
                       placeholder="https://actionpay..."
                     />
                  </div>

                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Posição</label>
                        <select 
                           value={editingBanner.position}
                           onChange={e => setEditingBanner({...editingBanner, position: e.target.value as any})}
                           className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer"
                        >
                           {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                     </div>
                     <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="checkbox" 
                             checked={editingBanner.isActive}
                             onChange={e => setEditingBanner({...editingBanner, isActive: e.target.checked})}
                             className="w-6 h-6 rounded border-gray-300 text-pop-green focus:ring-pop-green"
                           />
                           <span className="font-bold text-pop-dark">Ativo</span>
                        </label>
                     </div>
                  </div>
               </div>

               <div className="bg-gray-100 rounded-2xl p-4 flex flex-col justify-center items-center border border-dashed border-gray-300">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pré-visualização</span>
                  {editingBanner.imageUrl ? (
                     <a href={editingBanner.linkUrl} target="_blank" rel="noreferrer" className="block max-w-full hover:opacity-90 transition-opacity">
                        <img src={editingBanner.imageUrl} alt="Preview" className="max-w-full max-h-[250px] object-contain rounded-lg shadow-sm" />
                     </a>
                  ) : (
                     <div className="text-gray-400 text-sm italic">Insira uma URL de imagem</div>
                  )}
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
               <button onClick={() => setEditingBanner(null)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
               <button onClick={handleSaveBanner} disabled={saving} className="px-8 py-3 bg-pop-green text-white font-bold rounded-xl hover:bg-green-600 shadow-lg disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar Banner'}
               </button>
            </div>
         </div>
       )}

       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {banners.length === 0 ? (
             <div className="p-12 text-center text-gray-400">
                <p className="mb-4 text-xl">📢</p>
                <p>Nenhum banner configurado ainda.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 divide-y divide-gray-100">
                {banners.map(banner => (
                   <div key={banner.id} className="p-6 flex flex-col md:flex-row gap-6 items-center hover:bg-gray-50 transition-colors group">
                      <div className="w-full md:w-32 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                         {banner.imageUrl ? (
                            <img src={banner.imageUrl} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <span className="text-xs text-gray-400">Sem Imagem</span>
                         )}
                      </div>
                      
                      <div className="flex-1 text-center md:text-left">
                         <h4 className="font-bold text-pop-dark flex items-center justify-center md:justify-start gap-2">
                            {banner.name}
                            {!banner.isActive && <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] uppercase rounded">Inativo</span>}
                         </h4>
                         <div className="text-xs text-gray-500 mt-1 flex flex-col md:flex-row gap-2 md:gap-4">
                            <span className="flex items-center gap-1">
                               📍 {POSITIONS.find(p => p.id === banner.position)?.label || banner.position}
                            </span>
                            <span className="truncate max-w-[200px] text-blue-400">{banner.linkUrl}</span>
                         </div>
                      </div>

                      <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(banner)} className="p-2 text-gray-400 hover:text-pop-dark border border-gray-200 rounded-lg hover:bg-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-400 hover:text-red-600 border border-gray-200 rounded-lg hover:bg-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};
