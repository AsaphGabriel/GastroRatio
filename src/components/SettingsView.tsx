import React, { useState, useEffect } from 'react';
import { db } from '../data/database.js';
import { RecipeSchema, PantryItemSchema } from '../domain/schemas/recipe.schema.js';
import { Key, Download, Upload, ShieldCheck, Database, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gastroratio_gemini_api_key_v2');
      if (saved) {
        setApiKey(atob(saved).split('').reverse().join(''));
      }
      // Purgar ativamente resquícios legados inseguros do localStorage (CWE-312 / Art. 1º)
      localStorage.removeItem('gastroratio_gemini_api_key_v2');
      localStorage.removeItem('gastroratio_gemini_api_key');
    } catch {
      setApiKey('');
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      const obfuscated = btoa(apiKey.trim().split('').reverse().join(''));
      sessionStorage.setItem('gastroratio_gemini_api_key_v2', obfuscated);
    } else {
      sessionStorage.removeItem('gastroratio_gemini_api_key_v2');
    }
    // Purgar ativamente resquícios inseguros do localStorage em toda operação de salvar
    localStorage.removeItem('gastroratio_gemini_api_key_v2');
    localStorage.removeItem('gastroratio_gemini_api_key');
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

    // Barreira de tamanho de arquivo: previne OOM DoS (CWE-400 / VibeSec File Upload)
    const MAX_BACKUP_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_BACKUP_SIZE) {
      alert('Erro: O arquivo de backup excede o tamanho máximo permitido de 5 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          // Validação e sanitização Zod em runtime: usar o RETORNO do parse() (CWE-915 / Pilar 2 & 8)
          // O retorno de RecipeSchema.parse() descarta propriedades não declaradas no schema,
          // prevenindo Mass Assignment e injeção de campos extras no IndexedDB.
          const sanitizedRecipes = (parsed.recipes as unknown[]).map((r) =>
            RecipeSchema.parse(r)
          );
          const sanitizedPantry =
            parsed.pantry && Array.isArray(parsed.pantry)
              ? (parsed.pantry as unknown[]).map((p) => PantryItemSchema.parse(p))
              : [];

          // Transação atômica ACID (tudo ou nada) operando sobre dados higienizados
          await db.transaction('rw', [db.recipes, db.pantry], async () => {
            await db.recipes.clear();
            await db.recipes.bulkAdd(sanitizedRecipes);
            if (sanitizedPantry.length > 0) {
              await db.pantry.clear();
              await db.pantry.bulkAdd(sanitizedPantry);
            }
          });

          alert('Backup restaurado e validado com sucesso!');
          window.location.reload();
        } else {
          alert('Arquivo de backup inválido: formato de receitas não identificado.');
        }
      } catch (err: any) {
        alert('Erro ao processar/validar backup JSON: ' + (err?.message || err));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="border-b border-theme-subtle pb-3">
        <h1 className="text-lg sm:text-xl font-black text-theme-main">Configurações & Privacidade</h1>
        <p className="text-xs text-theme-muted mt-0.5">
          Arquitetura Local-First, controle de IA e persistência soberana no cliente.
        </p>
      </div>

      {/* Assistente de IA: Gemini Flash (BYOK) */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-3.5 card-shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-theme-brand-subtle text-theme-brand flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-main">Chave de IA Gemini (BYOK — Opcional)</h2>
            <p className="text-xs text-theme-muted">
              Utilizada apenas para o parse de receitas caóticas da internet. O app funciona 100% offline sem ela.{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-theme-brand hover:underline font-bold"
              >
                Obter chave gratuita no Google AI Studio →
              </a>
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-theme-main font-semibold flex items-center justify-between mb-1">
              API Key (Gemini, Groq ou OpenAI):
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    const trimmed = text.trim();
                    if (trimmed.length > 30) {
                      setApiKey(trimmed);
                      const obfuscated = btoa(trimmed.split('').reverse().join(''));
                      sessionStorage.setItem('gastroratio_gemini_api_key_v2', obfuscated);
                      localStorage.removeItem('gastroratio_gemini_api_key_v2');
                      localStorage.removeItem('gastroratio_gemini_api_key');
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    } else {
                      alert('A chave na área de transferência parece inválida ou curta demais.');
                    }
                  } catch (err) {
                    alert('Não foi possível ler a área de transferência. Cole manualmente.');
                  }
                }}
                className="text-[10px] text-theme-brand hover:underline font-bold"
              >
                📋 Colar e Salvar
              </button>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy... (armazenada apenas no seu navegador)"
              className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-4 py-2.5 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand font-mono transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <p className="text-[11px] text-theme-dim">
              Deixe em branco para usar o parser determinístico local em 0ms.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const key = apiKey.trim();
                  if (!key) {
                    alert('Cole uma chave primeiro.');
                    return;
                  }
                  
                  const isGroq = key.startsWith('gsk_');
                  const isOpenAI = key.startsWith('sk-proj-') || key.startsWith('sk-ant-') || key.startsWith('sk-');
                  
                  let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;
                  let method = 'POST';
                  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
                  let body = JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] });
                  let name = 'Gemini';

                  if (isGroq) {
                    url = 'https://api.groq.com/openai/v1/models';
                    method = 'GET';
                    headers = { 'Authorization': `Bearer ${key}` };
                    body = '';
                    name = 'Groq';
                  } else if (isOpenAI) {
                    url = 'https://api.openai.com/v1/models';
                    method = 'GET';
                    headers = { 'Authorization': `Bearer ${key}` };
                    body = '';
                    name = 'OpenAI';
                  }

                  try {
                    const reqOptions: RequestInit = { method, headers };
                    if (method === 'POST') reqOptions.body = body;
                    const response = await fetch(url, reqOptions);
                    
                    if (response.ok) {
                      alert(`🟢 Conexão validada! ${name} respondendo normalmente.`);
                    } else {
                      alert(`🔴 Falha na conexão com ${name}: HTTP ${response.status} — Chave inválida ou cota esgotada.`);
                    }
                  } catch (err: any) {
                    alert(`🔴 Erro de rede: ${err.message}`);
                  }
                }}
                className="bg-theme-card border border-theme-subtle hover:bg-theme-card-hover text-theme-main px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm touch-target shrink-0"
              >
                Testar Conexão
              </button>
              <button
                type="submit"
                className="bg-theme-brand hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition shadow-sm touch-target shrink-0"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-white" />
                    Salvo com Sucesso!
                  </>
                ) : (
                  'Salvar Chave'
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Backup e Exportação Local (IndexedDB) */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-3.5 card-shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-main">Persistência Local & Backup</h2>
            <p className="text-xs text-theme-muted">
              Seus cadernos de receitas e bancada residem no banco de dados do seu dispositivo (IndexedDB).
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center space-x-2.5 flex-wrap gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center px-4 py-2.5 rounded-xl bg-theme-card border border-theme-subtle hover:bg-theme-card-hover text-xs font-bold text-theme-main transition shadow-sm touch-target"
          >
            <Download className="w-4 h-4 mr-2 text-sky-600 dark:text-sky-400 shrink-0" />
            Exportar Backup JSON
          </button>

          <label className="flex items-center px-4 py-2.5 rounded-xl bg-theme-card border border-theme-subtle hover:bg-theme-card-hover text-xs font-bold text-theme-main transition cursor-pointer shadow-sm touch-target">
            <Upload className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Restaurar Backup JSON
            <input type="file" accept=".json" onChange={handleImportBackup} className="sr-only" />
          </label>
        </div>
      </section>

      {/* Conformidade e LGPD */}
      <section className="bg-theme-card-subtle border border-theme-subtle rounded-2xl p-4 sm:p-5 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-theme-muted space-y-1">
          <h3 className="font-bold text-theme-main">Privacidade & Soberania por Padrão</h3>
          <p className="leading-relaxed">
            O GastroRatio é uma aplicação 100% estática e offline (PWA). Ele não envia seus dados para nenhum servidor em nuvem nem coleta rastreadores.
          </p>
        </div>
      </section>
    </div>
  );
};
