import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/api/client";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
}

interface CurrencyState {
  active: string; // ISO code
  currencies: Currency[];
  setCurrency: (code: string) => Promise<void>;
  loadCurrencies: () => Promise<void>;
  getSymbol: () => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      active: "USD",
      currencies: [],

      loadCurrencies: async () => {
        try {
          const { data } = await api.get("/currency/");
          set({ currencies: data.currencies, active: data.active ?? get().active });
        } catch {
          // non-fatal — keep existing state
        }
      },

      setCurrency: async (code: string) => {
        set({ active: code });
        try {
          await api.post("/currency/set/", { code });
        } catch {
          // cookie set failed — in-memory state still updated
        }
      },

      getSymbol: () => {
        const { active, currencies } = get();
        return currencies.find((c) => c.code === active)?.symbol ?? "$";
      },
    }),
    { name: "femvelle-currency", partialize: (s) => ({ active: s.active }) }
  )
);
