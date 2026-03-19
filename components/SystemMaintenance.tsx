import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { storageService } from '../services/storageService';

interface SystemMaintenanceProps {
  recipes: Recipe[];
  onUpdateRecipe: (recipe: Recipe) => Promise<void>;
}

export const SystemMaintenance: React.FC<SystemMaintenanceProps> = ({ recipes, onUpdateRecipe }) => {
  const [candidates, setCandidates] = useState<Recipe[]>([]);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  
  // Batch State
  const BATCH_SIZE = 30;
  const [scanIndex, setScanIndex] = useState(0);
  const [forceAll, setForceAll] = useState(false);
  const [unknownCount, setUnknownCount] = useState(0);
  const [conversionLog, setConversionLog] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 });
  const [statusText, setStatusText] = useState('');
  const [hasN8n, setHasN8n] = useState(false);

  useEffect(() => {
     storageService.getSettings().then(s => setHasN8n(!!s.n8nImageOptimizationUrl));
  }, []);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const checkFileSize = async (url: string): Promise<number> => {
    try {
      const separator = url.includes('?') ? '&' : '?';
      const cleanUrl = `${url}${separator}t=${Date.now()}`;
      
      const response = await fetchWithTimeout(cleanUrl, { method: 'HEAD' }, 2000);
      const size = response.headers.get('content-length');
      return size ? parseInt(size, 10) : 0;
    } catch (e) {
      return 0; 
    }
  };

  const handleScanNextBatch = async () => {
    setScanning(true);
    setUnknownCount(0);
    
    const endIndex = Math.min(scanIndex + BATCH_SIZE, recipes.length);
    const batch = recipes.slice(scanIndex, endIndex);
    
    setProgress({ current: scanIndex, total: recipes.length, success: 0, failed: 0, skipped: 0 });
    
    const newHeavyRecipes: Recipe[] = [];
    const SIZE_THRESHOLD = 500 * 1024; // 500KB
    let batchUnknowns = 0;

    for (let i = 0; i < batch.length; i++) {
      const recipe = batch[i];
      const globalIndex = scanIndex + i + 1;
      
      setProgress(prev => ({ ...prev, current: globalIndex }));
      setStatusText(`Verificando (${globalIndex}/${recipes.length}): ${recipe.title.substring(0, 15)}...`);
      
      await new Promise(r => setTimeout(r, 5));

      if (!recipe.imageUrl) continue;

      if (recipe.imageUrl.startsWith('http')) {
         if (forceAll) {
            newHeavyRecipes.push(recipe);
         } else {
            const size = await checkFileSize(recipe.imageUrl);
            
            if (size === 0) {
               batchUnknowns++;
            } else if (size > SIZE_THRESHOLD) {
                newHeavyRecipes.push(recipe);
            }
         }
      }
    }

    setCandidates(prev => [...prev, ...newHeavyRecipes]);
    setUnknownCount(prev => prev + batchUnknowns);
    setScanIndex(endIndex);
    setScanning(false);
    
    let resultMsg = newHeavyRecipes.length > 0 ? `Encontrados +${newHeavyRecipes.length} candidatos.` : 'Nenhuma imagem pesada confirmada.';
    if (batchUnknowns > 0 && !forceAll) {
       resultMsg += ` (Aviso: ${batchUnknowns} com tamanho ilegível)`;
    }
    setStatusText(resultMsg);
  };

  const handleResetScan = () => {
    setScanIndex(0);
    setCandidates([]);
    setUnknownCount(0);
    setStatusText('');
    setErrorLog([]);
    setProgress({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 });
  };

  const handleTestConnection = async (e: React.MouseEvent) => {
     e.stopPropagation();
     setStatusText('Enviando teste...');
     setProcessing(true);
     try {
        const testUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
        // Fix: Added missing 'slug' argument required by optimizeImage
        await storageService.optimizeImage(testUrl, 'test/connection-check', 'test-connection');
        alert(`Conexão OK!`);
     } catch (err: any) {
        console.error(err);
        alert("Falha no teste. Verifique o console ou Configurações.");
     } finally {
        setProcessing(false);
        setStatusText('');
     }
  };

  const handleTestRealConversion = async (e: React.MouseEvent) => {
     e.stopPropagation();
     const target = recipes.find(r => r.imageUrl.startsWith('http') && !r.imageUrl.includes('placeholder'));
     
     if (!target) {
        alert("Nenhuma receita com imagem HTTP encontrada.");
        return;
     }

     setProcessing(true);
     setConversionLog(null);
     setStatusText(`Processando: ${target.title}...`);
     
     try {
        const updated = await storageService.smartOptimize(target);
        await onUpdateRecipe(updated);
        setConversionLog(`✅ Sucesso!\nReceita: ${target.title}\nNova URL: ${updated.imageUrl}`);
     } catch (err: any) {
        console.error(err);
        setConversionLog(`❌ Erro: ${err.message}`);
     } finally {
        setProcessing(false);
        setStatusText('');
     }
  };

  const handleBatchOptimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (candidates.length === 0) return;
    
    // Set UI state first
    setProcessing(true);
    setStopRequested(false);
    setErrorLog([]);
    setProgress({ current: 0, total: candidates.length, success: 0, failed: 0, skipped: 0 });

    // Use setTimeout to allow render before loop starts
    setTimeout(async () => {
        for (let i = 0; i < candidates.length; i++) {
          if (stopRequested) {
             setStatusText('Parado pelo usuário.');
             break;
          }

          const recipe = candidates[i];
          setProgress(prev => ({ ...prev, current: i + 1, total: candidates.length }));
          setStatusText(`Otimizando: ${recipe.title.substring(0, 15)}...`);

          try {
            // Protect individual items with timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 45000));
            const optimizePromise = storageService.smartOptimize(recipe);
            
            const updatedRecipe = await Promise.race([optimizePromise, timeoutPromise]) as Recipe;
            
            await onUpdateRecipe(updatedRecipe); 
            setProgress(prev => ({ ...prev, success: prev.success + 1 }));
          } catch (err: any) {
            const msg = `Erro (${recipe.title}): ${err.message}`;
            console.error(msg);
            setErrorLog(prev => [...prev, msg]);
            setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
          
          await new Promise(r => setTimeout(r, 200));
        }

        setProcessing(false);
        if (!stopRequested) {
            setStatusText('Processo Finalizado!');
            setCandidates([]); 
        }
    }, 100);
  };

  const handleStop = (e: React.MouseEvent) => {
     e.stopPropagation();
     setStopRequested(true);
     setStatusText('Parando...');
  };

  const isScanComplete = scanIndex >= recipes.length;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
       <div className="mb-8">
         <h2 className="text-3xl font-extrabold text-pop-dark">Manutenção & Performance</h2>
         <p className="text-gray-500">Ferramentas para reduzir custos de banda e acelerar o site.</p>
       </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative z-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl">
                   📉
                </div>
                <div>
                   <h3 className="font-bold text-lg text-pop-dark">Otimizador de Imagens</h3>
                   <p className="text-sm text-gray-500">Detecta e converte imagens via n8n.</p>
                </div>
             </div>
             {hasN8n && (
                <div className="flex gap-2 relative z-10">
                   <button 
                     type="button"
                     onClick={handleTestConnection} 
                     disabled={processing}
                     className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 font-bold hover:bg-gray-100 cursor-pointer"
                   >
                      📡 Testar Ping
                   </button>
                   <button 
                     type="button"
                     onClick={handleTestRealConversion} 
                     disabled={processing}
                     className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-bold hover:bg-green-100 cursor-pointer"
                   >
                      🚀 Teste Real (1 Receita)
                   </button>
                </div>
             )}
          </div>

          {conversionLog && (
             <div className="mb-6 bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap overflow-x-auto border border-gray-800 shadow-inner">
                {conversionLog}
                <button onClick={() => setConversionLog(null)} className="block mt-2 text-white/50 hover:text-white underline">Fechar Log</button>
             </div>
          )}

          <div className="mb-6 flex flex-col gap-4">
             {/* Progress Bar Global */}
             <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(scanIndex / recipes.length) * 100}%` }}
                ></div>
             </div>
             <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span>Progresso: {scanIndex} / {recipes.length}</span>
                {scanIndex > 0 && <button type="button" onClick={handleResetScan} className="text-red-400 hover:text-red-600 underline">Reiniciar Contagem</button>}
             </div>
          </div>

          {/* Options */}
          {!scanning && !processing && !isScanComplete && (
             <div className="flex flex-col gap-4 relative z-10">
                <div className="flex flex-wrap items-center gap-4">
                   <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={forceAll}
                        onChange={e => setForceAll(e.target.checked)}
                        className="w-5 h-5 rounded text-pop-dark focus:ring-pop-dark cursor-pointer"
                      />
                      <div>
                         <span className="font-bold block text-pop-dark">Forçar Otimização (Ignorar Tamanho)</span>
                         <span className="text-xs text-gray-400">Marque se suas imagens são grandes mas o scanner não detecta.</span>
                      </div>
                   </label>
                </div>

                <button 
                  type="button"
                  onClick={handleScanNextBatch}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border border-gray-200 cursor-pointer"
                >
                   <span>🔍</span> Escanear Próximos {BATCH_SIZE} ({scanIndex} - {Math.min(scanIndex + BATCH_SIZE, recipes.length)})
                </button>
             </div>
          )}

          {/* Unknown Size Warning */}
          {!scanning && unknownCount > 0 && !forceAll && (
             <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                   <p className="font-bold text-sm">Atenção: {unknownCount} imagens com tamanho ilegível</p>
                   <p className="text-xs mt-1">O scanner não conseguiu ler o tamanho de algumas imagens (provavelmente bloqueio do servidor). <br/>Recomendamos marcar a opção <strong>"Forçar Otimização"</strong> acima e escanear novamente para garantir que elas sejam processadas.</p>
                </div>
             </div>
          )}

          {isScanComplete && candidates.length === 0 && (
             <div className="mt-6 p-6 bg-green-50 text-green-700 rounded-xl text-center font-bold border border-green-100">
                🎉 Varredura completa! Nenhuma imagem pendente encontrada.
                <button type="button" onClick={handleResetScan} className="block mx-auto mt-2 text-xs underline text-green-600">Verificar novamente</button>
             </div>
          )}

          {(scanning || processing) && (
             <div className="mb-6 animate-fade-in bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6 relative z-10">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                   <span className="truncate max-w-[200px]">{statusText}</span>
                   <span>{progress.current} / {processing ? candidates.length : recipes.length}</span>
                </div>
                {/* Visual Progress for Batch */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                   <div className={`h-full transition-all duration-300 ${scanning ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} style={{ width: processing ? `${(progress.current / candidates.length) * 100}%` : '100%' }}></div>
                </div>
                {processing && (
                   <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-4 text-xs font-medium">
                         <span className="text-green-600">✅ {progress.success} OK</span>
                         <span className="text-red-500">❌ {progress.failed} Falhas</span>
                      </div>
                      <button type="button" onClick={handleStop} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded font-bold hover:bg-red-200 cursor-pointer">
                         PARAR
                      </button>
                   </div>
                )}
             </div>
          )}

          {errorLog.length > 0 && (
             <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 max-h-40 overflow-y-auto relative z-10">
                <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Log de Erros:</h4>
                {errorLog.map((err, i) => (
                   <div key={i} className="text-[10px] text-red-600 font-mono border-b border-red-100 last:border-0 py-1">
                      {err}
                   </div>
                ))}
                <button type="button" onClick={() => setErrorLog([])} className="mt-2 text-xs underline text-red-500 cursor-pointer">Limpar Log</button>
             </div>
          )}

          {!scanning && candidates.length > 0 && (
             <div className="animate-fade-in mt-6 relative z-10">
                <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-100">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-red-800 text-sm">Imagens Selecionadas:</span>
                      <span className="font-black text-2xl text-red-600">{candidates.length}</span>
                   </div>
                   <p className="text-xs text-red-600 mt-2">
                      Você pode otimizar agora ou continuar escaneando mais lotes.
                   </p>
                </div>

                <div className="flex gap-3">
                   <button 
                     type="button"
                     onClick={() => setCandidates([])}
                     disabled={processing}
                     className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                   >
                      Limpar Lista
                   </button>
                   <button 
                     type="button"
                     onClick={handleBatchOptimize}
                     disabled={processing}
                     className="flex-[2] py-4 bg-pop-green text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                   >
                      {processing ? (
                         <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           Processando...
                         </>
                      ) : (
                         <>
                           <span>⚡</span> Otimizar {candidates.length} Imagens
                         </>
                      )}
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};