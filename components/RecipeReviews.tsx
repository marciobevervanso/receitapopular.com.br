
import React, { useState, useEffect } from 'react';
import { Review } from '../types';

interface RecipeReviewsProps {
  recipeId: string;
  initialReviews?: Review[];
}

export const RecipeReviews: React.FC<RecipeReviewsProps> = ({ recipeId, initialReviews = [] }) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Load reviews from local storage to simulate persistence
  useEffect(() => {
    const saved = localStorage.getItem(`reviews-${recipeId}`);
    if (saved) {
      setReviews(JSON.parse(saved));
    } else if (initialReviews.length > 0) {
      setReviews(initialReviews);
    }
  }, [recipeId, initialReviews]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim() || !authorName.trim()) return;

    const review: Review = {
      id: Date.now().toString(),
      author: authorName,
      rating: newRating,
      comment: newComment,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews-${recipeId}`, JSON.stringify(updated));
    
    // Reset form
    setNewComment('');
    setNewRating(0);
    setAuthorName('');
    alert('Obrigado pela sua avaliação!');
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mt-16 print-break-inside">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Stats Column */}
        <div className="md:w-1/3 text-center md:text-left">
          <h3 className="text-2xl font-black text-pop-dark mb-2">Avaliações</h3>
          <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
             <span className="text-5xl font-black text-pop-dark">{averageRating}</span>
             <div className="flex flex-col items-start">
               <div className="flex text-pop-yellow text-lg">
                 {[1,2,3,4,5].map(star => (
                   <span key={star}>{star <= Math.round(Number(averageRating)) ? '★' : '☆'}</span>
                 ))}
               </div>
               <span className="text-xs text-gray-400 font-bold uppercase">{reviews.length} Comentários</span>
             </div>
          </div>
          <p className="text-gray-500 text-sm mb-6">Conte para a nossa comunidade o que você achou desta receita!</p>
        </div>

        {/* Form & List Column */}
        <div className="md:w-2/3">
           
           {/* Add Review Form */}
           <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl mb-10 border border-gray-100">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sua Nota</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= newRating ? 'text-pop-yellow' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" 
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pop-dark bg-white"
                  required
                />
              </div>

              <textarea 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="O que achou da receita? Alguma dica?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pop-dark bg-white h-24 mb-4 resize-none"
                required
              />
              
              <button 
                type="submit"
                disabled={newRating === 0}
                className="px-6 py-2 bg-pop-dark text-white rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
              >
                Publicar Avaliação
              </button>
           </form>

           {/* Reviews List */}
           <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-pop-dark mr-2">{review.author}</span>
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>
                      <div className="text-pop-yellow text-sm">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                   </div>
                   <p className="text-gray-600 font-serif italic text-sm">"{review.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center text-gray-400 py-4 italic text-sm">
                   Seja o primeiro a avaliar esta receita!
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
