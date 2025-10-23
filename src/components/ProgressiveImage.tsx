import React, { useState, useEffect, useCallback } from 'react';
import { useImageProcessor } from '../hooks/useImageProcessor';

interface ProgressiveImageProps {
  file?: File;
  src?: string;
  alt?: string;
  className?: string;
  onLoad?: (dataUrl: string) => void;
  onProgress?: (progress: number) => void;
  maxDimension?: number;
  quality?: number;
  showProgress?: boolean;
}

export function ProgressiveImage({
  file,
  src,
  alt = '',
  className = '',
  onLoad,
  onProgress,
  maxDimension = 1600,
  quality = 0.8,
  showProgress = true
}: ProgressiveImageProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [highQualityUrl, setHighQualityUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  
  const { processImage, tasks } = useImageProcessor();

  // Generate low-quality preview immediately
  const generatePreview = useCallback(async (file: File) => {
    try {
      // Create a very small preview for immediate display
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise<string>((resolve, reject) => {
        img.onload = () => {
          // Very small dimensions for fast preview
          const previewSize = 50;
          const ratio = Math.min(previewSize / img.width, previewSize / img.height);
          const width = Math.round(img.width * ratio);
          const height = Math.round(img.height * ratio);
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.3));
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return '';
    }
  }, []);

  // Process image on mount
  useEffect(() => {
    let isMounted = true;
    
    // If src is provided, use it directly without processing
    if (src && !file) {
      setHighQualityUrl(src);
      setIsLoading(false);
      onLoad?.(src);
      return;
    }
    
    // If no file is provided, do nothing
    if (!file) {
      return;
    }
    
    const processImageAsync = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Generate low-quality preview first
        const preview = await generatePreview(file);
        if (isMounted && preview) {
          setPreviewUrl(preview);
        }
        
        // Process high-quality version in Web Worker
        const highQuality = await processImage(file, maxDimension, quality);
        
        if (isMounted) {
          setHighQualityUrl(highQuality);
          setIsLoading(false);
          onLoad?.(highQuality);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to process image');
          setIsLoading(false);
        }
      }
    };
    
    processImageAsync();
    
    return () => {
      isMounted = false;
    };
  }, [file, src, maxDimension, quality, generatePreview, processImage, onLoad]);

  // Track progress from Web Worker
  useEffect(() => {
    if (!file) return; // Only track progress when processing a file
    
    const currentTask = tasks.find(task => task.file === file);
    if (currentTask) {
      setProgress(currentTask.progress);
      onProgress?.(currentTask.progress);
      
      if (currentTask.status === 'error' && currentTask.error) {
        setError(currentTask.error);
        setIsLoading(false);
      }
    }
  }, [tasks, file, onProgress]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (highQualityUrl && highQualityUrl.startsWith('blob:')) {
        URL.revokeObjectURL(highQualityUrl);
      }
    };
  }, [previewUrl, highQualityUrl]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="text-center p-4">
          <div className="text-red-500 text-sm mb-2">⚠️ Error</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Low-quality preview */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            highQualityUrl ? 'opacity-0' : 'opacity-100'
          } filter blur-sm`}
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      
      {/* High-quality image */}
      {highQualityUrl && (
        <img
          src={highQualityUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100"
        />
      )}
      
      {/* Loading overlay */}
      {isLoading && showProgress && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-xs">{Math.round(progress)}%</div>
          </div>
        </div>
      )}
      
      {/* Progress bar */}
      {isLoading && showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}