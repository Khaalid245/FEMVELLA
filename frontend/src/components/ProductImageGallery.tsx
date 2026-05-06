import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ProductImageGallery.css";

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  // Sort images by sort_order, then by is_primary, then by id
  const sortedImages = [...images].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    return a.id - b.id;
  });

  const [activeImageId, setActiveImageId] = useState<number>(
    sortedImages.find(img => img.is_primary)?.id || sortedImages[0]?.id || 0
  );

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="w-full">
        {/* Placeholder Main Image */}
        <div 
          className="relative w-full aspect-[3/4] overflow-hidden mb-4 flex items-center justify-center"
          style={{ 
            background: "linear-gradient(135deg, #F5F0EB 0%, #EDE8E3 100%)",
            borderRadius: "8px"
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 opacity-30" style={{ color: "#C4985A" }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <p style={{ 
              color: "#9E8E88", 
              fontFamily: "'Inter', sans-serif", 
              fontSize: "14px",
              fontWeight: 500
            }}>
              {productName}
            </p>
            <p style={{ 
              color: "#C8BDB8", 
              fontFamily: "'Inter', sans-serif", 
              fontSize: "12px",
              marginTop: "4px"
            }}>
              No image available
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeImage = sortedImages.find(img => img.id === activeImageId) || sortedImages[0];

  return (
    <div className="w-full">
      {/* Main Image */}
      <div 
        className="relative w-full aspect-[3/4] overflow-hidden mb-4 group"
        style={{ 
          background: "#F5F0EB",
          borderRadius: "8px"
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage.id}
            src={activeImage.image}
            alt={activeImage.alt_text || productName}
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </AnimatePresence>
      </div>

      {/* Thumbnail Gallery */}
      {sortedImages.length > 1 && (
        <div className="w-full">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sortedImages.slice(0, 5).map((image) => (
              <button
                key={image.id}
                onClick={() => setActiveImageId(image.id)}
                className="flex-shrink-0 relative overflow-hidden transition-all duration-200"
                style={{
                  width: "60px",
                  height: "80px", // Same 3:4 aspect ratio as main image
                  border: activeImageId === image.id ? "2px solid #C4985A" : "2px solid transparent",
                  borderRadius: "4px",
                  background: "#F5F0EB"
                }}
              >
                <img
                  src={image.image}
                  alt={image.alt_text || `${productName} view ${image.id}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}