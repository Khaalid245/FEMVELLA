import { createContext, useContext, ReactNode } from "react";
import { useSearch } from "@/hooks/useSearch";

type SearchContextValue = ReturnType<typeof useSearch>;

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const search = useSearch();
  return (
    <SearchContext.Provider value={search}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearchContext must be used inside <SearchProvider>");
  return ctx;
}
