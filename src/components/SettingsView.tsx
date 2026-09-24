import React, { useState, useEffect } from 'react';
import { db } from '../data/database.js';
import { Key, Download, Upload, ShieldCheck, Database, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gastroratio_gemini_api_key') || '';
    setApiKey(saved);
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gastroratio_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gastroratio_gemini_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportBackup = async () => {
    const allRecipes = await db.recipes.toArray();
    const allPantry = await db.pantry.toArray();
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: allRecipes,
      pantry: allPantry
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastroratio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          await db.recipes.clear();
          await db.recipes.bulkAdd(parsed.recipes);
          alert('Backup restaurado com sucesso!');
          window.location.reload();
        }
      } catch (err) {
        alert('Erro ao processar arquivo de backup JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-xl font-bold text-white">Configurações & Privacidade</h1>
        <p className="text-xs text-slate-400">
          Governança Local-First, chaves de inteligência artificial e persistência física.
        </p>
      </div>

      {/* Assistente de IA: Gemini Flash (BYOK) */}
      <section className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chave de IA Gemini (BYOK — Opcional)</h2>
            <p className="text-xs text-slate-400">
              Utilizada apenas para o assistente de parse de receitas brutas da internet e substituições químicas raras.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-2">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              Google Gemini API Key:
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy... (fica salva apenas no navegador)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Deixe em branco para usar o app 100% offline em modo determinístico puro.
            </p>
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center transition touch-target"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-white" />
                  Salvo!
                </>
              ) : (
                'Salvar Chave'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Backup e Exportação Local (IndexedDB) */}
      <section className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Persistência Local & Backup</h2>
            <p className="text-xs text-slate-400">
              Seus dados residem exclusivamente no armazenamento do seu dispositivo (IndexedDB).
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center space-x-3 flex-wrap gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition touch-target"
          >
            <Download className="w-4 h-4 mr-2 text-sky-400" />
            Exportar Backup JSON
          </button>

          <label className="flex items-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition cursor-pointer touch-target">
            <Upload className="w-4 h-4 mr-2 text-emerald-400" />
            Restaurar Backup JSON
            <input type="file" accept=".json" onChange={handleImportBackup} className="sr-only" />
          </label>
        </div>
      </section>

      {/* Conformidade e LGPD */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start space-x-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <h3 className="font-semibold text-slate-200">Arquitetura Soberana (Local-First by Design)</h3>
          <p>
            O GastroRatio não possui servidores em nuvem para armazenamento de dados, não coleta telemetria e não exige login. Suas receitas e preferências pertencem estritamente a você.
          </p>
        </div>
      </section>
    </div>
  );
};
