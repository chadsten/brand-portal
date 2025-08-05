/**
 * Client-only thumbnail service wrapper
 * This file should only be imported using dynamic imports on the client side
 */

'use client';

export interface ThumbnailRenderOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: Required<ThumbnailRenderOptions> = {
  width: 800,
  height: 600,
  quality: 0.85,
  format: 'webp'
};

let isInitialized = false;
let pdfjsLib: any = null;
let mammoth: any = null;
let html2canvas: any = null;
let XLSX: any = null;

async function initializeLibraries() {
  if (typeof window === 'undefined') {
    throw new Error('Client thumbnail renderers can only be used in browser environment');
  }

  if (isInitialized) return;

  try {
    // Load PDF.js
    const pdfModule = await import('pdfjs-dist');
    pdfjsLib = pdfModule;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    // Load Mammoth for Word documents
    const mammothModule = await import('mammoth');
    mammoth = mammothModule.default || mammothModule;

    // Load html2canvas
    const canvasModule = await import('html2canvas');
    html2canvas = canvasModule.default || canvasModule;

    // Load XLSX
    XLSX = await import('xlsx');

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize thumbnail libraries:', error);
    throw error;
  }
}

export async function renderPdfThumbnail(
  pdfBlob: Blob,
  options: ThumbnailRenderOptions = {}
): Promise<Blob> {
  await initializeLibraries();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.0 });
    const scaleX = opts.width / viewport.width;
    const scaleY = opts.height / viewport.height;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledViewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas
    }).promise;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        `image/${opts.format}`,
        opts.quality
      );
    });
  } catch (error) {
    throw new Error(`PDF rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function renderWordThumbnail(
  docBlob: Blob,
  options: ThumbnailRenderOptions = {}
): Promise<Blob> {
  await initializeLibraries();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const arrayBuffer = await docBlob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    tempDiv.style.cssText = `
      width: ${opts.width}px;
      max-width: ${opts.width}px;
      padding: 40px;
      background-color: white;
      font-family: 'Times New Roman', serif;
      font-size: 12px;
      line-height: 1.5;
      color: #000000;
      position: absolute;
      left: -9999px;
      top: -9999px;
      overflow: hidden;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await html2canvas(tempDiv, {
        width: opts.width,
        height: opts.height,
        backgroundColor: '#ffffff',
        scale: 1,
        useCORS: true,
        allowTaint: false,
        logging: false
      });
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          `image/${opts.format}`,
          opts.quality
        );
      });
    } finally {
      document.body.removeChild(tempDiv);
    }
  } catch (error) {
    throw new Error(`Word document rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function renderTextThumbnail(
  textBlob: Blob,
  options: ThumbnailRenderOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const text = await textBlob.text();
    const previewText = text.substring(0, 3000);
    
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('Text Document Preview', 20, 20);
    
    ctx.fillStyle = '#333333';
    ctx.font = '12px "Courier New", "Consolas", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const lines = wrapText(ctx, previewText, opts.width - 40);
    const lineHeight = 16;
    const maxLines = Math.floor((opts.height - 60) / lineHeight);
    
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      ctx.fillText(lines[i], 20, 50 + i * lineHeight);
    }
    
    if (lines.length > maxLines || text.length > 3000) {
      ctx.fillStyle = '#999999';
      ctx.font = 'italic 11px Arial, sans-serif';
      ctx.fillText('... (content truncated)', 20, opts.height - 20);
    }
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        `image/${opts.format}`,
        opts.quality
      );
    });
  } catch (error) {
    throw new Error(`Text rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (word.includes('\n')) {
      const parts = word.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i === 0) {
          const testLine = currentLine + parts[i] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = parts[i] + ' ';
          } else {
            currentLine = testLine;
          }
        } else {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = parts[i] + ' ';
        }
      }
    } else {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

export function getRendererForMimeType(mimeType: string): 'pdf' | 'word' | 'text' | null {
  const mimeMap: Record<string, 'pdf' | 'word' | 'text'> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
    'application/msword': 'word',
    'text/plain': 'text',
    'text/csv': 'text',
    'text/html': 'text',
    'text/css': 'text',
    'text/javascript': 'text',
    'text/typescript': 'text',
    'application/json': 'text',
    'application/xml': 'text',
    'text/xml': 'text'
  };
  
  return mimeMap[mimeType] || null;
}

export const CLIENT_RENDERERS = {
  pdf: renderPdfThumbnail,
  word: renderWordThumbnail,
  text: renderTextThumbnail
} as const;