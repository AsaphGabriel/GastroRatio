const fs = require('fs');
let content = fs.readFileSync('src/components/PantryView.tsx', 'utf8');

content = content.replace(
  /peer-checked:\[background-color:var\(--brand-main\)\]/g,
  'toggle-track'
);

fs.writeFileSync('src/components/PantryView.tsx', content);

let cssContent = fs.readFileSync('src/index.css', 'utf8');
cssContent += `
/* Toggle ativo */
input.peer:checked + .toggle-track {
  background-color: var(--brand-main);
}
`;
fs.writeFileSync('src/index.css', cssContent);

