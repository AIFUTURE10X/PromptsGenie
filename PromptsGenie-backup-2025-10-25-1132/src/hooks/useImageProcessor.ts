import { useCallback, useRef, useState } from 'react';
import type { ImageProcessingMessage, ImageProcessingResult, ProgressMessage } from '../workers/imageProcessor';

export interface ProcessingTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export function useImageProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const [tasks, setTasks] = useState<Map<string, ProcessingTask>>(new Map());
  const pendingResolvers = useRef<Map<string, { resolve: (value: string) => void; reject: (error: Error) => void }>>(new Map());

  // Initialize worker
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      // Create worker from the TypeScript file
      workerRef.current = new Worker(
        new URL('../workers/imageProcessor.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event: MessageEvent<ImageProcessingResult | ProgressMessage>) => {
        const { type, id } = event.data;

        if (type === 'PROGRESS') {
          const { progress } = event.data as ProgressMessage;
          setTasks(prev => {
            const newTasks = new Map(prev);
            const task = newTasks.get(id);
            if (task) {
              newTasks.set(id, { ...task, progress, status: 'processing' });
            }
            return newTasks;
          });
        } else if (type === 'IMAGE_PROCESSED') {
          const { dataUrl, error } = event.data as ImageProcessingResult;
          const resolvers = pendingResolvers.current.get(id);
          
          setTasks(prev => {
            const newTasks = new Map(prev);
            const task = newTasks.get(id);
            if (task) {
              newTasks.set(id, {
                ...task,
                progress: 100,
                status: error ? 'error' : 'completed',
                result: dataUrl,
                error
              });
            }
            return newTasks;
          });

          if (resolvers) {
            if (error) {
              resolvers.reject(new Error(error));
            } else {
              resolvers.resolve(dataUrl);
            }
            pendingResolvers.current.delete(id);
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Image processing worker error:', error);
      };
    }
    return workerRef.current;
  }, []);

  // Process image with progress tracking
  const processImage = useCallback(async (
    file: File,
    maxDimension: number = 1600,
    quality: number = 0.8
  ): Promise<string> => {
    const worker = initWorker();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add task to tracking
    setTasks(prev => {
      const newTasks = new Map(prev);
      newTasks.set(id, {
        id,
        file,
        progress: 0,
        status: 'pending'
      });
      return newTasks;
    });

    return new Promise((resolve, reject) => {
      // Store resolvers for this task
      pendingResolvers.current.set(id, { resolve, reject });

      // Send message to worker
      const message: ImageProcessingMessage = {
        type: 'PROCESS_IMAGE',
        file,
        maxDimension,
        quality,
        id
      };

      worker.postMessage(message);

      // Set timeout for safety
      setTimeout(() => {
        const resolvers = pendingResolvers.current.get(id);
        if (resolvers) {
          resolvers.reject(new Error('Image processing timeout'));
          pendingResolvers.current.delete(id);
        }
      }, 30000); // 30 second timeout
    });
  }, [initWorker]);

  // Process multiple images concurrently
  const processImages = useCallback(async (
    files: File[],
    maxDimension: number = 1600,
    quality: number = 0.8
  ): Promise<string[]> => {
    const promises = files.map(file => processImage(file, maxDimension, quality));
    return Promise.all(promises);
  }, [processImage]);

  // Get task status
  const getTaskStatus = useCallback((id: string): ProcessingTask | undefined => {
    return tasks.get(id);
  }, [tasks]);

  // Clear completed tasks
  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => {
      const newTasks = new Map();
      for (const [id, task] of prev) {
        if (task.status === 'processing' || task.status === 'pending') {
          newTasks.set(id, task);
        }
      }
      return newTasks;
    });
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingResolvers.current.clear();
    setTasks(new Map());
  }, []);

  return {
    processImage,
    processImages,
    tasks: Array.from(tasks.values()),
    getTaskStatus,
    clearCompletedTasks,
    cleanup
  };
}