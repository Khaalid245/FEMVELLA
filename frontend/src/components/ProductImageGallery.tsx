import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ProductImageGallery.css";

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeImageId, setActiveImageId] = useState<number>(
    images.find(img => img.is_primary)?.id || images[0]?.id || 0
  );

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] flex items-center justify-center" style={{ background: "#F5F0EB", borderRadius: "8px" }}>
        <span style={{ color: "#9E8E88", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>No image available</span>
      </div>
    );
  }

  const activeImage = images.find(img => img.id === activeImageId) || images[0];

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
      {images.length > 1 && (
        <div className="w-full">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {images.slice(0, 5).map((image) => (
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