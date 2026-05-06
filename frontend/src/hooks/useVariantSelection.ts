import { useState, useCallback, useMemo } from "react";
import type { ProductVariant } from "@/api/products";
import { 
  getAvailableSizes, 
  getSizesForColor, 
  getColorsForSize, 
  findVariant, 
  isValidSelection 
} from "@/utils/variantUtils";

interface UseVariantSelectionProps {
  variants: ProductVariant[];
  colors?: { id: number; name: string; hex_code: string }[];
}

export function useVariantSelection({ variants, colors = [] }: UseVariantSelectionProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const hasVariants = variants.length > 0;

  // Get available options
  const availableSizes = useMemo(() => 
    hasVariants ? getAvailableSizes(variants) : [], 
    [variants, hasVariants]
  );

  const availableColors = useMemo(() => 
    hasVariants 
      ? [...new Set(variants.map(v => v.color).filter(Boolean))]
      : colors?.map(c => c.name) || [], 
    [variants, colors, hasVariants]
  );

  // Get filtered options based on current selection
  const sizesForColor = useMemo(() => 
    selectedColor && hasVariants 
      ? getSizesForColor(variants, selectedColor)
      : availableSizes,
    [selectedColor, variants, availableSizes, hasVariants]
  );

  const colorsForSize = useMemo(() => 
    selectedSize && hasVariants 
      ? getColorsForSize(variants, selectedSize)
      : availableColors,
    [selectedSize, variants, availableColors, hasVariants]
  );

  // Find selected variant
  const selectedVariant = useMemo(() => 
    hasVariants && selectedSize
      ? findVariant(variants, selectedSize, selectedColor)
      : null,
    [variants, selectedSize, selectedColor, hasVariants]
  );

  // Validation
  const validation = useMemo(() => {
    if (!hasVariants) {
      return { isValid: true, inStock: true, variant: null };
    }

    if (!selectedSize) {
      return { isValid: false, inStock: false, variant: null };
    }

    return isValidSelection(variants, selectedSize, selectedColor);
  }, [variants, selectedSize, selectedColor, hasVariants]);

  // Handlers
  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    // Reset color if current color not available for this size
    if (selectedColor && !getColorsForSize(variants, size).includes(selectedColor)) {
      setSelectedColor(null);
    }
  }, [selectedColor, variants]);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    // Reset size if current size not available for this color
    if (selectedSize && !getSizesForColor(variants, color).includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [selectedSize, variants]);

  const reset = useCallback(() => {
    setSelectedSize(null);
    setSelectedColor(null);
  }, []);

  // Check if selection is complete
  const isSelectionComplete = useMemo(() => {
    if (!hasVariants) return true;
    
    const needsSize = availableSizes.length > 0;
    const needsColor = availableColors.length > 0;
    
    return (!needsSize || !!selectedSize) && (!needsColor || !!selectedColor);
  }, [hasVariants, availableSizes.length, availableColors.length, selectedSize, selectedColor]);

  return {
    // State
    selectedSize,
    selectedColor,
    selectedVariant,
    
    // Available options
    availableSizes,
    availableColors,
    sizesForColor,
    colorsForSize,
    
    // Validation
    validation,
    isSelectionComplete,
    
    // Handlers
    handleSizeSelect,
    handleColorSelect,
    setSelectedSize,
    setSelectedColor,
    reset,
    
    // Computed
    hasVariants
  };
}