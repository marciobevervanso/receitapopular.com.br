
import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number; // 0 to 1 (percentage of visibility)
  minHeight?: string; // Placeholder height to prevent layout shift
}

export const LazySection: React.FC<LazySectionProps> = ({ 
  children, 
  className = "", 
  threshold = 0.1,
  minHeight = "200px" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, render immediately (fallback)
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we disconnect. We don't need to hide it again.
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before the element enters viewport
        threshold: threshold
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div 
      ref={sectionRef} 
      className={className} 
      style={{ minHeight: isVisible ? 'auto' : minHeight }}
    >
      {isVisible ? children : null}
    </div>
  );
};
