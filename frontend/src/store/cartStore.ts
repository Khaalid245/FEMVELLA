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
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.id === item.id && i.variant_id === item.variant_id
        );
        if (existing) {
          set({ items: get().items.map((i) =>
            i.id === item.id && i.variant_id === item.variant_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )});
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)) }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    }),
    { name: "femvelle-cart" }
  )
);
