const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const emptyScaleState = `
        {activeTab === 'scale' && !selectedRecipe && (
          <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-theme-brand-subtle text-theme-brand flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-theme-main">Nenhuma Receita Selecionada</h2>
            <p className="text-sm text-theme-muted max-w-md">
              Para usar a balança, vá na Bancada ou no Catálogo de Receitas e selecione um prato para preparo.
            </p>
            <button onClick={() => setActiveTab('pantry')} className="px-6 py-2.5 mt-4 rounded-xl bg-theme-brand hover:opacity-90 text-white font-bold transition shadow-sm touch-target">
              Voltar para Bancada
            </button>
          </div>
        )}

        {activeTab === 'scale' && selectedRecipe && (`;

content = content.replace(/{activeTab === 'scale' && selectedRecipe && \(/g, emptyScaleState);
fs.writeFileSync('src/App.tsx', content);
