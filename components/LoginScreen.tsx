
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
  onCancel: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'marciobever' && pass === '102030') {
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-pop-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200 rotate-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
           </div>
           <h2 className="text-3xl font-serif font-black text-pop-dark">Área do Chef</h2>
           <p className="text-gray-500 mt-2 font-medium">Acesso restrito para administradores.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-100">
           <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usuário</label>
              <input 
                type="text" 
                value={user}
                onChange={e => setUser(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-pop-dark focus:outline-none transition-colors"
                placeholder="Digite seu usuário"
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Senha</label>
              <input 
                type="password" 
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-pop-dark focus:outline-none transition-colors"
                placeholder="••••••"
              />
           </div>

           {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

           <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-3 bg-pop-dark text-white font-bold rounded-xl hover:bg-black shadow-lg transition-colors"
              >
                Entrar
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};
