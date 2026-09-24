const fs = require('fs');
let content = fs.readFileSync('src/components/PantryView.tsx', 'utf8');
content = content.replace(
  /className={`text-xs px-3 py-1.5 rounded-xl transition whitespace-nowrap font-medium touch-target \${/g,
  "className={`shrink-0 text-xs px-3 py-1.5 rounded-xl transition whitespace-nowrap font-medium touch-target ${"
);
fs.writeFileSync('src/components/PantryView.tsx', content);
