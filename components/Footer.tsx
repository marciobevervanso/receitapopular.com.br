
import React from 'react';
import { Category, SiteSettings, Language } from '../types';
import { t } from '../utils/i18n';

interface FooterProps {
  categories: Category[];
  settings: SiteSettings;
  onOpenAllRecipes: () => void;
  onOpenCategory: (category: Category) => void;
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ categories, settings, onOpenAllRecipes, onOpenCategory, language }) => {
  return (
    <footer className="bg-[#1c1917] text-gray-400 py-16 border-t-4 border-pop-red no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
             
             {/* Brand Column */}
             <div className="md:pr-12">
                <div className="flex items-center gap-2 mb-6 text-white">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
                   <span className="font-serif font-bold text-xl tracking-tight">{settings.siteName}</span>
                </div>
                <p className="text-sm leading-relaxed mb-6 font-serif italic max-w-sm">
                   {t(language, 'footerDesc')} 
                </p>
                <div className="flex gap-4 mt-4">
                   {/* Facebook */}
                   {settings.socialLinks.facebook && (
                     <a href={settings.socialLinks.facebook} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors cursor-pointer text-white group" aria-label="Facebook">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                     </a>
                   )}
                   
                   {/* Instagram */}
                   {settings.socialLinks.instagram && (
                     <a href={settings.socialLinks.instagram} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-colors cursor-pointer text-white group" aria-label="Instagram">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.072 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                     </a>
                   )}

                   {/* X (Twitter) */}
                   {settings.socialLinks.twitter && (
                     <a href={settings.socialLinks.twitter} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer text-white group" aria-label="X (Twitter)">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                     </a>
                   )}
                </div>
             </div>

             {/* Navigation Links - Merged & Simplified */}
             <div className="flex flex-col md:items-end">
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">{t(language, 'navQuick')}</h4>
                <ul className="space-y-4 text-sm md:text-right">
                   <li><button onClick={onOpenAllRecipes} className="hover:text-white transition-colors">{t(language, 'seeAll')}</button></li>
                   {categories.slice(0, 3).map(cat => (
                      <li key={cat.id}>
                        <button onClick={() => onOpenCategory(cat)} className="hover:text-white transition-colors">{cat.name}</button>
                      </li>
                   ))}
                   <li className="pt-4"><span className="text-gray-600 text-xs">{t(language, 'rights')}</span></li>
                </ul>
             </div>

          </div>
      </div>
    </footer>
  );
};
