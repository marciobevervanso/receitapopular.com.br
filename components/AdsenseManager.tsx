import React, { useState, useEffect } from 'react';
import { AdSettings, SiteSettings } from '../types';

interface AdsenseManagerProps {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => Promise<void>;
}

export const AdsenseManager: React.FC<AdsenseManagerProps> = ({ settings: globalSettings, onSave }) => {
  const [settings, setSettings] = useState<AdSettings>({
    clientId: 'ca-pub-6058225169212979',
    slots: { 
       homeTop: '6608470753', 
       homeMiddle: '8784175551', 
       sidebar: '1931126043', 
       recipeTop: '7103294779', 
       recipeMiddle: '7454782015', 
       recipeBottom: '4716804589' 
    }
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (globalSettings.adSettings) {
      setSettings(globalSettings.adSettings);
    }
  }, [globalSettings.adSettings]);

  const handleSave = async () => {
    try {
      await onSave({ ...globalSettings, adSettings: settings });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch(err) {
      console.error(err);
      alert("Erro ao salvar no banco de dados.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-pop-dark flex items-center gap-3">
           Motor de Monetização (AdSense)
        </h2>
        <p className="text-gray-500 mt-2">Configure seu Client ID e os códigos dos blocos de anúncios para renderizá-los automaticamente no site.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        
        {/* Client ID */}
        <div className="mb-10 pb-10 border-b border-gray-100">
           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Conta do Google AdSense</label>
           <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-pop-dark transition-colors">
              <span className="bg-gray-100 px-4 py-3 text-gray-400 font-bold border-r border-gray-200">ID:</span>
              <input 
                 type="text" 
                 className="flex-1 bg-transparent px-4 py-3 outline-none font-medium text-gray-700 placeholder-gray-300" 
                 placeholder="ca-pub-XXXXXXXXXXXXX" 
                 value={settings.clientId} 
                 onChange={e => setSettings({ ...settings, clientId: e.target.value })} 
              />
           </div>
           <p className="text-xs text-gray-400 mt-2 font-medium">Exemplo: ca-pub-123456789</p>
        </div>

        {/* Slots */}
        <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-6">Códigos de Blocos (Slots)</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Home - Topo</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.homeTop} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, homeTop: e.target.value } })} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Home - Meio</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.homeMiddle} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, homeMiddle: e.target.value } })} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Sidebar Global</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.sidebar} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, sidebar: e.target.value } })} />
              </div>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Receita - Topo</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.recipeTop || ''} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, recipeTop: e.target.value } })} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Receita - Meio do Texto</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.recipeMiddle || ''} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, recipeMiddle: e.target.value } })} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Receita - Fim (Rodapé)</label>
                 <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-pop-dark" placeholder="1234567890" value={settings.slots.recipeBottom || ''} onChange={e => setSettings({ ...settings, slots: { ...settings.slots, recipeBottom: e.target.value } })} />
              </div>
           </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
           <p className="text-sm text-gray-500 font-medium">* As alterações entram no ar imediatamente.</p>
           <button 
             onClick={handleSave} 
             className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isSaved ? 'bg-pop-green text-white shadow-green-200' : 'bg-pop-dark text-white hover:bg-black'}`}
           >
             {isSaved ? (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Salvo!</>
             ) : 'Salvar Configurações'}
           </button>
        </div>

      </div>
    </div>
  );
}
