
import React, { useState } from 'react';
import { SiteSettings } from '../types';
import { generateMeme } from '../services/socialService';
import { GoogleGenAI } from "@google/genai";
import { storageService } from '../services/storageService';

interface MemeGeneratorProps {
  settings: SiteSettings;
}

export const MemeGenerator: React.FC<MemeGeneratorProps> = ({ settings }) => {
  const [idea, setIdea] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'preview' | 'uploading' | 'posting' | 'success' | 'error'>('idle');
  const [isDreaming, setIsDreaming] = useState(false);
  
  // Preview Data
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCaption, setPreviewCaption] = useState('');

  // Helper to retrieve key
  const getApiKey = () => {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY || process.env.API_KEY || '';
  };

  // 1. Generate Text Idea (Brainstorm)
  const handleMagicIdea = async () => {
    setIsDreaming(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Gere uma única frase curta e EXTREMAMENTE engraçada/caótica para um meme de culinária. Estilo: Twitter/TikTok Brasil, linguagem coloquial, 'perrengue chique', expectativa vs realidade. Ex: 'Minha dieta durou 15 min', 'O que eu cozinhei vs o que comi'. Retorne APENAS o texto puro, sem aspas.",
        config: {
           temperature: 1.4,
        }
      });
      
      const funnyText = response.text?.trim() || "";
      if (funnyText) setIdea(funnyText);
    } catch (e) {
      console.error(e);
      alert("A IA está sem criatividade agora. Tente de novo!");
    } finally {
      setIsDreaming(false);
    }
  };

  // 2. Generate Preview (Image + Caption)
  const handleGeneratePreview = async () => {
    if (!idea.trim()) return;
    setStatus('generating');

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });

      // Parallel Generation: Image & Caption
      // Prompt ajustado para FOTOGRAFIA REALISTA
      const imagePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A real life photograph, 8k resolution, Canon 5D style. A funny/chaotic kitchen scene representing: "${idea}". Real humans with realistic skin texture, real food. NOT A DRAWING, NOT 3D, NOT CARTOON. Photorealistic style.` }] },
      });

      const captionPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Crie uma legenda de Instagram para um meme sobre: "${idea}". 
        Use humor brasileiro, irônico e engraçado. Use emojis. 
        Adicione hashtags populares de culinária e humor (#receitapopular #humor #culinaria). 
        A legenda deve convidar a pessoa a marcar um amigo que passaria por isso.`,
      });

      const [imgResponse, captionResponse] = await Promise.all([imagePromise, captionPromise]);

      // Process Image: Iterate through parts to find inlineData
      let imageBase64 = null;
      const parts = imgResponse.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageBase64) {
         setPreviewImage(imageBase64);
      } else {
         console.error("AI Response Error:", JSON.stringify(imgResponse, null, 2));
         throw new Error("Falha ao gerar imagem. A IA não retornou dados visuais.");
      }

      // Process Caption
      const caption = captionResponse.text?.trim() || `${idea} 😂\n\n#memes #culinaria`;
      setPreviewCaption(caption);

      setStatus('preview');

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar preview. Tente novamente.");
      setStatus('error');
    }
  };

  // 3. Confirm & Post
  const handlePost = async () => {
    console.log("Iniciando postagem..."); // Debug log

    if (!settings?.n8nMemeWebhookUrl) {
      alert("ERRO: Configure a URL do Webhook de Memes na aba Configurações primeiro.");
      return;
    }
    
    if (!previewImage || !previewCaption) {
      alert("Imagem ou legenda faltando. Gere o preview novamente.");
      return;
    }

    try {
      // Step A: Upload to Supabase
      setStatus('uploading');
      console.log("Enviando imagem para Supabase...");
      
      let publicUrl = '';
      try {
        publicUrl = await storageService.uploadImage(previewImage, 'memes');
        console.log("Imagem enviada com sucesso:", publicUrl);
      } catch (uploadError) {
        console.error("Erro no upload:", uploadError);
        alert("Erro ao fazer upload da imagem. Verifique se o bucket 'images' é público no Supabase.");
        setStatus('error');
        return;
      }

      // Step B: Send to n8n
      setStatus('posting');
      console.log("Enviando payload para n8n...", settings.n8nMemeWebhookUrl);
      
      const payload = {
        title: { rendered: `Meme: ${idea.substring(0, 20)}...` },
        guid: { rendered: publicUrl }, // The public URL for Facebook API
        link: "https://receitapopular.com.br", 
        output: {
           slug: `meme-${Date.now()}`,
           instagramPost: previewCaption,
           title: "Meme do Dia"
        }
      };

      try {
        await generateMeme(payload, settings.n8nMemeWebhookUrl);
        console.log("Sucesso no n8n!");
      } catch (n8nError) {
        console.error("Erro no n8n:", n8nError);
        alert("Erro ao conectar com o Webhook (n8n). Verifique a URL nas configurações e se o workflow está ativo.");
        setStatus('error');
        return;
      }
      
      setStatus('success');
      setTimeout(() => {
         setStatus('idle');
         setIdea('');
         setPreviewImage(null);
         setPreviewCaption('');
      }, 5000);

    } catch (e) {
      console.error("Erro geral no handlePost:", e);
      alert("Ocorreu um erro inesperado ao postar. Verifique o console.");
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setPreviewImage(null);
    setPreviewCaption('');
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-200 rotate-3 transform hover:rotate-6 transition-all duration-300">
           <span className="text-4xl">🎭</span>
        </div>
        <h2 className="text-4xl font-extrabold text-pop-dark mb-2 tracking-tight">Fábrica de Memes</h2>
        <p className="text-gray-500 text-lg">Do caos da cozinha para o feed em segundos.</p>
      </div>

      {status === 'success' ? (
        <div className="max-w-xl mx-auto bg-green-50 border-2 border-green-200 rounded-3xl p-12 text-center animate-bounce-slow">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
           </div>
           <h3 className="text-2xl font-black text-green-800 mb-2">Postado com Sucesso!</h3>
           <p className="text-green-700">Seu meme já está a caminho das redes sociais.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
           
           {/* Steps Indicator */}
           <div className="flex border-b border-gray-100">
              <div className={`flex-1 p-4 text-center text-sm font-bold border-b-4 transition-colors ${status === 'idle' || status === 'generating' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>
                 1. Ideia
              </div>
              <div className={`flex-1 p-4 text-center text-sm font-bold border-b-4 transition-colors ${status === 'preview' || status === 'uploading' || status === 'posting' || status === 'error' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>
                 2. Preview & Postar
              </div>
           </div>

           {/* Content Area */}
           <div className="p-8">
              
              {/* STEP 1: IDEA */}
              {(status === 'idle' || status === 'generating') && (
                 <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex justify-between items-end">
                       <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">Sobre o que é o meme?</label>
                       <button 
                         onClick={handleMagicIdea}
                         disabled={isDreaming || status === 'generating'}
                         className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                       >
                         {isDreaming ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div> : '✨'}
                         Gerar Ideia Aleatória
                       </button>
                    </div>
                    
                    <textarea 
                      value={idea}
                      onChange={e => setIdea(e.target.value)}
                      placeholder="Ex: Quando a visita diz que não está com fome mas come tudo..."
                      disabled={status === 'generating'}
                      className="w-full h-40 p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-purple-400 focus:bg-white transition-all resize-none text-xl font-medium text-pop-dark placeholder-gray-300 leading-relaxed"
                    />

                    <button 
                      onClick={handleGeneratePreview}
                      disabled={!idea.trim() || status === 'generating'}
                      className="w-full py-4 bg-pop-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                    >
                       {status === 'generating' ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Criando a Mágica...
                          </>
                       ) : (
                          <>
                            <span>🎨</span> Gerar Preview
                          </>
                       )}
                    </button>
                 </div>
              )}

              {/* STEP 2: PREVIEW */}
              {(status === 'preview' || status === 'uploading' || status === 'posting' || status === 'error') && (
                 <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Image Preview */}
                    <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                       {previewImage ? (
                          <img src={previewImage} alt="Meme Preview" className="w-full h-auto object-contain" />
                       ) : (
                          <div className="h-64 flex items-center justify-center text-gray-400">Sem imagem</div>
                       )}
                    </div>

                    {/* Caption & Actions */}
                    <div className="space-y-6">
                       <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legenda (Instagram/Facebook)</label>
                          <textarea 
                            value={previewCaption}
                            onChange={e => setPreviewCaption(e.target.value)}
                            disabled={status !== 'preview' && status !== 'error'}
                            className="w-full h-48 p-4 bg-white border border-gray-200 rounded-xl focus:border-purple-400 outline-none resize-none text-sm leading-relaxed custom-scrollbar shadow-sm"
                          />
                       </div>

                       {status === 'error' && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg text-center animate-pulse">
                             Erro ao postar. Tente novamente ou verifique as configurações.
                          </div>
                       )}

                       <div className="flex gap-3 pt-2">
                          <button 
                            onClick={handleCancel}
                            disabled={status !== 'preview' && status !== 'error'}
                            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                          >
                             Voltar
                          </button>
                          <button 
                            onClick={handlePost}
                            disabled={status !== 'preview' && status !== 'error'}
                            className="flex-[2] py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                             {status === 'uploading' || status === 'posting' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  {status === 'uploading' ? 'Enviando Imagem...' : 'Postando...'}
                                </>
                             ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                  Confirmar e Postar
                                </>
                             )}
                          </button>
                       </div>
                    </div>
                 </div>
              )}

           </div>
        </div>
      )}

      {/* Quick Ideas (Only in Input Mode) */}
      {status === 'idle' && (
         <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70 hover:opacity-100 transition-opacity duration-500">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => setIdea("Expectativa vs Realidade: Bolo de Cenoura")}>
               <div className="text-2xl mb-2">💡</div>
               <h4 className="font-bold text-sm text-pop-dark">Ideia Rápida</h4>
               <p className="text-xs text-gray-500 mt-1">"Expectativa vs Realidade"</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => setIdea("Eu fingindo que estou de dieta na segunda-feira")}>
               <div className="text-2xl mb-2">🔥</div>
               <h4 className="font-bold text-sm text-pop-dark">Tendência</h4>
               <p className="text-xs text-gray-500 mt-1">"Eu fingindo que estou de dieta"</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => setIdea("A cara do chef quando alguém pede ketchup no risoto")}>
               <div className="text-2xl mb-2">🥘</div>
               <h4 className="font-bold text-sm text-pop-dark">Vida de Chef</h4>
               <p className="text-xs text-gray-500 mt-1">"Ketchup no Risoto"</p>
            </div>
         </div>
      )}
    </div>
  );
};
