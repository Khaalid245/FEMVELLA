import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi, AutocompleteSuggestion, TrendingQuery, RecentlyViewedProduct } from "@/api/search";

const DEBOUNCE_MS = 220;

export function useSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [trending, setTrending] = useState<TrendingQuery[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load trending + recently viewed when modal opens
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([searchApi.trending(), searchApi.recentlyViewed()]).then(
      ([t, r]) => {
        setTrending(t);
        setRecentlyViewed(r);
      }
    );
  }, [isOpen]);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchApi.autocomplete(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
        setActiveIndex(-1);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open();
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const submit = useCallback(
    (q?: string) => {
      const term = (q ?? query).trim();
      if (!term) return;
      close();
      navigate(`/products?search=${encodeURIComponent(term)}`);
    },
    [query, navigate, close]
  );

  const selectSuggestion = useCallback(
    (suggestion: AutocompleteSuggestion, index: number) => {
      searchApi.trackClick(query, 0, index).catch(() => {});
      close();
      navigate(suggestion.url);
    },
    [query, navigate, close]
  );

  // Arrow key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = suggestions.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % total);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + total) % total);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectSuggestion(suggestions[activeIndex], activeIndex);
        } else {
          submit();
        }
      } else if (e.key === "Escape") {
        close();
      }
    },
    [suggestions, activeIndex, selectSuggestion, submit, close]
  );

  return {
    isOpen,
    open,
    close,
    query,
    setQuery,
    suggestions,
    trending,
    recentlyViewed,
    loading,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    submit,
    selectSuggestion,
    inputRef,
  };
}
