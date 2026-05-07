import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VariantAvailability } from "@/api/inventory";

interface ColorOption {
  name: string;
  hex_code: string;
}

interface DynamicColorSelectorProps {
  variants: VariantAvailability[];
  colors: ColorOption[];
  selectedColor: string | null;
  selectedSize: string | null;
  onColorSelect: (color: string) => void;
  showError?: boolean;
  className?: string;
}

export default function DynamicColorSelector({
  variants,
  colors,
  selectedColor,
  selectedSize,
  onColorSelect,
  showError = false,
  className = "",
}: DynamicColorSelectorProps) {
  
  // Calculate color availability based on selected size
  const colorAvailability = useMemo(() => {
    const colorMap = new Map<string, {
      available: boolean;
      stock: number;
      isLowStock: boolean;
      variants: VariantAvailability[];
      hexCode: string;
    }>();

    // Initialize with all colors from product
    colors.forEach(color => {
      colorMap.set(color.name, {
        available: false,
        stock: 0,
        isLowStock: false,
        variants: [],
        hexCode: color.hex_code
      });
    });

    variants.forEach(variant => {
      // If size is selected, only show colors for that size
      if (selectedSize && variant.size !== selectedSize) {
        return;
      }

      // Skip if color not in product colors
      if (!colorMap.has(variant.color)) {
        return;
      }

      const existing = colorMap.get(variant.color)!;
      existing.stock += variant.stock;
      existing.available = existing.available || variant.is_in_stock;
      existing.isLowStock = existing.isLowStock || variant.is_low_stock;
      existing.variants.push(variant);
    });

    return colorMap;
  }, [variants, colors, selectedSize]);

  // Filter to only available colors or show all if none selected
  const availableColors = useMemo(() => {
    return colors.filter(color => {
      const colorData = colorAvailability.get(color.name);
      return colorData && (colorData.available || !selectedSize);
    });
  }, [colors, colorAvailability, selectedSize]);

  if (availableColors.length === 0) {
    return null;
  }

  const getColorButtonStyle = (colorName: string, colorData: any) => {
    const isSelected = selectedColor === colorName;
    const isAvailable = colorData.available;
    
    let baseStyle = {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "2px solid #DDD5CE",
      cursor: "pointer",
      transition: "all 0.2s ease",
      position: "relative" as const,
      background: colorData.hexCode,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
    };

    if (!isAvailable) {
      return {
        ...baseStyle,
        opacity: 0.3,
        cursor: "not-allowed",
        filter: "grayscale(100%)",
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        border: "2px solid #2C2420",
        transform: "scale(1.1)",
        boxShadow: "0 4px 12px rgba(44, 36, 32, 0.25), inset 0 0 0 1px rgba(0,0,0,0.1)",
      };
    }

    return baseStyle;
  };

  const getStockIndicator = (colorData: any) => {
    if (!colorData.available) {
      return (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "2px",
            height: "32px",
            background: "#E57373",
            transform: "translate(-50%, -50%) rotate(45deg)",
          }}
        />
      );
    }

    if (colorData.isLowStock && colorData.stock <= 3) {
      return (
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#ffc107",
            color: "#000",
            fontSize: "8px",
            fontWeight: 600,
            padding: "2px 4px",
            borderRadius: "8px",
            lineHeight: 1,
            minWidth: "16px",
            textAlign: "center",
          }}
        >
          {colorData.stock}
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
          Color {showError && <span style={{ color: "#E57373" }}>*</span>}
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        {availableColors.map((color) => {
          const colorData = colorAvailability.get(color.name)!;
          
          return (
            <div key={color.name} className="flex flex-col items-center gap-1">
              <motion.button
                onClick={() => colorData.available && onColorSelect(color.name)}
                disabled={!colorData.available}
                style={getColorButtonStyle(color.name, colorData)}
                whileHover={colorData.available ? { 
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 16px rgba(44, 36, 32, 0.2), inset 0 0 0 1px rgba(0,0,0,0.1)"
                } : {}}
                whileTap={colorData.available ? { transform: "scale(0.95)" } : {}}
                aria-label={`Select ${color.name} color`}
              >
                {getStockIndicator(colorData)}
              </motion.button>
              
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  color: colorData.available ? "#6B5B55" : "#9E8E88",
                  textAlign: "center",
                  maxWidth: "60px",
                  lineHeight: 1.2,
                }}
              >
                {color.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stock status message */}
      <AnimatePresence>
        {selectedColor && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3"
          >
            {(() => {
              const colorData = colorAvailability.get(selectedColor);
              if (!colorData) return null;

              if (!colorData.available) {
                return (
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "#E57373",
                  }}>
                    {selectedColor} is out of stock
                    {selectedSize && ` in size ${selectedSize}`}
                  </p>
                );
              }

              if (colorData.isLowStock && colorData.stock <= 5) {
                return (
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "#ff9800",
                  }}>
                    Only {colorData.stock} left in {selectedColor}
                    {selectedSize && ` size ${selectedSize}`}
                  </p>
                );
              }

              return (
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  color: "#6B5B55",
                }}>
                  {selectedColor} is in stock
                  {selectedSize && ` in size ${selectedSize}`}
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
            Please select a color
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}