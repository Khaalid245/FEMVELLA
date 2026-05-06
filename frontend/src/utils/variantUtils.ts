import type { ProductVariant } from "@/api/products";

export interface SizeAvailability {
  size: string;
  isAvailable: boolean;
  isOutOfStock: boolean;
  totalStock: number;
  variants: ProductVariant[];
}

/**
 * Extract unique sizes from product variants with availability info
 */
export function getAvailableSizes(variants: ProductVariant[]): string[] {
  const sizes = [...new Set(variants.map(v => v.size))];
  
  // Custom sort order for common clothing sizes
  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
  
  return sizes.sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a);
    const bIndex = sizeOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Get size availability information for a specific color
 */
export function getSizeAvailability(
  variants: ProductVariant[], 
  selectedColor?: string | null
): SizeAvailability[] {
  const sizes = getAvailableSizes(variants);
  
  return sizes.map(size => {
    const sizeVariants = selectedColor 
      ? variants.filter(v => v.size === size && v.color === selectedColor)
      : variants.filter(v => v.size === size);
    
    const totalStock = sizeVariants.reduce((sum, v) => sum + v.stock, 0);
    const isOutOfStock = totalStock === 0;
    const isAvailable = sizeVariants.length > 0;
    
    return {
      size,
      isAvailable,
      isOutOfStock,
      totalStock,
      variants: sizeVariants
    };
  });
}

/**
 * Get colors available for a specific size
 */
export function getColorsForSize(variants: ProductVariant[], size: string): string[] {
  return [...new Set(
    variants
      .filter(v => v.size === size)
      .map(v => v.color)
      .filter(Boolean)
  )];
}

/**
 * Get sizes available for a specific color
 */
export function getSizesForColor(variants: ProductVariant[], color: string): string[] {
  return [...new Set(
    variants
      .filter(v => v.color === color)
      .map(v => v.size)
  )];
}

/**
 * Find a specific variant by size and color
 */
export function findVariant(
  variants: ProductVariant[], 
  size: string, 
  color?: string | null
): ProductVariant | null {
  if (!color) {
    return variants.find(v => v.size === size) || null;
  }
  
  return variants.find(v => v.size === size && v.color === color) || null;
}

/**
 * Check if a size/color combination is valid and in stock
 */
export function isValidSelection(
  variants: ProductVariant[], 
  size: string, 
  color?: string | null
): { isValid: boolean; inStock: boolean; variant: ProductVariant | null } {
  const variant = findVariant(variants, size, color);
  
  return {
    isValid: !!variant,
    inStock: variant ? variant.stock > 0 : false,
    variant
  };
}