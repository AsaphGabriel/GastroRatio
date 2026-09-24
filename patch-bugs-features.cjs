const fs = require('fs');

// --- 1. Fix BakersView Crash ---
let bakersView = fs.readFileSync('src/components/BakersView.tsx', 'utf8');
bakersView = bakersView.replace(
  /return CalculateBakersPercentageUseCase\.execute\(selectedRecipe\.ingredients\);/g,
  `try {
      return CalculateBakersPercentageUseCase.execute(selectedRecipe.ingredients);
    } catch (err) {
      return null;
    }`
);
// Add empty state for non-baking recipes
bakersView = bakersView.replace(
  /\{\/\* Controles de Peso \*\/\}/g,
  `{!baseBakersCalc && (
          <div className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-4 text-center mt-3">
            <h3 className="text-sm font-bold text-theme-main">Receita Incompatível</h3>
            <p className="text-xs text-theme-muted mt-1">
              Esta receita não possui ingredientes base (como farinha de trigo) necessários para o cálculo da Porcentagem de Padeiro.
            </p>
          </div>
        )}
        
        {/* Controles de Peso */}`
);
bakersView = bakersView.replace(/text-amber-600/g, 'text-amber-700');
fs.writeFileSync('src/components/BakersView.tsx', bakersView);

// --- 2. Update Chemical Substitutions ---
let subs = fs.readFileSync('src/domain/constants/chemical-substitutions.ts', 'utf8');
subs = subs.replace(/readonly physicalFunction: string;/g, 'readonly physicalFunction: string;\n  readonly multiplier?: number;\n  readonly overrideName?: string;');
subs = subs.replace(
  /original: 'açúcar refinado',\n    substitute: 'mel de abelha',/g,
  `original: 'açúcar refinado',\n    substitute: 'mel de abelha',\n    multiplier: 0.75,\n    overrideName: 'Mel de Abelha',`
);
subs = subs.replace(
  /original: 'manteiga',\n    substitute: 'óleo vegetal ou azeite',/g,
  `original: 'manteiga',\n    substitute: 'óleo vegetal ou azeite',\n    multiplier: 0.85,\n    overrideName: 'Óleo Vegetal',`
);
subs = subs.replace(
  /original: 'farinha de trigo \(como espessante de molho\)',\n    substitute: 'amido de milho \(maizena\)',/g,
  `original: 'farinha de trigo (como espessante de molho)',\n    substitute: 'amido de milho (maizena)',\n    multiplier: 0.5,\n    overrideName: 'Amido de Milho',`
);
fs.writeFileSync('src/domain/constants/chemical-substitutions.ts', subs);

// --- 3. Fix ScaleView Contrast, Swipe & Active Subs ---
let scaleView = fs.readFileSync('src/components/ScaleView.tsx', 'utf8');

// Add useRef to imports
scaleView = scaleView.replace(/import \{ useState, useMemo, useEffect \} from 'react';/, "import { useState, useMemo, useEffect, useRef } from 'react';");

// Contrast fixes
scaleView = scaleView.replace(/text-amber-600/g, 'text-amber-700');
scaleView = scaleView.replace(/bg-amber-600/g, 'bg-amber-700');

fs.writeFileSync('src/components/ScaleView.tsx', scaleView);
