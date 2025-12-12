
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AffiliateBanner } from '../types';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  label?: string;
  banners?: AffiliateBanner[]; 
  position?: AffiliateBanner['position'];
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  slotId, 
  format = 'auto', 
  className = '', 
  label = 'Publicidade',
  banners = [],
  position
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('adSettings');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setClientId(parsed.clientId || '');
    }
  }, []);

  // Lazy loading logic for Ads
  useEffect(() => {
    if (!containerRef.current) return;

    // Use IntersectionObserver to only render ads when they are in view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load when 200px away
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Seleciona banner se existir para a posição
  const activeBanner = useMemo(() => {
    if (!position || !banners || banners.length === 0) return null;
    
    const matches = banners.filter(b => b.position === position && b.isActive);
    
    if (matches.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * matches.length);
    return matches[randomIndex];
  }, [banners, position]);

  if (!isVisible) {
    // Placeholder to prevent layout shift
    return <div ref={containerRef} className={`min-h-[250px] w-full bg-transparent ${className}`}></div>;
  }

  if (activeBanner) {
    return (
      <div className={`text-center my-8 overflow-hidden flex flex-col items-center animate-fade-in ${className}`}>
         <div className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 text-center">Patrocinado</div>
         <a 
           href={activeBanner.linkUrl} 
           target="_blank" 
           rel="nofollow noreferrer noopener"
           className="block hover:opacity-95 transition-opacity max-w-full"
         >
            <img 
              src={activeBanner.imageUrl} 
              alt={activeBanner.name} 
              loading="lazy"
              className="max-w-full h-auto rounded-lg shadow-sm object-contain"
              style={{ maxHeight: position?.includes('sidebar') ? '600px' : '280px' }}
            />
         </a>
      </div>
    );
  }

  // Fallback para AdSense
  if (!slotId || !clientId) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 text-gray-400 select-none ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{label}</span>
        <span className="text-xs">Espaço reservado (AdSense ou Banner)</span>
        <span className="text-[10px] mt-2 opacity-50">(Configure no Dashboard)</span>
      </div>
    );
  }

  return (
    <div className={`text-center my-8 overflow-hidden animate-fade-in ${className}`}>
       <div className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 text-center">Publicidade</div>
       <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client={clientId}
         data-ad-slot={slotId}
         data-ad-format={format}
         data-full-width-responsive="true"></ins>
    </div>
  );
};
