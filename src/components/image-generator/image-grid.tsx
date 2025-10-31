import { ImageCard } from './image-card';

interface GeneratedImage {
  index: number;
  imageData: string;
  mimeType: string;
}

interface ImageGridProps {
  images: GeneratedImage[];
  imageCount: number;
  aspectRatio: string;
  isGenerating: boolean;
  onDeleteImage?: (index: number) => void;
}

export function ImageGrid({ images, imageCount, aspectRatio, isGenerating, onDeleteImage }: ImageGridProps) {
  // Create array of slots based on selected count
  const slots = Array.from({ length: imageCount }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {slots.map((slotIndex) => {
        const image = images.find(img => img.index === slotIndex);
        return (
          <ImageCard
            key={slotIndex}
            imageData={image?.imageData}
            mimeType={image?.mimeType}
            aspectRatio={aspectRatio}
            isGenerating={isGenerating && !image}
            index={slotIndex}
            onDelete={() => onDeleteImage?.(slotIndex)}
          />
        );
      })}
    </div>
  );
}
