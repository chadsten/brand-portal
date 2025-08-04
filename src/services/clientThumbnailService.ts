/**
 * Client-side thumbnail generation service
 * 100% web-based - no server dependencies
 * Generates thumbnails in browser and uploads to S3
 */

import { nanoid } from 'nanoid';
import { 
  RENDERERS, 
  getRendererForMimeType,
  type ThumbnailRenderOptions 
} from './clientThumbnailRenderers';

export interface ThumbnailGenerationResult {
  success: boolean;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  error?: string;
  progress?: number;
}

export interface ThumbnailGenerationOptions extends ThumbnailRenderOptions {
  organizationId?: string;
  onProgress?: (progress: number, message?: string) => void;
}

export class ClientThumbnailService {
  private worker: Worker | null = null;
  private pendingOperations = new Map<string, {
    resolve: (result: ThumbnailGenerationResult) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number, message?: string) => void;
  }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return; // SSR guard
    
    try {
      this.worker = new Worker('/thumbnail-worker.js');
      
      this.worker.onmessage = (e) => {
        const { type, id, progress, message, error, arrayBuffer, fileName, mimeType, options } = e.data;
        const operation = this.pendingOperations.get(id);
        
        if (!operation) return;
        
        switch (type) {
          case 'progress':
            operation.onProgress?.(progress, message);
            break;
            
          case 'ready':
            // Process the document data in main thread
            this.processDocumentData(id, arrayBuffer, fileName, mimeType, options);
            break;
            
          case 'error':
            operation.reject(new Error(error));
            this.pendingOperations.delete(id);
            break;
            
          case 'pong':
            // Worker is alive
            break;
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Thumbnail worker error:', error);
      };
      
    } catch (error) {
      console.warn('Web Worker not available, will process on main thread:', error);
    }
  }

  /**
   * Generate thumbnail for a document asset
   */
  async generateThumbnail(
    assetId: string,
    fileBlob: Blob,
    fileName: string,
    mimeType: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailGenerationResult> {
    const { onProgress, organizationId, ...renderOptions } = options;
    
    try {
      onProgress?.(5, 'Checking file type...');
      
      // Check if file type is supported
      const rendererType = getRendererForMimeType(mimeType);
      if (!rendererType) {
        return {
          success: false,
          error: `Unsupported file type: ${mimeType}`
        };
      }

      onProgress?.(10, 'Downloading file...');
      
      // Generate thumbnail using appropriate renderer
      const renderer = RENDERERS[rendererType];
      onProgress?.(30, 'Processing document...');
      
      const thumbnailBlob = await renderer(fileBlob, renderOptions);
      onProgress?.(70, 'Generated thumbnail, uploading...');
      
      // Upload thumbnail to storage
      const uploadResult = await this.uploadThumbnailToS3(
        assetId,
        thumbnailBlob,
        fileName,
        organizationId
      );
      
      onProgress?.(90, 'Updating database...');
      
      // Update asset with thumbnail information
      await this.updateAssetThumbnail(assetId, uploadResult.key);
      
      onProgress?.(100, 'Complete!');
      
      return {
        success: true,
        thumbnailUrl: uploadResult.url,
        thumbnailKey: uploadResult.key
      };
      
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process document data (called from worker or directly)
   */
  private async processDocumentData(
    operationId: string,
    arrayBuffer: ArrayBuffer,
    fileName: string,
    mimeType: string,
    options: any
  ) {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) return;
    
    try {
      // Convert array buffer back to blob
      const fileBlob = new Blob([arrayBuffer], { type: mimeType });
      
      // Process with renderer
      const rendererType = getRendererForMimeType(mimeType);
      if (!rendererType) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
      
      const renderer = RENDERERS[rendererType];
      operation.onProgress?.(60, 'Rendering thumbnail...');
      
      const thumbnailBlob = await renderer(fileBlob, options);
      operation.onProgress?.(80, 'Upload thumbnail...');
      
      // Generate result
      operation.resolve({
        success: true,
        // Note: In a real implementation, you'd upload here
        thumbnailUrl: URL.createObjectURL(thumbnailBlob)
      });
      
    } catch (error) {
      operation.reject(error instanceof Error ? error : new Error('Processing failed'));
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Upload generated thumbnail to S3 storage
   */
  private async uploadThumbnailToS3(
    assetId: string,
    thumbnailBlob: Blob,
    originalFileName: string,
    organizationId?: string
  ): Promise<{ url: string; key: string }> {
    try {
      // Generate unique thumbnail filename
      const timestamp = Date.now();
      const randomId = nanoid(8);
      const thumbnailName = `thumbnail-${assetId}-${timestamp}-${randomId}.webp`;
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', thumbnailBlob, thumbnailName);
      formData.append('assetId', assetId);
      formData.append('type', 'thumbnail');
      formData.append('originalFileName', originalFileName);
      
      if (organizationId) {
        formData.append('organizationId', organizationId);
      }
      
      // Upload to server
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return {
        url: result.url,
        key: result.key
      };
      
    } catch (error) {
      throw new Error(`Thumbnail upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update asset record with thumbnail information
   */
  private async updateAssetThumbnail(assetId: string, thumbnailKey: string): Promise<void> {
    try {
      const response = await fetch('/api/assets/update-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId,
          thumbnailKey
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database update failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Database update failed');
      }
      
    } catch (error) {
      // Log error but don't fail the whole operation
      console.error('Failed to update asset thumbnail in database:', error);
      throw error;
    }
  }

  /**
   * Check if a file type is supported for thumbnail generation
   */
  isFileTypeSupported(mimeType: string): boolean {
    return getRendererForMimeType(mimeType) !== null;
  }

  /**
   * Get list of supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'text/csv',
      'text/html',
      'text/css',
      'text/javascript',
      'text/typescript',
      'application/json',
      'application/xml',
      'text/xml'
    ];
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject any pending operations
    for (const [id, operation] of this.pendingOperations) {
      operation.reject(new Error('Service destroyed'));
    }
    this.pendingOperations.clear();
  }
}

// Create singleton instance
export const clientThumbnailService = new ClientThumbnailService();