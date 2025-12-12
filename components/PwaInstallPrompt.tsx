
import React, { useState, useEffect } from 'react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up no-print">
      <div className="bg-pop-dark text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-700">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-pop-dark" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
            </div>
            <div>
               <h4 className="font-bold text-sm">Instalar App</h4>
               <p className="text-xs text-gray-400">Acesso rápido e offline.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
               ✕
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-pop-red hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
               Instalar
            </button>
         </div>
      </div>
    </div>
  );
};
