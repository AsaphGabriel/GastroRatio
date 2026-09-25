import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite specific URL import
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.js?url';

// Configuração do Worker do PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export class ExtractTextFromPdfUseCase {
  static async execute(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = this.reconstructPageText(textContent.items);
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    return fullText.trim();
  }

  /**
   * Reconstitui o texto ordenado visualmente (de cima para baixo, esquerda para direita)
   * e insere quebras de linha em mudanças de altura Y e em lacunas entre colunas horizontais.
   */
  public static reconstructPageText(items: any[]): string {
    if (!items || items.length === 0) return '';

    // Filtrar apenas itens válidos com transform e string
    const valid = items.filter(
      (it) => it && typeof it.str === 'string' && it.transform && it.transform.length >= 6
    );

    if (valid.length === 0) {
      // Fallback caso não venha transform
      return items.map((it) => it?.str || '').join(' ').trim();
    }

    // Ordenar verticalmente de cima para baixo (Y decrescente)
    // Se a diferença de Y for menor ou igual a 4px, ordenar horizontalmente da esquerda para a direita (X crescente)
    valid.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      const diffY = yB - yA;
      if (Math.abs(diffY) > 4) {
        return diffY;
      }
      return a.transform[4] - b.transform[4];
    });

    let text = '';
    let prevY: number | null = null;
    let prevXEnd: number | null = null;

    for (const item of valid) {
      const str = item.str.trim();
      if (!str) continue;

      const curY = item.transform[5];
      const curX = item.transform[4];
      const width = item.width || (str.length * 7);

      if (prevY === null) {
        text += str;
      } else {
        const isNewLine = Math.abs(prevY - curY) > 4;
        // Se houver um salto horizontal significativo na mesma linha (> 35px), é uma coluna adjacente (ex: 2 colunas de ingredientes)
        const isColumnGap = prevXEnd !== null && (curX - prevXEnd) > 35;

        if (isNewLine || isColumnGap) {
          text += '\n' + str;
        } else {
          // Espaço simples entre palavras da mesma linha
          text += ' ' + str;
        }
      }

      prevY = curY;
      prevXEnd = curX + width;
    }

    return text.trim();
  }
}
