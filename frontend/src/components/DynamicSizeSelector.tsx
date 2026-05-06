import { useMemo } from "react";

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock: number;
  price_override?: string;
  effective_price: string;
}

interface DynamicSizeSelectorProps {
  variants: ProductVariant[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeSelect: (size: string) => void;
  showError?: boolean;
}

export default function DynamicSizeSelector({
  variants,
  selectedSize,
  selectedColor,
  onSizeSelect,
  showError = false
}: DynamicSizeSelectorProps) {
  // Extract unique sizes from variants
  const availableSizes = useMemo(() => {
    return [...new Set(variants.map(v => v.size))].sort((a, b) => {
      // Custom sort order for common sizes
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [variants]);

  // Get sizes available for selected color
  const sizesForColor = useMemo(() => {
    if (!selectedColor) return availableSizes;
    return [...new Set(
      variants
        .filter(v => v.color === selectedColor)
        .map(v => v.size)
    )];
  }, [variants, selectedColor, availableSizes]);

  // Get out of stock sizes
  const outOfStockSizes = useMemo(() => {
    return availableSizes.filter(size => {
      const sizeVariants = selectedColor 
        ? variants.filter(v => v.size === size && v.color === selectedColor)
        : variants.filter(v => v.size === size);
      
      return sizeVariants.every(v => v.stock === 0);
    });
  }, [variants, availableSizes, selectedColor]);

  if (availableSizes.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <label 
        className="block mb-3" 
        style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "10px", 
          letterSpacing: "0.1em", 
          textTransform: "uppercase", 
          color: "#6B5B55" 
        }}
      >
        SIZE{selectedSize ? `: ${selectedSize}` : ""}
      </label>
      
      <div className="flex gap-2 flex-wrap">
        {availableSizes.map((size) => {
          const isSelected = selectedSize === size;
          const isDisabled = selectedColor ? !sizesForColor.includes(size) : false;
          const isOutOfStock = outOfStockSizes.includes(size);
          const shouldDisable = isDisabled || isOutOfStock;
          
          return (
            <button
              key={size}
              onClick={() => {
                if (shouldDisable) return;
                onSizeSelect(size);
              }}
              disabled={shouldDisable}
              className="flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              style={{
                minWidth: size === "One Size" ? "80px" : "44px",
                height: "44px",
                padding: size === "One Size" ? "0 12px" : "0",
                border: isSelected ? "1.5px solid #2C2420" : "1.5px solid #DDD5CE",
                background: isSelected ? "#2C2420" : "transparent",
                color: isSelected ? "#fff" : shouldDisable ? "#C8BDB8" : "#2C2420",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                cursor: shouldDisable ? "not-allowed" : "pointer",
                borderRadius: "4px",
                opacity: shouldDisable ? 0.5 : 1,
              }}
              title={isOutOfStock ? `${size} - Out of stock` : size}
            >
              {size}
            </button>
          );
        })}
      </div>
      
      {showError && (
        <p style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "12px", 
          color: "#E57373",
          marginTop: "8px"
        }}>
          Please select a size
        </p>
      )}
    </div>
  );
}