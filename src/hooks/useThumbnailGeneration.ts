import { useState, useCallback } from 'react';
import { clientThumbnailService } from '~/services/clientThumbnailService';
import { ThumbnailGenerationOptions, ThumbnailGenerationResult } from '~/types';

export interface UseThumbnailGenerationProps {
  assetId: string;
  mimeType: string;
  onSuccess?: () => void;
}

export function useThumbnailGeneration({
  assetId,
  mimeType,
  onSuccess
}: UseThumbnailGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useCallback(() => {
    return clientThumbnailService.isFileTypeSupported(mimeType);
  }, [mimeType]);

  const generateThumbnail = useCallback(async (
    fileBlob: Blob,
    fileName: string,
    options: Omit<ThumbnailGenerationOptions, 'onProgress'>
  ): Promise<ThumbnailGenerationResult> => {
    if (!canGenerate()) {
      throw new Error('File type not supported for thumbnail generation');
    }

    setIsGenerating(true);
    setProgress(0);
    setMessage('Starting thumbnail generation...');
    setError(null);

    try {
      const result = await clientThumbnailService.generateThumbnail(
        assetId,
        fileBlob,
        fileName,
        mimeType,
        {
          ...options,
          onProgress: (progress, message) => {
            setProgress(progress);
            if (message) setMessage(message);
          }
        }
      );

      if (result.success) {
        setMessage('Thumbnail generated successfully!');
        onSuccess?.();
        
        // Show success for a moment, then reset
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(0);
          setMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Thumbnail generation failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setMessage(`Error: ${errorMessage}`);
      
      // Show error for a moment, then reset
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setMessage('');
        setError(null);
      }, 3000);

      throw error;
    }
  }, [assetId, mimeType, canGenerate, onSuccess]);

  const downloadAndGenerate = useCallback(async (
    downloadUrl: string,
    fileName: string,
    options: Omit<ThumbnailGenerationOptions, 'onProgress'>
  ) => {
    setProgress(10);
    setMessage('Downloading original file...');
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const fileBlob = await response.blob();
    setProgress(30);
    
    return generateThumbnail(fileBlob, fileName, options);
  }, [generateThumbnail]);

  return {
    isGenerating,
    progress,
    message,
    error,
    canGenerate,
    generateThumbnail,
    downloadAndGenerate,
  };
}