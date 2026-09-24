const fs = require('fs');
let scaleView = fs.readFileSync('src/components/ScaleView.tsx', 'utf8');

// Add activeSubs state
scaleView = scaleView.replace(
  /const \[expandedSubId, setExpandedSubId\] = useState<string \| null>\(null\);/,
  `const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [activeSubs, setActiveSubs] = useState<Record<string, { multiplier: number, newName: string }>>({});
  
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (diff > 50) setActiveStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1));
    else if (diff < -50) setActiveStepIndex((prev) => Math.max(0, prev - 1));
    touchStartX.current = null;
  };

  const patchedRecipe = useMemo(() => {
    return {
      ...recipe,
      ingredients: recipe.ingredients.map(ing => {
        const sub = activeSubs[ing.id];
        if (sub) {
          return { ...ing, name: sub.newName, amount: ing.amount * sub.multiplier };
        }
        return ing;
      })
    };
  }, [recipe, activeSubs]);`
);

// Change `ScaleRecipeUseCase.execute(recipe, ...)` to `ScaleRecipeUseCase.execute(patchedRecipe, ...)`
scaleView = scaleView.replace(
  /return ScaleRecipeUseCase\.execute\(recipe, scaleOptions\);/g,
  `return ScaleRecipeUseCase.execute(patchedRecipe, scaleOptions);`
);

// Add button to apply substitution
scaleView = scaleView.replace(
  /\{sub\.waterAdjustmentAlert && \(/g,
  `{sub.multiplier && sub.overrideName && !activeSubs[ing.id] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubs(prev => ({ ...prev, [ing.id]: { multiplier: sub.multiplier!, newName: sub.overrideName! } }));
                          setExpandedSubId(null);
                        }}
                        className="mt-2 w-full bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center justify-center"
                      >
                        Aplicar Substituição
                      </button>
                    )}
                    {activeSubs[ing.id] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubs(prev => {
                            const clone = {...prev};
                            delete clone[ing.id];
                            return clone;
                          });
                        }}
                        className="mt-2 w-full bg-theme-card border border-theme-subtle text-theme-main px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center justify-center"
                      >
                        Reverter Original
                      </button>
                    )}
                    {sub.waterAdjustmentAlert && (`
);

// Add swipe handlers to the steps card
scaleView = scaleView.replace(
  /<div className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-4 sm:p-5 min-h-\[90px\] flex items-center">/g,
  `<div 
          onTouchStart={handleTouchStart} 
          onTouchEnd={handleTouchEnd}
          className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-4 sm:p-5 min-h-[90px] flex items-center select-none"
        >`
);

fs.writeFileSync('src/components/ScaleView.tsx', scaleView);
