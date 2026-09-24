const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// 1. Change layout of tabs from flex-row to flex-col to avoid truncation on mobile
content = content.replace(/className={`flex items-center justify-center py-2 px-1/g, 'className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1');
content = content.replace(/<UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" \/>/g, '<UtensilsCrossed className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />');
content = content.replace(/<Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" \/>/g, '<Scale className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />');
content = content.replace(/<Croissant className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" \/>/g, '<Croissant className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />');
content = content.replace(/<BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" \/>/g, '<BookOpen className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />');
content = content.replace(/<Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" \/>/g, '<Settings className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />');

// Remove truncate and make text 10px on mobile
content = content.replace(/<span className="truncate">/g, '<span className="text-[10px] sm:text-xs">');

// 2. Change 'Padeiro' to 'Chef'
content = content.replace(/<span>Padeiro<\/span>/g, '<span>Chef</span>');
content = content.replace(/<span className="text-\[10px\] sm:text-xs">Padeiro<\/span>/g, '<span className="text-[10px] sm:text-xs">Chef</span>');

// 3. Make Scale Tab ALWAYS clickable, not disabled
content = content.replace(/disabled={!hasSelectedRecipe}/g, '');
// Change the color logic for scale so it doesn't look disabled
content = content.replace(
  /activeTab === 'scale'\n\s+\? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'\n\s+: hasSelectedRecipe\n\s+\? 'text-theme-muted hover:text-theme-main'\n\s+: 'text-theme-dim opacity-40 cursor-not-allowed'/g,
  "activeTab === 'scale'\n              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'\n              : 'text-theme-muted hover:text-theme-main'"
);
content = content.replace(
  /title={!hasSelectedRecipe \? 'Selecione uma receita para abrir a balança' : 'Balança de precisão'}/g,
  "title='Balança de precisão'"
);

fs.writeFileSync('src/components/Header.tsx', content);
