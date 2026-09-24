import React, { useState } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { SanitizeAndParseRecipeUseCase } from '../domain/use-cases/SanitizeAndParseRecipe.js';
import { FetchRecipeFromUrlUseCase } from '../domain/use-cases/FetchRecipeFromUrl.js';
import { GeminiSousChefAdapter } from '../domain/use-cases/GeminiSousChefAdapter.js';
import { X, Sparkles, Zap, AlertCircle, Save } from 'lucide-react';

interface RecipeImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
}

export const RecipeImporterModal: React.FC<RecipeImporterModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<Recipe | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [source, setSource] = useState<'local' | 'ai'>('local');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLocalParse = async () => {
    setErrorMsg(null);
    setWarningMsg(null);
    const sanitizedText = rawText.trim().substring(0, 5000);
    if (!sanitizedText) {
      setErrorMsg('Cole o texto ou a URL da receita antes de extrair.');
      return;
    }

    const isUrl = /^(https?:\/\/[^\s]+)$/.test(sanitizedText);
    
    setIsLoadingLocal(true);
    try {
      let result;
      if (isUrl) {
        result = await FetchRecipeFromUrlUseCase.execute(sanitizedText);
      } else {
        result = SanitizeAndParseRecipeUseCase.execute(sanitizedText);
      }
      setParsedRecipe(result.recipe);
      setConfidence(result.confidence);
      setSource('local');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar receita localmente.');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleAiParse = async () => {
    setErrorMsg(null);
    setWarningMsg(null);
    let sanitizedText = rawText.trim().substring(0, 5000);
    if (!sanitizedText) {
      setErrorMsg('Cole o texto ou a URL da receita antes de refinar com IA.');
      return;
    }

    const isUrl = /^(https?:\/\/[^\s]+)$/.test(sanitizedText);

    setIsLoadingAi(true);
    try {
      if (isUrl) {
        // Se for URL, primeiro extraímos o texto via proxy/JSON-LD, e depois passamos pra IA melhorar
        sanitizedText = await FetchRecipeFromUrlUseCase.extractRawTextFromUrl(sanitizedText);
      }
      
      const result = await GeminiSousChefAdapter.parseChaoticRecipe(sanitizedText);
      setParsedRecipe(result.recipe);
      setConfidence(1.0);
      setSource('ai');
    } catch (err: any) {
      // Fallback Silencioso: IA falhou (ex: 503), usamos motor local sem travar o app
      console.warn('API de IA falhou. Acionando fallback offline:', err.message);
      try {
        const localResult = SanitizeAndParseRecipeUseCase.execute(sanitizedText);
        setParsedRecipe(localResult.recipe);
        setConfidence(localResult.confidence);
        setSource('local');
        setWarningMsg('Servidor de IA em alta demanda. Sua receita foi extraída com sucesso pelo motor local offline!');
      } catch (localErr: any) {
        // Ambas falharam
        setErrorMsg('Erro na IA e no motor local: Não foi possível extrair a receita.');
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecipe) return;
    try {
      await onSaveRecipe(parsedRecipe);
      onClose();
    } catch (e: any) {
      let humanMsg = 'Erro de validação ao salvar.';
      const errStr = e.message || '';
      
      // Tradução semântica dos erros do Zod (Fim do JSON cru)
      if (errStr.includes('too_small') && errStr.includes('ingredients')) {
        humanMsg = 'Nenhum ingrediente foi identificado nesta extração. Verifique se o texto ou link colado realmente contém uma lista de ingredientes legível.';
      } else {
        humanMsg = `Verifique os campos da receita: ${errStr.substring(0, 80)}...`;
      }
      setErrorMsg(humanMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-theme-card border border-theme-subtle rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header do Modal */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-theme-subtle flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-theme-brand-subtle text-theme-brand flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-theme-main truncate">
                Importar Receita
              </h2>
              <p className="text-[11px] sm:text-xs text-theme-muted truncate">
                Cole um link (TudoGostoso/Panelinha) ou o texto bruto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-theme-card-subtle hover:bg-theme-card border border-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {warningMsg && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Área de Colagem */}
          <div>
            <label className="text-xs text-theme-main font-bold block mb-1.5">
              Link ou Texto da Receita:
            </label>
            <textarea
              rows={5}
              maxLength={5000}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui a URL do site ou texto (máx 5000 caracteres)"
              className="w-full bg-theme-card-subtle border border-theme-subtle rounded-2xl p-3.5 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand font-mono leading-relaxed transition resize-none"
            />
          </div>

          {/* Botões de Ação em Cascata */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleLocalParse}
              disabled={isLoadingLocal || isLoadingAi}
              className="w-full sm:flex-1 bg-theme-brand hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center transition touch-target disabled:opacity-50"
            >
              <Zap className="w-4 h-4 mr-1.5 shrink-0" />
              {isLoadingLocal ? 'Extraindo...' : 'Extrair Instantâneo (Offline / 0ms)'}
            </button>

            <button
              onClick={handleAiParse}
              disabled={isLoadingAi}
              className="w-full sm:w-auto bg-theme-card hover:bg-theme-card-hover text-amber-700 dark:text-amber-300 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition touch-target disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500 shrink-0" />
              {isLoadingAi ? 'Consultando IA...' : 'Refinar com Sous-Chef IA'}
            </button>
          </div>

          {/* Pré-visualização Estruturada */}
          {parsedRecipe && (
            <div className="mt-4 pt-4 border-t border-theme-subtle space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-card-subtle text-theme-dim uppercase font-bold tracking-wider border border-theme-subtle">
                    Origem: {source === 'local' ? 'Parser Determinístico Local' : 'Sous-Chef Gemini'}
                  </span>
                  <h3 className="text-base font-bold text-theme-main mt-1">{parsedRecipe.title}</h3>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Confiança: {Math.round(confidence * 100)}%
                  </span>
                  <span className="text-[10px] text-theme-dim block">
                    {parsedRecipe.ingredients.length} itens convertidos para gramas
                  </span>
                </div>
              </div>

              {/* Tabela Resumida de Ingredientes */}
              <div className="bg-theme-card-subtle rounded-xl p-3 divide-y divide-theme-subtle border border-theme-subtle">
                {parsedRecipe.ingredients.map((ing) => (
                  <div key={ing.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-theme-main font-medium">
                      {ing.name}
                      {ing.isStaple && (
                        <span className="text-[10px] ml-2 text-theme-dim font-mono">[despensa]</span>
                      )}
                    </span>
                    <span className="font-black text-theme-brand font-mono">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Etapas */}
              <div>
                <h4 className="text-xs font-bold text-theme-main mb-1">
                  Etapas Extraídas ({parsedRecipe.steps.length}):
                </h4>
                <ol className="list-decimal list-inside text-xs text-theme-muted space-y-1">
                  {parsedRecipe.steps.map((st, i) => (
                    <li key={i} className="line-clamp-2 leading-relaxed">{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botão Salvar */}
        {parsedRecipe && (
          <div className="px-4 sm:px-6 py-3.5 bg-theme-card-subtle border-t border-theme-subtle flex items-center justify-between gap-2">
            <span className="text-xs text-theme-muted truncate">Pronto para salvar no seu caderno local.</span>
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center transition touch-target shrink-0"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Salvar no Caderno
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
