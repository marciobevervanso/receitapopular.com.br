
import React, { useState } from 'react';
import { FAQItem } from '../types';

interface RecipeFAQProps {
  faqs: FAQItem[];
}

export const RecipeFAQ: React.FC<RecipeFAQProps> = ({ faqs }) => {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-16 print-break-inside">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 text-pop-dark flex items-center justify-center font-serif font-bold text-xl italic">
          ?
        </div>
        <h3 className="text-2xl font-black text-pop-dark">Dúvidas Comuns</h3>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details key={index} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <h4 className="font-bold text-pop-dark text-lg group-hover:text-pop-red transition-colors">
                {faq.question}
              </h4>
              <div className="text-gray-400 group-open:rotate-180 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed animate-fade-in">
               {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
