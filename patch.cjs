const fs = require('fs');
let code = fs.readFileSync('src/domain/use-cases/SanitizeAndParseRecipe.ts', 'utf8');

code = code.replace(
  /const isStrictIngredientLine =[\s\S]*?;\n/,
  `const isStrictIngredientLine =
          (/^\\s*[•\\-*]\\s*\\d+/i.test(line) ||
            /^\\s*\\d+[\\d\\/\\.,\\s]*(?:xícara|colher|copo|g|kg|ml|l|unidade|lata|caixa|pitada)\\b/i.test(line) ||
            /^\\s*.+?:\\s*\\d+[\\d\\/\\.,\\s]*(?:xícara|colher|copo|g|kg|ml|l|unidade|lata|caixa|pitada)?\\b/i.test(line)) &&
          !/(?:minuto|minutos|ano|anos|hora|horas|dia|dias)\\b/i.test(line);\n`
);

fs.writeFileSync('src/domain/use-cases/SanitizeAndParseRecipe.ts', code);
