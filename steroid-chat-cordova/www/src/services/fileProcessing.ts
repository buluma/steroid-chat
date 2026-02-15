import { FileAttachment } from '../types';

export class FileProcessingService {
  private static instance: FileProcessingService;

  static getInstance(): FileProcessingService {
    if (!FileProcessingService.instance) {
      FileProcessingService.instance = new FileProcessingService();
    }
    return FileProcessingService.instance;
  }

  async processFile(file: File): Promise<FileAttachment> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type || this.getMimeType(extension);
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'log':
      case 'csv':
      case 'js':
      case 'ts':
      case 'py':
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return this.processTextFile(file);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'svg':
        return this.processImageFile(file);
      case 'pdf':
        return this.processPdfFile(file);
      default:
        return this.processTextFile(file);
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      log: 'text/plain',
      csv: 'text/csv',
      js: 'text/javascript',
      ts: 'text/typescript',
      py: 'text/x-python',
      html: 'text/html',
      css: 'text/css',
      json: 'application/json',
      xml: 'application/xml',
      yaml: 'text/yaml',
      yml: 'text/yaml',
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async processTextFile(file: File): Promise<FileAttachment> {
    const content = await file.text();
    const type: FileAttachment['type'] = file.name.endsWith('.json') ? 'json' : 'text';
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      content,
      mimeType: file.type || 'text/plain',
      size: file.size
    };
  }

  private async processJsonFile(file: File): Promise<FileAttachment> {
    const content = await file.text();
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'json',
        content: formatted,
        mimeType: 'application/json',
        size: file.size
      };
    } catch {
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'text',
        content,
        mimeType: 'application/json',
        size: file.size
      };
    }
  }

  private async processImageFile(file: File): Promise<FileAttachment> {
    const base64 = await this.fileToBase64(file);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: 'image',
      content: base64,
      mimeType: file.type || 'image/jpeg',
      size: file.size
    };
  }

  private async processPdfFile(file: File): Promise<FileAttachment> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = this.arrayBufferToBase64(arrayBuffer);
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: 'pdf',
      content: `[PDF File: ${file.name}]\n\nNote: This is a PDF file. For best results with AI models, please ensure your selected model supports PDF/vision processing, or convert the PDF to text format.`,
      mimeType: 'application/pdf',
      size: file.size
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: FileAttachment['type']): string {
    switch (type) {
      case 'text': return '📄';
      case 'json': return '📋';
      case 'image': return '🖼️';
      case 'pdf': return '📕';
      default: return '📁';
    }
  }

  isSupportedFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const supported = ['txt', 'md', 'log', 'csv', 'js', 'ts', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf'];
    return supported.includes(ext);
  }
}

export const fileProcessingService = FileProcessingService.getInstance();
