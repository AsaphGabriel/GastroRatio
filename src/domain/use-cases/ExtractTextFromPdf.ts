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
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
        
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  }
}
