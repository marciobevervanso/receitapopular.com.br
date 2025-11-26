
import React, { useEffect, useState } from 'react';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  label?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'auto', className = '', label = 'Publicidade' }) => {
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('adSettings');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setClientId(parsed.clientId || '');
    }
  }, []);

  // If no Slot ID is provided (or not configured yet), show a visible placeholder so the user knows space is reserved
  if (!slotId || !clientId) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 text-gray-400 select-none ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{label}</span>
        <span className="text-xs">Espaço reservado para Google AdSense</span>
        <span className="text-[10px] mt-2 opacity-50">(Configure no Dashboard &gt; Monetização)</span>
      </div>
    );
  }

  // Real Ad Code Render
  return (
    <div className={`text-center my-8 overflow-hidden ${className}`}>
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
