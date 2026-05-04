import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;         // product id
  variant_id?: number;
  name: string;
  size?: string;
  color?: string;
  price: string;
  quantity: number;
  image: string;
  slug: string;
  customization_text?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number, variantId?: number, customizationText?: string) => void;
  updateQuantity: (id: number, quantity: number, variantId?: number, customizationText?: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.id === item.id && i.variant_id === item.variant_id && i.customization_text === item.customization_text
        );
        if (existing) {
          set({ items: get().items.map((i) =>
            i.id === item.id && i.variant_id === item.variant_id && i.customization_text === item.customization_text
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )});
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (id, variantId, customizationText) => {
        set({ 
          items: get().items.filter((i) => 
            !(i.id === id && i.variant_id === variantId && i.customization_text === customizationText)
          ) 
        });
      },
      updateQuantity: (id, quantity, variantId, customizationText) =>
        set({ 
          items: get().items.map((i) => 
            (i.id === id && i.variant_id === variantId && i.customization_text === customizationText) 
              ? { ...i, quantity } 
              : i
          ) 
        }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    }),
    { name: "femvelle-cart" }
  )
);
