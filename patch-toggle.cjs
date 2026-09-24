const fs = require('fs');
let content = fs.readFileSync('src/components/PantryView.tsx', 'utf8');

// Fix toggle switch: add 'relative' to the div so 'after:absolute' works correctly, and change color to brand (orange)
content = content.replace(
  /<div className="w-11 h-6 bg-theme-card-subtle/g,
  '<div className="w-11 h-6 relative bg-theme-card-subtle'
);
content = content.replace(
  /peer-checked:bg-emerald-600/g,
  'peer-checked:bg-theme-brand'
);

fs.writeFileSync('src/components/PantryView.tsx', content);
