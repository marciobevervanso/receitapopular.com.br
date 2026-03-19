
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';

export const NewsletterManager: React.FC = () => {
  const [subscribers, setSubscribers] = useState<{email: string, created_at: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await storageService.getSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyList = () => {
    const emails = subscribers.map(s => s.email).join('\n');
    navigator.clipboard.writeText(emails);
    alert('Lista de e-mails copiada para a área de transferência!');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
       <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-3xl font-extrabold text-pop-dark">Newsletter</h2>
           <p className="text-gray-500">Gerencie sua base de leads.</p>
         </div>
         <button 
           onClick={copyList} 
           disabled={subscribers.length === 0}
           className="bg-pop-dark text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2 shadow-lg"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
           Copiar Lista
         </button>
       </div>

       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
             <span className="font-bold text-pop-dark uppercase text-xs tracking-widest">Total de Inscritos</span>
             <span className="text-2xl font-black text-pop-red">{subscribers.length}</span>
          </div>
          
          {loading ? (
             <div className="p-12 text-center text-gray-400">Carregando...</div>
          ) : subscribers.length === 0 ? (
             <div className="p-12 text-center text-gray-400 italic">Nenhum inscrito ainda.</div>
          ) : (
             <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                   <thead className="bg-white sticky top-0 shadow-sm">
                      <tr>
                         <th className="p-4 text-xs font-bold text-gray-400 uppercase w-2/3">E-mail</th>
                         <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Data Inscrição</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {subscribers.map((sub, idx) => (
                         <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-700">{sub.email}</td>
                            <td className="p-4 text-right text-sm text-gray-400 font-mono">
                               {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
       </div>
    </div>
  );
};
