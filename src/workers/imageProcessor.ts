// Image processing Web Worker to prevent UI blocking
export interface ImageProcessingMessage {
  type: 'PROCESS_IMAGE';
  file: File;
  maxDimension: number;
  quality: number;
  id: string;
}

export interface ImageProcessingResult {
  type: 'IMAGE_PROCESSED';
  dataUrl: string;
  id: string;
  error?: string;
}

export interface ProgressMessage {
  type: 'PROGRESS';
  id: string;
  progress: number;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<ImageProcessingMessage>) => {
  const { type, file, maxDimension, quality, id } = event.data;
  
  if (type === 'PROCESS_IMAGE') {
    try {
      // Send progress update
      self.postMessage({ type: 'PROGRESS', id, progress: 10 } as ProgressMessage);
      
      const dataUrl = await processImageInWorker(file, maxDimension, quality, id);
      
      // Send completion
      self.postMessage({
        type: 'IMAGE_PROCESSED',
        dataUrl,
        id
      } as ImageProcessingResult);
    } catch (error) {
      self.postMessage({
        type: 'IMAGE_PROCESSED',
        dataUrl: '',
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ImageProcessingResult);
    }
  }
};

async function processImageInWorker(
  file: File, 
  maxDimension: number, 
  quality: number,
  id: string
): Promise<string> {
  try {
    // Send progress update
    self.postMessage({ type: 'PROGRESS', id, progress: 10 } as ProgressMessage);
    
    // Use createImageBitmap which is available in Web Workers
    const imageBitmap = await createImageBitmap(file);
    
    // Send progress update
    self.postMessage({ type: 'PROGRESS', id, progress: 30 } as ProgressMessage);
    
    // Calculate new dimensions
    let { width, height } = imageBitmap;
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Create OffscreenCanvas for better performance
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Send progress update
    self.postMessage({ type: 'PROGRESS', id, progress: 60 } as ProgressMessage);
    
    // Draw and compress
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Clean up the ImageBitmap
    imageBitmap.close();
    
    // Send progress update
    self.postMessage({ type: 'PROGRESS', id, progress: 80 } as ProgressMessage);
    
    // Convert to blob and then to data URL
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Send final progress
        self.postMessage({ type: 'PROGRESS', id, progress: 100 } as ProgressMessage);
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    throw error;
  }
}