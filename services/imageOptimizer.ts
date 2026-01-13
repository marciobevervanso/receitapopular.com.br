
/**
 * Serviço dedicado para conversão de imagens no navegador.
 * Tenta múltiplos métodos para contornar problemas de CORS.
 */

export const imageOptimizer = {
  /**
   * Baixa uma imagem de uma URL, converte para WebP e retorna o Blob.
   */
  async convertUrlToWebP(imageUrl: string, quality = 0.8): Promise<Blob> {
    // Adiciona timestamp para evitar cache
    const cleanUrl = imageUrl.includes('?') ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;

    // ESTRATÉGIA 1: Fetch direto (Mais rápido)
    try {
        const response = await fetch(cleanUrl, { mode: 'cors' });
        if (response.ok) {
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            return await this.bitmapToBlob(bitmap, quality);
        }
    } catch (e) {
        console.warn("[Optimizer] Fetch falhou, tentando fallback Image()...", e);
    }

    // ESTRATÉGIA 2: Elemento HTML Image (Fallback)
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = cleanUrl;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas context null")); return; }
                
                // Fundo branco para evitar fundo preto em PNGs transparentes
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Falha na conversão Canvas->Blob"));
                }, 'image/webp', quality);
            } catch (err) {
                // Erro clássico de "Tainted Canvas" se o servidor não enviar headers CORS
                reject(new Error("Bloqueio de segurança (CORS): A imagem original não permite edição local."));
            }
        };
        
        img.onerror = () => reject(new Error("Não foi possível carregar a imagem original."));
        
        // Timeout de segurança
        setTimeout(() => reject(new Error("Timeout ao carregar imagem.")), 10000);
    });
  },

  async bitmapToBlob(bitmap: ImageBitmap, quality: number): Promise<Blob> {
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No Context");
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      
      return new Promise((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("Blob error")), 'image/webp', quality);
      });
  }
};
