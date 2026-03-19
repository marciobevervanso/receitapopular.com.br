
import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onSave: (categories: Category[]) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onSave }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImg, setEditImg] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImg(cat.img);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImg('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const updated = categories.map(c => 
      c.id === editingId ? { ...c, name: editName, img: editImg } : c
    );
    await onSave(updated);
    setSaving(false);
    cancelEdit();
  };

  const addCategory = async () => {
    setSaving(true);
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: 'Nova Categoria',
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800'
    };
    await onSave([...categories, newCat]);
    setSaving(false);
    startEdit(newCat);
  };

  const deleteCategory = async (id: string) => {
    if(window.confirm('Excluir esta categoria?')) {
      setSaving(true);
      await onSave(categories.filter(c => c.id !== id));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
       <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-3xl font-extrabold text-pop-dark">Gerenciar Categorias</h2>
           <p className="text-gray-500">Organize a navegação do seu site.</p>
         </div>
         <button onClick={addCategory} disabled={saving} className="bg-pop-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50">
           + Nova Categoria
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
             <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 items-center">
                {editingId === cat.id ? (
                   <div className="flex-1 space-y-2">
                      <input 
                        className="w-full px-3 py-2 border rounded text-sm font-bold"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Nome da Categoria"
                      />
                      <input 
                        className="w-full px-3 py-2 border rounded text-xs font-mono"
                        value={editImg}
                        onChange={e => setEditImg(e.target.value)}
                        placeholder="URL da Imagem"
                      />
                      <div className="flex gap-2 mt-2">
                         <button onClick={saveEdit} disabled={saving} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded font-bold">{saving ? '...' : 'Salvar'}</button>
                         <button onClick={cancelEdit} className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded font-bold">Cancelar</button>
                      </div>
                   </div>
                ) : (
                   <>
                     <img src={cat.img} alt={cat.name} className="w-16 h-16 rounded-lg object-cover" />
                     <div className="flex-1">
                        <h4 className="font-bold text-pop-dark">{cat.name}</h4>
                        <span className="text-xs text-gray-400 font-mono">{cat.id}</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => startEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                   </>
                )}
             </div>
          ))}
       </div>
    </div>
  );
};
