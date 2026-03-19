
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

export const WelcomeModal: React.FC = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'offer' | 'thankyou'>('offer');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has already seen/dismissed the newsletter popup
    const dismissed = localStorage.getItem('newsletterDismissed');
    if (!dismissed) {
      // Delay to allow user to see the site first (better UX)
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('newsletterDismissed', 'true');
    setShow(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await storageService.subscribeNewsletter(email);
      setStep('thankyou');
      localStorage.setItem('newsletterDismissed', 'true');
    } catch (error) {
      alert("Erro ao inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative overflow-hidden border-4 border-white ring-1 ring-gray-100">
        
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-pop-gray to-white -z-10"></div>
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pop-yellow/20 rounded-full blur-2xl"></div>
        <div className="absolute top-10 -left-6 w-20 h-20 bg-pop-red/10 rounded-full blur-xl"></div>

        {/* Close Button */}
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 text-center">
           
           {/* Logo Brand */}
           <div className="w-20 h-20 bg-pop-dark text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-300 transform -rotate-3 border-4 border-white">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
           </div>

           {step === 'offer' ? (
             <>
               <h2 className="text-2xl font-black text-pop-dark mb-2 font-serif">Bem-vindo, Chef!</h2>
               <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                 Junte-se à nossa comunidade VIP e receba <strong>receitas exclusivas</strong> e dicas de chef toda semana.
               </p>

               <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-pop-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input 
                      type="email" 
                      placeholder="Seu melhor e-mail" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-pop-red focus:ring-2 focus:ring-red-100 transition-all text-sm font-medium"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-pop-dark text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Entrando...' : 'Quero receber receitas!'}
                  </button>
               </form>

               <button 
                 onClick={handleDismiss}
                 className="mt-4 text-xs font-bold text-gray-400 hover:text-pop-dark underline decoration-gray-300 underline-offset-4 transition-colors"
               >
                  Não, prefiro apenas navegar
               </button>
             </>
           ) : (
             <div className="animate-fade-in py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-inner">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-black text-pop-dark mb-2">Tudo pronto!</h3>
                <p className="text-gray-500 text-sm mb-6">Enviamos um presente de boas-vindas para seu e-mail.</p>
                <button 
                  onClick={() => setShow(false)}
                  className="w-full py-3 bg-pop-dark text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                   Ir para o Site
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
