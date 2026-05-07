import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VariantAvailability } from "@/api/inventory";

interface DynamicSizeSelectorProps {
  variants: VariantAvailability[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeSelect: (size: string) => void;
  showError?: boolean;
  className?: string;
}

export default function DynamicSizeSelector({
  variants,
  selectedSize,
  selectedColor,
  onSizeSelect,
  showError = false,
  className = "",
}: DynamicSizeSelectorProps) {
  
  // Calculate size availability based on selected color
  const sizeAvailability = useMemo(() => {
    const sizeMap = new Map<string, {
      available: boolean;
      stock: number;
      isLowStock: boolean;
      variants: VariantAvailability[];
    }>();

    variants.forEach(variant => {
      // If color is selected, only show sizes for that color
      if (selectedColor && variant.color !== selectedColor) {
        return;
      }

      const existing = sizeMap.get(variant.size);
      if (!existing) {
        sizeMap.set(variant.size, {
          available: variant.is_in_stock,
          stock: variant.stock,
          isLowStock: variant.is_low_stock,
          variants: [variant]
        });
      } else {
        // Combine stock from multiple color variants of same size
        existing.stock += variant.stock;
        existing.available = existing.available || variant.is_in_stock;
        existing.isLowStock = existing.isLowStock || variant.is_low_stock;
        existing.variants.push(variant);
      }
    });

    return sizeMap;
  }, [variants, selectedColor]);

  // Sort sizes in logical order
  const sortedSizes = useMemo(() => {
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
    const availableSizes = Array.from(sizeAvailability.keys());
    
    return availableSizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [sizeAvailability]);

  if (sortedSizes.length === 0) {
    return null;
  }

  const getSizeButtonStyle = (size: string, sizeData: any) => {
    const isSelected = selectedSize === size;
    const isAvailable = sizeData.available;
    
    let baseStyle = {
      fontFamily: "'Inter', sans-serif",
      fontSize: "12px",
      fontWeight: 500,
      padding: "12px 16px",
      border: "1px solid #DDD5CE",
      background: "transparent",
      color: "#2C2420",
      cursor: "pointer",
      transition: "all 0.2s ease",
      borderRadius: "4px",
      position: "relative" as const,
      minWidth: "48px",
      textAlign: "center" as const,
    };

    if (!isAvailable) {
      return {
        ...baseStyle,
        opacity: 0.4,
        cursor: "not-allowed",
        color: "#9E8E88",
        textDecoration: "line-through",
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        border: "1.5px solid #2C2420",
        background: "#2C2420",
        color: "#fff",
      };
    }

    return baseStyle;
  };

  const getStockIndicator = (sizeData: any) => {
    if (!sizeData.available) {
      return null;
    }

    if (sizeData.isLowStock && sizeData.stock <= 3) {
      return (
        <span
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "#ffc107",
            color: "#000",
            fontSize: "8px",
            fontWeight: 600,
            padding: "2px 4px",
            borderRadius: "8px",
            lineHeight: 1,
          }}
        >
          {sizeData.stock}
        </span>
      );
    }

    return null;
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <label
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: showError ? "#E57373" : "#6B5B55",
            marginBottom: "8px",
            display: "block",
          }}
        >
          Size {showError && <span style={{ color: "#E57373" }}>*</span>}
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedSizes.map((size) => {
          const sizeData = sizeAvailability.get(size)!;
          
          return (
            <motion.button
              key={size}
              onClick={() => sizeData.available && onSizeSelect(size)}
              disabled={!sizeData.available}
              style={getSizeButtonStyle(size, sizeData)}
              whileHover={sizeData.available ? { 
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(44, 36, 32, 0.15)"
              } : {}}
              whileTap={sizeData.available ? { transform: "translateY(0)" } : {}}
            >
              {size}
              {getStockIndicator(sizeData)}
            </motion.button>
          );
        })}
      </div>

      {/* Stock status message */}
      <AnimatePresence>
        {selectedSize && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2"
          >
            {(() => {
              const sizeData = sizeAvailability.get(selectedSize);
              if (!sizeData) return null;

              if (!sizeData.available) {
                return (
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "#E57373",
                  }}>
                    Size {selectedSize} is out of stock
                  </p>
                );
              }

              if (sizeData.isLowStock && sizeData.stock <= 5) {
                return (
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "#ff9800",
                  }}>
                    Only {sizeData.stock} left in size {selectedSize}
                  </p>
                );
              }

              return (
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  color: "#6B5B55",
                }}>
                  Size {selectedSize} is in stock
                </p>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {showError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#E57373",
              marginTop: "4px",
            }}
          >
            Please select a size
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}