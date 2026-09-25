/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export const SWUpdater: React.FC = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // 1 hora
      }
    },
    onRegisterError(error: Error) {
      console.error('Erro ao registrar SW:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/50 flex flex-col gap-2 max-w-sm">
        <div className="text-sm font-bold flex items-center">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Nova versão do GastroRatio disponível!
        </div>
        <p className="text-xs text-emerald-100 mb-1">
          Clique abaixo para carregar as últimas melhorias e recursos no seu celular.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-emerald-50 transition touch-target"
        >
          Atualizar App Agora
        </button>
      </div>
    </div>
  );
};
