import { useCallback, useState, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ImageLightbox } from '../ui/image-lightbox';
import { fileToBase64 } from '../../lib/utils';
import { imageFileSchema } from '../../lib/schemas';

interface ImageUploadProps {
  onImageSelect: (imageData: string, file: File) => void;
  selectedImage: string | null;
  onClear: () => void;
  label?: string;
}

const ImageUploadComponent = ({ onImageSelect, selectedImage, onClear, label }: ImageUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
              className={`cursor-pointer transition-all duration-200 bg-[#F77000] ${
                isDragActive
                  ? 'border-2 border-dashed border-black scale-[1.02]'
                  : 'border-2 border-dashed border-black hover:brightness-110'
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <input {...getInputProps()} aria-label={label || "Upload an image"} />
                <div
                  className={`rounded-full p-4 mb-4 transition-colors ${
                    isDragActive ? 'bg-black/20' : 'bg-black/10'
                  }`}
                >
                  <Upload className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black">
                  {isDragActive ? 'Drop your image here' : (label || 'Upload an image')}
                </h3>
                <p className="text-sm text-black/80 text-center mb-4">
                  Drag and drop or click to select an image
                </p>
                <p className="text-xs text-black/70">
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
            <Card className="relative overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative">
                  <div
                    className="cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsLightboxOpen(true);
                      }
                    }}
                    aria-label="Click to view image in full screen"
                  >
                    <img
                      src={`data:image/jpeg;base64,${selectedImage}`}
                      alt="Selected image"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto max-h-96 object-contain bg-black/5 transition-opacity group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 shadow-lg z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear();
                    }}
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lightbox */}
            <ImageLightbox
              src={`data:image/jpeg;base64,${selectedImage}`}
              alt="Selected image"
              isOpen={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
            />
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
};

// Export memoized version to prevent unnecessary re-renders
export const ImageUpload = memo(ImageUploadComponent);
