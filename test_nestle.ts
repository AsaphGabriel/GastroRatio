import { SanitizeAndParseRecipeUseCase } from './src/domain/use-cases/SanitizeAndParseRecipe.js';

const text = `Title: Receita de Massa Simples de Panqueca

URL Source: https://www.receitasnestle.com.br/receitas/receita-massa-panqueca

Markdown Content:
[](https://www.receitasnestle.com.br/)

![Image 1: Foto da receita de Massa de Panqueca. Observa-se 3 massas finas de panqueca enroladas e douradas sobre um prato.](https://www.receitasnestle.com.br/sites/default/files/styles/recipe_detail_desktop_new/public/srh_recipes/34caad91b7984e1fa4350fbade067a62.jpeg?itok=H4IHv6UP)

Testada

A panqueca é aquela receita coringa que transita com perfeição entre o café da manhã reforçado e um almoço prático.  
Com uma massa leve, elástica e neutra, ela funciona como uma tela em branco pronta para receber desde recheios salgados suculentos, como carne moída e frango com requeijão, até coberturas doces irresistíveis.  
O grande charme da panqueca reside na sua simplicidade e na rapidez do preparo, garantindo uma refeição reconfortante que agrada a todos, sem exigir horas na cozinha ou técnicas complexas.

Receita criada por: **Receitas Nestlé**

*   **Dificuldade**Fácil
*   **Porções**15
*   **Total**40 min

*   5 
Avalie esta receita

## Ingredientes

*       *   2 xícaras (chá) de farinha de trigo
    *   3 ovos
    *   2 xícaras (chá) de Leite Líquido NINHO® Forti+ Integral
    *   1 colher (chá) de sal
`

const result = SanitizeAndParseRecipeUseCase.execute(text);
console.log(JSON.stringify(result, null, 2));
