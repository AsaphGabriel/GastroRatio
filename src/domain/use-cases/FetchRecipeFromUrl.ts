import { ParseRecipeResult, SanitizeAndParseRecipeUseCase } from './SanitizeAndParseRecipe.js';

export class FetchRecipeFromUrlUseCase {
  public static async execute(url: string): Promise<ParseRecipeResult> {
    const rawText = await this.extractRawTextFromUrl(url);
    return SanitizeAndParseRecipeUseCase.execute(rawText);
  }

  public static async extractRawTextFromUrl(url: string): Promise<string> {
    // 1. Tenta usar o r.jina.ai (Bypass nativo de Cloudflare e conversão direta pra Markdown)
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown'
        }
      });
      if (response.ok) {
        let markdown = await response.text();
        if (markdown && markdown.length > 50) {
          // Limpa imagens e links do Markdown para não confundir o parser offline
          markdown = markdown.replace(/!\[.*?\]\(.*?\)/g, '');
          markdown = markdown.replace(/\[(.*?)\]\(.*?\)/g, '$1');
          return `${markdown}\n\nFonte: ${url}`;
        }
      }
    } catch (e) {
      console.warn("Jina proxy failed, falling back to html proxies...", e);
    }

    // 2. Fallback para corsproxy.io (mais rápido, extração JSON-LD em sites permitidos)
    let proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    let html = '';
    
    try {
      let response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('CORSProxy failed');
      html = await response.text();
    } catch (e) {
      // 3. Fallback para allorigins.win
      try {
        proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        let response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Falha ao acessar a URL.`);
        html = await response.text();
      } catch (err: any) {
        throw new Error(`Erro de conexão com o site (CORS/Bloqueio). A URL alvo está protegida. Copie e cole o texto manualmente.`);
      }
    }

    try {
      return this.parseJsonLd(html, url);
    } catch (e: any) {
      return this.extractFallbackText(html, url);
    }
  }

  private static extractFallbackText(html: string, url: string): string {
    // Extrai o body cru removendo tags HTML script e style
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyText = bodyMatch ? bodyMatch[1] : html;
    
    // Remove scripts e styles
    bodyText = bodyText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    bodyText = bodyText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // Troca tags HTML comuns por quebras de linha para dar respiro ao parser
    bodyText = bodyText.replace(/<br\s*\/?>/gi, '\n');
    bodyText = bodyText.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, '\n\n');
    
    // Limpa tags residuais
    bodyText = bodyText.replace(/<[^>]+>/ig, ' ');
    
    // Decodifica entidades HTML comuns
    bodyText = bodyText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    
    // Remove espaços excessivos
    bodyText = bodyText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    
    return `${bodyText}\n\nFonte: ${url}`;
  }

  private static parseJsonLd(html: string, sourceUrl: string): string {
    const scriptRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let recipeData: any = null;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        let jsonLd = JSON.parse(match[1]);
        
        if (Array.isArray(jsonLd)) {
          const r = jsonLd.find((item: any) => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
          if (r) {
            recipeData = r;
            break;
          }
        } else if (jsonLd['@graph']) {
           const r = jsonLd['@graph'].find((item: any) => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
           if (r) {
             recipeData = r;
             break;
           }
        } else if (jsonLd['@type'] === 'Recipe' || (Array.isArray(jsonLd['@type']) && jsonLd['@type'].includes('Recipe'))) {
          recipeData = jsonLd;
          break;
        }
      } catch (e) {
        // Ignorar JSON malformado
      }
    }

    if (!recipeData) {
      throw new Error("Nenhum metadado de receita (schema.org/Recipe) encontrado nesta página. Tente colar o texto manualmente.");
    }

    const title = recipeData.name || 'Receita Importada';
    
    // Concatena as instruções se for um array de objetos HowToStep
    let instructions = '';
    if (Array.isArray(recipeData.recipeInstructions)) {
      instructions = recipeData.recipeInstructions.map((step: any) => {
        if (typeof step === 'string') return step;
        return step.text || step.name || '';
      }).filter((s: string) => s.trim().length > 0).join('\n');
    } else {
      instructions = recipeData.recipeInstructions || '';
    }
      
    const rawIngredients: string[] = recipeData.recipeIngredient || [];
    if (rawIngredients.length === 0) {
      throw new Error("A receita não possui ingredientes listados nos metadados da página.");
    }

    // Criamos o texto bruto no formato ideal para o SanitizeAndParseRecipeUseCase
    return `${title}\n\nIngredientes:\n${rawIngredients.join('\n')}\n\nModo de Preparo:\n${instructions}\n\nFonte: ${sourceUrl}`;
  }
}
