
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Recipe } from '../types';
import { chatWithChef } from '../services/geminiService';

interface ChefBotProps {
  recipes: Recipe[];
  onOpenRecipe?: (recipe: Recipe) => void;
}

export const ChefBot: React.FC<ChefBotProps> = ({ recipes, onOpenRecipe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'assistant', text: 'Olá! 👨‍🍳 Sou o Chef Virtual. Posso te ajudar com receitas, dicas ou sugestões. O que vamos cozinhar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Simulate thinking delay
      await new Promise(r => setTimeout(r, 1000));
      
      const responseText = await chatWithChef(messages, userMsg.text, recipes);
      
      // Typing effect delay
      await new Promise(r => setTimeout(r, Math.min(2000, responseText.length * 20)));

      const botMsg: ChatMessage = { 
         id: (Date.now() + 1).toString(), 
         role: 'assistant', 
         text: responseText,
         showLeadGen: true 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to parse Markdown-like syntax from Gemini
  const formatMessage = (text: string) => {
    if (!text) return '';

    let formatted = text;

    // 1. Sanitize (Basic) to prevent injection of malicious scripts, though we control the input mostly
    formatted = formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 2. Headers (### Title)
    formatted = formatted.replace(/### (.*?)\n/g, '<h3 class="text-sm font-black text-pop-red uppercase tracking-wide mt-2 mb-1">$1</h3>');

    // 3. Bold (**text**) - Adding Tailwind class because default <b> might be reset
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-pop-dark">$1</strong>');
    
    // 4. Recipe Links [Title](/receita/slug)
    // We use a specific class and data-slug to hook into the click event
    formatted = formatted.replace(
      /\[(.*?)\]\(\/receita\/(.*?)\)/g, 
      '<span class="inline-flex items-center gap-1 text-blue-600 underline decoration-blue-300 cursor-pointer font-bold hover:text-blue-800 bg-blue-50 px-1 rounded" data-slug="$2"><svg class="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>$1</span>'
    );

    // 5. Lists (* Item or - Item)
    // Replace start of line bullets with HTML bullet
    formatted = formatted.replace(/(?:^|\n)(?:[\*\-]\s+)(.*?)(?=\n|$)/g, '<div class="flex items-start gap-2 my-1 ml-1"><span class="text-pop-yellow font-bold">•</span><span>$1</span></div>');

    // 6. Line Breaks (remaining newlines)
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  // Handle clicks on the formatted message
  const handleMessageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Check if clicked element is our internal recipe link (or inside it)
    const linkElement = target.closest('[data-slug]') as HTMLElement;
    
    if (linkElement && linkElement.dataset.slug) {
      e.preventDefault();
      e.stopPropagation();
      
      const slug = linkElement.dataset.slug;
      const recipe = recipes.find(r => r.slug === slug);
      
      if (recipe && onOpenRecipe) {
        onOpenRecipe(recipe);
      } else {
        console.warn("Recipe not found for slug:", slug);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 no-print">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[350px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-fade-in origin-bottom-right">
           {/* Header */}
           <div className="bg-pop-dark p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl relative">
                    👨‍🍳
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-pop-dark rounded-full"></span>
                 </div>
                 <div>
                    <h3 className="font-bold text-sm">Chef Popular</h3>
                    <p className="text-[10px] text-gray-300 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online agora
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>

           {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                 <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-pop-dark text-white rounded-tr-none' 
                          : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                      }`}
                      onClick={handleMessageClick} // Attach click handler
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                    
                    {/* Lead Gen Card */}
                    {msg.role === 'assistant' && msg.showLeadGen && (
                       <div className="mt-2 max-w-[85%] bg-green-50 border border-green-100 p-3 rounded-xl animate-fade-in">
                          <p className="text-[10px] font-bold text-green-800 uppercase tracking-wide mb-2">Dica Exclusiva</p>
                          <p className="text-xs text-green-700 mb-3">Gostou da sugestão? Entre no nosso grupo VIP para receber receitas diárias!</p>
                          <a 
                            href="https://whatsapp.com" 
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full py-2 bg-green-600 text-white text-center rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.897.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                             Grupo VIP
                          </a>
                       </div>
                    )}
                 </div>
              ))}
              
              {isTyping && (
                 <div className="flex items-start">
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte ao Chef..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pop-dark"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-pop-dark text-white p-2 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
              >
                 <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
           </div>
        </div>
      )}

      {/* Toggle Button (Avatar) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-pop-dark border-4 border-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group relative"
        >
           <span className="text-3xl">👨‍🍳</span>
           <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
           
           {/* Tooltip */}
           <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl shadow-lg whitespace-nowrap text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Fale com o Chef!
           </div>
        </button>
      )}
    </div>
  );
};
