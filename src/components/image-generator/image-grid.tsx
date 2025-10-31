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
}

export function ImageGrid({ images, imageCount, aspectRatio, isGenerating }: ImageGridProps) {
  // Create array of slots based on selected count
  const slots = Array.from({ length: imageCount }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          />
        );
      })}
    </div>
  );
}
