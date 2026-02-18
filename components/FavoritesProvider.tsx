"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

const FAVORITES_CHANGED_EVENT = "harmony-favorites-changed";

type FavoritesContextValue = {
  favorites: string[];
  isLoading: boolean;
  toggleFavorite: (songId: string) => Promise<boolean>;
  isFavorite: (songId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      if (!res.ok) {
        setFavorites([]);
        return;
      }
      const data = (await res.json()) as { favorites: string[] };
      setFavorites(data.favorites ?? []);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, status]);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    const h = () => void fetchFavorites();
    window.addEventListener(FAVORITES_CHANGED_EVENT, h);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, h);
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(
    async (songId: string): Promise<boolean> => {
      if (status !== "authenticated") return false;
      try {
        const res = await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { favorited: boolean };
        setFavorites((prev) => {
          if (data.favorited) {
            return prev.includes(songId) ? prev : [...prev, songId];
          }
          return prev.filter((id) => id !== songId);
        });
        window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
        return data.favorited;
      } catch {
        return false;
      }
    },
    [status]
  );

  const isFavorite = useCallback(
    (songId: string) => favorites.includes(songId),
    [favorites]
  );

  const value: FavoritesContextValue = {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      favorites: [],
      isLoading: false,
      toggleFavorite: async () => false,
      isFavorite: () => false,
    };
  }
  return ctx;
}
