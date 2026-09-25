import React, { useState } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { SanitizeAndParseRecipeUseCase } from '../domain/use-cases/SanitizeAndParseRecipe.js';
import { FetchRecipeFromUrlUseCase } from '../domain/use-cases/FetchRecipeFromUrl.js';
import { GeminiSousChefAdapter } from '../domain/use-cases/AiProviderAdapter.js';
import { X, Sparkles, Zap, AlertCircle, Save, FileText, Trash2 } from 'lucide-react';

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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<Recipe | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [source, setSource] = useState<'local' | 'ai'>('local');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processPdf = async (file: File) => {
    try {
      setIsLoadingLocal(true);
      setErrorMsg(null);
      setPdfFile(file);
      const { ExtractTextFromPdfUseCase } = await import('../domain/use-cases/ExtractTextFromPdf.js');
      const text = await ExtractTextFromPdfUseCase.execute(file);
      setRawText(text.substring(0, 5000));
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao ler PDF. Ele pode ser uma imagem escaneada sem texto ou estar protegido.');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      await processPdf(file);
    } else if (file) {
      setErrorMsg('Por favor, envie apenas arquivos PDF.');
    }
  };

  if (!isOpen) return null;

  const handleLocalParse = async () => {
    setErrorMsg(null);
    setWarningMsg(null);
    const sanitizedText = rawText.trim().substring(0, 5000);
    if (!sanitizedText) {
      setErrorMsg('Cole o texto, URL ou carregue um PDF da receita antes de extrair.');
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

    // Verificar de antemão se a chave existe antes de disparar loading
    const savedKey = sessionStorage.getItem('gastroratio_gemini_api_key_v2');
    if (!savedKey) {
      setErrorMsg('Chave da API do Gemini não configurada. Configure na aba Configurações para usar a IA, ou use o botão "Extrair Instantâneo (Offline)".');
      return;
    }

    let sanitizedText = rawText.trim().substring(0, 5000);
    if (!sanitizedText && !pdfFile) {
      setErrorMsg('Cole o texto, URL ou carregue um PDF da receita antes de refinar com IA.');
      return;
    }

    const isUrl = /^(https?:\/\/[^\s]+)$/.test(sanitizedText);

    setIsLoadingAi(true);
    try {
      let result;
      if (pdfFile) {
        // Envia o arquivo PDF nativamente para a API multimodal do Gemini
        result = await GeminiSousChefAdapter.parseRecipeFromPdf(pdfFile);
      } else if (isUrl) {
        sanitizedText = await FetchRecipeFromUrlUseCase.extractRawTextFromUrl(sanitizedText);
        result = await GeminiSousChefAdapter.parseChaoticRecipe(sanitizedText);
      } else {
        result = await GeminiSousChefAdapter.parseChaoticRecipe(sanitizedText);
      }
      
      setParsedRecipe(result.recipe);
      setConfidence(1.0);
      setSource('ai');
    } catch (err: any) {
      console.error('Falha na extração com IA:', err);
      setErrorMsg(`Falha na IA: ${err.message || 'Erro de comunicação'}. Você ainda pode extrair offline usando o botão ao lado.`);
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

          {/* Indicador de PDF Ativo */}
          {pdfFile && (
            <div className="flex items-center justify-between p-2.5 bg-theme-brand-subtle/50 border border-theme-brand/30 rounded-xl text-xs text-theme-main">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <FileText className="w-4 h-4 text-theme-brand shrink-0" />
                Arquivo PDF: <strong className="truncate">{pdfFile.name}</strong> ({(pdfFile.size / 1024).toFixed(0)} KB)
              </span>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setRawText('');
                }}
                className="text-[11px] text-theme-muted hover:text-rose-500 font-bold ml-2 shrink-0 transition"
              >
                Remover PDF
              </button>
            </div>
          )}

          {/* Área de Colagem e Drop */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative rounded-2xl overflow-hidden border-2 transition-colors duration-200 ${
              isDragging ? 'border-theme-brand bg-theme-brand-subtle/50' : 'border-transparent'
            }`}
          >
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setPdfFile(null);
                    setParsedRecipe(null);
                    setErrorMsg(null);
                    setWarningMsg(null);
                  }}
                  className="bg-theme-card border border-theme-subtle hover:bg-rose-500/10 hover:text-rose-500 text-theme-muted px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar
                </button>
              )}
              <label className="cursor-pointer bg-theme-card border border-theme-subtle hover:bg-theme-card-subtle text-theme-main px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Ler PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) processPdf(e.target.files[0]);
                  e.target.value = '';
                }} />
              </label>
            </div>
            
            <textarea
              rows={5}
              maxLength={5000}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui a URL, texto ou arraste um PDF (máx 5000 caracteres)"
              className="w-full bg-theme-card-subtle border border-theme-subtle rounded-2xl p-3.5 pt-10 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand font-mono leading-relaxed transition resize-none"
            />
            {isDragging && (
              <div className="absolute inset-0 z-20 bg-theme-brand/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="bg-theme-brand text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                  Solte o PDF para extrair o texto
                </div>
              </div>
            )}
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
