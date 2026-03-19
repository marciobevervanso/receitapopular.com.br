
import React, { useState, useEffect } from 'react';
import { WebStory, StorySlide } from '../types';

interface WebStoryViewerProps {
  story: WebStory;
  onClose: () => void;
}

export const WebStoryViewer: React.FC<WebStoryViewerProps> = ({ story, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto advance logic
  useEffect(() => {
    const duration = 6000; // 6 seconds per slide
    const interval = 50; // Update every 50ms
    const steps = duration / interval;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < story.slides.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            clearInterval(timer);
            return 100;
          }
        }
        return prev + (100 / steps);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, story.slides.length]);

  // Reset progress when index changes manually
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < story.slides.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  };

  const currentSlide = story.slides[currentIndex];

  // --- Layout Renderers ---

  const renderContent = (slide: StorySlide) => {
    switch (slide.layout) {
      case 'cover':
        return (
          <div className="flex flex-col justify-end h-full p-8 text-center">
             <span className="inline-block mb-4 px-3 py-1 bg-pop-yellow text-pop-dark text-xs font-black uppercase tracking-widest rounded self-center animate-[fadeIn_0.5s_ease-out]">
               Nova Receita
             </span>
             <h1 className="text-4xl md:text-5xl font-black font-serif text-white leading-none mb-6 drop-shadow-lg animate-[slideUp_0.7s_ease-out]">
               {slide.text}
             </h1>
             <p className="text-lg text-gray-200 font-medium animate-[slideUp_0.9s_ease-out] delay-100">
               {slide.subtext}
             </p>
          </div>
        );
      
      case 'list': // Ingredients
        return (
          <div className="flex flex-col justify-center h-full p-8">
             <h2 className="text-3xl font-black text-pop-yellow mb-6 uppercase tracking-wide drop-shadow-md animate-[fadeIn_0.5s_ease-out]">
               {slide.text}
             </h2>
             <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 animate-[zoomIn_0.5s_ease-out]">
                <p className="text-xl text-white leading-loose font-serif whitespace-pre-line">
                  {slide.subtext?.split(',').map((item, i) => (
                    <span key={i} className="block border-b border-white/20 last:border-0 py-2">
                      • {item.trim()}
                    </span>
                  ))}
                </p>
             </div>
          </div>
        );

      case 'quote': // Tips
        return (
          <div className="flex flex-col justify-center h-full p-8">
             <div className="bg-pop-red/90 backdrop-blur p-8 rounded-tr-[3rem] rounded-bl-[3rem] shadow-2xl animate-[slideUp_0.6s_ease-out]">
                <svg className="w-10 h-10 text-white/50 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.054 15.355 14.333 17.224 13.973L17.75 13.871C18.249 13.775 18.558 13.287 18.441 12.794L18.351 12.415C18.234 11.922 17.737 11.627 17.24 11.746L16.714 11.872C15.619 12.134 14.518 12.265 13.417 12.265L13 12.265L13 2.525L21 2.525L21 21L14.017 21ZM5.01697 21L5.01697 18C5.01697 16.054 6.35497 14.333 8.22397 13.973L8.74997 13.871C9.24897 13.775 9.55797 13.287 9.44097 12.794L9.35097 12.415C9.23397 11.922 8.73697 11.627 8.23997 11.746L7.71397 11.872C6.61897 12.134 5.51797 12.265 4.41697 12.265L3.99997 12.265L3.99997 2.525L12 2.525L12 21L5.01697 21Z" /></svg>
                <h3 className="text-2xl font-bold text-white leading-relaxed font-serif italic">
                  "{slide.text}"
                </h3>
                <div className="mt-4 w-12 h-1 bg-white/50"></div>
             </div>
          </div>
        );

      case 'conclusion': // CTA
        return (
          <div className="flex flex-col justify-center items-center h-full p-8 text-center bg-gradient-to-t from-black via-black/50 to-transparent">
             <h2 className="text-4xl font-black text-white mb-4 drop-shadow-xl animate-[zoomIn_0.5s_ease-out]">
               {slide.text}
             </h2>
             <p className="text-lg text-gray-200 mb-8 animate-[fadeIn_1s_ease-out]">{slide.subtext}</p>
             
             <div className="animate-bounce flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-pop-dark shadow-lg cursor-pointer hover:scale-110 transition-transform" onClick={onClose}>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white">Ver Receita</span>
             </div>
          </div>
        );

      case 'minimal':
      default:
        return (
          <div className="flex flex-col justify-end h-full p-8 pb-24 bg-gradient-to-t from-black/80 via-transparent to-transparent">
             <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md animate-[slideUp_0.5s_ease-out]">{slide.text}</h2>
             <p className="text-base text-gray-200 font-medium animate-[slideUp_0.7s_ease-out]">{slide.subtext}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center backdrop-blur-xl">
       {/* Mobile Frame */}
       <div className="relative w-full h-full md:w-[400px] md:h-[85vh] md:max-h-[850px] md:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col">
          
          {/* Ken Burns Background Image */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Key to reset animation on slide change */}
            <img 
              key={currentIndex}
              src={currentSlide.imageUrl} 
              alt="Background" 
              className="w-full h-full object-cover animate-[kenBurns_10s_ease-out_forwards]"
            />
            {/* Global Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Progress Bars */}
          <div className="absolute top-4 left-2 right-2 flex gap-1 z-30">
            {story.slides.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-100 ease-linear ${
                    idx < currentIndex ? 'w-full' : idx === currentIndex ? `w-[${progress}%]` : 'w-0'
                  }`}
                  style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                ></div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-4 z-40 text-white/80 hover:text-white bg-black/20 rounded-full p-1 backdrop-blur-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Tap Areas */}
          <div className="absolute inset-0 z-20 flex">
             <div className="w-1/3 h-full" onClick={handlePrev}></div>
             <div className="w-2/3 h-full" onClick={handleNext}></div>
          </div>

          {/* Content Layer */}
          <div className="absolute inset-0 z-20 pointer-events-none">
             {/* Brand Badge Top Left */}
             <div className="absolute top-8 left-4 flex items-center gap-2 opacity-90 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-pop-red flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
                </div>
                <span className="font-bold text-xs text-white uppercase tracking-wider">Receita Popular</span>
             </div>

             {renderContent(currentSlide)}
          </div>

       </div>

       <style>{`
         @keyframes kenBurns {
           0% { transform: scale(1); }
           100% { transform: scale(1.15); }
         }
         @keyframes slideUp {
           0% { transform: translateY(20px); opacity: 0; }
           100% { transform: translateY(0); opacity: 1; }
         }
         @keyframes fadeIn {
           0% { opacity: 0; }
           100% { opacity: 1; }
         }
         @keyframes zoomIn {
           0% { transform: scale(0.9); opacity: 0; }
           100% { transform: scale(1); opacity: 1; }
         }
       `}</style>
    </div>
  );
};
