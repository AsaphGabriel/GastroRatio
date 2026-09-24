import React, { useState } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { SanitizeAndParseRecipeUseCase } from '../domain/use-cases/SanitizeAndParseRecipe.js';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLocalParse = () => {
    setErrorMsg(null);
    if (!rawText.trim()) {
      setErrorMsg('Cole o texto da receita antes de extrair.');
      return;
    }

    try {
      const result = SanitizeAndParseRecipeUseCase.execute(rawText);
      setParsedRecipe(result.recipe);
      setConfidence(result.confidence);
      setSource('local');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar receita localmente.');
    }
  };

  const handleAiParse = async () => {
    setErrorMsg(null);
    if (!rawText.trim()) {
      setErrorMsg('Cole o texto da receita antes de refinar com IA.');
      return;
    }

    setIsLoadingAi(true);
    try {
      const result = await GeminiSousChefAdapter.parseChaoticRecipe(rawText);
      setParsedRecipe(result.recipe);
      setConfidence(1.0);
      setSource('ai');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao consultar Sous-Chef IA.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecipe) return;
    await onSaveRecipe(parsedRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar Receita da Internet</h2>
              <p className="text-xs text-slate-400">Cole o texto bruto de qualquer blog ou site culinário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Textarea */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5">
              Texto da Receita:
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui a receita (ex: 2 xícaras de farinha, 1 lata de leite condensado, bata tudo no liquidificador...)"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono leading-relaxed"
            />
          </div>

          {/* Action Buttons (Cascata) */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={handleLocalParse}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow flex items-center justify-center transition touch-target"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Extrair Instantâneo (Offline / 0ms)
            </button>

            <button
              onClick={handleAiParse}
              disabled={isLoadingAi}
              className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition touch-target disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-purple-400" />
              {isLoadingAi ? 'Consultando IA...' : 'Refinar com Sous-Chef IA'}
            </button>
          </div>

          {/* Pré-visualização Estruturada */}
          {parsedRecipe && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-bold tracking-wider">
                    Origem: {source === 'local' ? 'Parser Determinístico Local' : 'Sous-Chef Gemini'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{parsedRecipe.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">
                    Confiança: {Math.round(confidence * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {parsedRecipe.ingredients.length} itens em gramas
                  </span>
                </div>
              </div>

              {/* Tabela Resumida de Ingredientes */}
              <div className="bg-slate-950/60 rounded-xl p-3 divide-y divide-slate-800/80">
                {parsedRecipe.ingredients.map((ing) => (
                  <div key={ing.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-200">
                      {ing.name}
                      {ing.isStaple && (
                        <span className="text-[10px] ml-2 text-slate-500 font-mono">[despensa]</span>
                      )}
                    </span>
                    <span className="font-bold text-brand-400 font-mono">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Passos Extraídos */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1.5">
                  Etapas ({parsedRecipe.steps.length}):
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                  {parsedRecipe.steps.map((st, i) => (
                    <li key={i} className="line-clamp-2">{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedRecipe && (
          <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Pronto para salvar no seu caderno local.</span>
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center transition touch-target"
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
