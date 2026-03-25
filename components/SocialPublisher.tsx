import React, { useState } from 'react';
import { Recipe, ReelScript, SiteSettings } from '../types';
import { generateReelScript, generateSocialPost, generateReelVideo } from '../services/geminiService';

interface SocialPublisherProps {
  recipes: Recipe[];
  settings: SiteSettings;
}

export const SocialPublisher: React.FC<SocialPublisherProps> = ({ recipes, settings }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [postType, setPostType] = useState<'photo' | 'video'>('photo');
  
  const [script, setScript] = useState<ReelScript | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const resetState = () => {
    setScript(null);
    setVideoUrl(null);
  };

  const handleRecipeChange = (id: string) => {
    setSelectedRecipe(recipes.find(r => r.id === id) || null);
    resetState();
  };

  const handleTypeChange = (type: 'photo' | 'video') => {
    setPostType(type);
    resetState();
  };

  const handleGenerateScript = async () => {
    if (!selectedRecipe) return;
    setLoadingScript(true);
    resetState();
    try {
      if (postType === 'video') {
        const data = await generateReelScript(selectedRecipe);
        setScript(data);
      } else {
        const data = await generateSocialPost(selectedRecipe);
        setScript(data);
      }
    } catch (e) {
      alert("Erro ao gerar conteúdo com a Inteligência Artificial.");
    } finally {
      setLoadingScript(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script || postType !== 'video') return;
    setLoadingVideo(true);
    try {
      const url = await generateReelVideo(script.visualPrompt);
      setVideoUrl(url);
    } catch (e) {
      alert("Erro ao gerar vídeo nativo. Verifique se sua chave do Gemini suporta os modelos Veo.");
    } finally {
      setLoadingVideo(false);
    }
  };

  const handlePublishMenu = async () => {
    if (!selectedRecipe || !script) return;
    const webhookUrl = settings.n8nSocialWebhookUrl || 'https://n8n.seureview.com.br/webhook/social';
    
    if (postType === 'video' && !videoUrl) {
      alert("Por favor, gere o vídeo (Veo) antes de enviar para publicação.");
      return;
    }

    setIsPublishing(true);
    try {
      // ---- FACEBOOK: Post completo com ingredientes e modo de preparo ----
      const ingredientsList = selectedRecipe.ingredients
        .map(i => `• ${i.amount} ${i.item}`)
        .join('\n');
      
      const stepsList = selectedRecipe.steps
        .map((s, idx) => `${idx + 1}. ${s.replace(/<[^>]*>/g, '')}`)
        .join('\n');

      const facebookPost = [
        `${script.hook}\n`,
        `${script.body}\n`,
        `📝 INGREDIENTES:\n${ingredientsList}\n`,
        `👨‍🍳 MODO DE PREPARO:\n${stepsList}\n`,
        `⏰ Tempo: ${selectedRecipe.prepTime} preparo + ${selectedRecipe.cookTime} cozimento`,
        `🍽️ Rende: ${selectedRecipe.servings} porções\n`,
        `🔗 Receita completa: https://receitapopular.com.br/${selectedRecipe.slug}\n`,
        script.hashtags
      ].join('\n');

      // ---- INSTAGRAM: Post de engajamento com "EU QUERO" ----
      const instagramPost = [
        `${script.hook}\n`,
        `${script.body}\n`,
        `${script.cta}\n`,
        `Quer a receita completa? Comente "EU QUERO" 👇🔥\n`,
        `📌 Salve esse post para não perder!\n`,
        script.hashtags
      ].join('\n');

      const recipeImageUrl = selectedRecipe.imageUrl || '';
      
      const payload = {
        type: postType,
        recipeId: selectedRecipe.id,
        slug: selectedRecipe.slug || '',
        title: selectedRecipe.title || 'Receita',
        link: `https://receitapopular.com.br/${selectedRecipe.slug || ''}`,
        // Imagem da receita (múltiplos campos para compatibilidade com n8n)
        imageUrl: recipeImageUrl,
        mediaUrl: postType === 'photo' ? recipeImageUrl : videoUrl,
        // Campo compatível com o workflow antigo do WP
        guid: { rendered: recipeImageUrl },
        // Duas versões do post
        facebookPost,
        instagramPost,
        // Dados da receita (para o n8n usar se quiser)
        output: {
          title: selectedRecipe.title,
          slug: selectedRecipe.slug || '',
          facebookPost,
          instagramPost,
          hook: script.hook,
          body: script.body,
          cta: script.cta,
          hashtags: script.hashtags,
        }
      };

      console.log('[SocialPublisher] Payload para n8n:', JSON.stringify(payload, null, 2));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert("Sucesso! Conteúdo enviado para o seu n8n. O post será publicado em breve.");
        resetState();
        setSelectedRecipe(null);
      } else {
        alert("A requisição para o n8n falhou. Verifique se a URL do Webhook está correta.");
      }
    } catch (e) {
      alert("Falha de rede ao tentar conectar com o webhook n8n.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-pop-dark flex items-center gap-3">
          Estúdio de Automação Social
          <span className="bg-pop-red text-white text-[10px] px-2 py-1 rounded uppercase tracking-widest font-black">Beta (n8n + Gemini)</span>
        </h2>
        <p className="text-gray-500 mt-2">Crie postagens perfeitas usando IA e envie automaticamente para o Instagram e Facebook!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Settings & Script Generation */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">1. Escolha uma Receita</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-pop-dark font-medium"
                  onChange={(e) => handleRecipeChange(e.target.value)}
                  value={selectedRecipe?.id || ''}
                >
                  <option value="">Selecione a receita...</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
             </div>
             
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">2. Formato da Postagem</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                   <button 
                     onClick={() => handleTypeChange('photo')}
                     className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${postType === 'photo' ? 'bg-white shadow text-pop-dark' : 'text-gray-500 hover:text-gray-800'}`}
                   >
                      Post Estático (Foto)
                   </button>
                   <button 
                     onClick={() => handleTypeChange('video')}
                     className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${postType === 'video' ? 'bg-white shadow text-pop-dark' : 'text-gray-500 hover:text-gray-800'}`}
                   >
                      Vídeo Cine Veo (Reel)
                   </button>
                </div>
             </div>
            
            <button 
              onClick={handleGenerateScript}
              disabled={!selectedRecipe || loadingScript}
              className="w-full mt-4 py-4 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingScript ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Escrevendo texto com Gemini...</>
              ) : '3. Gerar Legenda Magicamente (IA)'}
            </button>
          </div>

          {script && selectedRecipe && (() => {
            const ingredientsList = selectedRecipe.ingredients
              .map(i => `• ${i.amount} ${i.item}`)
              .join('\n');
            const stepsList = selectedRecipe.steps
              .map((s, idx) => `${idx + 1}. ${s.replace(/<[^>]*>/g, '')}`)
              .join('\n');

            const fbPreview = `${script.hook}\n\n${script.body}\n\n📝 INGREDIENTES:\n${ingredientsList}\n\n👨‍🍳 MODO DE PREPARO:\n${stepsList}\n\n⏰ Tempo: ${selectedRecipe.prepTime} preparo + ${selectedRecipe.cookTime} cozimento\n🍽️ Rende: ${selectedRecipe.servings} porções\n\n🔗 Receita completa: https://receitapopular.com.br/${selectedRecipe.slug}\n\n${script.hashtags}`;

            const igPreview = `${script.hook}\n\n${script.body}\n\n${script.cta}\n\nQuer a receita completa? Comente "EU QUERO" 👇🔥\n\n📌 Salve esse post para não perder!\n\n${script.hashtags}`;

            return (
              <div className="space-y-4 animate-[slideUp_0.2s_ease-out]">
                {/* Facebook Preview */}
                <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-blue-50 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">f</div>
                    <div>
                      <h3 className="font-bold text-sm text-pop-dark">Facebook</h3>
                      <span className="text-[10px] text-gray-400">Post completo com receita</span>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-[300px] overflow-y-auto">{fbPreview}</pre>
                </div>

                {/* Instagram Preview */}
                <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-pink-50 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">IG</div>
                    <div>
                      <h3 className="font-bold text-sm text-pop-dark">Instagram</h3>
                      <span className="text-[10px] text-gray-400">Engajamento "EU QUERO"</span>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-[300px] overflow-y-auto">{igPreview}</pre>
                </div>

                {postType === 'video' && script.visualPrompt !== 'none' && (
                  <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Instrução para a Câmera IA (Inglês)
                    </span>
                    <p className="text-xs text-gray-500 italic mt-2 bg-purple-50 p-3 rounded-lg border border-purple-100">{script.visualPrompt}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Media Preview & Publish */}
        <div className="space-y-6">
           <div className={`rounded-3xl p-1 overflow-hidden relative flex flex-col min-h-[500px] border shadow-sm ${postType === 'video' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              
              {/* Media Preview Box */}
              {postType === 'photo' ? (
                 <div className="flex-1 flex flex-col justify-center bg-gray-50 rounded-[20px] overflow-hidden">
                    {selectedRecipe ? (
                       <img src={selectedRecipe.imageUrl} alt={selectedRecipe.title} className="w-full h-full object-cover max-h-[500px]" />
                    ) : (
                       <div className="text-center p-8 text-gray-400">
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="font-medium">Selecione a receita para visualizar a mídia.</p>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-[20px]">
                    {videoUrl ? (
                      <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover rounded-2xl max-h-[500px] shadow-2xl" />
                    ) : (
                       <>
                          {loadingVideo ? (
                             <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                                <p className="text-white font-bold animate-pulse">Renderizando cena cinematográfica...</p>
                                <p className="text-[10px] text-gray-400 font-medium">O Google Veo pode levar entre 1 a 3 minutos.</p>
                             </div>
                          ) : script ? (
                             <div className="flex flex-col items-center px-4">
                                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pop-red rounded-full flex items-center justify-center mb-6 shadow-xl">
                                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Motor Veo 3</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Clique para gerar um vídeo cinematográfico baseando-se no gancho descrito pela inteligência artificial. Perfeito para Reels curtos e engajamento brutal.</p>
                                <button 
                                  onClick={handleGenerateVideo}
                                  className="w-full py-4 bg-white text-gray-900 rounded-xl font-black hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                  Renderizar Vídeo
                                </button>
                             </div>
                          ) : (
                             <div className="text-gray-600">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-30 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                                <p className="font-bold text-gray-500">Gere a estrutura 1º para renderizar.</p>
                             </div>
                          )}
                       </>
                    )}
                 </div>
              )}
           </div>

           {/* Webhook Publish Button Area */}
           {(script && (postType === 'photo' || videoUrl)) && (
              <div className="bg-pop-green/10 p-6 rounded-3xl border border-pop-green/20 animate-fade-in text-center">
                 <h4 className="font-black text-pop-green mb-1">Pronto para a Mágica?</h4>
                 <p className="text-sm font-medium text-gray-600 mb-6">Ao clicar abaixo, enviamos seu pacote criado para o n8n postar nas suas redes sociais!</p>
                 <button
                    onClick={handlePublishMenu}
                    disabled={isPublishing}
                    className="w-full bg-pop-green text-white py-5 rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-xl shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isPublishing ? (
                       <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Enviando para o Servidor...</>
                    ) : (
                       <><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Disparar Automático via n8n</>
                    )}
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
