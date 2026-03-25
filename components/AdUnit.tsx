
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AffiliateBanner } from '../types';

const DEFAULT_CLIENT_ID = 'ca-pub-6058225169212979';

interface AdUnitProps {
  slotId?: string;
  clientId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  label?: string;
  banners?: AffiliateBanner[]; 
  position?: AffiliateBanner['position'];
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  slotId, 
  clientId = DEFAULT_CLIENT_ID,
  format = 'auto', 
  className = '', 
  label = 'Publicidade',
  banners = [],
  position
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Invoca o AdSense assim que a div estiver visível (Lazy Load AdSense)
  useEffect(() => {
     if (isVisible && !activeBanner && clientId && slotId) {
        try {
           // eslint-disable-next-line @typescript-eslint/ban-ts-comment
           // @ts-ignore
           (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
           console.error("AdSense push error:", err);
        }
     }
  }, [isVisible, activeBanner, clientId, slotId]);

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

  // Se não tiver slot configurado, não mostra nada pro visitante
  if (!slotId || !clientId) {
    return null;
  }

  return (
    <div className={`text-center my-8 w-full animate-fade-in ${className}`}>
       <div className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 text-center">Publicidade</div>
       <div className="w-full flex justify-center">
         <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client={clientId}
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
       </div>
    </div>
  );
};
