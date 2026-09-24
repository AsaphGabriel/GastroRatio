const fs = require('fs');
let content = fs.readFileSync('src/components/PantryView.tsx', 'utf8');

// Fix vertical alignment: change top-[2px] left-[2px] to top-[1px] left-[1px] because the border takes 1px of the 24px height
content = content.replace(/after:top-\[2px\] after:left-\[2px\]/g, "after:top-[1px] after:left-[1px]");

// Fix missing color: Tailwind v4 doesn't dynamically create peer-checked variants for custom CSS classes unless configured, so we use arbitrary value syntax
content = content.replace(/peer-checked:bg-theme-brand/g, "peer-checked:[background-color:var(--brand-main)]");

fs.writeFileSync('src/components/PantryView.tsx', content);
