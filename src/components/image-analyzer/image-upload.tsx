import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { fileToBase64 } from '../../lib/utils';
import { imageFileSchema } from '../../lib/schemas';

interface ImageUploadProps {
  onImageSelect: (imageData: string, file: File) => void;
  selectedImage: string | null;
  onClear: () => void;
  label?: string;
}

export function ImageUpload({ onImageSelect, selectedImage, onClear, label }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file
      const validationResult = imageFileSchema.safeParse(file);
      if (!validationResult.success) {
        setError(validationResult.error.errors[0]?.message ?? 'Invalid file');
        return;
      }

      try {
        const base64Data = await fileToBase64(file);
        onImageSelect(base64Data, file);
      } catch (err) {
        setError('Failed to process image. Please try again.');
        console.error('Error processing image:', err);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              {...getRootProps()}
              className={`cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-dashed hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <input {...getInputProps()} />
                <div
                  className={`rounded-full p-4 mb-4 transition-colors ${
                    isDragActive ? 'bg-primary/20' : 'bg-primary/10'
                  }`}
                >
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Drop your image here' : (label || 'Upload an image')}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Drag and drop or click to select an image
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, WebP, GIF (max 5MB)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={`data:image/jpeg;base64,${selectedImage}`}
                    alt="Selected"
                    className="w-full h-auto max-h-96 object-contain bg-black/5"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={onClear}
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
