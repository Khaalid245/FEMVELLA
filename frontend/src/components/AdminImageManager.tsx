import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface ProductImage {
  id?: number;
  image: string | File;
  alt_text: string;
  sort_order: number;
  is_primary?: boolean;
}

interface AdminImageManagerProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export default function AdminImageManager({ 
  images, 
  onImagesChange, 
  maxImages = 10 
}: AdminImageManagerProps) {
  const [draggedItem, setDraggedItem] = useState<ProductImage | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList) => {
    const newImages: ProductImage[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push({
          image: file,
          alt_text: '',
          sort_order: images.length + i,
          is_primary: images.length === 0 && i === 0 // First image is primary if no images exist
        });
      }
    }

    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange, maxImages]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reorder remaining images
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: i === 0 // First image becomes primary
    }));
    onImagesChange(reorderedImages);
  }, [images, onImagesChange]);

  // Update alt text
  const updateAltText = useCallback((index: number, altText: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], alt_text: altText };
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // Set primary image
  const setPrimaryImage = useCallback((index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // Handle reorder
  const handleReorder = useCallback((newOrder: ProductImage[]) => {
    const reorderedImages = newOrder.map((img, i) => ({
      ...img,
      sort_order: i
    }));
    onImagesChange(reorderedImages);
  }, [onImagesChange]);

  // Get image URL for preview
  const getImageUrl = (image: string | File): string => {
    if (typeof image === 'string') {
      return image;
    }
    return URL.createObjectURL(image);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Product Images ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Images
            </span>
          </label>
        )}
      </div>

      {/* Upload Drop Zone */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <Reorder.Group
          axis="y"
          values={images}
          onReorder={handleReorder}
          className="space-y-3"
        >
          <AnimatePresence>
            {images.map((image, index) => (
              <Reorder.Item
                key={`${image.sort_order}-${index}`}
                value={image}
                dragListener={false}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  {/* Drag Handle */}
                  <div
                    className="cursor-move p-1 text-gray-400 hover:text-gray-600"
                    onPointerDown={(e) => {
                      setDraggedItem(image);
                      (e.currentTarget.closest('[data-framer-name="reorder-item"]') as any)?.controls?.start(e);
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </div>

                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={getImageUrl(image.image)}
                      alt={image.alt_text || 'Product image'}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    {image.is_primary && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Primary
                      </div>
                    )}
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={image.alt_text}
                        onChange={(e) => updateAltText(index, e.target.value)}
                        placeholder="Describe this image..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      {!image.is_primary && (
                        <button
                          onClick={() => setPrimaryImage(index)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Set as Primary
                        </button>
                      )}
                      <span className="text-sm text-gray-500">
                        Position: {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Tips:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Drag images to reorder them</li>
            <li>• The first image will be used as the main product image</li>
            <li>• Add alt text for better SEO and accessibility</li>
            <li>• Recommended image size: 1200x1200px or larger</li>
          </ul>
        </div>
      )}
    </div>
  );
}